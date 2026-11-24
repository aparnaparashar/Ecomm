const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
