# Real-Time Forum Updates via Server-Sent Events (SSE)

## What is SSE and why we used it

Server-Sent Events is a built-in browser/HTTP feature that lets the server push data to a connected client over a persistent HTTP connection. We used it instead of WebSockets because forum updates only need to flow one way (server → client), and it requires no extra libraries.

## The SSE client registry (`userClients` in `threads.js`)

```js
const userClients = new Map(); // userId -> Set of response objects
```

This Map lives at the module level and tracks every currently connected user. Each user maps to a **Set** of response objects rather than a single one, to support multiple open tabs. This pattern — a module-level Map of connected clients — is the core of the real-time system and can be reused anywhere else in the app that needs to push live updates to specific users.

## The SSE endpoint (`GET /api/threads/stream`)

This is the persistent connection clients open to receive events. The key things it does:

- Sets SSE headers and calls `flushHeaders()` to keep the connection open
- Registers the client in `userClients`
- Runs a heartbeat every 30s **in production only** — Railway's proxy closes idle connections without it, but it's unnecessary noise in dev
- On disconnect, removes only this tab's response from the user's Set, and cleans up the user's entry entirely if their Set is now empty (prevents memory leaks)

**Note:** This route must be registered before any `/:threadId` routes, otherwise Express matches `"stream"` as a threadId parameter.

## Broadcast logic (inside `POST /api/threads/:threadId/posts`)

After saving a post, the server determines who gets notified:

- If the thread has `isGlobalFeed: true` → broadcast to all connected users
- Otherwise → query the `Subscriptions` table for that thread and broadcast only to those users

This is the hook for the future home feed: any thread flagged as `isGlobalFeed` will automatically push to everyone without any additional code.

## Client side (`ThreadDetail.tsx`)

The `useEffect` opens an `EventSource` on mount and closes it on unmount. `api.defaults.baseURL` is used to get the URL so it stays in sync with the axios instance rather than being hardcoded. `withCredentials: true` is required since the endpoint checks the session cookie. Incoming events are filtered by `threadId` before updating state, since the stream is per-user and may carry events from multiple threads.

## What's still needed

- **Subscription routes** — the model and table exist but there are no API endpoints yet for users to subscribe/unsubscribe from threads
- **Home feed component** — `isGlobalFeed` is wired on the server but the client page doesn't exist yet
