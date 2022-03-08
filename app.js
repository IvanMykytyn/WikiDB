require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs")
const mongoose = require("mongoose");
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const session = require('express-session')({
  secret: process.env.SECRET,
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
  password: String,
  secret: String,
  googleId: String,
  facebookId: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",

  },
  (accessToken, refreshToken, profile, cb) => {
    User.findOrCreate({ googleId: profile.id }, (err, user) => {
        return cb(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  (accessToken, refreshToken, profile, cb) => {
    User.findOrCreate({ facebookId: profile.id }, (err, user) => {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
   res.render("home");
});
// may be add { scope: ['profile']
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }
));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
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
app.get("/submit", (req, res) => {
  if (req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login")
  }
})
app.post("/submit", (req, res) => {
  const secretMessage = req.body.secret
  const userID = req.user.id

  User.findOne({_id: userID}, (err, foundUser) => {
    if(!err){
      if(foundUser){
        foundUser.secret = secretMessage
        foundUser.save(err => {
          if(!err){
            res.redirect("/secrets")
          }else{
            console.log(err);
          }
        })
      }
    }else{
      console.log(err);
    }
  })
})
app.get("/secrets", (req, res) => {
  User.find({secret: {$ne: null}}, (err, foundSecrets) =>{
    if(!err){
      if(foundSecrets){
        res.render("secrets", {usersSecretList: foundSecrets})
      }else{
        res.render("secrets", {usersSecretList: []})
      }
    }
  })
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


app.listen(3000, () => {
 console.log("the server is running at port 3000");
});
