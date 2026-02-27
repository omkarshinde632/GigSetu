const mongoose = require("mongoose");

const liquidityPoolSchema = new mongoose.Schema({

  totalCapital: {
    type: Number,
    default: 100000   // Start with ₹1 lakh demo capital
  }

});

module.exports = mongoose.model("LiquidityPool", liquidityPoolSchema);