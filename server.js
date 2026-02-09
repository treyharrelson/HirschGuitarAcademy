const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cors = require('cors');
const router = express.Router();
// SQL Models for sequelize
// All SQL queries should go through here, e.g. 
// Models.User.create(...), Models.User.findOne(...), etc.
const Models = require('./models');
const path = require('path');
const app = express();

// -- MIDDLEWARE SETUP --

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

// Check if user is logged in (read from session)
app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json({
      success: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// Register a new user
app.post("/register", async (req, res) => {
  console.log('Register request received');
  console.log('Request body:', req.body);
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    req.body.password = hashedPassword;

    // should probably have more validation here

    // Insert the new user into the database
    const newUser = await Models.User.create(req.body);
    res.json({success:true, message:'User registered successfully'});
  } catch (error) {
    res.status(500).send(`Error registering user: ${error}`);
  }
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await Models.User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(404).send('User not found');
    }
    

    // Compare the hashed password
  
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      req.session.user = {
        id: user.id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      };
      
      res.json({
        success: true,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role
        }
      })
    }
    else {
      res.status(401).json({ success: false, message: 'Invalid credentials'});
    }
  } catch (error) {
    res.status(500).send(`Error logging in: ${error}`);
  }



  // db.query(query, [email], async (err, results) => {
  //   if (err) throw err;

  //   if (results.length > 0) {
  //     const user = results[0];

  //     // Compare the hashed password
  //     const isMatch = await bcrypt.compare(password, user.password);

  //     if (isMatch) {
  //       //res.status(200).send('Login successful');

  //       //Create session data
  //       req.session.user = {
  //         id: user._user_id,
  //         role: user.role,
  //         name: user.name,
  //         email: user.email
  //       };

  //       // Redirect based on privilage/role
  //       if (user.role === 'user') {
  //         res.redirect('user_dashboard.html');
  //       } else if (user.role === 'admin') {
  //         res.redirect('admin_dashboard.html');
  //       }

  //     } else {
  //       res.status(401).send('Invalid credentials');
  //     }
  //   } else {
  //     res.status(404).send('User not found');
  //   }
  // });
});

// User logout
app.post('/logout', (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      return nextTick(err);
    }
    res.redirect("/");
  });
});

// Get all threads
app.get('/api/threads', async (req, res) => {
  try {
    const threads = await Models.Thread.findAll({
      include: [{
        model: Models.User,
        as: 'author',
        attributes: ['userName', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(threads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching threads: ${error}'});
  }
});

// Create a thread
app.post('/api/threads', async (req, res) => {
  console.log('POST /api/threads called');
  console.log('Request body:', req.body);
  console.log('Session user:', req.session.user);
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Must be logged in to create a thread'});
    }

    const { title } = req.body;
    const newThread = await Models.Thread.create({
      title,
      authorId: req.session.user.id
    });

    res.status(201).json(newThread);
  } catch (error) {
    res.status(500).json({ message: `Error creating thread: ${error}` });
  }
});

// Get posts in a thread
app.get('/api/threads/:threadId/posts', async (req, res) => {
  try {
    const posts = await Models.Post.findAll({
      where: { threadId: req.params.threadId },
      include: [{
        model: Models.User,
        as: 'author',
        attributes: ['userName', 'firstName', 'lastName']
      }],
      order: [['datePosted', 'ASC']]
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: `Error fetching posts: ${error}` });
  }
});

// Create a post in a thread
app.post('/api/threads/:threadId/posts', async (req, res) => {
  console.log('POST /api/threads/:threadId/posts called');
  console.log('Thread ID :', req.params.threadId);
  console.log('Request body: ', req.body);
  console.log('Session user: ', req.session.user);
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Must be logged in to post to a thread'});
    }

    const { content } = req.body;
    console.info(req.params.threadId)
    const newPost = await Models.Post.create({
      threadId: req.params.threadId,
      userId: req.session.user.id,
      content
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post: ', error)
    res.status(500).json({ message: `Error creating post: ${error}` });
  }
});


// -- START SERVER --
module.exports = router;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
