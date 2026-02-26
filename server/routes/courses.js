const express = require('express');
const router = express.Router();
const Models = require('../db/models');
const requireRole = require('../middleware/requireRole');

// === ALL AUTHENTICATED USERS ===
// (requireAuth is applied at the server.js mount point)

// Get all courses (Maps to GET /api/courses)
router.get('/', async (req, res) => {
    try {
        const courses = await Models.Course.findAll({
            include: [
                { model: Models.User, as: 'instructor', attributes: ['id', 'userName', 'firstName', 'lastName', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
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
        const course = await Models.Course.findByPk(courseId, {
            include: [
                { model: Models.User, as: 'instructor', attributes: ['id', 'userName', 'firstName', 'lastName', 'email'] }
            ]
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: `Error fetching course: ${error.message}` });
    }
});

// === STUDENT ONLY ===

// Enroll in a course (Maps to POST /api/courses/:courseId/enroll)
router.post('/:courseId/enroll', requireRole('student'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { courseId } = req.params;

        const course = await Models.Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.enrolled >= course.capacity) {
            return res.status(400).json({ message: 'Course is at full capacity' });
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
        if (course && course.enrolled > 0) {
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
        const { name, capacity, modules } = req.body;

        if (!name || !capacity) {
            return res.status(400).json({ message: 'Course name and capacity are required' });
        }

        // Using a transaction to ensure all or nothing is created
        const newCourse = await Models.Course.sequelize.transaction(async (t) => {
            const course = await Models.Course.create({
                name,
                capacity,
                instructorId: req.session.user.id
            }, { transaction: t });

            // If modules exist, process them
            if (modules && Array.isArray(modules)) {
                for (let i = 0; i < modules.length; i++) {
                    const modData = modules[i];
                    const newModule = await Models.Module.create({
                        title: modData.moduleTitle,
                        order: modData.moduleOrder,
                        courseId: course.id
                    }, { transaction: t });

                    // Process lectures for this module
                    if (modData.moduleContent && Array.isArray(modData.moduleContent)) {
                        for (let j = 0; j < modData.moduleContent.length; j++) {
                            const lecData = modData.moduleContent[j];
                            await Models.Lecture.create({
                                title: lecData.lectureTitle,
                                order: lecData.lectureOrder,
                                content: lecData.content || '',
                                moduleId: newModule.id
                            }, { transaction: t });
                        }
                    }
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

module.exports = router;
