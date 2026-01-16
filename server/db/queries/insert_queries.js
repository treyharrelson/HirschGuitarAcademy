const Models = require('../models');

async function createUser(data) {
	try {
		await Models.User.create(data);
	} catch (error) {
		throw error;
	}
}

module.exports = {
	createUser,
};