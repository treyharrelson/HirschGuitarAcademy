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
            // don't include enrollment table data
            attributes: [],
            // get all rows with userId
            where: { userId: userId },
            // get Courses that are in rolls
            include: [
                {
                    // didn't add "as" in relations for some reason, so don't add "as" here, just returns as "Course" in object
                    model: Models.Course,
                    attributes: ['id', 'name', 'instructorId', 'enrolled', 'isPrivate'],
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
                isPrivate: course.isPrivate,
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

        const course = await Models.Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
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

// === INSTRUCTOR OR ADMIN ===

// Create a new course (Maps to POST /api/courses)
router.post('/', requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { name, modules } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Course name is required' });
        }
        // Using a transaction to ensure all or nothing is created
        const newCourse = await Models.Course.sequelize.transaction(async (t) => {
            const course = await Models.Course.create({
                name,
                instructorId: req.session.user.id
            }, { transaction: t });

            // If modules exist, process them
            if (modules) {
                let modulestocreate = []
                let lecturestocreate = []
                for (let i = 0; i < modules.length; i++) {
                    const modData = modules[i];
                    const newModule = await Models.Module.build({
                        title: modData.moduleTitle,
                        order: modData.moduleOrder,
                        courseId: course.id
                    }, { transaction: t });

                    modulestocreate.push(newModule);

                    // Process lectures for this module
                    if (modData.moduleContent && Array.isArray(modData.moduleContent)) {
                        for (let j = 0; j < modData.moduleContent.length; j++) {
                            const lecData = modData.moduleContent[j];
                            const newLecture = await Models.Lecture.create({
                                title: lecData.lectureTitle,
                                order: lecData.lectureOrder,
                                content: lecData.content || '',
                                moduleId: newModule.id
                            }, { transaction: t });
                            lecturestocreate.push(newLecture);
                        }
                    }
                }
                Models.Module.bulkCreate(modulestocreate);
                if (lecturestocreate) {
                    Models.Lecture.bulkCreate(lecturestocreate);
                }
            }
            return course;
        });

        res.status(201).json(newCourse);
    } catch (error) {
        res.status(500).json({ message: `Error creating course: ${error.message}` });
    }
});

// Delete a course (Maps to DELETE /api/courses/:courseId)
// Instructors can only delete their own; admins can delete any
router.delete('/:courseId', requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Models.Course.findByPk(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Instructors can only delete courses they own
        if (req.session.user.role === 'instructor' && course.instructorId !== req.session.user.id) {
            return res.status(403).json({ message: 'You can only delete your own courses' });
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
        });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: `Error fetching courses: ${error.message}` });
    }
});

// Get a specific course by ID (Maps to GET /api/courses/:courseId)
router.get('/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Models.Course.findByPk(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: `Error fetching course: ${error.message}` });
    }
});

module.exports = router;
