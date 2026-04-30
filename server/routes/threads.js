const express = require('express');
const router = express.Router();
const Models = require('../db/models');
// for Server-Sent-Events(SSE), used to map connected userId's to their response objects
const userClients = new Map();
const { Op } = require('sequelize');
const { getReactionSummary } = require('./posts');
const requireRole = require('../middleware/requireRole');
const requireAuth = require('../middleware/requireAuth');
const roles = require('../rolesEnum');

// Get a # of threads at a time with offset pagination logic (Maps to /api/threads)
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
		const userId = req.session.user.id;

		// find private threadIds this user has access to
		const memberOf = await Models.ThreadMember.findAll({
			where: { userId },
			attributes: ['threadId']
		});
		// pull out the list of threadIds
		const memberThreadIds = memberOf.map(m => m.threadId);

        const { count, rows: threads } = await Models.Thread.findAndCountAll({
			where: {
				// if the thread is not private or it is private but the user is in it, it is included
				[Op.or]: [
					{ visibility: ['public', 'global'] },
					...(memberThreadIds.length > 0 ? [{ id: memberThreadIds}] : [])
				]
			},
            include: [{ model: Models.User, as: 'author', attributes: ['id', 'userName', 'firstName', 'lastName', 'name'] }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({ threads, total: count, hasMore: offset + limit < count });
    } catch (error) {
        res.status(500).json({ message: `Error fetching threads: ${error}` });
    }
});

// Create a thread (Maps to /api/threads)
// Also auto-creates a global announcement post and broadcasts it via SSE
router.post('/', async (req, res) => {
	try {
		const { title, visibility = 'public', makeAnnouncement = true, parentThreadId = null } = req.body;
		
		// validate visibility
		if (!['public', 'global', 'private'].includes(visibility)) {
			return res.status(400).json({ message: "visibility must be 'public', 'global', or 'private'" });
		}

		const newThread = await Models.Thread.create({
			title,
			authorId: req.session.user.id,
			visibility,
			parentThreadId: parentThreadId || null,
		});

		// if private, immediately add the creator as a member so they can see their own thread
		if (visibility === 'private') {
			await Models.ThreadMember.findOrCreate({
				where: {
					threadId: newThread.id,
					userId: req.session.user.id
				}
			});
		}

		if (makeAnnouncement) {
			// Auto-create a global announcement post for the new thread
			const announcementPost = await Models.Post.create({
				content: `New thread started: "${title}" — jump in and join the discussion!`,
				authorId: req.session.user.id,
				scope: 'global',
				threadId: null,
				announcedThreadId: newThread.id
			});


			const postWithAuthor = await Models.Post.findByPk(announcementPost.id, {
				include: [
					{ model: Models.User, as: 'author', attributes: ['id', 'userName', 'firstName', 'lastName', 'name'] },
					{ model: Models.Attachment, as: 'attachments' },
					{ model: Models.Thread, as: 'announcedThread', attributes: ['id', 'title', 'visibility'] }
				]
			});

			// Broadcast the announcement to all connected users
			const payload = `data: ${JSON.stringify({ type: 'new_global_post', post: postWithAuthor })}\n\n`;
			userClients.forEach(clients => clients.forEach(client => client.write(payload)));
		}
		
		// auto follow the thread author
		await Models.Follow.findOrCreate({
			where: {
				userId: req.session.user.id,
				threadId: newThread.id
			}
		});

		res.status(201).json(newThread);
	} catch (error) {
		if (error.name === 'SequelizeUniqueConstraintError') {
			return res.status(409).json({ message: 'A thread with that title already exists' });
		}
		res.status(500).json({ message: `Error creating thread: ${error}` });
	}
});

// SSE stream: client connects here for live feed/thread updates
// maps to Get /api/threads/stream
router.get('/stream', (req, res) => {
	const userId = req.session.user.id;

	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.flushHeaders();

	// accounts for the user having multiple tabs open
	if (!userClients.has(userId)) userClients.set(userId, new Set());
	userClients.get(userId).add(res);

	// heartbeat every 30s: keeps Railway's proxy from closing idle connections
	const heartbeat = process.env.NODE_ENV === 'production'
	? setInterval(() => res.write(': heartbeat\n\n'), 30000)
	: null;

	// close handler
	req.on('close', () => {
		userClients.get(userId)?.delete(res);
		if (userClients.get(userId)?.size === 0) userClients.delete(userId);
		if (heartbeat) clearInterval(heartbeat);
	});
});

