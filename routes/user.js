const express = require("express");
const router = express.Router();
const passport = require("passport");
const middleware = require("../middleware");
const Order = require("../models/order");
const {
  userSignUpValidationRules,
  userSignInValidationRules,
  validateInputs
} = require("../config/validators");

// GET: Sign Up Page (Experiment 4 & 6)
router.get("/signup", middleware.isNotLoggedIn, (req, res) => {
  res.render("user/signup", {
    pageName: "Join The House"
  });
});

// POST: Sign Up Handler (Experiment 4 & 6)
router.post(
  "/signup",
  [
    middleware.isNotLoggedIn,
    userSignUpValidationRules(),
    validateInputs
  ],
  passport.authenticate("local.signup", {
    failureRedirect: "/user/signup",
    failureFlash: true
  }),
  (req, res) => {
    req.flash("success", `Welcome to Meridian, ${req.user.username}. Experience modern tailoring.`);
    if (req.session.oldUrl) {
      const redirectUrl = req.session.oldUrl;
      delete req.session.oldUrl;
      return res.redirect(redirectUrl);
    }
    res.redirect("/products");
  }
);

// GET: Sign In Page (Experiment 4 & 6)
router.get("/signin", middleware.isNotLoggedIn, (req, res) => {
  res.render("user/signin", {
    pageName: "Maison Access"
  });
});

// POST: Sign In Handler (Experiment 4 & 6)
router.post(
  "/signin",
  [
    middleware.isNotLoggedIn,
    userSignInValidationRules(),
    validateInputs
  ],
  passport.authenticate("local.signin", {
    failureRedirect: "/user/signin",
    failureFlash: true
  }),
  (req, res) => {
    req.flash("success", `Welcome back, ${req.user.username}.`);
    if (req.session.oldUrl) {
      const redirectUrl = req.session.oldUrl;
      delete req.session.oldUrl;
      return res.redirect(redirectUrl);
    }
    res.redirect("/products");
  }
);

// GET: Profile & Orders (Experiment 3 & 6)
router.get("/profile", middleware.isLoggedIn, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort("-createdAt")
      .exec();

    res.render("user/profile", {
      pageName: "Client Portfolio",
      orders,
      user: req.user
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.redirect("/");
  }
});

// GET: Sign Out (Experiment 6 & 7)
router.get("/logout", middleware.isLoggedIn, (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "You have signed out gracefully.");
    res.redirect("/");
  });
});

module.exports = router;
