const requireRole = (...roles) => {
	return (req, res, next) => {
		if (req.session && req.session.user && roles.includes(req.session.user.role)) {
			next();
		} else {
			res.status(403).json({
				success: false,
				message: req.session?.user
					? `No access. Required role(s): ${roles.join(', ')}.`
					: "Session expired or user not logged in."
			});
		}
	}
}
module.exports = requireRole;