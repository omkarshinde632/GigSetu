const mongoose = require("mongoose");

const earningSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    platform: {
        type: String,
        enum: ["Uber", "Swiggy", "Zomato", "Freelance"],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("Earning", earningSchema);