const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Category = require("../models/category");
const Review = require("../models/review");
const Cart = require("../models/cart");
const middleware = require("../middleware");

async function callGroq(messages, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error("GROQ_API_KEY is not configured");
    err.code = "NO_KEY";
    throw err;
  }

  const requested = (process.env.GROQ_MODEL || "").trim();
  const fallbackModels = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama3-8b-8192",
    "llama3-70b-8192"
  ];
  const baseModels = [];
  if (requested) baseModels.push(requested);
  fallbackModels.forEach(m => { if (!baseModels.includes(m)) baseModels.push(m); });

  async function tryModels(models, failures) {
    let lastStatus = 0;
    for (const model of models) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature != null ? options.temperature : 0.3,
            max_tokens: options.max_tokens || 900
          })
        });

        if (!response.ok) {
          let detail = "";
          try { detail = await response.text(); } catch (e) {}
          lastStatus = response.status;
          const shortDetail = detail.replace(/\s+/g, " ").trim().slice(0, 180);
          failures.push(`${model}: ${response.status} ${shortDetail || "request failed"}`.trim());
          if ([400, 401, 403, 404, 422, 429].includes(response.status)) continue;
          const err = new Error(`Groq API error (${response.status})`);
          err.code = "GROQ_ERROR";
          err.detail = failures.join(" | ");
          throw err;
        }

        const data = await response.json();
        const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
          ? data.choices[0].message.content.trim()
          : "";
        if (reply) return { reply, lastStatus };
        failures.push(`${model}: empty response`);
      } catch (err) {
        if (err && err.code === "GROQ_ERROR") throw err;
        failures.push(`${model}: ${(err && err.message) || "Request failed"}`);
      }
    }
    return { reply: "", lastStatus };
  }

  const failures = [];
  let result = await tryModels(baseModels, failures);
  if (result.reply) return result.reply;

  try {
    const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    if (modelsRes.ok) {
      const modelsData = await modelsRes.json();
      const available = Array.isArray(modelsData && modelsData.data) ? modelsData.data : [];
      const discovered = available
        .map(m => m && m.id)
        .filter(id => typeof id === "string")
        .filter(id => !/whisper|distil|guard|embed|tts|playai|tool-use/i.test(id))
        .filter(id => !baseModels.includes(id));
      if (discovered.length) {
        result = await tryModels(discovered.slice(0, 6), failures);
        if (result.reply) return result.reply;
      }
    }
  } catch (e) {}

  const err = new Error(`Groq API error (${result.lastStatus || "unknown"})`);
  err.code = "GROQ_ERROR";
  err.detail = failures.join(" | ") || "No compatible model responded.";
  throw err;
}

async function getCartProducts(req) {
  try {
    if (!req.session.cart || !req.session.cart._id) return [];
    const cart = await Cart.findById(req.session.cart._id).lean();
    if (!cart || !Array.isArray(cart.items)) return [];
    const ids = cart.items.map(item => item.productId).filter(Boolean);
    if (!ids.length) return [];
    return await Product.find({ _id: { $in: ids } }).populate("category").lean().exec();
  } catch (e) {
    return [];
  }
}

async function updateProductRatingStats(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        ratingAverage: { $avg: "$rating" },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: Math.round(stats[0].ratingAverage * 10) / 10,
      ratingCount: stats[0].ratingCount
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: 0,
      ratingCount: 0
    });
  }
}

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

    // Pairing items across categories for Style Studio
    const pairingProducts = await Product.find({
      category: { $ne: product.category._id },
      available: true
    })
      .limit(12)
      .populate("category")
      .exec();

    const cartProducts = await getCartProducts(req);

    const reviews = await Review.find({ product: product._id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    let userHasReviewed = false;
    if (req.user) {
      userHasReviewed = reviews.some(r => String(r.user) === String(req.user._id));
    }

    res.render("shop/product", {
      pageName: product.title,
      product,
      relatedProducts,
      pairingProducts,
      cartProducts,
      reviews,
      userHasReviewed
    });
  } catch (error) {
    console.error("Product detail error:", error);
    req.flash("error", "Invalid piece identifier.");
    res.redirect("/products");
  }
});

