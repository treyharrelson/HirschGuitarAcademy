import { faker } from '@faker-js/faker';
import * as readline from 'node:readline';
import bcrypt from 'bcryptjs';
import { db, schema } from '../db'; // Import your Drizzle DB and Tables
import { eq } from 'drizzle-orm';

// Create the interface for reading console input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


async function hashPassword(pass: string) {
  return await bcrypt.hash(pass, 10);
}

async function makeFakeUsers(numUsers: number) {
  try {
    console.log(`Creating ${numUsers} users...`);
    
    // Loop and insert
    for (let i = 0; i < numUsers; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      // Hash a dummy password
      const password = await hashPassword('password123'); 

      await db.insert(schema.users).values({
        fname: firstName,
        lname: lastName,
        username: faker.internet.username({ firstName, lastName }),
        email: faker.internet.email({ firstName, lastName }),
        password: password, 
        role: 'user',
      });
    }
    console.log("Users created.");
  } catch (error) {
    console.error("Error creating users:", error);
  }
}

async function makeFakePosts(numPosts: number) {
  try {
    console.log("Fetching students to assign posts to...");
    
    const studentUsers = await db.select().from(schema.users).where(eq(schema.users.role, 'user'));
    
    if (studentUsers.length === 0) {
      console.log("No students found! Create users first.");
      return;
    }

    console.log(`Creating ${numPosts} posts...`);

    for (let i = 0; i < numPosts; i++) {
      // Pick a random user
      const randomUser = studentUsers[Math.floor(Math.random() * studentUsers.length)];

      await db.insert(schema.posts).values({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2),
        userid: randomUser.id,
      });
    }
    console.log("Posts created.");
  } catch (error) {
    console.error("Error creating posts:", error);
  }
}

// Recursive function to keep asking questions
function consoleLoop() {
  rl.question('\n1: Create Fake Users\n2: Create Fake Posts\n3: Quit\n> ', async (answer) => {
    
    if (answer.trim() === '3') {
      console.log('Bye!');
      rl.close();
      process.exit(0);
    } 
    
    else if (answer.trim() === '1') {
      rl.question('How many users? ', async (num) => {
        await makeFakeUsers(parseInt(num) || 5);
        consoleLoop();
      });
    } 
    
    else if (answer.trim() === '2') {
      rl.question('How many posts? ', async (num) => {
        await makeFakePosts(parseInt(num) || 5);
        consoleLoop();
      });
    } 
    
    else {
      console.log("Invalid option.");
      consoleLoop();
    }
  });
}

console.log("Database Seeder Tool");
consoleLoop();