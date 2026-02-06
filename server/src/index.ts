import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sessionMiddleware, CookieStore } from 'hono-sessions';
import auth from './routes/auth';
import posts from './routes/posts';
import users from './routes/users';


// Most stuff very similar to express, app uses routes and such
const app = new Hono();

const store = new CookieStore();

app.use('*', sessionMiddleware({
	store,
	encryptionKey: 'this-is-a-very-long-password-for-security-purposes-123456',
	expireAfterSeconds: 1000 * 60 * 60 * 24,
	cookieOptions: {
		sameSite: 'Lax',
		path: '/',
		httpOnly: true,
	}
}))

// For dev stuff?
app.use('/*', cors());

app.route('/api/auth', auth);

app.route('/api/posts', posts);

app.route('/api/users', users)

serve({
	fetch: app.fetch,
	port: 3000
}, (info) => {
	console.log(`Server is running on http://localhost:${info.port}`)
})
