const mongoose = require("mongoose");

const weeklyPayoutPlanSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  weeklyAmount: {
    type: Number,
    required: true
  },

  dailyAmount: {
    type: Number,
    required: true
  },

  processingFee: {
    type: Number,
    required: true
  },

  daysReleased: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["pending_payment", "active", "completed"],
    default: "pending_payment"
  },

  startDate: Date

}, { timestamps: true });

module.exports = mongoose.model("WeeklyPayoutPlan", weeklyPayoutPlanSchema);