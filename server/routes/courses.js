const express = require('express');
const router = express.Router();
const Models = require('../db/models');
const requireRole = require('../middleware/requireRole');



// === STUDENT ONLY ===

// Get enrollments for the current user (Maps to GET /api/courses/my-enrollments)
router.get('/my-enrollments', requireRole('student'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const enrolledcourses = await Models.Enrollment.findAll({
            attributes: ['completed'],
            // get all rows with userId
            where: { userId: userId },
            // get Courses that are in rolls
            include: [
                {
                    // didn't add "as" in relations for some reason, so don't add "as" here, just returns as "Course" in object
                    model: Models.Course,
                    attributes: ['id', 'name', 'instructorId', 'enrolled', 'isPrivate', 'thumbnail', 'description'],
                    include: [
                        {
                            // added "as" in relations, so returns as "instructor" in object
                            model: Models.User,
                            as: 'instructor',
                            attributes: ['id', 'userName', 'firstName', 'lastName', 'email'],
                        }
                    ],
                },
            ],
        });

        const enrollments = enrolledcourses.map(enrollment => {
            const course = enrollment.Course;
            const instructor = course.instructor;
            return {
                id: course.id,
                name: course.name,
                instructorId: instructor.id,
                instructor: instructor,
                enrolled: course.enrolled,
                completed: enrollment.completed,
                isPrivate: course.isPrivate,
                thumbnail: course.thumbnail,
                description: course.description
            }
        });

        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ message: `Error fetching enrollments: ${error.message}` });
    }
});

// Enroll in a course (Maps to POST /api/courses/:courseId/enroll)
router.post('/:courseId/enroll', requireRole('student'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { courseId } = req.params;

        const course = await Models.Course.findByPk(courseId, {
            include: [{ model: Models.Course, as: 'requirements' }]
        });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check requirements
        if (course.requirements && course.requirements.length > 0) {
            const userEnrollments = await Models.Enrollment.findAll({
                where: { userId }
            });
            const completedCourseIds = userEnrollments.filter(e => e.completed).map(e => e.courseId);
            
            const missingRequirements = course.requirements.filter(reqCourse => !completedCourseIds.includes(reqCourse.id));
            if (missingRequirements.length > 0) {
                return res.status(403).json({ 
                    message: 'Missing required courses', 
                    missingRequirements: missingRequirements.map(r => r.name) 
                });
            }
        }

        // Check if already enrolled
        const existingEnrollment = await Models.Enrollment.findOne({
            where: { userId, courseId }
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        // Create enrollment and update course count
        await Models.Enrollment.create({ userId, courseId });
        await course.increment('enrolled');

        res.status(201).json({ message: 'Successfully enrolled in course' });
    } catch (error) {
        res.status(500).json({ message: `Error enrolling in course: ${error.message}` });
    }
});

// Drop a course (Maps to DELETE /api/courses/:courseId/enroll)
router.delete('/:courseId/enroll', requireRole('student'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { courseId } = req.params;

        const enrollment = await Models.Enrollment.findOne({
            where: { userId, courseId }
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Not enrolled in this course' });
        }

        await enrollment.destroy();

        // Update course enrolled count
        const course = await Models.Course.findByPk(courseId);
        if (course) {
            await course.decrement('enrolled');
        }

        res.status(200).json({ message: 'Successfully dropped the course' });
    } catch (error) {
        res.status(500).json({ message: `Error dropping course: ${error.message}` });
    }
});

// Complete a course (Maps to POST /api/courses/:courseId/complete)
router.post('/:courseId/complete', requireRole('student'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { courseId } = req.params;

        const enrollment = await Models.Enrollment.findOne({
            where: { userId, courseId }
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Not enrolled in this course' });
        }

        if (enrollment.completed) {
            return res.status(400).json({ message: 'Course is already completed' });
        }

        enrollment.completed = true;
        await enrollment.save();

        res.status(200).json({ message: 'Successfully completed the course' });
    } catch (error) {
        res.status(500).json({ message: `Error completing course: ${error.message}` });
    }
});

// === INSTRUCTOR OR ADMIN ===

// Create a new course (Maps to POST /api/courses)
router.post('/', requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { name, modules, description, isPrivate, thumbnail, requirements } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Course name is required' });
        }
        // Using a transaction to ensure all or nothing is created
        const newCourse = await Models.Course.sequelize.transaction(async (t) => {
            const course = await Models.Course.create({
                name,
                instructorId: req.session.user.id,
                description: description || null,
                isPrivate: isPrivate || false,
                thumbnail: thumbnail || null
            }, { transaction: t });

            // If modules exist, process them
            if (modules && Array.isArray(modules)) {
                for (let i = 0; i < modules.length; i++) {
                    const modData = modules[i];
                    const newModule = await Models.Module.create({
                        title: modData.title || 'Untitled Module',
                        order: modData.order || i + 1,
                        courseId: course.id,
                        parentModuleId: null
                    }, { transaction: t });

                    if (modData.content && Array.isArray(modData.content)) {
                        for (let j = 0; j < modData.content.length; j++) {
                            const item = modData.content[j];
                            
                            if (Array.isArray(item.content)) {
                                const newSubModule = await Models.Module.create({
                                    title: item.title || 'Untitled Submodule',
                                    order: item.order || j + 1,
                                    courseId: course.id,
                                    parentModuleId: newModule.id
                                }, { transaction: t });

                                for (let k = 0; k < item.content.length; k++) {
                                    const subLec = item.content[k];
                                    await Models.Lecture.create({
                                        title: subLec.title || 'Untitled Lecture',
                                        order: subLec.order || k + 1, 
                                        content: subLec.content || '',
                                        moduleId: newSubModule.id
                                    }, { transaction: t });
                                }
                            } else {
                                await Models.Lecture.create({
                                    title: item.title || 'Untitled Lecture',
                                    order: item.order || j + 1,
                                    content: item.content || '',
                                    moduleId: newModule.id
                                }, { transaction: t });
                            }
                        }
                    }
                }
            }

            // Parse requirement IDs as integers (frontend sends strings)
            if (requirements && Array.isArray(requirements) && requirements.length > 0) {
                const reqIds = requirements.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
                await course.setRequirements(reqIds, { transaction: t });
            }

            return course;
        });

        res.status(201).json(newCourse);
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(e => e.message).join(', ');
            return res.status(400).json({ message: `Validation error: ${messages}` });
        }
        res.status(500).json({ message: `Error creating course: ${error.message}` });
    }
});

