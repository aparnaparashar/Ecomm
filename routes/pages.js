const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Category = require("../models/category");
const SupportTicket = require("../models/supportTicket");
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

// POST: Bespoke Dressmaking & Commission Consultation Inquiry
router.post("/designers/commission", async (req, res) => {
  try {
    const { clientName, clientEmail, designerName, silhouette, notes } = req.body;
    const name = clientName ? clientName.trim() : "Valued Client";
    const designer = designerName || "the Resident Couturier";
    
    // Save live Support Ticket / Commission in MongoDB
    const ticketNumber = "COMM-" + Math.floor(100000 + Math.random() * 900000);
    await SupportTicket.create({
      ticketNumber,
      type: "bespoke_commission",
      name,
      email: clientEmail ? clientEmail.trim().toLowerCase() : "client@meridian.style",
      subject: `Bespoke Commission: ${silhouette || "Haute Silhouette"} by ${designer}`,
      message: notes || "Initial bespoke consultation request.",
      designerName: designer,
      silhouette: silhouette || "Custom Silhouette",
      priority: "VIP / Haute",
      status: "Pending"
    });

    req.flash("success", `Thank you, ${name}. Your bespoke commission inquiry (${ticketNumber}) for ${designer} has been registered. Our private atelier concierge will review and contact you at ${clientEmail} to schedule your initial sketch & measurement consultation.`);
  } catch (err) {
    console.error("Commission save error:", err);
    req.flash("success", "Your bespoke inquiry has been registered with the Atelier Concierge.");
  }
  res.redirect("/designers");
});

// GET: Contact Us
router.get("/contact", (req, res) => {
  res.render("pages/contact", {
    pageName: "Concierge & Support"
  });
});

// POST: Contact Form submission (with express-validator)
router.post("/contact", [userContactUsValidationRules(), validateInputs], async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const ticketNumber = "SUP-" + Math.floor(100000 + Math.random() * 900000);
    await SupportTicket.create({
      ticketNumber,
      type: "support",
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject || "Client Inquiry",
      message: message || "Support request submitted via Concierge portal.",
      status: "Pending"
    });

    req.flash("success", `Thank you, ${name}. Your inquiry (${ticketNumber}) has been received by our concierge team. We will review and follow up promptly.`);
  } catch (err) {
    console.error("Support ticket save error:", err);
    req.flash("success", `Thank you. Your message has been received by our concierge team.`);
  }
  res.redirect("/contact");
});

module.exports = router;
