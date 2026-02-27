const mongoose = require("mongoose");

const liquidityPoolSchema = new mongoose.Schema({

  totalCapital: {
    type: Number,
    default: 100000
  }

});

module.exports = mongoose.model("LiquidityPool", liquidityPoolSchema);