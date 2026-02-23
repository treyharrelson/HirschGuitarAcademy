require('dotenv').config();

const express = require("express");
const session = require("express-session");
const cors = require('cors');
const path = require('path');
const app = express();

// -- MIDDLEWARE SETUP --
const requireAuth = require('./middleware/requireAuth')
// ROUTES
const authRoutes = require('./routes/auth');
const threadRoutes = require('./routes/threads');

// allows connection from frontend
app.use(cors({
  origin: 'http://localhost:5173', //Vite dev server
  credentials: true
}));

// what port the server listens on
const port = 3000;

// Collect data sent from client
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // get JSON data sent from React with axios

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create session data
// look into express-mysql-session for dedicated session storing for persistent session data via the MYSQL database
app.use(session({
  secret: "fortestingpurposes", // used to sign the session id cookie
  resave: false, // prevents the session from being saved back to the session store
  saveUninitialized: false, // prevents a asession from being saved if it hasnt been modified
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // cookie expiration time
}))

// -- ROUTES --
// Hook up the imported routers
app.use('/', authRoutes);
app.use('/api/threads', requireAuth, threadRoutes); // This prefixes all routes in threads.js with /api/threads

// -- START SERVER --
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});