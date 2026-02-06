import { db, schema } from './index';
import {eq} from 'drizzle-orm';
import * as interfaces from './interfaces'
import test from 'node:test';

async function main() {
	console.log("Connecting to db")

	try {
		const newUser = await db.insert(schema.users).values({
			fname: 'Michael',
			lname: 'Kenny',
			username: 'mkenny',
			password: '123abc',
			role: 'admin',
			email: 'mlk@email.com'
		})
	} catch {
		console.log("error")
	}
};
async function testConnection() {
  try {
    const result = await db.select().from(schema.users);
    console.log("Connection Successful. Users:", result);
    
    // We exit explicitly so the script doesn't hang
    process.exit(0);
  } catch (err) {
    console.error("Connection Failed:", err);
    process.exit(1);
  }
}
main();
testConnection();