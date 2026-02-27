const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const WeeklyPayoutPlan = require("../models/WeeklyPayoutPlan");


router.post("/apply", isAuthenticated, async (req, res) => {

  const { weeklyAmount } = req.body;

  if (!weeklyAmount || weeklyAmount <= 0) {
    return res.send("Invalid weekly amount");
  }

  const dailyAmount = Math.floor(weeklyAmount / 7);
  const processingFee = Math.floor(weeklyAmount * 0.02);

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