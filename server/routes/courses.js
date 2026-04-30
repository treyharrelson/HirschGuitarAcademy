const express = require('express');
const router = express.Router();
const Models = require('../db/models');
const requireRole = require('../middleware/requireRole');
const requireAuth = require('../middleware/requireAuth');


// === STUDENT ONLY ===

// Get enrollments for the current user (Maps to GET /api/courses/my-enrollments)
router.get('/my-enrollments', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) return res.status(401).json({ message: "No session ID" });

        // Fetch RAW enrollments ONLY - No associations here to avoid crashes
        const enrolledCourses = await Models.Enrollment.findAll({
            where: { userId: userId },
            raw: true
        });

        if (!enrolledCourses || enrolledCourses.length === 0) {
            return res.status(200).json([]);
        }

        // Fetch data for each enrollment independently
        const enrollments = await Promise.all(enrolledCourses.map(async (enroll) => {
            // Find the course manually
            const course = await Models.Course.findByPk(enroll.courseId, {
                attributes: ['id', 'name', 'thumbnail'],
                raw: true
            });
            if (!course) return null;

            // Count completed lectures for this user in this course
            const completedCount = await Models.Progress.count({
                where: { userId, courseId: course.id }
            });

            // Find all module IDs for this course
            const courseModules = await Models.Module.findAll({
                where: { courseId: course.id },
                attributes: ['id'],
                raw: true
            });

            const moduleIds = courseModules.map(m => m.id);

            // Count lectures linked to those modules
            const totalLectures = moduleIds.length > 0
                ? await Models.Lecture.count({ where: { moduleId: moduleIds } })
                : 0;

            const progress = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

            return {
                id: course.id,
                enrollmentId: enroll.id,
                courseId: course.id,
                name: course.name,
                thumbnail: course.thumbnail,
                completed: enroll.completed || progress === 100,
                totalLectures: totalLectures || 0,
                completedCount: completedCount || 0,
                progress: progress
            };
        }));

        res.status(200).json(enrollments.filter(e => e !== null));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Enroll in a course (Maps to POST /api/courses/:courseId/enroll)
