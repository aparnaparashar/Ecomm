const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  cart: {
    totalQty: { type: Number, default: 0, required: true },
    totalCost: { type: Number, default: 0, required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        qty: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
        title: { type: String },
        productCode: { type: String }
      }
    ]
  },
  address: { type: String, required: true },
  paymentId: { type: String, required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paymentMethod: { type: String, default: "Razorpay" },
  createdAt: { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false }
});

module.exports = mongoose.model("Order", orderSchema);
