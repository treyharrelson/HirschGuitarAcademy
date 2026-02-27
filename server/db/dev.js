const Models = require('./models')
const { faker } = require('@faker-js/faker');

const tableChoices = [
	'All',
	'User',
	'Course',
	'Module',
	'Lecture',
	'Enrollment',
	'Thread',
	'Post',
	'Comment',
	'Notification',
	'Subscription',
	'Message',
	'Clear',
	'Exit'
];

async function getRandomId(Model) {
	const record = await Model.findOne({ order: Models.sequelize.random() });
	return record ? record.id : null;
}

async function generateFakeData(table, amount) {
	const modelName = table.charAt(0).toUpperCase() + table.slice(1);
	const Model = Models[modelName];

	if (!Model) {
		console.error(`\nError: Model '${modelName}' is undefined. Available models:`, Object.keys(Models).filter(k => k !== 'sequelize').join(', '), '\n');
		return;
	}

	const records = [];

	for (let i = 0; i < amount; i++) {
		let record = {};

		switch (modelName) {
			case 'User':
				record = {
					firstName: faker.person.firstName(),
					lastName: faker.person.lastName(),
					userName: faker.internet.username() + Math.random().toString(36).substring(7), // Ensure unique
					email: Math.random().toString(36).substring(7) + faker.internet.email(), // Ensure unique
					password: faker.internet.password(),
					role: faker.helpers.arrayElement(['student', 'instructor', 'admin'])
				};
				break;

			case 'Course':
				const instructorId = await getRandomId(Models.User) || 1;
				record = {
					name: faker.company.catchPhrase() + ' ' + Math.random().toString(36).substring(7),
					instructorId,
					capacity: faker.number.int({ min: 10, max: 100 }),
					enrolled: faker.number.int({ min: 0, max: 10 })
				};
				break;

			case 'Enrollment':
				record = {
					userId: await getRandomId(Models.User) || 1,
					courseId: await getRandomId(Models.Course) || 1
				};
				break;

			case 'Thread':
				record = {
					title: faker.lorem.words(5),
					authorId: await getRandomId(Models.User) || 1
				};
				break;

			case 'Post':
				record = {
					threadId: await getRandomId(Models.Thread) || 1,
					authorId: await getRandomId(Models.User) || 1,
					content: faker.lorem.paragraphs(2),
					numLikes: faker.number.int({ min: 0, max: 100 })
				};
				break;

			case 'Comment':
				record = {
					authorId: await getRandomId(Models.User) || 1,
					postId: await getRandomId(Models.Post) || 1,
					content: faker.lorem.sentence(),
					numLikes: faker.number.int({ min: 0, max: 50 })
				};
				break;

			case 'Notification':
				record = {
					userId: await getRandomId(Models.User) || 1,
					content: faker.lorem.sentence(),
					seen: faker.datatype.boolean(),
					urgency: faker.helpers.arrayElement(['normal', 'urgent'])
				};
				break;

			case 'Subscription':
				record = {
					userId: await getRandomId(Models.User) || 1
				};
				break;

			case 'Module':
				record = {
					title: faker.company.catchPhrase(),
					order: faker.number.int({ min: 1, max: 20 }),
					courseId: await getRandomId(Models.Course) || 1
				};
				break;

			case 'Lecture':
				record = {
					title: faker.lorem.words(3),
					order: faker.number.int({ min: 1, max: 10 }),
					content: faker.lorem.paragraphs({ min: 1, max: 3 }),
					moduleId: await getRandomId(Models.Module) || 1
				};
				break;

			case 'Message':
				record = {
					senderId: await getRandomId(Models.User) || 1,
					recipientId: await getRandomId(Models.User) || 2,
					content: faker.lorem.sentences(3),
					seen: faker.datatype.boolean()
				};
				break;
		}
		records.push(record);
	}

	try {
		await Model.bulkCreate(records);
		console.log(`\ndone\n`);
	} catch (error) {
		console.error(`\nerror\n`);
	}
}

async function fakeAll() {
	await generateFakeData('User', 100);
	await generateFakeData('Course', 10);
	await generateFakeData('Module', 30);
	await generateFakeData('Lecture', 100);
	await generateFakeData('Enrollment', 50);
	await generateFakeData('Thread', 20);
	await generateFakeData('Post', 100);
	await generateFakeData('Comment', 200);
	await generateFakeData('Notification', 50);
	await generateFakeData('Subscription', 30);
	await generateFakeData('Message', 150);

	console.log('done\n');
}

async function clearAll() {
	try {
		// Clearing in reverse dependency order to avoid foreign constraint errors
		const tablesToClear = [
			'Comment',
			'Post',
			'Thread',
			'Lecture',
			'Module',
			'Enrollment',
			'Course',
			'Subscription',
			'Notification',
			'Message',
			'User' // User cleared last
		];

		for (const tableName of tablesToClear) {
			if (Models[tableName]) {
				await Models[tableName].destroy({ where: {}, truncate: true, cascade: true });
			}
		}
		console.log('cleared\n');
	} catch (error) {
		console.error('\nerror\n');
	}
}

async function startApp() {
	let inquirer;
	try {
		const inquirerModule = await import('inquirer');
		inquirer = inquirerModule.default || inquirerModule;
	} catch (e) {
		inquirer = require('inquirer');
	}

	console.log('\nfaker stuff\n');

	while (true) {
		const { tableRaw } = await inquirer.prompt([
			{
				type: 'input',
				name: 'tableRaw',
				message: 'table selection: (All, User, Course, Exit, etc.): ',
			}
		]);

		// Format to Title Case (e.g., 'all' -> 'All', 'uSeR' -> 'User', 'seed all data' -> 'Seed All Data')
		let table = tableRaw.trim();
		if (table.toLowerCase() === 'seed all data') {
			table = 'All';
		} else {
			table = table.charAt(0).toUpperCase() + table.slice(1).toLowerCase();
		}


		if (table === 'Exit') {
			console.log('done');
			process.exit(0);
		}

		if (table === 'Clear') {
			await clearAll();
			continue;
		}

		if (table === 'All') {
			await fakeAll();
			continue;
		}

		const { amountStr } = await inquirer.prompt([
			{
				type: 'input',
				name: 'amountStr',
				message: `How many?`,
				default: '10',
				validate: (input) => !isNaN(parseInt(input)) || 'enter num'
			}
		]);

		const amount = parseInt(amountStr);
		await generateFakeData(table, amount);
	}
}

// exits if hanging on startup
setTimeout(() => {
	startApp().catch(console.error);
}, 500);