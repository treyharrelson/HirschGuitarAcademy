const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const Models = require('../db/models'); // Adjust path to go up one directory

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
	console.log('Register request received');
	console.log('Request body:', req.body);
	try {
		// Hash the password
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		req.body.password = hashedPassword;

		// should probably have more validation here

		// Insert the new user into the database
		const newUser = await Models.User.create(req.body);
		res.json({ success: true, message: 'User registered successfully' });
	} catch (error) {
		res.status(500).send(`Error registering user: ${error}`);
	}
});

// User login
router.post('/login', async (req, res) => {
	const { email, password } = req.body;

	try {
		// Find the user by email
		const user = await Models.User.findOne({ where: { email: email } });
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
router.post('/logout', (req, res) => {
	req.session.destroy(function (err) {
		if (err) {
			return nextTick(err);
		}
		res.redirect("/");
	});
});

module.exports = router;