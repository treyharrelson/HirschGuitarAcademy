import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, desc } from 'drizzle-orm';

const app = new Hono();

app.get('/', async (c) => {
  // 1. Get the "page" query param (default to 1)
  const page = Number(c.req.query('page') || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  // 2. Query DB with Join
  // We want the Post content AND the Author's name
  const allPosts = await db.select({
    id: schema.posts.id,
    content: schema.posts.content,
    createdAt: schema.posts.created_at,
    authorName: schema.users.username, // Join magic
  })
  .from(schema.posts)
  .leftJoin(schema.users, eq(schema.posts.userid, schema.users.id))
  .limit(limit)
  .offset(offset)
  .orderBy(desc(schema.posts.created_at)); // Newest first

  return c.json(allPosts);
});

export default app;