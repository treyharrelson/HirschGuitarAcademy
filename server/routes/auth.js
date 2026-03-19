const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const Models = require('../db/models');
const { Op } = require("sequelize");

// Check if user is logged in (read from session)
router.get('/api/me', (req, res) => {
	if (req.session.user) {
		res.json({
			success: true,
			user: req.session.user
		});
	} else {
		res.status(401).json({
			success: false,
			message: 'Not authenticated'
		});
	}
});

// Register a new user
router.post('/register', async (req, res) => {
	try {
		// better error messages
		// Tries to find user with either matching email or username
		const user = await Models.User.findOne({ where: { [Op.or]: { email: req.body.email, userName: req.body.userName } } });
		// if does, sends appropriate error
		if (user) {
			if (user.email === req.body.email) {
				return res.status(400).json({ message: 'An account is already associated with that email address.' });
			}
			if (user.userName === req.body.userName) {
				return res.status(400).json({ message: 'That username is already taken.' });
			}
		}
		// Hash the password
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		req.body.password = hashedPassword;

		// Insert the new user into the database
		const newUser = await Models.User.create(req.body);
		res.json({ success: true, message: 'User registered successfully' });
	} catch (error) {
		res.status(500).send(`Error registering user: ${error}`);
	}
});

// User login
router.post('/login', async (req, res) => {
	const { email: login, password } = req.body;
	try {
		const user = await Models.User.findOne({ where: { [Op.or]: { email: login, userName: login } } });
		if (!user) {
			return res.status(404).send('User not found');
		}

		// Compare the hashed password
		const isMatch = await bcrypt.compare(password, user.password);
		if (isMatch) {
			req.session.user = {
				id: user.id,
				role: user.role,
				name: `${user.firstName} ${user.lastName}`,
				email: user.email
			};
			res.json({
				success: true,
				user: {
					id: user.id,
					name: `${user.firstName} ${user.lastName}`,
					email: user.email,
					role: user.role
				}
			})
		}
		else {
			res.status(401).json({ success: false, message: 'Invalid credentials' });
		}
	} catch (error) {
		res.status(500).send(`Error logging in: ${error}`);
	}
});

// User logout
router.post('/logout', (req, res, next) => {
	req.session.destroy(function (err) {
		if (err) {
			return next(err);
		}
		// Also clear the actual session cookie in the browser to make the frontend checkAuth fail
		res.clearCookie('connect.sid');
		res.json({ success: true, message: 'Logged out successfully' });
	});
});

module.exports = router;