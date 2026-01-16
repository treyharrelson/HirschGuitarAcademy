const fs = require('fs').promises;
const Models = require('../models');

fileconcat = process.platform === "win32" ? '\\' : '/';

async function writeToFile(filename, data) {
	try {
		await fs.writeFile((__dirname + fileconcat + filename), data, 'utf8');
		console.log(`Data written to ${filename}`);
	} catch (error) {
		console.error(`Error writing to file ${filename}:`, error);
	}
}


writeToFile('test.txt', 'Test really done.');