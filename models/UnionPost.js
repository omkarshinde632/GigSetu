const mongoose = require("mongoose");

const unionPostSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  platform: {
    type: String,
    enum: ["Uber", "Swiggy", "Zomato", "Freelance", "General"],
    default: "General"
  },

  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  status: {
    type: String,
    enum: ["open", "under_review", "resolved"],
    default: "open"
  }

}, { timestamps: true });

module.exports = mongoose.model("UnionPost", unionPostSchema);