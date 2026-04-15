const express = require('express');
const router = express.Router();
const Models = require('../db/models');
// for Server-Sent-Events(SSE), used to map connected userId's to their response objects
const userClients = new Map();
const { Op } = require('sequelize');

// Get a # of threads at a time with offset pagination logic (Maps to /api/threads)
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const { count, rows: threads } = await Models.Thread.findAndCountAll({
            include: [{ model: Models.User, as: 'author', attributes: ['userName', 'firstName', 'lastName'] }],
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
		const { title } = req.body;
		const newThread = await Models.Thread.create({
			title,
			authorId: req.session.user.id
		});

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
				{ model: Models.User, as: 'author', attributes: ['userName', 'firstName', 'lastName'] },
				{ model: Models.Attachment, as: 'attachments' },
				{ model: Models.Thread, as: 'announcedThread', attributes: ['id', 'title'] }
			]
		});

		// Broadcast the announcement to all connected users
		const payload = `data: ${JSON.stringify({ type: 'new_global_post', post: postWithAuthor })}\n\n`;
		userClients.forEach(clients => clients.forEach(client => client.write(payload)));

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
				{ model: Models.User, as: 'author', attributes: ['userName', 'firstName', 'lastName'] },
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
//   - posts from threads the user is subscribed to
//   - global announcement posts (visible to everyone)
// Uses offset pagination. Maps to GET /api/threads/feed/posts
router.get('/feed/posts', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const subs = await Models.Subscription.findAll({
            where: { userId: req.session.user.id }
        });
        const threadIds = subs.map(s => s.threadId);

        const { count, rows: posts } = await Models.Post.findAndCountAll({
            where: {
                [Op.or]: [
                    // posts from subscribed threads (only if the user follows at least one)
                    ...(threadIds.length > 0 ? [{ threadId: threadIds }] : []),
                    // global announcements always included
                    { scope: 'global' }
                ]
            },
            include: [
                { model: Models.User, as: 'author', attributes: ['userName', 'firstName', 'lastName'] },
                { model: Models.Attachment, as: 'attachments' },
                { model: Models.Thread, as: 'thread', attributes: ['id', 'title'], required: false },
                { model: Models.Thread, as: 'announcedThread', attributes: ['id', 'title'], required: false }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({ posts, total: count, hasMore: offset + limit < count });
    } catch (error) {
        res.status(500).json({ message: `Error fetching feed: ${error}` });
    }
});

// Get a user's followed threads (maps to /api/threads/follows)
router.get('/follows', async (req, res) => {
	try {
		const follows = await Models.Subscription.findAll({
			where: { userId: req.session.user.id },
			include: [{
				model: Models.Thread,
				as: 'thread',
				include: [{ model: Models.User, as: 'author', attributes: ['userName', 'firstName', 'lastName']}]
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
        const follows = await Models.Subscription.findAll({
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

// Get a single thread by ID
router.get('/:threadId', async (req, res) => {
	try {
		const thread = await Models.Thread.findByPk(req.params.threadId, {
			include: [{ model: Models.User, as: 'author', attributes: ['userName', 'firstName', 'lastName'] }]
		});
		if (!thread) return res.status(404).json({message: 'Thread not found' });
		res.json(thread);
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
				{
					model: Models.User,
					as: 'author',
					attributes: ['userName', 'firstName', 'lastName']
				},
				{
					model: Models.Attachment,
					as: 'attachments'
				}
			],
			order: [['createdAt', 'ASC']]
		});
		res.json(posts);
	} catch (error) {
		res.status(500).json({ message: `Error fetching posts: ${error}` });
	}
});

// Create a post in a thread (Maps to /api/threads/:threadId/posts)
router.post('/:threadId/posts', async (req, res) => {
	try {
		const { content, attachments } = req.body;
		const newPost = await Models.Post.create({
			threadId: req.params.threadId,
			authorId: req.session.user.id,
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

		//Auto-subscribe the poster to this thread if not already subscribed
		await Models.Subscription.findOrCreate({
		where: {
			userId: req.session.user.id,
			threadId: req.params.threadId
		}
		});

		// fetch post with author included for the broadcast payload
		const postWithAuthor = await Models.Post.findByPk(newPost.id, {
			include: [
				{ model: Models.User, as: 'author', attributes: ['userName', 'firstName', 'lastName'] },
				{ model: Models.Attachment, as: 'attachments' }
			]
		});

		// find who should receive this event, either users who are subscribed or everyone, if thread is global
		const thread = await Models.Thread.findByPk(req.params.threadId);

		let recipientUserIds;
		if (thread.isGlobalFeed) {
			// broadcast to all connected users
			recipientUserIds = [...userClients.keys()];
		} else {
			// broadcast to subscribed users
			const subs = await Models.Subscription.findAll({
				where: { threadId: req.params.threadId }
			});
			recipientUserIds = subs.map(s => s.userId);
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

// Get subscription status for current user on this thread
router.get('/:threadId/subscribe', async (req, res) => {
	try {
		const subscription = await Models.Subscription.findOne({
			where: {
				userId: req.session.user.id,
				threadId: req.params.threadId
			}
		});
		res.json({ subscribed: !!subscription });
	} catch (error) {
		res.status(500).json({ message: `Error checking subscription: ${error} `});
	}
});

// Subscribe to a thread (maps to /api/threads/:threadId/subscribe)
router.post('/:threadId/subscribe', async (req, res) => {
	try {
		const [subscription, created] = await Models.Subscription.findOrCreate({
			where: {
				userId: req.session.user.id,
				threadId: req.params.threadId
			}
		});
		res.status(created ? 201 : 200).json(subscription);
	} catch (error) {
		res.status(500).json({ message: `Error subscribing: ${error}` });
	}
});

// Unsubscribe from a thread
router.delete('/:threadId/subscribe', async (req, res) => {
	try {
		await Models.Subscription.destroy({
			where: {
				userId: req.session.user.id,
				threadId: req.params.threadId
			}
		});
		res.status(204).end();
	} catch (error) {
		res.status(500).json({ message: `Error unsubscribing: ${error}` });
	}
});

// updates lastReadAt on the followed thread
router.post('/:threadId/read', async (req, res) => {
    try {
        const [follow] = await Models.Subscription.findOne({
            where: { userId: req.session.user.id, threadId: req.params.threadId }
        });

		if (!follow) return res.status(204).end();

        await follow.update({ lastReadAt: new Date() });
        res.json({ lastReadAt: follow.lastReadAt });
    } catch (error) {
        res.status(500).json({ message: `Error marking as read: ${error}` });
    }
});

module.exports = router;
