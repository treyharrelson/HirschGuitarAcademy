const express = require('express');
const router = express.Router();
const { Badge, User, Course } = require('../db/models');
const requireRole = require('../middleware/requireRole');
const requireAuth = require('../middleware/requireAuth');

// --- PUBLIC/STUDENT ROUTES ---

// GET all badges (Library View)
router.get('/', requireAuth, async (req, res) => {
    try {
        const badges = await Badge.findAll();
        res.json(badges);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch badge library" });
    }
});

// GET current user's earned badges (Collection View)
router.get('/my-badges', requireAuth, async (req, res) => {
    try {
        const userWithBadges = await User.findByPk(req.user.id, {
            include: [{ model: Badge, as: 'earnedBadges' }]
        });
        res.json(userWithBadges.earnedBadges);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch your badges" });
    }
});

// PATCH set active badge (Equip for Forum/Profile)
router.patch('/set-active', requireAuth, async (req, res) => {
    const { badgeId } = req.body;
    try {
        const user = await User.findByPk(req.user.id);

        // Safety check: ensure user owns the badge they are trying to equip
        if (badgeId !== null) {
            const hasBadge = await user.hasEarnedBadge(badgeId); // Magic method from belongsToMany
            if (!hasBadge) {
                return res.status(403).json({ error: "You must earn this badge before equipping it." });
            }
        }

        await user.update({ activeBadgeId: badgeId });
        res.json({ message: "Active badge updated successfully", activeBadgeId: badgeId });
    } catch (err) {
        res.status(500).json({ error: "Failed to update active badge" });
    }
});

// --- ADMIN / INSTRUCTOR ROUTES ---

// POST create new badge (Admin/Instructor only)
router.post('/', requireAuth, requireRole('admin', 'instructor'), async (req, res) => {
    const { name, imageUrl, description } = req.body;
    try {
        const newBadge = await Badge.create({ name, imageUrl, description });
        res.status(201).json(newBadge);
    } catch (err) {
        res.status(400).json({ error: "Failed to create badge definition" });
    }
});

// PATCH link a badge to a course (Instructor only)
router.patch('/link-course/:courseId', requireAuth, requireRole('instructor', 'admin'), async (req, res) => {
    const { badgeId } = req.body;
    const { courseId } = req.params;
    try {
        const course = await Course.findByPk(courseId);
        if (!course) return res.status(404).json({ error: "Course not found" });

        // Ensure the instructor owns this course (Optional security check)
        if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
            return res.status(403).json({ error: "You can only modify badges for your own courses." });
        }

        await course.update({ completionBadgeId: badgeId });
        res.json({ message: "Course completion badge updated", completionBadgeId: badgeId });
    } catch (err) {
        res.status(500).json({ error: "Failed to link badge to course" });
    }
});

module.exports = router;