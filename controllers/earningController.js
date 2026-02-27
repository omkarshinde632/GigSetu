const Earning = require("../models/Earnings");
const User = require("../models/User");
const { calculateGigScore } = require("../utils/gigScore");

exports.addEarning = async (req, res) => {
    try {

        const { platform, amount } = req.body;
        const userId = req.session.userId;

        const user = await User.findById(userId);

        if (!user) {
            return res.redirect("/login");
        }

        if (user.accountFrozen) {
            return res.send("Your account is frozen. Earnings are disabled. Contact admin.");
        }

        await Earning.create({
            user: userId,
            platform,
            amount: Number(amount)
        });

        user.walletBalance += Number(amount);

        const earnings = await Earning.find({ user: userId });

        const totalEarnings = earnings.reduce(
            (sum, e) => sum + e.amount,
            0
        );

        user.gigScore = calculateGigScore(
            totalEarnings,
            earnings.length,
            user.walletBalance
        );

        const suspicious = false;

        if (
            earnings.length >= 3 &&
            totalEarnings > 5000 &&
            user.gigScore > 70 &&
            !suspicious &&
            user.verificationStatus === "pending"
        ) {
            user.autoEligible = true;
        }

        await user.save();

        req.session.user = user;

        res.redirect("/dashboard");

    } catch (error) {
        console.log("Add Earning Error:", error);
        res.redirect("/dashboard");
    }
};