// Edit an existing course (Maps to PUT /api/courses/:courseId)
router.put('/:courseId', requireRole('admin','instructor'), async (req, res) => {
    try {
        const { courseId } = req.params;
        const { name, modules, description, isPrivate, thumbnail, requirements } = req.body;

        const course = await Models.Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Course name is required' });
        }

        await Models.Course.sequelize.transaction(async (t) => {
            // Update course basic info
            await course.update({
                name,
                description: description || null,
                isPrivate: isPrivate || false,
                thumbnail: thumbnail || null
            }, { transaction: t });

            // Destroy existing lectures & modules
            const oldModules = await Models.Module.findAll({ where: { courseId: course.id }, transaction: t });
            const oldModuleIds = oldModules.map(m => m.id);
            if (oldModuleIds.length > 0) {
                await Models.Lecture.destroy({ where: { moduleId: oldModuleIds }, transaction: t });
                await Models.Module.destroy({ where: { courseId: course.id }, transaction: t });
            }

            // Re-create modules
            // should probably be in a function for this and add course, maybe just use edit course for both and add course just takes directly to edit course after naming?
            if (modules) {
                for (let i = 0; i < modules.length; i++) {
                    const modData = modules[i];
                    const newModule = await Models.Module.create({
                        title: modData.title || 'Untitled Module',
                        order: modData.order || i + 1,
                        courseId: course.id,
                        parentModuleId: null
                    }, { transaction: t });

                    if (modData.content && Array.isArray(modData.content)) {
                        for (let j = 0; j < modData.content.length; j++) {
                            const item = modData.content[j];
                            
                            if (Array.isArray(item.content)) {
                                const newSubModule = await Models.Module.create({
                                    title: item.title || 'Untitled Submodule',
                                    order: item.order || j + 1,
                                    courseId: course.id,
                                    parentModuleId: newModule.id
                                }, { transaction: t });

                                for (let k = 0; k < item.content.length; k++) {
                                    const subLec = item.content[k];
                                    await Models.Lecture.create({
                                        title: subLec.title || 'Untitled Lecture',
                                        order: subLec.order || k + 1, 
                                        content: subLec.content || '',
                                        moduleId: newSubModule.id
                                    }, { transaction: t });
                                }
                            } else {
                                await Models.Lecture.create({
                                    title: item.title || 'Untitled Lecture',
                                    order: item.order || j + 1,
                                    content: item.content || '',
                                    moduleId: newModule.id
                                }, { transaction: t });
                            }
                        }
                    }
                }
            }

            // Update requirements
            if (requirements && Array.isArray(requirements) && requirements.length > 0) {
                const reqIds = requirements.map((id) => parseInt(id, 10)).filter(id => !isNaN(id));
                await course.setRequirements(reqIds, { transaction: t });
            } else {
                await course.setRequirements([], { transaction: t });
            }
        });

        res.status(200).json({ message: 'Course updated successfully' });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(e => e.message).join(', ');
            return res.status(400).json({ message: `Validation error: ${messages}` });
        }
        res.status(500).json({ message: `Error updating course: ${error.message}` });
    }
});

