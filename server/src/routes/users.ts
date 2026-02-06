import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { Session } from 'hono-sessions';

const app = new Hono<{ Variables: { session: Session } }>();

app.get('/', async (c) => {
	const allUsers = await db.select().from(schema.users);
  
  const safeUsers = allUsers.map(({ password, ...rest }) => rest);
  
  return c.json(safeUsers);
});

export default app;