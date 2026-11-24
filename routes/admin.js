const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Category = require("../models/category");
const Order = require("../models/order");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const SupportTicket = require("../models/supportTicket");
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

// ==========================================
// 1. ADMIN DASHBOARD & OVERVIEW
// ==========================================
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
    const pendingTicketsCount = await SupportTicket.countDocuments({ status: { $ne: "Resolved" } });
    const activeCouponsCount = await Coupon.countDocuments({ isActive: true });

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
      pendingTicketsCount,
      activeCouponsCount,
      totalRevenue: revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0,
      totalItemsSold: revenueAgg.length > 0 ? revenueAgg[0].totalItemsSold : 0,
      avgOrderValue: revenueAgg.length > 0 ? Math.round(revenueAgg[0].avgOrderValue) : 0
    };

    res.render("admin/dashboard", {
      pageName: "Atelier Console",
      currentTab: "dashboard",
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

// ==========================================
// 2. PRODUCT MANAGEMENT & PRICING
// ==========================================

// GET: Add Product Form
router.get("/add-product", middleware.isAdmin, async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render("admin/add-product", {
      pageName: "Curate New Piece",
      currentTab: "products",
      categories
    });
  } catch (err) {
    console.error("Add product page error:", err);
    res.redirect("/admin");
  }
});

// POST: Create New Product (with optional discount pricing)
router.post("/add-product", [middleware.isAdmin, upload.single("image")], async (req, res) => {
  try {
    const {
      title,
      productCode,
      price,
      discountPrice,
      discountPercent,
      category,
      manufacturer,
      designer,
      designerOrigin,
      fabric,
      description,
      available,
      featured
    } = req.body;

    let imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.imageUrl || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600";

    const parsedPrice = parseFloat(price);
    const parsedDiscountPrice = discountPrice && parseFloat(discountPrice) > 0 ? parseFloat(discountPrice) : null;
    const parsedDiscountPercent = discountPercent ? parseInt(discountPercent, 10) : 0;

    const newProduct = new Product({
      title,
      productCode: productCode || `MRD-${Date.now().toString().slice(-6)}`,
      price: parsedPrice,
      discountPrice: parsedDiscountPrice,
      discountPercent: parsedDiscountPercent,
      category,
      manufacturer: manufacturer || "Meridian Atelier",
      designer: designer || "Alessandro Rossi",
      designerOrigin: designerOrigin || "Milan, Italy",
      fabric: fabric || "100% Pure Virgin Wool & Mulberry Silk",
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

// GET: Edit Product
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
      currentTab: "products",
      product,
      categories
    });
  } catch (err) {
    console.error("Edit product form error:", err);
    res.redirect("/admin");
  }
});

