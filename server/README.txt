Moved everything for server into server folder except database, mostly because feels like it should be it's own thing.

Added middleware and routes. Routes are just instead of having one server.js with a million routes, can make file for routes and import to server.js.
Middleware works pretty much exactly the same, just adds extra steps before serving GET/POST requests. So like adding requireAuth to route makes 
 it run code in requireAuth, in this case if logged in or not, and then decides whether to go to route or not.

