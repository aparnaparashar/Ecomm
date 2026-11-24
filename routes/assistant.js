const express = require("express");
const router = express.Router();
const Product = require("../models/product");

function parseBudget(message) {
  const text = (message || "").toLowerCase().replace(/,/g, "");
  const inr = text.replace(/₹/g, "rs ").replace(/\binr\b/g, "rs");
  let max = null;
  let min = null;

  const under = inr.match(/(?:under|below|less than|upto|up to|within|max(?:imum)?|budget(?: of)?|for)\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*(k)?/i);
  if (under) {
    max = parseFloat(under[1]) * (under[2] ? 1000 : 1);
  }

  const between = inr.match(/(?:between|from)\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*(k)?\s*(?:and|to|-)\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*(k)?/i);
  if (between) {
    const a = parseFloat(between[1]) * (between[2] ? 1000 : 1);
    const b = parseFloat(between[3]) * (between[4] ? 1000 : 1);
    min = Math.min(a, b);
    max = Math.max(a, b);
  }

  const plain = !max && inr.match(/(?:rs\.?\s*)(\d+(?:\.\d+)?)\s*(k)?/i);
  if (plain) {
    max = parseFloat(plain[1]) * (plain[2] ? 1000 : 1);
  }

  return { min, max };
}

function detectIntent(message) {
  const text = (message || "").toLowerCase();
  const intents = [];
  if (/(gift|present|birthday|anniversary|wedding|festive|diwali|valentine)/.test(text)) intents.push("gift");
  if (/(men|man|boy|him|his|groom)/.test(text)) intents.push("men");
  if (/(women|woman|girl|her|lady|bride)/.test(text)) intents.push("women");
  if (/(kid|child|children|boy|girl)/.test(text)) intents.push("kids");
  if (/(formal|office|work|business|meeting|interview)/.test(text)) intents.push("formal");
  if (/(casual|daily|everyday|comfort)/.test(text)) intents.push("casual");
  if (/(party|evening|wedding|festive|occasion|celebration)/.test(text)) intents.push("occasion");
  if (/(summer|winter|warm|cool|light|breathable)/.test(text)) intents.push("seasonal");
  if (/(top|shirt|t-?shirt|blouse|kurta)/.test(text)) intents.push("top");
  if (/(jean|pant|trouser|bottom|skirt|short)/.test(text)) intents.push("bottom");
  if (/(dress|gown|saree|jumpsuit|outfit|set)/.test(text)) intents.push("dress");
  return intents;
}

function scoreProduct(product, message, budget, intents) {
  let score = 0;
  const text = (message || "").toLowerCase();
  const hay = [
    product.title,
    product.description,
    product.manufacturer,
    product.fabric,
    product.designer,
    product.category ? product.category.title : "",
    product.category ? product.category.slug : ""
  ].join(" ").toLowerCase();

  const price = typeof product.discountPrice === "number" && product.discountPrice > 0 ? product.discountPrice : product.price;
  if (budget.max != null) {
    if (price <= budget.max) score += 6;
    else score -= 8;
    if (price >= budget.max * 0.6 && price <= budget.max) score += 2;
  }
  if (budget.min != null) {
    if (price >= budget.min) score += 2;
    else score -= 4;
  }

  intents.forEach(intent => {
    if (hay.includes(intent)) score += 3;
  });

  const words = text.split(/[^a-z0-9]+/).filter(w => w.length > 2 && !["need", "want", "for", "under", "below", "with", "and", "the", "gift", "friend", "please", "show", "suggest", "something", "good", "best"].includes(w));
  words.forEach(word => {
    if (hay.includes(word)) score += 1.5;
  });

  if (product.available) score += 1;
  if (product.featured) score += 0.5;
  return score;
}

function formatProductForPrompt(p) {
  const price = typeof p.discountPrice === "number" && p.discountPrice > 0 ? p.discountPrice : p.price;
  return {
    id: String(p._id),
    title: p.title,
    price,
    originalPrice: p.price,
    category: p.category ? p.category.title : "Apparel",
    description: (p.description || "").slice(0, 180),
    fabric: p.fabric || "",
    designer: p.designer || "",
    available: !!p.available,
    url: `/products/${p._id}`
  };
}

async function callGroq(messages) {
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
            temperature: 0.4,
            max_tokens: 900
          })
        });

        if (!response.ok) {
          let detail = "";
          try { detail = await response.text(); } catch (e) {}
          lastStatus = response.status;
          const shortDetail = detail.replace(/\s+/g, " ").trim().slice(0, 180);
          failures.push(`${model}: ${response.status} ${shortDetail || "request failed"}`.trim());
          if ([400, 401, 403, 404, 422, 429].includes(response.status)) {
            continue;
          }
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
        const msg = (err && err.message) ? err.message : "Request failed";
        failures.push(`${model}: ${msg}`);
      }
    }
    return { reply: "", lastStatus };
  }

  const failures = [];
  let result = await tryModels(baseModels, failures);
  if (result.reply) return result.reply;

  // Discover available models from the account and retry with chat-capable ones
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
        failures.push(`discovered models: ${discovered.slice(0, 8).join(", ")}`);
        result = await tryModels(discovered.slice(0, 6), failures);
        if (result.reply) return result.reply;
      } else {
        failures.push("no additional chat models discovered");
      }
    } else {
      let d = "";
      try { d = await modelsRes.text(); } catch (e) {}
      failures.push(`models lookup: ${modelsRes.status} ${d.replace(/\s+/g, " ").slice(0, 120)}`);
    }
  } catch (e) {
    failures.push(`models lookup failed: ${(e && e.message) || "unknown error"}`);
  }

  const err = new Error(`Groq API error (${result.lastStatus || "unknown"})`);
  err.code = "GROQ_ERROR";
  err.detail = failures.join(" | ") || "No compatible model responded.";
  throw err;
}

