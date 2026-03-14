const Models = require('./models')
const bcrypt = require('bcrypt');

async function getrecord(fname, lname, uname, email, password, role) {
	const hashedPassword = await bcrypt.hash(password, 10);
	const femail = `${email}@gmail.com`
	const record = {
		firstName: fname,
		lastName: lname,
		userName: uname,
		email: femail,
		password: hashedPassword,
		role: role
	};
	return record;
};

async function doit() {
	// to add more accounts just copy paste and change, must change username and email rest of fields can stay same
	const constusers = await Promise.all([
		getrecord('m', 'k', 'user', 'user', 'password', 'student'),
		getrecord('m', 'm', 'teach', 'teacher', 'password', 'instructor'),
		getrecord('m', 'm', 'student', 'student', 'password', 'student'),
		getrecord('m', 'm', 'admin', 'admin', 'password', 'admin'),
		getrecord('m', 'm', 'guy', 'guy', 'password', 'student'),
	]);
	try {
		await Models.User.bulkCreate(constusers, { ignoreDuplicates: true });
	} catch (error) {
		console.error("Error inserting dev users:", error);
	};
};

module.exports = { doit };