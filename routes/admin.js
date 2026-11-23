const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Category = require("../models/category");
const Order = require("../models/order");
const User = require("../models/user");
const middleware = require("../middleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer storage configuration for product uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = path.join(__dirname, "..", "public", "uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp") {
      cb(null, true);
    } else {
      cb(new Error("Only images (jpg, png, webp) are permitted."));
    }
  }
});

// GET: Admin Dashboard (Experiment 3 & Live DB Analytics)
router.get("/", middleware.isAdmin, async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category")
      .sort("-createdAt")
      .exec();
    const categories = await Category.find({}).exec();
    const orders = await Order.find({})
      .populate("user")
      .sort("-createdAt")
      .limit(10)
      .exec();

    // Live MongoDB aggregations & counts
    const totalOrdersCount = await Order.countDocuments({});
    const totalClientsCount = await User.countDocuments({ isAdmin: false });
    const inStockCount = await Product.countDocuments({ available: true });
    const outOfStockCount = await Product.countDocuments({ available: false });
    const featuredCount = await Product.countDocuments({ featured: true });

    const revenueAgg = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$cart.totalCost" },
          totalItemsSold: { $sum: "$cart.totalQty" },
          avgOrderValue: { $avg: "$cart.totalCost" }
        }
      }
    ]);

    const liveStats = {
      totalProducts: products.length,
      inStockCount,
      outOfStockCount,
      featuredCount,
      totalCategories: categories.length,
      totalOrders: totalOrdersCount,
      totalClients: totalClientsCount,
      totalRevenue: revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0,
      totalItemsSold: revenueAgg.length > 0 ? revenueAgg[0].totalItemsSold : 0,
      avgOrderValue: revenueAgg.length > 0 ? Math.round(revenueAgg[0].avgOrderValue) : 0
    };

    res.render("admin/dashboard", {
      pageName: "Atelier Console",
      products,
      categories,
      orders,
      stats: liveStats,
      totalRevenue: liveStats.totalRevenue
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.redirect("/");
  }
});

// GET: Add Product Form (Experiment 3)
router.get("/add-product", middleware.isAdmin, async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render("admin/add-product", {
      pageName: "Curate New Piece",
      categories
    });
  } catch (err) {
    console.error("Add product page error:", err);
    res.redirect("/admin");
  }
});

// POST: Create New Product (Experiment 3 & 4)
router.post("/add-product", [middleware.isAdmin, upload.single("image")], async (req, res) => {
  try {
    const { title, productCode, price, category, manufacturer, description, available, featured } = req.body;
    let imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.imageUrl || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600";

    const newProduct = new Product({
      title,
      productCode: productCode || `MRD-${Date.now().toString().slice(-6)}`,
      price: parseFloat(price),
      category,
      manufacturer: manufacturer || "Meridian Atelier",
      description,
      imagePath,
      available: available === "on" || available === "true",
      featured: featured === "on" || featured === "true"
    });

    await newProduct.save();
    req.flash("success", `Piece "${title}" successfully catalogued.`);
    res.redirect("/admin");
  } catch (err) {
    console.error("Create product error:", err);
    req.flash("error", `Failed to add product: ${err.message}`);
    res.redirect("/admin/add-product");
  }
});

// GET: Edit Product (Experiment 3)
router.get("/edit-product/:id", middleware.isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const categories = await Category.find({});
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/admin");
    }
    res.render("admin/edit-product", {
      pageName: `Edit ${product.title}`,
      product,
      categories
    });
  } catch (err) {
    console.error("Edit product form error:", err);
    res.redirect("/admin");
  }
});

// POST: Update Product (Experiment 3)
router.post("/edit-product/:id", [middleware.isAdmin, upload.single("image")], async (req, res) => {
  try {
    const { title, productCode, price, category, manufacturer, description, available, featured, existingImage } = req.body;
    const update = {
      title,
      productCode,
      price: parseFloat(price),
      category,
      manufacturer,
      description,
      available: available === "on" || available === "true",
      featured: featured === "on" || featured === "true"
    };

    if (req.file) {
      update.imagePath = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl && req.body.imageUrl.trim()) {
      update.imagePath = req.body.imageUrl.trim();
    }

    await Product.findByIdAndUpdate(req.params.id, update);
    req.flash("success", `Piece "${title}" updated.`);
    res.redirect("/admin");
  } catch (err) {
    console.error("Update product error:", err);
    req.flash("error", "Failed to update product.");
    res.redirect("/admin");
  }
});

// POST: Delete Product (Experiment 3)
router.post("/delete-product/:id", middleware.isAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash("success", "Piece removed from catalogue.");
  } catch (err) {
    console.error("Delete product error:", err);
    req.flash("error", "Error removing piece.");
  }
  res.redirect("/admin");
});

// POST: Add Category (Experiment 3)
router.post("/add-category", middleware.isAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;
    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const newCategory = new Category({ title, slug, description });
    await newCategory.save();
    req.flash("success", `Category "${title}" established.`);
  } catch (err) {
    console.error("Add category error:", err);
    req.flash("error", "Could not create category.");
  }
  res.redirect("/admin");
});

// POST: Delete Category (Experiment 3)
router.post("/delete-category/:id", middleware.isAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    req.flash("success", "Category deleted.");
  } catch (err) {
    console.error("Delete category error:", err);
    req.flash("error", "Error removing category.");
  }
  res.redirect("/admin");
});

// GET: Orders Management (Experiment 3 & 10)
router.get("/orders", middleware.isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user")
      .sort("-createdAt")
      .exec();

    res.render("admin/orders", {
      pageName: "Order Ledger",
      orders
    });
  } catch (err) {
    console.error("Admin orders error:", err);
    res.redirect("/admin");
  }
});

// POST: Toggle Order Delivery Status (Experiment 3)
router.post("/toggle-delivery/:id", middleware.isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.delivered = !order.delivered;
      await order.save();
      req.flash("success", `Order #${order._id.toString().slice(-6).toUpperCase()} marked as ${order.delivered ? "Delivered" : "Processing"}.`);
    }
  } catch (err) {
    console.error("Toggle delivery error:", err);
  }
  res.redirect("/admin/orders");
});

module.exports = router;
