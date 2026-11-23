const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  title: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" }
});

module.exports = mongoose.model("Category", categorySchema);
