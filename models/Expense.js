const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: ["fuel", "repair", "rent", "food", "mobile", "other"],
      required: true
    },
    amount: { type: Number, required: true },
    note: String,
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);