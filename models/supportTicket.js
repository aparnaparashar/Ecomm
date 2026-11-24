const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const supportTicketSchema = new Schema({
  ticketNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ["support", "bespoke_commission"], default: "support" },
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  designerName: { type: String, default: null },
  silhouette: { type: String, default: null },
  status: { type: String, enum: ["Pending", "In Review", "Contacted", "Resolved"], default: "Pending" },
  adminNotes: { type: String, default: "" },
  priority: { type: String, enum: ["Standard", "VIP / Haute"], default: "Standard" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
