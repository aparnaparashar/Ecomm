const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: "Seasonal Atelier Promotional Privilege" },
  discountType: { type: String, enum: ["percent", "flat"], default: "percent" },
  discountValue: { type: Number, required: true }, // e.g. 15 for 15% or 1000 for ₹1000
  minPurchase: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 50000 },
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  expiryDate: { type: Date, default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Coupon", couponSchema);