// Delete a course (Maps to DELETE /api/courses/:courseId)
// Admins can delete any
router.delete('/:courseId', requireRole('admin','instructor'), async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Models.Course.findByPk(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        await course.destroy();
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: `Error deleting course: ${error.message}` });
    }
});

// === ALL AUTHENTICATED USERS ===
// (requireAuth done first)
// had to move down because wildcard ":id" was catching post for "enrollment"

// Get all courses (Maps to GET /api/courses)
router.get('/', async (req, res) => {
    try {
        const courses = await Models.Course.findAll({
            order: [['createdAt', 'DESC']],
            include: [{ model: Models.Course, as: 'requirements', attributes: ['id', 'name'] }]
        });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: `Error fetching courses: ${error.message}` });
    }
});

// Get a specific course by ID with its modules and lectures (Maps to GET /api/courses/:courseId)
router.get('/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Models.Course.findByPk(courseId, {
            include: [
                {
                    model: Models.Module,
                    as: 'modules',
                    where: { parentModuleId: null },
                    required: false,
                    include: [
                        {
                            model: Models.Lecture,
                            as: 'lectures'
                        },
                        {
                            model: Models.Module,
                            as: 'subModules',
                            include: [
                                {
                                    model: Models.Lecture,
                                    as: 'lectures'
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Models.Course,
                    as: 'requirements',
                    attributes: ['id', 'name']
                }
            ],
            order: [
                [{ model: Models.Module, as: 'modules' }, 'order', 'ASC'],
                [{ model: Models.Module, as: 'modules' }, { model: Models.Lecture, as: 'lectures' }, 'order', 'ASC'],
                [{ model: Models.Module, as: 'modules' }, { model: Models.Module, as: 'subModules' }, 'order', 'ASC'],
                [{ model: Models.Module, as: 'modules' }, { model: Models.Module, as: 'subModules' }, { model: Models.Lecture, as: 'lectures' }, 'order', 'ASC']
            ]
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        let mappedModules = [];
        if (course.modules) {
            mappedModules = course.modules.map(mod => {
                return {
                    id: mod.id.toString(),
                    title: mod.title,
                    order: mod.order,
                    courseId: mod.courseId.toString(),
                    collapsed: false,
                    content: [
                        ...(mod.subModules ? mod.subModules.map(subMod => ({
                            id: subMod.id.toString(),
                            title: subMod.title,
                            order: subMod.order,
                            courseId: subMod.courseId.toString(),
                            collapsed: false,
                            content: subMod.lectures ? subMod.lectures.map(lec => ({
                                id: lec.id.toString(),
                                title: lec.title,
                                order: lec.order,
                                content: lec.content,
                                moduleId: lec.moduleId.toString()
                            })).sort((a,b)=>a.order - b.order) : []
                        })) : []),
                        ...(mod.lectures ? mod.lectures.map(lec => ({
                            id: lec.id.toString(),
                            title: lec.title,
                            order: lec.order,
                            content: lec.content,
                            moduleId: lec.moduleId.toString()
                        })) : [])
                    ].sort((a,b)=>a.order - b.order)
                };
            });
        }

        const courseData = {
            id: course.id.toString(),
            name: course.name,
            instructorId: course.instructorId,
            enrolled: course.enrolled,
            isPrivate: course.isPrivate,
            description: course.description,
            thumbnail: course.thumbnail,
            modules: mappedModules,
            requirements: course.requirements ? course.requirements.map(reqCourse => ({ id: reqCourse.id, name: reqCourse.name })) : []
        };

        res.status(200).json(courseData);
    } catch (error) {
        res.status(500).json({ message: `Error fetching course: ${error.message}` });
    }
});

module.exports = router;
