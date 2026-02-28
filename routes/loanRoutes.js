const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Earning = require("../models/Earnings");
const Loan = require("../models/Loan");

const {
  calculateLoanEligibility,
  calculateEMI
} = require("../utils/loanEngine");


router.get("/apply", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/login");

    const earnings = await Earning.find({ user: user._id });

    const eligibility = calculateLoanEligibility(user, earnings);

    res.render("loanApply", { eligibility, user });

  } catch (error) {

    return res.status(400).render("error", {
    status: 400,
    message: "Loan Eligibility Error",
    redirect: "/dashboard"
});
  }
});

router.post("/apply", isAuthenticated, async (req, res) => {
  try {
    const { amount, tenure } = req.body;

    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/login");

    if (user.accountFrozen) {
      return res.send("🚫 Your account is frozen. Contact admin.");
    }

    const earnings = await Earning.find({ user: user._id });

    const eligibility = calculateLoanEligibility(user, earnings);


    if (!eligibility.eligible) {
      return res.send("❌ Not eligible for loan.");
    }

    if (Number(amount) > eligibility.loanLimit) {
      return res.send("❌ Requested amount exceeds your loan limit.");
    }

    const interestRate = eligibility.interestRate;

    const { totalPayable, emiAmount } = calculateEMI(
      Number(amount),
      Number(tenure),
      interestRate
    );

    const nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await Loan.create({
      user: user._id,
      amount: Number(amount),
      tenure: Number(tenure),
      interestRate: interestRate * 100,
      totalPayable,
      emiAmount,
      riskTier: eligibility.riskTier,
      status: "pending",
      remainingBalance: totalPayable,
      emisPaid: 0,

      nextDueDate,           
      latePenaltyApplied: false,
      penaltyAmount: 0
    });

    res.redirect("/dashboard");

  } catch (error) {
    return res.status(400).render("error", {
    status: 400,
    message: "Loan Apply Error",
    redirect: "/dashboard"
});
    
  }
});

module.exports = router;