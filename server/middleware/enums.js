// "enum" for user roles, why typescript might be better because can just use what's put in database for this
const ROLES = Object.freeze({
	STUDENT: 'student',
	INSTRUCTOR: 'instructor',
	ADMIN: 'admin'
});

module.exports = ROLES;