// Create a global feed post (Maps to POST /api/threads/feed)
router.post('/feed', async (req, res) => {
	try {
		const { content, attachments } = req.body;

		const newPost = await Models.Post.create({
			content,
			authorId: req.session.user.id,
			scope: 'global',
			threadId: null
		})

		if (attachments && attachments.length > 0) {
			const attachmentRecords = attachments.map(att => ({
				postId: newPost.id,
				fileKey: att.fileKey,
				fileType: att.fileType,
				fileName: att.fileName
			}));
			await Models.Attachment.bulkCreate(attachmentRecords);
		}

		// fetch post with author included for the broadcast payload
		const postWithAuthor = await Models.Post.findByPk(newPost.id, {
			include: [
				{ model: Models.User, as: 'author', attributes: ['id', 'userName', 'firstName', 'lastName', 'name', 'email', 'role'] },
				{ model: Models.Attachment, as: 'attachments' }
			]
		});

		// broadcast to ALL connected users
		const payload = `data: ${JSON.stringify({
			type: 'new_global_post',
			post: postWithAuthor
		})}\n\n`;

		userClients.forEach(clients => {
			clients.forEach(client => client.write(payload));
		});

		res.status(201).json(newPost);
	} catch(error) {
		res.status(500).json({ message: `Error creating post: ${error}`});
	}
});

