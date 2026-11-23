const { check, validationResult } = require("express-validator");

const userSignUpValidationRules = () => {
  return [
    check("name", "Full Name is required").trim().not().isEmpty(),
    check("email", "Please enter a valid email address").isEmail().normalizeEmail(),
    check("password", "Password must be at least 4 characters").isLength({ min: 4 }),
    check("password2", "Password confirmation is required").not().isEmpty()
  ];
};

const userSignInValidationRules = () => {
  return [
    check("email", "Please enter a valid email address").isEmail().normalizeEmail(),
    check("password", "Password must be at least 4 characters").isLength({ min: 4 })
  ];
};

const userContactUsValidationRules = () => {
  return [
    check("name", "Name is required").trim().not().isEmpty(),
    check("email", "Please enter a valid email address").isEmail().normalizeEmail(),
    check("message", "Message must be at least 10 characters").isLength({ min: 10 })
  ];
};

const validateInputs = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    req.flash("error", messages);
    return res.redirect("back");
  }
  next();
};

module.exports = {
  userSignUpValidationRules,
  userSignInValidationRules,
  userContactUsValidationRules,
  validateInputs
};
