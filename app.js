require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs")
const mongoose = require("mongoose");
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const session = require('express-session')({
  secret: 'secret message actually i dont know what to write',
  resave: false,
  saveUninitialized: false
});

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session)
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost/userDB')

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})


userSchema.plugin(passportLocalMongoose);


const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req, res) => {
   res.render("home");
});

app.get("/login", (req, res) => {
   res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login")
  }
});

app.post("/register", (req, res) => {
  User.register({username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        }else{
          passport.authenticate('local')(req, res, () => {
            res.redirect('/secrets');
          })
        }
    });
})

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }),
  (req, res) => {
      res.redirect('/secrets');
});


// app.post("/login", (req, res) => {
//   const username = req.body.username
//   const password = req.body.password
//
//   User.login()
//
// })

app.listen(3000, () => {
 console.log("the server is running at port 3000");
});