router.post('/:courseId/enroll', requireRole('student'), async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const { courseId } = req.params;

        const existingEnrollment = await Models.Enrollment.findOne({ where: { userId, courseId } });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        const course = await Models.Course.findByPk(courseId, {
            include: [{ model: Models.Course, as: 'requirements' }]
        });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check requirements
        if (course.requirements && course.requirements.length > 0) {
            const userEnrollments = await Models.Enrollment.findAll({
                where: { userId },
                raw: true
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

// STUDENT COURSE PROGRESS
router.get('/:courseId/progress', requireRole('student'), async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.session.user?.id || req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const records = await Models.Progress.findAll({
            where: { userId, courseId }
        });
        const completedLectures = records.map(r => r.lectureId.toString());
        res.json({ completedLectures });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// COMPLETION ROUTE
router.post('/:courseId/lectures/:lectureId/complete', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { courseId, lectureId } = req.params;

        await Models.Progress.findOrCreate({
            where: {
                userId: userId,
                courseId: courseId,
                lectureId: parseInt(String(lectureId).replace('lec-', ''))
            }
        });

        res.json({ success: true });
    } catch (err) {
        console.error("COMPLETION ERROR:", err);
        res.status(500).json({ message: err.message });
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
                                    moduleId: newModule.id,
                                    //blocks: item.blocks ? [...item.blocks] : []
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
router.put('/:courseId', requireRole('admin', 'instructor'), async (req, res) => {
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
                                    // REMOVE 'id: item.id'
                                    title: item.title || 'Untitled Submodule',
                                    order: j + 1,
                                    courseId: course.id,
                                    parentModuleId: newModule.id
                                }, { transaction: t });

                                for (let k = 0; k < item.content.length; k++) {
                                    const subLec = item.content[k];
                                    await Models.Lecture.create({
                                        // REMOVE 'id: subLec.id'
                                        title: subLec.title || 'Untitled Lecture',
                                        order: k + 1,
                                        moduleId: newSubModule.id,
                                        blocks: subLec.blocks || []
                                    }, { transaction: t });
                                }
                            } else {
                                await Models.Lecture.create({
                                    // REMOVE 'id: item.id' from here
                                    title: item.title || 'Untitled Lecture',
                                    order: j + 1,
                                    moduleId: newModule.id,
                                    blocks: item.blocks ? [...item.blocks] : []
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
router.delete('/:courseId', requireRole('admin', 'instructor'), async (req, res) => {
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

// === INSTRUCTOR ENROLLMENT MANAGEMENT ===

// Get all students and their enrolled courses
router.get('/instructor/students', requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const students = await Models.User.findAll({
            where: { role: 'student' },
            attributes: ['id', 'userName', 'firstName', 'lastName', 'name', 'email'],
            include: [{
                model: Models.Course,
                as: 'enrolledCourses',
                attributes: ['id', 'name']
            }]
        });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: `Error fetching students: ${error.message}` });
    }
});

// Get all students for a specific course
router.get('/:courseId/students', requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Models.Course.findByPk(courseId, {
            include: [{
                model: Models.User,
                as: 'students',
                attributes: ['id', 'userName', 'firstName', 'lastName', 'name', 'email']
            }]
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json(course.students);
    } catch (error) {
        res.status(500).json({ message: `Error fetching course students: ${error.message}` });
    }
});

// Instructor manually enrolls student
router.post('/:courseId/enroll/:studentId', requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { courseId, studentId } = req.params;

        const course = await Models.Course.findByPk(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const student = await Models.User.findByPk(studentId);
        if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

        const existingEnrollment = await Models.Enrollment.findOne({ where: { userId: studentId, courseId } });
        if (existingEnrollment) return res.status(400).json({ message: 'Student already enrolled' });

        await Models.Enrollment.create({ userId: studentId, courseId });
        await course.increment('enrolled');

        res.status(201).json({ message: 'Student successfully enrolled' });
    } catch (error) {
        res.status(500).json({ message: `Error enrolling student: ${error.message}` });
    }
});

// Instructor manually removes student
router.delete('/:courseId/enroll/:studentId', requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { courseId, studentId } = req.params;

        const enrollment = await Models.Enrollment.findOne({ where: { userId: studentId, courseId } });
        if (!enrollment) return res.status(404).json({ message: 'Student not enrolled' });

        await enrollment.destroy();

        const course = await Models.Course.findByPk(courseId);
        if (course) await course.decrement('enrolled');

        res.status(200).json({ message: 'Student successfully completely removed' });
    } catch (error) {
        res.status(500).json({ message: `Error removing student: ${error.message}` });
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
            include: [
                { model: Models.Course, as: 'requirements', attributes: ['id', 'name'] },
                { model: Models.User, as: 'instructor', attributes: ['id', 'userName', 'firstName', 'lastName', 'name', 'email', 'role'] }
            ]
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
                },
                {
                    model: Models.User,
                    as: 'instructor',
                    attributes: ['id', 'userName', 'firstName', 'lastName', 'name', 'email', 'role']
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
                                blocks: lec.blocks || [],
                                moduleId: lec.moduleId.toString()
                            })).sort((a, b) => a.order - b.order) : []
                        })) : []),
                        ...(mod.lectures ? mod.lectures.map(lec => ({
                            id: lec.id.toString(),
                            title: lec.title,
                            order: lec.order,
                            content: lec.content,
                            blocks: lec.blocks || [],
                            moduleId: lec.moduleId.toString()
                        })) : [])
                    ].sort((a, b) => a.order - b.order)
                };
            });
        }

        const courseData = {
            id: course.id.toString(),
            name: course.name,
            instructor: course.instructor,
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