const express = require('express');
const router = express.Router();
const Models = require('../db/models');
const requireRole = require('../middleware/requireRole');
const requireAuth = require('../middleware/requireAuth');

router.get('/:userId', requireAuth, async (req, res) => {
	try {
		const { userId } = req.params;
		const user = await Models.User.findByPk(userId, {
			attributes: ['id', 'name', 'userName', 'email', 'role', 'private', 'bio', 'createdAt']
		});

		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		const isSelf = user.id === req.session.user.id;

		if (isSelf) {
			return res.json({ success: true, user });
		} else {
			if (user.private) {
				return res.status(403).json({ success: false, message: 'This profile is private' });
			} else {
				// Don't send email or other sensitive info for public profiles
				return res.json({
					success: true,
					user: {
						id: user.id,
						realName: user.name,
						name: user.userName,
						role: user.role,
						bio: user.bio,
						createdAt: user.createdAt,
					}
				});
			}
		}
	} catch (error) {
		console.error("Error fetching user:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
});

router.put('/:userId', requireAuth, async (req, res) => {
	try {
		const { userId } = req.params;
		const { bio, private } = req.body;

		// Ensure user is editing their own profile
		if (parseInt(userId) !== req.session.user.id) {
			return res.status(403).json({ success: false, message: 'You can only edit your own profile' });
		}

		const user = await Models.User.findByPk(userId);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		if (bio !== undefined) user.bio = bio;
		if (private !== undefined) user.private = private;

		await user.save();

		res.json({ success: true, user: { id: user.id, bio: user.bio, private: user.private } });
	} catch (error) {
		console.error("Error updating user:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
});

module.exports = router;
