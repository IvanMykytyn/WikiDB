require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs")
const mongoose = require("mongoose");
const md5 = require("md5")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost/userDB')

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})

const User = mongoose.model("User", userSchema)

app.get("/", (req, res) => {
   res.render("home");
});

app.get("/login", (req, res) => {
   res.render("login");
});

app.post("/login", (req, res) => {
    const username = req.body.username
    const password = md5(req.body.password)

    User.findOne({email: username}, (err, foundUser) => {
      if(!err){
        if (foundUser){
          if(foundUser.password === password){
            res.render("secrets")
          }else{
            console.log("Wrong password");
          }
        }else{
          console.log("No such a user");
        }
      }
    })

})

app.get("/register", (req, res) => {
   res.render("register");
});

app.post("/register", (req, res) => {
  const registerUser = new User({
    email: req.body.username,
    password: md5(req.body.password)
  })
  registerUser.save(err => {
    if (!err){
      res.render("secrets")
    }else{
      console.log(err);
    }
  })
})

app.listen(3000, () => {
 console.log("the server is running at port 3000");
});
