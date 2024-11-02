const { body, validationResult } = require("express-validator");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const path = require("node:path");
const db = require("./db/queries");
const bcrypt = require('bcryptjs');
const assetsPath = path.join(__dirname, "public");
require('dotenv').config();

const PORT = 5000

const app = express();
app.use(express.static(assetsPath));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

const validateSignUp = [
  body("firstName")
    .notEmpty().withMessage("First name is required.")
    .trim()
    .isAlpha().withMessage("First name must contain only letters.")
    .isLength({ min: 2, max: 15 })
    .withMessage("The first name must have between 2 to 15 characters."),
  
  body("lastName")
    .notEmpty().withMessage("Last name is required.")
    .trim()
    .isAlpha().withMessage("Last name must contain only letters.")
    .isLength({ min: 2, max: 15 })
    .withMessage("The last name must have between 2 to 15 characters."),
  
  body("username")
    .notEmpty().withMessage("Username is required.")
    .isLength({ min: 2, max: 15 })
    .withMessage("The username must have between 2 to 15 characters."),
  
  body("email")
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please enter a valid email address."),
    
  body("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 8, max: 64 }).withMessage("Password must be between 8 and 64 characters."),
  
    body("password2")
    .notEmpty().withMessage("Please confirm your password.")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    })
];

passport.use(
  new LocalStrategy({
    usernameField: 'usernameEmail',
    passwordField: 'password'
  },async (username, password, done) => {
    try {
      console.log("tried");
      const usernameRow = await db.selectUsername(username);
      let user = null;
      if(!usernameRow){
        user = await db.selectEmail(username);
      }else{
        user = usernameRow;
      }
      
      if (!user) {
        console.log("Incorrect username or email");
        return done(null, false, { message: "Incorrect username or email" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        console.log("Incorrect password");
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch(err) {
      return done(err);
    }
  })
);
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.selectByID(id);
    done(null, user);
  } catch(err) {
    done(err);
  }
});


app.get("/", async (req, res) => {
  try {
    const secrets = await db.getAllSecrets();
    res.render("index", { user: req.user, secrets:secrets });
} catch (error) {
    console.error('Error fetching secrets:', error);
    res.status(500).send('Internal Server Error');
}
});

app.get("/sign-up", (req, res) => res.render("sign-up"));
app.get("/log-in", (req, res) => res.render("log-in"));
app.get("/addSecret", (req, res) => (!req.user) ? res.redirect("/") : res.render("addSecret"));
app.get("/secretCode", (req, res) => (!req.user) ? res.redirect("/") : res.render("secretCode"));
app.get("/mySecrets", async (req, res) => {
  if(!req.user){
    return res.redirect("/");
  }else{
    const secrets = await db.getAllSecretsById(req.user.id);
    res.render("mySecrets", {secrets: secrets})
  }
});

const getFirstErrors = (result) => {
  let firstErrors = [];
  let curPath = ""
  result.array().forEach(error => {
    if (error.path != curPath) {
      firstErrors.push(error.msg);
      curPath = error.path;
    }
  });

  return firstErrors;
};


app.post("/sign-up", validateSignUp, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(getFirstErrors(errors));
      return res.render("errors", {errors: getFirstErrors(errors)});
      }
    const username = await db.selectByUsername(req.body.username);
    console.log(username);
    if(username){
      return res.render("errors", {errors: ["Username '"+ username.username + "' already exists."]});
    }
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        try {
            const user = await db.addUser(req.body.firstName, req.body.lastName, req.body.email, req.body.username, hashedPassword);

            req.login(user, (err) => {
              if (err) {
                  return next(err);
              }
              return res.redirect("/");
          });
  
        } catch(err) {
          return next(err);
        }
      });
  });
app.post("/log-in", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/log-in"
  })
);
app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    return res.redirect("/");
  });
});


function getCurrentDateFormatted() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

app.post("/addSecret", async (req, res)=>{
  if(!req.user){
    res.redirect("/");
  }else{
    await db.addSecret(req.user.username, req.body.title, req.body.content, getCurrentDateFormatted(), req.user.id);
    res.redirect("/");
  }
});
app.post("/delete/:id&:author_id", async (req, res)=>{
  if(!req.user){
    return res.redirect("/");
  }else if(req.user.admin){
    await db.deleteSecretById(req.params.id);
    return res.redirect("/");
  }
  else{
    if(req.params.author_id == req.user.id){
      await db.deleteSecretById(req.params.id);
      return res.redirect("/");
    }else{
      console.log("Error, no permissions");
      return res.redirect("/");
    }
  }
  });
app.post("/secretCode", async (req, res)=>{
  if(!req.user){
    return res.redirect("/");
  }else{
    console.log(req.body);
    if(req.body.code == process.env.secretCode){
      console.log("Passed");
      await db.giveAdmin(req.user.id);
      return res.redirect("/");
    }else{
      console.log("Invalid");
      
    }
  }
});
  

app.listen(PORT, () => console.log("http://localhost:" + PORT + "/"));