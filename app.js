require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const morgan = require("morgan");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const path = require("path");

const { connectDB } = require("./config/db");
const Category = require("./models/category");
const Cart = require("./models/cart");

const app = express();

// Initialize Database (Local MongoDB or Automatic In-Memory MongoDB Fallback)
connectDB().catch(err => {
  console.error("Critical Database Error:", err);
});

// Passport Configuration
require("./config/passport");

// View Engine Setup (EJS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Standard Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session Management (Experiment 7)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "meridian_luxury_secret_session_key_2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3 * 60 * 60 * 1000, // 3 hours
      httpOnly: true
    }
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Global Context Middleware
app.use(async (req, res, next) => {
  try {
    res.locals.login = req.isAuthenticated();
    res.locals.currentUser = req.user || null;
    res.locals.session = req.session;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");

    // Dynamic categories in header (Experiment 2 & 3)
    let categories = [];
    try {
      categories = await Category.find({}).sort({ title: 1 }).exec();
    } catch (e) {
      categories = [
        { title: "Men", slug: "men" },
        { title: "Women", slug: "women" },
        { title: "Kids", slug: "kids" }
      ];
    }
    res.locals.categories = categories;

    // Cart total quantity badge (Experiment 10)
    if (req.session.cart && req.session.cart._id) {
      try {
        const cart = await Cart.findById(req.session.cart._id);
        res.locals.cartCount = cart ? cart.totalQty : 0;
      } catch (e) {
        res.locals.cartCount = req.session.cart.totalQty || 0;
      }
    } else {
      res.locals.cartCount = 0;
    }

    next();
  } catch (err) {
    console.error("Global middleware error:", err);
    res.locals.cartCount = 0;
    next();
  }
});

// Mount Routes
const pageRoutes = require("./routes/pages");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

app.use("/", pageRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render("error", {
    pageName: "Page Not Found",
    message: "The requested atelier piece or salon could not be located."
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                                                            ║");
  console.log("║           ◇  M E R I D I A N   A T E L I E R  ◇            ║");
  console.log("║          Luxury Fashion & Modern Apparel Platform          ║");
  console.log("║                                                            ║");
  console.log(`║      🌐 Server Active:   http://localhost:${PORT}             ║`);
  console.log("║      📦 E-Commerce Lab:  BIT-417 (Experiments 1-11)        ║");
  console.log("║                                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
});
