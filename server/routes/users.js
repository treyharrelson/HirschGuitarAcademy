const express = require('express');
const router = express.Router();
const Models = require('../db/models');
const requireRole = require('../middleware/requireRole');
const requireAuth = require('../middleware/requireAuth');
const roles = require('../rolesEnum');

router.get('/tempUsers', requireAuth, requireRole(roles.ADMIN), async (req, res) => {
	try {
		const users = await Models.TempUser.findAll({attributes: ['id', 'name', 'firstName', 'lastName', 'email', 'role', 'emailConfirmed', 'adminConfirmed']});
		res.status(200).json(users);
	}catch(error) {
		res.status(500).json(`Error: ${error}`)
	}
});


router.get('/:userId', requireAuth, async (req, res) => {
	try {
		const { userId } = req.params;

		// Ensure ProfileSettings row exists for this user
		const [profileSettings] = await Models.ProfileSettings.findOrCreate({
			where: { userId }
		});

		const user = await Models.User.findByPk(userId, {
			attributes: ['id', 'name', 'userName', 'email', 'role', 'bio', 'createdAt', 'activeBadgeId'],
			include: [
				{
					model: Models.Badge,
					as: 'earnedBadges',
					through: { attributes: [] }
				},
				{
					model: Models.Badge,
					as: 'activeBadge'
				}
			]
		});

		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		const isSelf = user.id === req.session.user.id;

		if (isSelf) {
			return res.json({ success: true, user, profileSettings });
		} else {
			if (profileSettings.private) {
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
						activeBadge: user.activeBadge,
						earnedBadges: user.earnedBadges
					},
					profileSettings: {
						private: profileSettings.private,
						showName: profileSettings.showName,
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
		const { bio, private: isPrivate, showName, activeBadgeId } = req.body;

		// Ensure user is editing their own profile
		if (parseInt(userId) !== req.session.user.id) {
			return res.status(403).json({ success: false, message: 'You can only edit your own profile' });
		}

		const user = await Models.User.findByPk(userId);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		// Update bio on user if provided
		if (bio !== undefined) user.bio = bio;
		if (activeBadgeId !== undefined) {
			if (activeBadgeId === null) {
				user.activeBadgeId = null;
			} else {
				const hasBadge = await Models.UserBadge.findOne({
					where: { user_id: userId, badge_id: activeBadgeId }
				});
				if (hasBadge) {
					user.activeBadgeId = activeBadgeId;
				} else {
					return res.status(403).json({ success: false, message: "Achievement not earned." });
				}
			}
		}
		await user.save();

		// Update privacy settings on ProfileSettings
		const [profileSettings] = await Models.ProfileSettings.findOrCreate({
			where: { userId }
		});

		if (isPrivate !== undefined) profileSettings.private = isPrivate;
		if (showName !== undefined) profileSettings.showName = showName;
		await profileSettings.save();

		res.json({
			success: true,
			user: { id: user.id, bio: user.bio, activeBadgeId: user.activeBadgeId },
			profileSettings: {
				private: profileSettings.private,
				showName: profileSettings.showName,
			}
		});
	} catch (error) {
		console.error("Error updating user:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
});

module.exports = router;
