const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");
const session = require("express-session");

const router = express.Router();

const path = require('path');
const app = express();
const port = 3000;

// Collect data sent from client
app.use(express.urlencoded({extended: true}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create session data
// look into express-mysql-session for dedicated session storing for persistent session data via the MYSQL database
app.use(session({
  secret: "fortestingpurposes", // used to sign the session id cookie
  resave: false, // prevents the session from being saved back to the session store
  saveUninitialized: false, // prevents a asession from being saved if it hasnt been modified
  cookie: {maxAge: 1000 * 60 * 60 * 24} // cookie expiration time
}))

// Register a new user
app.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const query = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        db.query(query, [name, email, hashedPassword, role], (err, result) => {
            if (err) throw err;
            res.status(201).send("User registered successfully");
        });
        res.redirect("public/index.html");
    } catch (error) {
        res.status(500).send("Error registering user");
    }
});

// User login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Find the user by email
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const user = results[0];

            // Compare the hashed password
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                //res.status(200).send('Login successful');

                //Create session data
                req.session.user = {
                  id: user._user_id,
                  role: user.role,
                  name: user.name,
                  email: user.email
                };

                // Redirect based on privilage/role
                if(user.role === 'user'){
                  res.redirect('user_dashboard.html');
                } else if (user.role === 'admin'){
                  res.redirect('admin_dashboard.html');
                }

            } else {
                res.status(401).send('Invalid credentials');
            }
        } else {
            res.status(404).send('User not found');
        }
    });
});

// User logout
app.post('/logout', (req, res) => {
  req.session.destroy(function(err){
    if (err){
      return nextTick(err);
    }
    res.redirect("/");
  }); 
});

module.exports = router;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});