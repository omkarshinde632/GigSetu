const mongoose = require("mongoose");

const repaymentSchema = new mongoose.Schema({
  paidOn: {
    type: Date,
    default: Date.now
  },
  amountPaid: Number,
  remainingAfterPayment: Number
}, { _id: false });

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    tenure: {
      type: Number,
      enum: [3, 6, 12],
      required: true
    },

    interestRate: {
      type: Number,
      required: true
    },

    totalPayable: {
      type: Number,
      required: true
    },

    emiAmount: {
      type: Number,
      required: true
    },

    riskTier: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "completed",
        "rejected",
        "defaulted"
      ],
      default: "pending"
    },

    remainingBalance: {
      type: Number,
      required: true
    },

    emisPaid: {
      type: Number,
      default: 0
    },

    // ✅ FIXED HERE
    // No longer required at creation time
    nextDueDate: {
      type: Date,
      default: null
    },

    latePenaltyApplied: {
      type: Boolean,
      default: false
    },

    penaltyAmount: {
      type: Number,
      default: 0
    },

    adminOverride: {
      type: Boolean,
      default: false
    },

    overrideReason: {
      type: String
    },

    repaymentHistory: [repaymentSchema]

  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", loanSchema);