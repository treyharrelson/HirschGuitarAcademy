require('dotenv').config();
const express = require("express");
const session = require("express-session");
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const app = express();
const { sequelize } = require('./db/models');

// 1. SET TRUST PROXY IMMEDIATELY
app.set('trust proxy', 1);

// FOR USERS UNTIL SERVER SET UP IN CLOUD
const devusers = require('./db/devusers');
const DEV = process.env.NODE_ENV !== 'production';

// -- MIDDLEWARE SETUP --
const requireAuth = require('./middleware/requireAuth');

// ROUTES
const authRoutes = require('./routes/auth');
const threadRoutes = require('./routes/threads');
const courseRoutes = require('./routes/courses');
const uploadRouter = require('./routes/upload');
const { router: postRoutes } = require('./routes/posts');
const userRoutes = require('./routes/users');
const badgeRoutes = require('./routes/badgeRoutes');

// allows connection from frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2. HEALTH CHECK AT THE VERY TOP OF THE STACK
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Session store setup
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

app.use(session({
  store: new pgSession({
    pool: sessionPool,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || "fortestingpurposes",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// -- ROUTES --
app.use('/', authRoutes);
app.use('/api/threads', requireAuth, threadRoutes);
app.use('/api/courses', requireAuth, courseRoutes);
app.use('/api/upload', requireAuth, uploadRouter);
app.use('/api/posts', requireAuth, postRoutes);
app.use('/api/user', userRoutes);
app.use('/api/badges', badgeRoutes);

// -- START SERVER --
async function init() {
  // 3. BIND TO PORT BEFORE ANY DATABASE CALLS
  // This satisfies Railway's healthcheck immediately
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 STARTUP: Server listening on 0.0.0.0:${port}`);
  });

  try {
    console.log('📡 Attempting DB connection...');
    await sequelize.authenticate();
    console.log('✅ DB connected successfully');

    if (DEV) {
      console.log("🛠 Running dev user sync...");
      await devusers.doit();
      console.log("🎁 Dev users synced");
    }
  } catch (err) {
    // We log the error but the server stays running so we can read the logs
    console.error("❌ DB connection failed during init:", err.message);
  }
}

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

init();