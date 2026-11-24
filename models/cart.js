const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  items: [
    {
      productId: { type: Schema.Types.ObjectId, ref: "Product" },
      qty: { type: Number, default: 0 },
      price: { type: Number, default: 0 },
      title: { type: String },
      productCode: { type: String }
    }
  ],
  totalQty: { type: Number, default: 0, required: true },
  totalCost: { type: Number, default: 0, required: true },
  discountCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },
  finalCost: { type: Number, default: 0 },
  user: { type: Schema.Types.ObjectId, ref: "User", required: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Cart", cartSchema);
