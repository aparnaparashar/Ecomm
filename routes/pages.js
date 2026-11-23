const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Category = require("../models/category");
const { userContactUsValidationRules, validateInputs } = require("../config/validators");

// GET: Home Page
router.get("/", async (req, res) => {
  try {
    const latestProducts = await Product.find({ available: true })
      .sort("-createdAt")
      .limit(8)
      .populate("category")
      .exec();

    const featuredProducts = await Product.find({ available: true, featured: true })
      .limit(4)
      .populate("category")
      .exec();

    const categories = await Category.find({}).exec();

    res.render("shop/home", {
      pageName: "Atelier & Collections",
      latestProducts,
      featuredProducts: featuredProducts.length > 0 ? featuredProducts : latestProducts.slice(0, 4),
      categories
    });
  } catch (error) {
    console.error("Home route error:", error);
    res.render("shop/home", {
      pageName: "Atelier & Collections",
      latestProducts: [],
      featuredProducts: [],
      categories: []
    });
  }
});

// GET: About Us
router.get("/about", (req, res) => {
  res.render("pages/about", {
    pageName: "The Maison Story"
  });
});

// GET: Resident Designers Showcase (Novelty Feature)
router.get("/designers", (req, res) => {
  res.render("pages/designers", {
    pageName: "Resident Master Couturiers"
  });
});

// GET: Contact Us
router.get("/contact", (req, res) => {
  res.render("pages/contact", {
    pageName: "Concierge & Support"
  });
});

// POST: Contact Form submission (with express-validator)
router.post("/contact", [userContactUsValidationRules(), validateInputs], (req, res) => {
  const { name, email, subject, message } = req.body;
  req.flash("success", `Thank you ${name}. Your message has been received by our concierge team.`);
  res.redirect("/contact");
});

module.exports = router;
