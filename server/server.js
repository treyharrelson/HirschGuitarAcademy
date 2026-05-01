require('dotenv').config();

const express = require("express");
const session = require("express-session");
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const app = express();
const { sequelize } = require('./db/models');
app.set('trust proxy', 1); // tells Express to trust Railway proxy

// FOR USERS UNTIL SERVER SET UP IN CLOUD
const devusers = require('./db/devusers')
const DEV = process.env.NODE_ENV !== 'production';
//

// -- MIDDLEWARE SETUP --
const requireAuth = require('./middleware/requireAuth')
// ROUTES
const authRoutes = require('./routes/auth');
const threadRoutes = require('./routes/threads');
const courseRoutes = require('./routes/courses');
const uploadRouter = require('./routes/upload');
const {router: postRoutes} = require('./routes/posts');
const userRoutes = require('./routes/users');
const badgeRoutes = require('./routes/badgeRoutes');

// allows connection from frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', //Vite dev server
  credentials: true
}));

// what port the server listens on
const port = process.env.PORT || 3000;

// Collect data sent from client
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // get JSON data sent from React with axios

// Session store using Railway's postgres. This makes it so sessions persist when
// Railway restarts the server container
const sessionPool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT
    });

// Create session data
// look into express-mysql-session for dedicated session storing for persistent session data via the MYSQL database
app.use(session({
  store: new pgSession({
    pool: sessionPool,
    createTableIfMissing: true // auto-creates the session table
  }),
  secret: process.env.SESSION_SECRET || "fortestingpurposes", // used to sign the session id cookie
  resave: false, // prevents the session from being saved back to the session store
  saveUninitialized: false, // prevents a asession from being saved if it hasnt been modified
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, //cookie expiration time
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production' // HTTPS only in production
  } 
}))

// Health check for Railway
app.get('/', (req, res) => {
  res.status(200).json({status: 'ok' });
})

// -- ROUTES --
// Hook up the imported routers
app.use('/', authRoutes);
app.use('/api/threads', requireAuth, threadRoutes); // This prefixes all routes in threads.js with /api/threads
app.use('/api/courses', requireAuth, courseRoutes); // Protects and prefixes course edit routing with /api/courses
app.use('/api/upload', requireAuth, uploadRouter);
app.use('/api/posts', requireAuth, postRoutes);
app.use('/api/user', userRoutes);
app.use('/api/badges', badgeRoutes);

// -- START SERVER --
async function init() {
   try {
    await sequelize.authenticate();
    console.log('DB connected');
    
    if (DEV) {
      await devusers.doit();
      console.log("Dev users synced");
    }

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  } catch(err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
}

init();