// POST: Update Product & Pricing
router.post("/edit-product/:id", [middleware.isAdmin, upload.single("image")], async (req, res) => {
  try {
    const {
      title,
      productCode,
      price,
      discountPrice,
      discountPercent,
      category,
      manufacturer,
      designer,
      designerOrigin,
      fabric,
      description,
      available,
      featured
    } = req.body;

    const parsedPrice = parseFloat(price);
    const parsedDiscountPrice = discountPrice && parseFloat(discountPrice) > 0 ? parseFloat(discountPrice) : null;
    const parsedDiscountPercent = discountPercent ? parseInt(discountPercent, 10) : 0;

    const update = {
      title,
      productCode,
      price: parsedPrice,
      discountPrice: parsedDiscountPrice,
      discountPercent: parsedDiscountPercent,
      category,
      manufacturer: manufacturer || "Meridian Atelier",
      designer: designer || "Alessandro Rossi",
      designerOrigin: designerOrigin || "Milan, Italy",
      fabric: fabric || "100% Pure Virgin Wool & Mulberry Silk",
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
    req.flash("success", `Piece "${title}" and pricing updated.`);
    res.redirect("/admin");
  } catch (err) {
    console.error("Update product error:", err);
    req.flash("error", "Failed to update piece.");
    res.redirect("/admin");
  }
});

// POST: Delete Product
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

// POST: Bulk Discount Application across Category or All Catalog
router.post("/bulk-discount", middleware.isAdmin, async (req, res) => {
  try {
    const { categoryId, discountPercent } = req.body;
    const percent = Math.min(90, Math.max(0, parseInt(discountPercent, 10) || 0));

    const filter = categoryId && categoryId !== "all" ? { category: categoryId } : {};
    
    if (percent === 0) {
      // Remove discounts
      await Product.updateMany(filter, { discountPercent: 0, discountPrice: null });
      req.flash("success", "All promotional discounts removed from selected pieces.");
    } else {
      const targetProducts = await Product.find(filter);
      for (const p of targetProducts) {
        const discounted = Math.round(p.price * (1 - percent / 100));
        p.discountPercent = percent;
        p.discountPrice = discounted;
        await p.save();
      }
      req.flash("success", `Applied ${percent}% promotional pricing across ${targetProducts.length} pieces.`);
    }
  } catch (err) {
    console.error("Bulk discount error:", err);
    req.flash("error", "Could not apply bulk promotional pricing.");
  }
  res.redirect("/admin/coupons");
});

// Category Management
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

// ==========================================
// 3. USER MANAGEMENT CONSOLE
// ==========================================
router.get("/users", middleware.isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).sort("-createdAt").exec();

    // Aggregate orders per user
    const userOrderStats = await Order.aggregate([
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$cart.totalCost" }
        }
      }
    ]);

    const orderStatsMap = {};
    userOrderStats.forEach(stat => {
      if (stat._id) {
        orderStatsMap[stat._id.toString()] = {
          count: stat.orderCount,
          total: stat.totalSpent
        };
      }
    });

    const enrichedUsers = users.map(u => ({
      ...u.toObject(),
      orderCount: orderStatsMap[u._id.toString()] ? orderStatsMap[u._id.toString()].count : 0,
      totalSpent: orderStatsMap[u._id.toString()] ? orderStatsMap[u._id.toString()].total : 0
    }));

    res.render("admin/users", {
      pageName: "Client & User Management",
      currentTab: "users",
      users: enrichedUsers
    });
  } catch (err) {
    console.error("Admin users page error:", err);
    req.flash("error", "Could not load users database.");
    res.redirect("/admin");
  }
});

// POST: Toggle User Status (Active / Suspended)
router.post("/users/:id/toggle-status", middleware.isAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }

    if (targetUser.email === req.user.email) {
      req.flash("error", "Cannot suspend current active administrator session.");
      return res.redirect("/admin/users");
    }

    targetUser.status = targetUser.status === "suspended" ? "active" : "suspended";
    await targetUser.save();

    req.flash("success", `User "${targetUser.username}" is now ${targetUser.status.toUpperCase()}.`);
  } catch (err) {
    console.error("Toggle user status error:", err);
    req.flash("error", "Failed to update user status.");
  }
  res.redirect("/admin/users");
});

// POST: Update User Role
router.post("/users/:id/update-role", middleware.isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }

    targetUser.role = role || "Client";
    if (role === "Curator / Admin") {
      targetUser.isAdmin = true;
    }
    await targetUser.save();

    req.flash("success", `Role for "${targetUser.username}" changed to "${targetUser.role}".`);
  } catch (err) {
    console.error("Update user role error:", err);
    req.flash("error", "Failed to update user role.");
  }
  res.redirect("/admin/users");
});

// POST: Delete User Account
router.post("/users/:id/delete", middleware.isAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }

    if (targetUser.email === req.user.email) {
      req.flash("error", "Cannot delete your own administrator account.");
      return res.redirect("/admin/users");
    }

    await User.findByIdAndDelete(req.params.id);
    req.flash("success", `User account "${targetUser.username}" removed.`);
  } catch (err) {
    console.error("Delete user error:", err);
    req.flash("error", "Failed to delete user account.");
  }
  res.redirect("/admin/users");
});

// ==========================================
// 4. CONCIERGE & SUPPORT TICKETS CONSOLE
// ==========================================
router.get("/support", middleware.isAdmin, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({}).sort("-createdAt").exec();

    const pendingCount = tickets.filter(t => t.status === "Pending").length;
    const inReviewCount = tickets.filter(t => t.status === "In Review").length;
    const contactedCount = tickets.filter(t => t.status === "Contacted").length;
    const resolvedCount = tickets.filter(t => t.status === "Resolved").length;
    const bespokeCount = tickets.filter(t => t.type === "bespoke_commission").length;

    res.render("admin/support", {
      pageName: "Concierge & Bespoke Commissions",
      currentTab: "support",
      tickets,
      stats: {
        total: tickets.length,
        pending: pendingCount,
        inReview: inReviewCount,
        contacted: contactedCount,
        resolved: resolvedCount,
        bespoke: bespokeCount
      }
    });
  } catch (err) {
    console.error("Admin support tickets error:", err);
    req.flash("error", "Could not load support ledger.");
    res.redirect("/admin");
  }
});

