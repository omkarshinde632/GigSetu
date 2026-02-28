const mongoose = require("mongoose");

const insuranceClaimSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  policyType: {
    type: String,
    enum: ["health", "accident"],
    required: true
  },

  reason: {
    type: String,
    required: true
  },

  requestedAmount: {
    type: Number,
    required: true
  },

  document: {
    type: String,
    required: true
  },

  payoutAmount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["pending_review", "approved", "rejected"],
    default: "pending_review"
  }

}, { timestamps: true });

module.exports = mongoose.model("InsuranceClaim", insuranceClaimSchema);