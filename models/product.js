const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  productCode: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  imagePath: { type: String, required: true, default: "/images/default-product.jpg" },
  manufacturer: { type: String, default: "Meridian Atelier" },
  designer: { type: String, default: "Alessandro Rossi" },
  designerOrigin: { type: String, default: "Milan, Italy" },
  fabric: { type: String, default: "100% Pure Virgin Wool & Mulberry Silk" },
  available: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);
