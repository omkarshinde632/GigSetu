const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,

  platform: {
    type: String,
    enum: ["Uber", "Swiggy", "Zomato", "Freelance"]
  },

  verificationStatus: {
    type: String,
    enum: ["unverified", "pending", "verified"],
    default: "unverified"
  },

  documents: {
    type: String
  },

  walletBalance: {
    type: Number,
    default: 0
  },

  gigScore: {
    type: Number,
    default: 60
  },

  role: {
    type: String,
    enum: ["worker", "admin"],
    default: "worker"
  },

  autoEligible: {
    type: Boolean,
    default: false
  },

  accountFrozen: {
    type: Boolean,
    default: false
  },

  upiId: {
    type: String,
    default: null
  },

  bankDetails: {
    accountNumber: { type: String, default: null },
    ifsc: { type: String, default: null },
    bankName: { type: String, default: null }
  },

  isPayoutLinked: {
    type: Boolean,
    default: false
  },

  insurance: {
    enrolled: { type: Boolean, default: false },
    policyType: { type: String, enum: ["health", "accident"], default: null },
    policyId: { type: String, default: null },
    enrolledAt: { type: Date }
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);