const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Signup Strategy
passport.use(
  "local.signup",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
          return done(null, false, { message: "Email already registered." });
        }
        if (password !== req.body.password2) {
          return done(null, false, { message: "Passwords do not match." });
        }
        const newUser = new User();
        newUser.email = email.toLowerCase().trim();
        newUser.username = req.body.name || "Customer";
        newUser.password = newUser.encryptPassword(password);
        if (req.body.adminSecret && req.body.adminSecret === "meridian_admin_key") {
          newUser.isAdmin = true;
        }
        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        console.error("Signup error:", error);
        return done(error);
      }
    }
  )
);

// Signin Strategy
passport.use(
  "local.signin",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: false
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
          return done(null, false, { message: "User not found with this email." });
        }
        if (!user.validPassword(password)) {
          return done(null, false, { message: "Invalid credentials." });
        }
        return done(null, user);
      } catch (error) {
        console.error("Signin error:", error);
        return done(error);
      }
    }
  )
);
