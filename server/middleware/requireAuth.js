// so don't have to do this in every route
const requireAuth = (req, res, next) => {
	// Check if the user exists in the session
	if (!req.session.user) {
		return res.status(401).json({
			success: false,
			message: 'Unauthorized: You must be logged in to do this.'
		});
	}

	// If they are logged in, pass to the next function (route)
	next();
};

module.exports = requireAuth;