// Gets a merged, chronologically sorted feed of:
//   - posts from threads the user follows
//   - global announcement posts (visible to everyone)
//	 - global feed threads (threads that have been designated as Global)
// Uses offset pagination. Maps to GET /api/threads/feed/posts
router.get('/feed/posts', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

		// grab threads that the user follows
        const follows = await Models.Follow.findAll({
            where: { userId: req.session.user.id }
        });
        const followedThreadIds = follows.map(f => f.threadId);

		// also grab all threads marked as global feed
		const globalThreads = await Models.Thread.findAll({
			where: { visibility: 'global' },
			attributes: ['id']
		});
		const globalThreadIds = globalThreads.map(t => t.id);

		// Merge followed threads and global threads
		const threadIds = [...new Set([...followedThreadIds, ...globalThreadIds])];

        const { count, rows: posts } = await Models.Post.findAndCountAll({
            where: {
                [Op.or]: [
                    // posts from followed threads (only if the user follows at least one)
                    ...(threadIds.length > 0 ? [{ threadId: threadIds }] : []),
                    // standalone global posts (announcements, feed-only posts)
                    { scope: 'global' }
                ]
            },
            include: [
                { model: Models.User, as: 'author', attributes: ['id', 'userName', 'firstName', 'lastName', 'name'] },
                { model: Models.Attachment, as: 'attachments' },
                { model: Models.Thread, as: 'thread', attributes: ['id', 'title'], required: false },
                { model: Models.Thread, as: 'announcedThread', attributes: ['id', 'title', 'visibility'], required: false },
				{ model: Models.Comment, as: 'comments', separate: true, order: [['createdAt', 'ASC']], include: [
					{ model: Models.User, as: 'author', attributes: ['id', 'userName', 'firstName', 'lastName', 'name'] }
				]}
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        const userId = req.session.user.id;
		const postsWithReactions = await Promise.all(posts.map(async p => {
			const summary = await getReactionSummary({ postId: p.id }, userId);
			const commentsWithReactions = await Promise.all((p.comments || []).map(async c => {
				const cs = await getReactionSummary({ commentId: c.id }, userId);
				return { ...c.toJSON(), ...cs };
			}));
			return { ...p.toJSON(), ...summary, comments: commentsWithReactions };
		}));
		res.json({ posts: postsWithReactions, total: count, hasMore: offset + limit < count });
    } catch (error) {
        res.status(500).json({ message: `Error fetching feed: ${error}` });
    }
});

// Get a user's followed threads (maps to /api/threads/follows)
router.get('/follows', async (req, res) => {
	try {

		const follows = await Models.Follow.findAll({
			where: { userId: req.session.user.id },
			include: [{
				model: Models.Thread,
				as: 'thread',
				include: [{ model: Models.User, as: 'author', attributes: ['id', 'userName', 'firstName', 'lastName', 'name']}]
			}],
			order: [['createdAt', 'DESC']]
		});

		const followsWithUnread = await Promise.all(follows.map(async (follows) => {
            const since = follows.lastReadAt || follows.createdAt;
            const unreadCount = await Models.Post.count({
                where: { threadId: follows.threadId, createdAt: { [Op.gt]: since } }
            });
            return { ...follows.toJSON(), unreadCount };
        }));

		res.json(followsWithUnread);
	}	catch (error) {
		res.status(500).json({ message: `Error fetching followed threads: ${error}` });
	}
});

// get unread count for all followed threads (maps to /api/threads/unread-counts)
router.get('/unread-counts', async (req, res) => {
    try {
        const follows = await Models.Follow.findAll({
            where: { userId: req.session.user.id }
        });

        const entries = await Promise.all(follows.map(async (follows) => {
            const since = follows.lastReadAt || follows.createdAt;
            const count = await Models.Post.count({
                where: { threadId: follows.threadId, createdAt: { [Op.gt]: since } }
            });
            return [follows.threadId, count];
        }));

        res.json(Object.fromEntries(entries));
    } catch (error) {
        res.status(500).json({ message: `Error fetching unread counts: ${error}` });
    }
});

// Get members of a private thread (GET /api/threads/:threadId/members)
router.get('/:threadId/members', async (req, res) => {
	try {
		// find members of the thread given by the GET URL param, 
		const members = await Models.ThreadMember.findAll({
			where: { threadId: req.params.threadId },
			// join Users table
			include: [{ model: Models.User, as: 'user', attributes: ['id', 'userName', 'firstName', 'lastName', 'name'] }]
		});
		// map the nested users from the query so that the response is only the users
		res.json(members.map(m => m.user));
	} catch (error) {
		res.status(500).json({ message: `Error fetching members: ${error}`});
	}
});

// Add a member to a private thread (POST /api/threads/:threadId/members)
router.post('/:threadId/members', async (req, res) => {
	try {
		// get userId from request
		const { userId } = req.body;
		if (!userId) return res.status(400).json({ message: 'userId is required' });
		// add new record for ThreadMember
		const [member, created] = await Models.ThreadMember.findOrCreate({
			where: { threadId: req.params.threadId, userId }
		});
		res.status(created ? 201 : 200).json(member);
	} catch (error) {
		res.status(500).json({ message: `Error adding member: ${error}` });
	}
});

// Remove a member from a private thread (DELETE /api/threads/:threadId/members/:userId)
router.delete('/:threadId/members/:userId', async (req, res) => {
	try {
		await Models.ThreadMember.destroy({
			where: { threadId: req.params.threadId, userId: req.params.userId }
		});
		res.status(204).end();
	} catch (error) {
		res.status(500).json({ message: `Error deleting member: ${error}`});
	}
});

// Get a single thread by ID
router.get('/:threadId', async (req, res) => {
	try {
		const thread = await Models.Thread.findByPk(req.params.threadId, {
			include: [{ model: Models.User, as: 'author', attributes: ['id', 'userName', 'firstName', 'lastName', 'name'] }]
		});
		if (!thread) return res.status(404).json({message: 'Thread not found' });
		
		const userId = req.session.user.id;
		const isBanned = await Models.ThreadBan.findOne({
			where: { userId, threadId: thread.id }
		});

		res.json({ ...thread.toJSON(), isBanned: !!isBanned });
	} catch (error) {
		res.status(500).json({ message: `Error fetching thread: ${error}` });
	}
});

// Get posts in a thread (Maps to /api/threads/:threadId/posts)
router.get('/:threadId/posts', async (req, res) => {
	try {
		const posts = await Models.Post.findAll({
			where: { threadId: req.params.threadId },
			include: [
				{ model: Models.User, as: 'author', attributes: ['id', 'userName', 'firstName', 'lastName', 'name'] },
				{ model: Models.Attachment, as: 'attachments' },
				{ model: Models.Thread, as: 'thread', attributes: ['id', 'title'] },
				{ model: Models.Comment, as: 'comments', separate: true, order: [['createdAt', 'ASC']], include: [
					{ model: Models.User, as: 'author', attributes: ['id', 'userName', 'firstName', 'lastName', 'name'] }
				]}
			],
			order: [['createdAt', 'ASC']]
		});
		const userId = req.session.user.id;
		const postsWithReactions = await Promise.all(posts.map(async p => {
			const summary = await getReactionSummary({ postId: p.id }, userId);
			const commentsWithReactions = await Promise.all((p.comments || []).map(async c => {
				const cs = await getReactionSummary({ commentId: c.id }, userId);
				return { ...c.toJSON(), ...cs };
			}));
			return { ...p.toJSON(), ...summary, comments: commentsWithReactions };
		}));
		res.json(postsWithReactions);
	} catch (error) {
		res.status(500).json({ message: `Error fetching posts: ${error}` });
	}
});

// Create a post in a thread (Maps to /api/threads/:threadId/posts)
router.post('/:threadId/posts', async (req, res) => {
	try {
		const { threadId } = req.params;
		const userId = req.session.user.id;
		const { content, attachments } = req.body;

		// Check for ban
		const isBanned = await Models.ThreadBan.findOne({
			where: { userId, threadId }
		});
		if (isBanned) {
			return res.status(403).json({ message: 'You are banned from posting in this thread.' });
		}

		const newPost = await Models.Post.create({
			threadId: req.params.threadId,
			authorId: userId,
			content,
			scope: 'thread'
		});

		if (attachments && attachments.length > 0) {
			const attachmentRecords = attachments.map(att => ({
				postId: newPost.id,
				fileKey: att.fileKey,
				fileType: att.fileType,
				fileName: att.fileName
			}));
			await Models.Attachment.bulkCreate(attachmentRecords);
		}

		//Auto-follow the poster to this thread if not already followed
		await Models.Follow.findOrCreate({
		where: {
			userId: req.session.user.id,
			threadId: req.params.threadId
		}
		});

		// fetch post with author included for the broadcast payload
		const postWithAuthor = await Models.Post.findByPk(newPost.id, {
			include: [
				{ model: Models.User, as: 'author', attributes: ['id', 'userName', 'firstName', 'lastName', 'name', 'email', 'role'] },
				{ model: Models.Attachment, as: 'attachments' },
				{ model: Models.Thread, as: 'thread', attributes: ['id', 'title'] }
			]
		});

		// find who should receive this event, either users who are followed or everyone, if thread is global
		const thread = await Models.Thread.findByPk(req.params.threadId);

		let recipientUserIds;
		if (thread.isGlobalFeed) {
			// broadcast to all connected users
			recipientUserIds = [...userClients.keys()];
		} else {
			// broadcast to followed users
			const follows = await Models.Follow.findAll({
				where: { threadId: req.params.threadId }
			});
			recipientUserIds = follows.map(f => f.userId);
		}

		const payload = `data: ${JSON.stringify({ type: 'new_post', threadId: req.params.threadId, post: postWithAuthor })}\n\n`;
		recipientUserIds.forEach(uid => {
			userClients.get(uid)?.forEach(client => client.write(payload));
		});

		res.status(201).json(newPost);
	} catch (error) {
		console.error('Error creating post: ', error)
		res.status(500).json({ message: `Error creating post: ${error}` });
	}
});

// Get follow status for current user on this thread
router.get('/:threadId/follow', async (req, res) => {
	try {
		const follow = await Models.Follow.findOne({
			where: {
				userId: req.session.user.id,
				threadId: req.params.threadId
			}
		});
		res.json({ followed: !!follow });
	} catch (error) {
		res.status(500).json({ message: `Error checking follow status: ${error} `});
	}
});

// follow a thread (maps to /api/threads/:threadId/follow)
router.post('/:threadId/follow', async (req, res) => {
	try {
		const [follow, created] = await Models.Follow.findOrCreate({
			where: {
				userId: req.session.user.id,
				threadId: req.params.threadId
			}
		});
		res.status(created ? 201 : 200).json(follow);
	} catch (error) {
		res.status(500).json({ message: `Error following: ${error}` });
	}
});

// Unfollow a thread
router.delete('/:threadId/follow', async (req, res) => {
	try {
		await Models.Follow.destroy({
			where: {
				userId: req.session.user.id,
				threadId: req.params.threadId
			}
		});
		res.status(204).end();
	} catch (error) {
		res.status(500).json({ message: `Error unfollowing: ${error}` });
	}
});

// updates lastReadAt on the followed thread
router.post('/:threadId/read', async (req, res) => {
    try {
        const follow = await Models.Follow.findOne({
            where: { userId: req.session.user.id, threadId: req.params.threadId }
        });

		if (!follow) return res.status(204).end();

        await follow.update({ lastReadAt: new Date() });
        res.json({ lastReadAt: follow.lastReadAt });
    } catch (error) {
        res.status(500).json({ message: `Error marking as read: ${error}` });
    }
});

// update visibility of a thread (PATCH /api/threads/:threadId/visibility)
// NOTE: a thread should not be able to be private and global at the same time
// TODO: add requireRole([ROLES.MODERATOR]) once roles are finalized
// PATCH /api/threads/:threadId/visibility — set to 'public', 'global', or 'private'
router.patch('/:threadId/visibility', async (req, res) => {
    try {
		// get visibility and ensure it is valid
        const { visibility } = req.body;
        if (!['public', 'global', 'private'].includes(visibility)) {
            return res.status(400).json({ message: "visibility must be 'public', 'global', or 'private'" });
        }

		// find the thread to update
        const thread = await Models.Thread.findByPk(req.params.threadId);
        if (!thread) return res.status(404).json({ message: 'Thread not found' });
        
		// if making private:
		if (visibility === 'private') {

			// make the current user (should be admin) a member
			await Models.ThreadMember.findOrCreate({
				where: {
					threadId: thread.id,
					userId: req.session.user.id
				}
			});

			// block making a private thread with 0 members - invalid state
			const count = await Models.ThreadMember.count({
				where: { threadId: req.params.threadId }
			});
			if (count === 0) {
				return res.status(400).json({
					message: 'Cannot make thread private without members'
				});
			}
		}
		await thread.update({ visibility });
        res.json({ id: thread.id, visibility: thread.visibility });
    } catch (error) {
        res.status(500).json({ message: `Error updating thread: ${error}` });
    }
});

// delete a thread and its posts/follows (DELETE /api/threads/:threadId)
// TODO: add requireRole([ROLES.MODERATOR]) once roles are finalized
router.delete('/:threadId', async (req, res) => {
	try {
		const thread = await Models.Thread.findByPk(req.params.threadId);
		if (!thread) return res.status(404).json({ message: 'Thread not found' });
		
		// delete posts inside the thread
		await Models.Post.destroy({ where: { threadId: thread.id } });

		// delete the announcement post that was auto-created when this thread was made
		// (it has threadId: null but announcedThreadId pointing here)
		await Models.Post.destroy({ where: {announcedThreadId: thread.id } });

		// delete the follow relationships between users and the thread
		await Models.Follow.destroy({ where: { threadId: thread.id } });
		
		// delete the member records if it was a private thread
		await Models.ThreadMember.destroy({ where: { threadId: thread.id } });

		// finally, delete the thread
		await thread.destroy();
		res.status(204).end();
	} catch (error) {
		res.status(500).json({ message: `Error banning user: ${error}` });
	}
});



// ban user from a thread
router.post('/:threadId/ban', requireRole(roles.MODERATOR, roles.ADMIN), async (req, res) => {
	try {
		const { threadId } = req.params;
		const { userId } = req.body;
		if (!userId) return res.status(400).json({ message: 'userId is required' });
		
		const parsedThreadId = parseInt(threadId);
		const parsedUserId = parseInt(userId);

		if (isNaN(parsedThreadId) || isNaN(parsedUserId)) {
			return res.status(400).json({ message: 'Valid threadId and userId are required for banning' });
		}

		await Models.ThreadBan.findOrCreate({
			where: { userId: parsedUserId, threadId: parsedThreadId },
			defaults: { bannedById: req.session.user.id }
		});
		res.status(200).json({ message: 'User banned successfully' });
	} catch (error) {
		console.error('Error in /ban route:', error);
		res.status(500).json({ message: `Error banning user: ${error.message || error}` });
	}
});

// Unban user from thread
router.delete('/:threadId/ban/:userId', requireRole(roles.MODERATOR, roles.ADMIN), async (req, res) => {
	try {
		const { threadId, userId } = req.params;
		await Models.ThreadBan.destroy({
			where: { userId, threadId }
		});
		res.status(200).json({ message: 'User unbanned successfully' });
	} catch (error) {
		res.status(500).json({ message: `Error unbanning user: ${error}` });
	}
});

// Get banned users in a thread
router.get('/:threadId/ban', requireRole(roles.MODERATOR, roles.ADMIN), async (req, res) => {
	try {
		const bans = await Models.ThreadBan.findAll({
			where: { threadId: req.params.threadId },
			include: [{ model: Models.User, as: 'user', attributes: ['id', 'userName', 'firstName', 'lastName', 'name'] }]
		});
		res.status(200).json(bans);
	} catch (error) {
		res.status(500).json({ message: `Error fetching bans: ${error}` });
	}
});

module.exports = router;