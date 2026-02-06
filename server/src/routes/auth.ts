import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { Session } from 'hono-sessions';

const auth = new Hono<{ Variables: { session: Session } }>();

auth.post('/login', async (c) => {
	const { email, password } = await c.req.json();
	const session = c.get('session');

	const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
	const user = result[0];
	if (!user) {
		return c.json({ error: 'Invalid email or password' }, 401);
	}
	const validPassword = await bcrypt.compare(password, user.password as string);
	if (!validPassword) {
		return c.json({ error: 'Invalid email or password' }, 401);
	}
	session.set('userId', user.id);
	session.set('role', user.role);
	return c.json({ message: 'Login successful' });
});

auth.post('/logout', async (c) => {
	const session = c.get('session');
	session.deleteSession();
	return c.json({ message: 'Logout successful' });
});

auth.post('/register', async (c) => {
	const { email, password, username } = await c.req.json();
	const hashedPassword = await bcrypt.hash(password, 10);
	try {
		await db.insert(schema.users).values({
			email: email,
			username: username,
			password: hashedPassword,
			role: 'user'
		});
	} catch (err) {
		return c.json({ error: 'Registration failed' }, 500);
	}
});

export default auth;