router.post("/chat", async (req, res) => {
  try {
    const message = (req.body && req.body.message ? String(req.body.message) : "").trim();
    const history = Array.isArray(req.body && req.body.history) ? req.body.history.slice(-8) : [];
    if (!message) {
      return res.status(400).json({ error: "Please enter a message." });
    }

    const allProducts = await Product.find({}).populate("category").lean().exec();
    const budget = parseBudget(message);
    const intents = detectIntent(message);

    const ranked = allProducts
      .map(p => ({ p, score: scoreProduct(p, message, budget, intents) }))
      .sort((a, b) => b.score - a.score);

    let candidates = ranked.filter(x => x.score > -2).slice(0, 10).map(x => x.p);
    if (candidates.length < 4) {
      candidates = ranked.slice(0, 8).map(x => x.p);
    }
    if (budget.max != null) {
      const within = ranked.filter(x => {
        const price = typeof x.p.discountPrice === "number" && x.p.discountPrice > 0 ? x.p.discountPrice : x.p.price;
        return price <= budget.max;
      }).slice(0, 8).map(x => x.p);
      if (within.length) candidates = within;
    }

    const catalog = candidates.map(formatProductForPrompt);
    const budgetText = budget.max != null
      ? (budget.min != null ? `Budget range: ₹${Math.round(budget.min)} - ₹${Math.round(budget.max)}.` : `Budget: up to ₹${Math.round(budget.max)}.`)
      : "Budget: not specified.";

    const systemPrompt = [
      "You are Meridian's AI shopping assistant for a luxury fashion e-commerce website.",
      "Help customers choose products based on their needs using only the provided catalog.",
      "Tasks: understand requirements, suggest suitable products from the catalog, compare options, and explain clearly why each is suitable.",
      "Rules:",
      "- Recommend only products that exist in the provided catalog. Do not invent products, prices, or links.",
      "- If budget is specified, prioritize products within budget and clearly mention when an option is near/within budget.",
      "- Suggest 1 to 5 relevant products. For each, mention name, price (₹), and reason.",
      "- When helpful, briefly compare products (e.g. style, fabric, occasion, value).",
      "- Include product links using the provided url paths (e.g. /products/<id>).",
      "- If nothing fits well, say so honestly and suggest closest alternatives from the catalog.",
      "- Be warm, concise, and practical. Use plain text formatting."
    ].join("\n");

    const contextMessage = `Customer request: ${message}\n${budgetText}\nDetected intents: ${intents.join(", ") || "general"}\n\nAvailable catalog candidates (JSON):\n${JSON.stringify(catalog, null, 2)}`;

    const messages = [{ role: "system", content: systemPrompt }];
    history.forEach(h => {
      if (!h || !h.role || !h.content) return;
      if (h.role === "user" || h.role === "assistant") {
        messages.push({ role: h.role, content: String(h.content).slice(0, 1000) });
      }
    });
    messages.push({ role: "user", content: contextMessage });

    let reply;
    try {
      reply = await callGroq(messages);
    } catch (err) {
      if (err.code === "NO_KEY") {
        return res.status(503).json({
          error: "Shopping assistant is not configured yet. Please add GROQ_API_KEY in the server .env file and restart the server.",
          code: "NO_KEY"
        });
      }
      console.error("Groq assistant error:", err.message, err.detail || "");
      const detail = (err && err.detail ? String(err.detail) : "").replace(/\s+/g, " ").trim();
      let userError = "The shopping assistant is unavailable right now. Please try again in a moment.";
      if (detail) {
        const short = detail.length > 500 ? detail.slice(0, 500) + "…" : detail;
        userError = `The shopping assistant could not respond (${short}). Please check the Groq model/API key and try again.`;
      }
      return res.status(502).json({
        error: userError,
        code: "GROQ_ERROR"
      });
    }

    const suggestedProducts = catalog.slice(0, 5).map(p => {
      const original = candidates.find(c => String(c._id) === p.id);
      return {
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category,
        url: p.url,
        imagePath: original ? (original.imagePath || "") : ""
      };
    });

    res.json({ reply, products: suggestedProducts, budget });
  } catch (error) {
    console.error("Assistant chat error:", error);
    res.status(500).json({ error: "Something went wrong while finding recommendations." });
  }
});

module.exports = router;