// POST: Update Support Ticket Status & Admin Resolution Notes
router.post("/support/:id/update", middleware.isAdmin, async (req, res) => {
  try {
    const { status, adminNotes, priority } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      req.flash("error", "Ticket not found.");
      return res.redirect("/admin/support");
    }

    ticket.status = status || ticket.status;
    ticket.adminNotes = adminNotes !== undefined ? adminNotes : ticket.adminNotes;
    ticket.priority = priority || ticket.priority;
    ticket.updatedAt = new Date();

    await ticket.save();
    req.flash("success", `Ticket #${ticket.ticketNumber} marked as "${ticket.status}".`);
  } catch (err) {
    console.error("Update support ticket error:", err);
    req.flash("error", "Failed to update support ticket.");
  }
  res.redirect("/admin/support");
});

// POST: Delete Support Ticket
router.post("/support/:id/delete", middleware.isAdmin, async (req, res) => {
  try {
    await SupportTicket.findByIdAndDelete(req.params.id);
    req.flash("success", "Support inquiry removed from ledger.");
  } catch (err) {
    console.error("Delete support ticket error:", err);
    req.flash("error", "Failed to delete ticket.");
  }
  res.redirect("/admin/support");
});

// ==========================================
// 5. COUPONS & DISCOUNTS CONSOLE
// ==========================================
router.get("/coupons", middleware.isAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort("-createdAt").exec();
    const categories = await Category.find({}).exec();
    const discountedProductsCount = await Product.countDocuments({ discountPercent: { $gt: 0 } });

    res.render("admin/coupons", {
      pageName: "Promotions & Pricing Engine",
      currentTab: "coupons",
      coupons,
      categories,
      discountedProductsCount
    });
  } catch (err) {
    console.error("Admin coupons error:", err);
    req.flash("error", "Could not load promotional privileges.");
    res.redirect("/admin");
  }
});

// POST: Create New Coupon
router.post("/coupons/create", middleware.isAdmin, async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minPurchase, maxDiscount, expiryDate } = req.body;

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      req.flash("error", `Coupon code "${code.toUpperCase()}" already exists.`);
      return res.redirect("/admin/coupons");
    }

    const newCoupon = new Coupon({
      code: code.trim().toUpperCase(),
      description: description || "Exclusive Atelier Promotional Benefit",
      discountType: discountType || "percent",
      discountValue: parseFloat(discountValue),
      minPurchase: parseFloat(minPurchase) || 0,
      maxDiscount: parseFloat(maxDiscount) || 50000,
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true
    });

    await newCoupon.save();
    req.flash("success", `Coupon privilege "${newCoupon.code}" created.`);
  } catch (err) {
    console.error("Create coupon error:", err);
    req.flash("error", `Failed to create coupon: ${err.message}`);
  }
  res.redirect("/admin/coupons");
});

// POST: Toggle Coupon Active State
router.post("/coupons/:id/toggle", middleware.isAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (coupon) {
      coupon.isActive = !coupon.isActive;
      await coupon.save();
      req.flash("success", `Coupon "${coupon.code}" is now ${coupon.isActive ? "ACTIVE" : "INACTIVE"}.`);
    }
  } catch (err) {
    console.error("Toggle coupon error:", err);
    req.flash("error", "Failed to update coupon status.");
  }
  res.redirect("/admin/coupons");
});

// POST: Delete Coupon
router.post("/coupons/:id/delete", middleware.isAdmin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    req.flash("success", "Coupon code deleted.");
  } catch (err) {
    console.error("Delete coupon error:", err);
    req.flash("error", "Failed to delete coupon.");
  }
  res.redirect("/admin/coupons");
});

// ==========================================
// 6. ORDER LEDGER
// ==========================================
router.get("/orders", middleware.isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user")
      .sort("-createdAt")
      .exec();

    res.render("admin/orders", {
      pageName: "Order Ledger",
      currentTab: "orders",
      orders
    });
  } catch (err) {
    console.error("Admin orders error:", err);
    res.redirect("/admin");
  }
});

// POST: Toggle Delivery Status
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
