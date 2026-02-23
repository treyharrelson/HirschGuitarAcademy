const requireRole = (requiredRole) => {
	return (req, res, next) => {
		// should use in conjunction with requireAuth.js, so assume session exists
		if (req.session.user.role === requiredRole) {
			next();
		}
		else {
			res.status(403).json({
				success: false,
				message: `No access, must be ${requiredRole}.`
			});
		}
	}
}

module.exports = requireRole;