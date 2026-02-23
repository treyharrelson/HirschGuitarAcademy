const express = require('express');
const router = express.Router();
const Models = require('../db/models');

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
		res.status(500).json({ message: `Error creating thread: ${error}` });
	}
});

// Get posts in a thread (Maps to /api/threads/:threadId/posts)
router.get('/:threadId/posts', async (req, res) => {
	try {
		const posts = await Models.Post.findAll({
			where: { threadId: req.params.threadId },
			include: [{
				model: Models.User,
				as: 'author',
				attributes: ['userName', 'firstName', 'lastName']
			}],
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
		const { content } = req.body;
		console.info(req.params.threadId)
		const newPost = await Models.Post.create({
			threadId: req.params.threadId,
			authorId: req.session.user.id,
			content
		});

		res.status(201).json(newPost);
	} catch (error) {
		console.error('Error creating post: ', error)
		res.status(500).json({ message: `Error creating post: ${error}` });
	}
});

module.exports = router;