const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const Loan = require("../models/Loan");
const User = require("../models/User");

router.post("/pay/:loanId", isAuthenticated, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.loanId);

    if (!loan) {
      return res.redirect("/dashboard");
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.redirect("/login");
    }

    if (loan.status !== "active") {
      return res.send("Loan is not active.");
    }

    if (user.accountFrozen) {
      return res.send("🚫 Your account is frozen. Repayment disabled. Contact admin.");
    }

    if (user.walletBalance < loan.emiAmount) {
      return res.send("❌ Insufficient wallet balance to pay EMI.");
    }

    user.walletBalance -= loan.emiAmount;

    loan.remainingBalance -= loan.emiAmount;
    loan.emisPaid += 1;

    loan.repaymentHistory.push({
      amountPaid: loan.emiAmount,
      remainingAfterPayment: loan.remainingBalance
    });

    loan.nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (loan.remainingBalance <= 0 || loan.emisPaid >= loan.tenure) {
      loan.status = "completed";
      loan.remainingBalance = 0;
    }

    await user.save();
    await loan.save();

    res.redirect("/dashboard");

  } catch (err) {
    return res.status(400).render("error", {
  status: 400,
  message: "Repayment Error",
  redirect: "/dashboard"
});
  }
});

module.exports = router;