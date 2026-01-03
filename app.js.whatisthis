// Modules
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressValidator = require('express-validator');
const flash = require('express-flash');
const session = require('express-session');
const pageRouter = require('./routes/pages');

var indexRouter = require("./routes/index");

// Initialize APP
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Collect data sent from client
app.use(express.urlencoded({extended: false}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Template Engine. PUG
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Session
app.use(
  session({
    secret: "fortestingpurposes",
    resave: true,
    saveUninitialized: true,
    cookie: {

    }
  })
);

// Router
app.use("/", pageRouter);

// Erros
app.use((req, res, next) =>{
  var err = new Error("Page not found");
  err.status = 404;
  next(err);
});

// Handling errors
app.use((err, rq, res, next) => {
  res.status(err.status || 500);
  res.send(err.message);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

module.exports = app;