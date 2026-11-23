const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Category = require("../models/category");

// GET: Product Catalog (All products with pagination)
router.get("/", async (req, res) => {
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  const sort = req.query.sort || "-createdAt";

  try {
    const query = {};
    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) query.category = category._id;
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .skip((perPage * page) - perPage)
      .limit(perPage)
      .populate("category")
      .exec();

    res.render("shop/index", {
      pageName: "All Collections",
      products,
      current: page,
      pages: Math.ceil(count / perPage) || 1,
      totalCount: count,
      home: "/products?",
      breadcrumbs: null,
      selectedCategory: req.query.category || "all",
      selectedSort: sort
    });
  } catch (error) {
    console.error("Products catalog error:", error);
    req.flash("error", "Unable to load catalogue at this time.");
    res.redirect("/");
  }
});

// GET: Search Box (Experiment 9)
router.get("/search", async (req, res) => {
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  const searchTerm = req.query.search ? req.query.search.trim() : "";

  try {
    const searchFilter = searchTerm
      ? {
          $or: [
            { title: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
            { productCode: { $regex: searchTerm, $options: "i" } },
            { manufacturer: { $regex: searchTerm, $options: "i" } }
          ]
        }
      : {};

    const count = await Product.countDocuments(searchFilter);
    const products = await Product.find(searchFilter)
      .sort("-createdAt")
      .skip((perPage * page) - perPage)
      .limit(perPage)
      .populate("category")
      .exec();

    res.render("shop/index", {
      pageName: `Search: "${searchTerm}"`,
      products,
      current: page,
      pages: Math.ceil(count / perPage) || 1,
      totalCount: count,
      home: `/products/search?search=${encodeURIComponent(searchTerm)}&`,
      breadcrumbs: { title: `Search results for "${searchTerm}"` },
      selectedCategory: "all",
      selectedSort: "-createdAt",
      searchTerm
    });
  } catch (error) {
    console.error("Search error:", error);
    req.flash("error", "Error executing search.");
    res.redirect("/products");
  }
});

// GET: Products by Category (Experiment 3 & 5)
router.get("/category/:slug", async (req, res) => {
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  const sort = req.query.sort || "-createdAt";

  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      req.flash("error", "Category not found.");
      return res.redirect("/products");
    }

    const count = await Product.countDocuments({ category: category._id });
    const products = await Product.find({ category: category._id })
      .sort(sort)
      .skip((perPage * page) - perPage)
      .limit(perPage)
      .populate("category")
      .exec();

    res.render("shop/index", {
      pageName: `${category.title} Collection`,
      products,
      current: page,
      pages: Math.ceil(count / perPage) || 1,
      totalCount: count,
      home: `/products/category/${category.slug}?`,
      breadcrumbs: category,
      selectedCategory: category.slug,
      selectedSort: sort
    });
  } catch (error) {
    console.error("Category query error:", error);
    res.redirect("/products");
  }
});

// GET: Single Product Details (Experiment 3 & 10)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category").exec();
    if (!product) {
      req.flash("error", "Piece not found in collection.");
      return res.redirect("/products");
    }

    // Related items in same category
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id }
    })
      .limit(4)
      .populate("category")
      .exec();

    res.render("shop/product", {
      pageName: product.title,
      product,
      relatedProducts
    });
  } catch (error) {
    console.error("Product detail error:", error);
    req.flash("error", "Invalid piece identifier.");
    res.redirect("/products");
  }
});

module.exports = router;
