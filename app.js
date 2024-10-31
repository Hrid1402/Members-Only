const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const path = require("node:path");
const db = require("./db/queries");
const bcrypt = require('bcryptjs');
const assetsPath = path.join(__dirname, "public");

const PORT = 5000

const app = express();
app.use(express.static(assetsPath));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

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


app.get("/", (req, res) => res.render("index", { user: req.user }));
app.get("/sign-up", (req, res) => res.render("sign-up"));
app.get("/log-in", (req, res) => res.render("log-in"));


app.post("/sign-up", async (req, res, next) => {
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        try {
            const user = await db.addUser(req.body.firstName, req.body.lastName, req.body.email, req.body.username, hashedPassword);

            req.login(user, (err) => {
              if (err) {
                  return next(err);
              }
              res.redirect("/");
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
    res.redirect("/");
  });
});

app.listen(PORT, () => console.log("http://localhost:" + PORT + "/"));