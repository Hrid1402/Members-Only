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

app.get("/", (req, res) => res.render("index"));
app.get("/sign-up", (req, res) => res.render("sign-up"));
app.get("/log-in", (req, res) => res.render("log-in"));


app.post("/sign-up", async (req, res, next) => {
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        try {
            await db.addUser(req.body.firstName, req.body.lastName, req.body.email, req.body.username, hashedPassword);
            res.redirect("/");
        } catch(err) {
          return next(err);
        }
      });
  });

app.listen(PORT, () => console.log("http://localhost:" + PORT + "/"));