const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const WeeklyPayoutPlan = require("../models/WeeklyPayoutPlan");
const User = require("../models/User");

router.post("/apply", isAuthenticated, async (req, res) => {

const user = await User.findById(req.session.userId);

  if (!user) return res.redirect("/login");

  if (user.verificationStatus !== "verified") {
        return res.status(403).render("error", {
      status: 403,
      message: "You must complete verification before activating Daily Payout.",
      redirect: "/dashboard"
});
  }

  const { weeklyAmount } = req.body;

  if (!weeklyAmount || weeklyAmount <= 0) {
    return res.send("Invalid weekly amount");
  }

  const dailyAmount = Math.floor(weeklyAmount / 7);
  const processingFee = Math.floor(weeklyAmount * 0.01);

  await WeeklyPayoutPlan.create({
    user: req.session.userId,
    weeklyAmount,
    dailyAmount,
    processingFee,
    status: "pending_payment"
  });

  res.redirect("/dashboard");
});

module.exports = router;