# Forum & Home Feed — Real-Time Updates, Subscriptions, and UI

## Overview

This set of changes adds real-time forum post delivery via Server-Sent Events (SSE), a thread subscription system, a live home feed on the dashboard, and a full visual overhaul of the forum UI.

---

## Real-Time Updates (SSE)

Server-Sent Events is a built-in browser/HTTP feature that lets the server push data to connected clients over a persistent HTTP connection. It was chosen over WebSockets because post delivery is one-directional (server → client) and requires no extra libraries.

### `userClients` Map (`threads.js`)

```js
const userClients = new Map(); // userId -> Set of response objects
```

Module-level registry of all connected SSE clients. Each user maps to a Set of response objects rather than a single one, to correctly handle multiple open tabs. This is the core of the real-time system and can be reused anywhere else in the app that needs to push live updates to specific users.

### `GET /api/threads/stream`

The persistent connection clients open to receive events. Key behaviors:

- Sets SSE headers and calls `flushHeaders()` to keep the HTTP connection open
- Registers the client's response object in `userClients`
- Runs a 30s heartbeat **in production only** — Railway's proxy closes idle connections without it, unnecessary in dev
- On disconnect, removes only the specific tab's response from the user's Set; cleans up the user's entry entirely if the Set is empty (prevents memory leaks)

**Must be registered before any `/:threadId` routes** — otherwise Express matches `"stream"` as a threadId parameter.

### Broadcast logic (`POST /api/threads/:threadId/posts`)

After saving a post, determines recipients and delivers the event:

- Re-fetches the post with `author` and `attachments` included so the client can render it immediately
- If `thread.isGlobalFeed` is `true` → sends to all connected users
- Otherwise → queries `Subscriptions` for the thread and sends only to subscribed users who are currently connected
- Payload format: `data: { type: 'new_post', threadId, post }\n\n`

---

## Thread Model Changes (`Thread.js`)

Two fields added:

- `unique: true` on `title` — enforced at the DB level, prevents duplicate thread names. The create thread route catches `SequelizeUniqueConstraintError` and returns a `409` with a readable message instead of a generic 500.
- `isGlobalFeed` (boolean, default `false`) — marks a thread as a global home feed thread. When true, new posts broadcast to all connected users. This is the hook for instructor/admin announcements visible to everyone without requiring subscriptions.

---

## Subscription System

### `Subscription.js`

Added `threadId` field — was previously missing, making the table non-functional. Each row now represents one user subscribed to one specific thread.

### `index.js` associations

Fixed and completed:
- Was incorrectly `User.hasOne(Subscription)` — changed to `hasMany` since a user can subscribe to many threads
- Added the missing `Thread.hasMany(Subscription)` and `Subscription.belongsTo(Thread)` sides

### Subscription routes (`threads.js`)

Three routes under `/:threadId/subscribe`:

- `GET` — returns `{ subscribed: boolean }` for the current user on a given thread
- `POST` — subscribes the current user using `findOrCreate` (safe to call repeatedly)
- `DELETE` — unsubscribes the current user

### Auto-subscribe on post

When a user creates a post in a thread, they are automatically subscribed via `findOrCreate` so they receive future replies without having to manually subscribe.

---

## Home Feed

### `GET /api/threads/feed/posts`

Fetches the 20 most recent posts from all threads the current user is subscribed to, ordered newest first. Includes `author`, `attachments`, and `thread` (id + title) on each post so the client can display and link to the source thread. Returns an empty array if the user has no subscriptions.

**Must be registered before `/:threadId` routes** for the same reason as `/stream`.

### `Dashboard.tsx`

Opens the same SSE stream as `ThreadDetail` on mount. Accepts all `new_post` events without filtering by threadId (the server already only broadcasts to subscribers). New posts are prepended to the top of the feed. The layout uses a fixed-width sidebar for quick links and `flex-1` for the feed so they sit side by side.

---

## New Components

### `PostCard.tsx`

Reusable card component used in both `ThreadDetail` and `Dashboard`. Accepts a `showThread` prop — when true, renders a linked thread title above the post (used on the feed so users know which thread a post came from). Includes an avatar generated from the author's username initials.

### `ThreadCard.tsx`

Reusable card component used in `Forum`. The entire card is a `Link` to the thread detail page. Shows the thread title, author, and creation date.

---

## `types/post.ts`

Added optional `thread` field (`{ id, title }`) to the `Post` interface to support the feed route which includes thread info on each post.

---

## What's still needed

- **Global feed UI** — `isGlobalFeed` is fully wired on the server but there is no admin/instructor interface yet for creating or designating global feed threads.

- **Main feed post creation** — no UI or routes for adding posts to the main feed directly. I'm pretty sure this is something the sponsor wants

- **image/video attachments need updating** — right now if you attach an image or video to a post, it is massive and takes up the whole screen. We
need to add a way to have a minimized version of it so that it looks better and is more user friendly.
