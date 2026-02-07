const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cors = require('cors');
const router = express.Router();
const app = express();

app.use(cors({
  origin: 'http://localhost:5173', //Vite dev server
  credentials: true
}));

// SQL Models for sequelize
// All SQL queries should go through here, e.g. 
// Models.User.create(...), Models.User.findOne(...), etc.
const Models = require('./models');

const path = require('path');

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
        id: user._user_id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      };
      
      res.json({
        success: true,
        user: {
          id: user._user_id,
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

module.exports = router;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});