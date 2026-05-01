const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const Models = require('../db/models');
const { Op } = require("sequelize");
const { transporter, sendValidationEmail } = require('./email');
const crypto = require('crypto');

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
		// For debugging, should probably change to just 'Username or Email incorrect' or somthing for security purposes
		if (user) {
			if (user.email === req.body.email) {
				return res.status(400).json({ message: 'An account is already associated with that email address.' });
			}
			if (user.userName === req.body.userName) {
				return res.status(400).json({ message: 'That username is already taken.' });
			}
		}
		const existingUser = await Models.TempUser.findAll({ where: { email: req.body.email } });
		if (existingUser.length > 0) {
			return res.status(500).send("User is already registering.");
		}
		// Hash the password
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		req.body.password = hashedPassword;

		// Generate a unique token for email confirmation
		const token = crypto.randomBytes(32).toString('hex');
		req.body.token = token;
		const newUser = await Models.TempUser.create(req.body);

		try {
			// like this because need to have one instance of transporter, not sure if necesarry but doing just in case
			const email = await sendValidationEmail(transporter, newUser);
			return res.status(200).json({ success: true, message: 'Registration successful. Please check your email to confirm.' });
		} catch (error) {
			await Models.TempUser.destroy({ where: { id: newUser.id } });
			console.log(error);
			res.status(500).send(`Error registering user: ${error}`);
		}
	} catch (error) {
		console.log(error);
		res.status(500).send(`Error registering user: ${error}`);
	}
});

// Confirm User
router.post('/confirm/:userId', async (req, res) => {
	const id = req.params;
	try {
		const user = await Models.TempUser.findByPk(id);
		user.adminConfirmed = true;
		user.save();
		if (user.emailConfirmed) {
			const user = await realUser(user);
			return res.status(200).json({ confirmed: true, made: true });
		} else {
			return res.status(200).json({ confirmed: true, made: false });
		}
	} catch (error) {
		res.status(500).send(`Error confirming user: ${error}`);
	}

});

async function realUser(user) {
	try {
		const result = await sequelize.transaction(async (t) => {
			const userData = user.get();
			// Let the real Users table generate a new ID
			delete userData.id;
			delete userData.token;

			const newUser = await Models.User.create(userData);

			// Delete the temporary user
			await user.destroy();
		});
	} catch (error) {
		return error;
	};
};

// Validate Email
router.post('/validate', async (req, res) => {
	const { token } = req.body;
	if (!token) {
		return res.status(400).json({ success: false, message: 'Token is required' });
	}
	try {
		// Find the temporary user by token
		const tempUser = await Models.TempUser.findOne({ where: { token } });
		if (!tempUser) {
			return res.status(400).json({ success: false, message: 'Invalid or expired confirmation token' });
		}

		if (tempUser.adminConfirmed) {
			const user = await realUser(tempUser);
			return res.json({
				success: true,
				message: 'Email confirmed successfully! You can now log in.',
				user: {
					id: newUser.id,
					userName: newUser.userName,
					email: newUser.email
				}
			});
		} else {
			return res.json({
				success: true,
				message: 'Email confirmed successfully! You\'ll get an email when an admin confirms you.',
			});
		}
	} catch (error) {
		console.error('Error confirming email:', error);
		res.status(500).json({ success: false, message: `Error confirming email: ${error.message}` });
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

// Search users - used by ThreadManager for private thread member managemetn
router.get('/api/users', async (req, res) => {
	try {
		// get the search query from the GET URL
		const search = req.query.search || '';
		// if search exists, apply filters, otherwise return all users (up to limit)
		const users = await Models.User.findAll({
			where: search ? {
				// Op.or makes it match any of the fields, Op.iLike makes it case-insensitive
				[Op.or]: [
					{ userName: { [Op.iLike]: `%${search}%` } },
					{ firstName: { [Op.iLike]: `%${search}%` } },
					{ lastName: { [Op.iLike]: `%${search}%` } },
				]
			} : {},
			// return these fields only
			attributes: ['id', 'userName', 'firstName', 'lastName'],
			limit: 10,
			order: [['userName', 'ASC']]
		});
		res.json(users);
	} catch (error) {
		res.status(500).json({ message: `Error searching users: ${error}` });
	}
});

module.exports = router;