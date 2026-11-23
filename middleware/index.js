const middleware = {
  isLoggedIn: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    req.session.oldUrl = req.originalUrl;
    req.flash("error", "Please sign in to proceed.");
    res.redirect("/user/signin");
  },

  isAdmin: (req, res, next) => {
    if (req.isAuthenticated() && req.user && req.user.isAdmin) {
      return next();
    }
    req.flash("error", "Admin privileges required.");
    res.redirect("/");
  },

  isNotLoggedIn: (req, res, next) => {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }
};

module.exports = middleware;
