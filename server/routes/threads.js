const express = require('express');
const router = express.Router();
const Models = require('../db/models');
// for Server-Sent-Events(SSE), used to map connected userId's to their response objects
const userClients = new Map();

// Get all threads (Maps to /api/threads)
router.get('/', async (req, res) => {
	try {
		const threads = await Models.Thread.findAll({
			include: [{
				model: Models.User,
				as: 'author',
				attributes: ['userName', 'firstName', 'lastName']
			}],
			order: [['createdAt', 'DESC']]
		});
		res.json(threads);
	} catch (error) {
		res.status(500).json({ message: `Error fetching threads: ${error}` });
	}
});

// Create a thread (Maps to /api/threads)
router.post('/', async (req, res) => {
	try {
		// took out auth code because runs in requireAuth in server.js
		const { title } = req.body;
		const newThread = await Models.Thread.create({
			title,
			authorId: req.session.user.id
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
	console.log('POST /api/threads/:threadId/posts called');
	console.log('Thread ID :', req.params.threadId);
	console.log('Request body: ', req.body);
	console.log('Session user: ', req.session.user);
	try {
		const { content, attachments } = req.body;
		console.info(req.params.threadId)
		const newPost = await Models.Post.create({
			threadId: req.params.threadId,
			authorId: req.session.user.id,
			content
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

module.exports = router;