// POST: Add a review and rating for a product
router.post("/:id/reviews", middleware.isLoggedIn, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).exec();
    if (!product) {
      req.flash("error", "Piece not found in collection.");
      return res.redirect("/products");
    }

    const rating = parseInt(req.body.rating, 10);
    const comment = (req.body.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      req.flash("error", "Please select a rating between 1 and 5.");
      return res.redirect(`/products/${product._id}#reviews`);
    }
    if (!comment) {
      req.flash("error", "Please add a short review comment.");
      return res.redirect(`/products/${product._id}#reviews`);
    }
    if (comment.length > 1000) {
      req.flash("error", "Review comment is too long (max 1000 characters).");
      return res.redirect(`/products/${product._id}#reviews`);
    }

    const existing = await Review.findOne({ product: product._id, user: req.user._id }).exec();
    if (existing) {
      req.flash("error", "You have already reviewed this product.");
      return res.redirect(`/products/${product._id}#reviews`);
    }

    await Review.create({
      product: product._id,
      user: req.user._id,
      username: req.user.username || "Customer",
      rating,
      comment
    });

    const mongoose = require("mongoose");
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(product._id) } },
      {
        $group: {
          _id: "$product",
          ratingAverage: { $avg: "$rating" },
          ratingCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      product.ratingAverage = Math.round(stats[0].ratingAverage * 10) / 10;
      product.ratingCount = stats[0].ratingCount;
    } else {
      product.ratingAverage = 0;
      product.ratingCount = 0;
    }
    await product.save();

    req.flash("success", "Thank you for sharing your review.");
    res.redirect(`/products/${product._id}#reviews`);
  } catch (error) {
    console.error("Add review error:", error);
    if (error && error.code === 11000) {
      req.flash("error", "You have already reviewed this product.");
    } else {
      req.flash("error", "Unable to submit your review at the moment.");
    }
    res.redirect(`/products/${req.params.id}#reviews`);
  }
});

// POST: AI-based review analysis summary for a product
router.post("/:id/reviews/analyze", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category").lean().exec();
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 }).lean().exec();
    if (!reviews.length) {
      return res.json({
        summary: {
          overallSentiment: "No reviews yet",
          sentimentLabel: "neutral",
          reviewCount: 0,
          highlights: [],
          complaints: [],
          takeaway: "There are no customer reviews for this product yet. Once reviews are added, an AI summary will highlight what customers liked, common concerns, and the overall sentiment."
        }
      });
    }

    const reviewData = reviews.map((r, i) => ({
      index: i + 1,
      rating: r.rating,
      comment: (r.comment || "").slice(0, 500),
      date: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ""
    }));

    const systemPrompt = [
      "You are an AI review analyst for an e-commerce product page.",
      "Analyze the provided customer reviews and return ONLY valid JSON (no markdown, no code fences, no extra text).",
      "The JSON must have this exact shape:",
      "{",
      '  "overallSentiment": "short label like Mostly positive / Mixed / Mostly negative",',
      '  "sentimentLabel": "positive|mixed|negative|neutral",',
      '  "reviewCount": <number>,',
      '  "highlights": [{"text":"what customers liked","evidence":"e.g. 78% of reviewers (7/9) mentioned..."}],',
      '  "complaints": [{"text":"common concern","evidence":"e.g. 2 of 9 reviewers mentioned..."}],',
      '  "takeaway": "2-3 sentence plain-language summary helping a shopper decide"',
      "}",
      "Rules:",
      "- Base every point strictly on the provided reviews; do not invent details.",
      "- Use percentages when reviewCount >= 5 and they are meaningful; also include counts (x/y). If reviewCount < 5, prefer counts/framing like '2 of 3 reviewers' and avoid overstating percentages.",
      "- If there are no clear complaints, return an empty complaints array and note that in takeaway if helpful.",
      "- Keep highlights/complaints concise (max 4 each)."
    ].join("\n");

    const userPrompt = `Product: ${product.title}\nCategory: ${product.category ? product.category.title : "Apparel"}\nAverage rating: ${product.ratingAverage || 0} / 5 (${reviews.length} reviews)\n\nReviews (JSON):\n${JSON.stringify(reviewData)}`;

    let reply;
    try {
      reply = await callGroq([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ], { temperature: 0.2, max_tokens: 800 });
    } catch (err) {
      if (err.code === "NO_KEY") {
        return res.status(503).json({ error: "AI review analysis is not configured yet. Please add GROQ_API_KEY in the server .env file and restart the server." });
      }
      console.error("Review analysis Groq error:", err.message, err.detail || "");
      const detail = (err && err.detail ? String(err.detail) : "").replace(/\s+/g, " ").trim();
      return res.status(502).json({ error: detail ? `AI analysis could not be generated (${detail.slice(0, 300)}).` : "AI analysis is unavailable right now. Please try again." });
    }

    let summary = null;
    try {
      const cleaned = reply.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      summary = JSON.parse(cleaned);
    } catch (e) {
      // Fallback: return raw text as takeaway
      summary = {
        overallSentiment: "Summary",
        sentimentLabel: "neutral",
        reviewCount: reviews.length,
        highlights: [],
        complaints: [],
        takeaway: reply.slice(0, 1200)
      };
    }

    summary.reviewCount = reviews.length;
    res.json({ summary });
  } catch (error) {
    console.error("Review analysis error:", error);
    res.status(500).json({ error: "Unable to analyze reviews at the moment." });
  }
});

module.exports = router;
