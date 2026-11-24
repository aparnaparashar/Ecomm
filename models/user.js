const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  role: { type: String, default: "Client" },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.methods.encryptPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

// Compare candidate password
userSchema.methods.validPassword = function(candidatePassword) {
  if (this.password != null) {
    return bcrypt.compareSync(candidatePassword, this.password);
  }
  return false;
};

module.exports = mongoose.model("User", userSchema);
