const requireRole = (roles) => {
	return (req, res, next) => {
		// should use in conjunction with requireAuth.js, so assume session exists
		if (roles.includes(req.session.user.role)) {
			next();
		}
		else {
			res.status(403).json({
				success: false,
				message: `No access. Required role(s): ${roles.join(', ')}.`
			});
		}
	}
}

module.exports = requireRole;