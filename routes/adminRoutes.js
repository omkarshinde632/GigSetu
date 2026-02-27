const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");

const User = require("../models/User");
const Earning = require("../models/Earnings");
const Loan = require("../models/Loan");
const LiquidityPool = require("../models/LiquidityPool");


// ================= ADMIN DASHBOARD =================
router.get("/dashboard", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "worker" });

    const verifiedUsers = await User.countDocuments({
      role: "worker",
      verificationStatus: "verified"
    });

    const pendingUsers = await User.countDocuments({
      verificationStatus: "pending"
    });

    const earnings = await Earning.find();
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

    const users = await User.find();
    const totalWalletFunds = users.reduce((sum, u) => sum + u.walletBalance, 0);

    // Liquidity pool safely inside route
    const pool = await LiquidityPool.findOne();
    const liquidity = pool ? pool.totalCapital : 0;

    res.render("adminDashboard", {
      totalUsers,
      verifiedUsers,
      pendingUsers,
      totalEarnings,
      totalWalletFunds,
      liquidity
    });

  } catch (err) {
    console.log("Admin Dashboard Error:", err);
    res.redirect("/admin");
  }
});


// ================= VERIFICATIONS =================
router.get("/verifications", isAuthenticated, isAdmin, async (req, res) => {
  const pendingUsers = await User.find({ verificationStatus: "pending" });
  res.render("adminVerifications", { pendingUsers });
});

router.post("/approve/:id", isAuthenticated, isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) return res.redirect("/admin/verifications");

  if (!user.autoEligible) {
    return res.send("❌ User is not eligible for verification.");
  }

  user.verificationStatus = "verified";
  await user.save();

  res.redirect("/admin/verifications");
});

router.post("/reject/:id", isAuthenticated, isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.verificationStatus = "unverified";
    await user.save();
  }

  res.redirect("/admin/verifications");
});


// ================= USER MANAGEMENT =================
router.get("/users", isAuthenticated, isAdmin, async (req, res) => {
  const users = await User.find({ role: "worker" });
  res.render("adminUsers", { users });
});

router.get("/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.redirect("/admin/users");

    const userLoans = await Loan.find({ user: user._id });

    const activeLoansCount = userLoans.filter(l => l.status === "active").length;

    const totalEmis = userLoans.reduce((sum, l) => sum + (l.tenure || 0), 0);
    const paidEmis = userLoans.reduce((sum, l) => sum + (l.emisPaid || 0), 0);

    const repaymentRate =
      totalEmis > 0
        ? ((paidEmis / totalEmis) * 100).toFixed(1)
        : "100";

    res.render("adminUserProfile", {
      user,
      activeLoansCount,
      repaymentRate
    });

  } catch (err) {
    res.redirect("/admin/users");
  }
});


// ================= FRAUD MONITORING =================
router.get("/fraud", isAuthenticated, isAdmin, async (req, res) => {
  const users = await User.find({ gigScore: { $lt: 60 } });
  res.render("adminFraud", { users });
});


// ================= LOAN MANAGEMENT =================
router.get("/loans", isAuthenticated, isAdmin, async (req, res) => {
  const loans = await Loan.find({ status: "pending" }).populate("user");
  res.render("adminLoans", { loans });
});

router.post("/loans/approve/:id", isAuthenticated, isAdmin, async (req, res) => {
  const loan = await Loan.findById(req.params.id).populate("user");

  if (!loan) return res.redirect("/admin/loans");
  if (loan.status !== "pending") return res.redirect("/admin/loans");

  if (loan.riskTier === "HIGH") {
    const overrideReason = req.body.overrideReason;
    if (!overrideReason) {
      return res.send("❌ High Risk Loan. Provide override reason.");
    }

    loan.adminOverride = true;
    loan.overrideReason = overrideReason;
  }

  loan.status = "active";
  loan.nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  loan.remainingBalance = loan.totalPayable;
  loan.emisPaid = 0;
  loan.latePenaltyApplied = false;
  loan.penaltyAmount = 0;

  const user = loan.user;
  user.walletBalance += loan.amount;

  await user.save();
  await loan.save();

  res.redirect("/admin/loans");
});

router.post("/loans/reject/:id", isAuthenticated, isAdmin, async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (loan) {
    loan.status = "rejected";
    await loan.save();
  }
  res.redirect("/admin/loans");
});


// ================= RISK PANEL =================
router.get("/risk", isAuthenticated, isAdmin, async (req, res) => {
  const today = new Date();

  const activeLoans = await Loan.find({ status: "active" }).populate("user");
  const defaultedLoans = await Loan.find({ status: "defaulted" }).populate("user");

  const overdueLoans = activeLoans.filter(
    loan => loan.nextDueDate && loan.nextDueDate < today
  );

  const highRiskLoans = activeLoans.filter(
    loan => loan.riskTier === "HIGH"
  );

  const totalOutstanding = activeLoans.reduce(
    (sum, loan) => sum + loan.remainingBalance,
    0
  );

  res.render("adminRisk", {
    activeCount: activeLoans.length,
    overdueCount: overdueLoans.length,
    defaultedCount: defaultedLoans.length,
    highRiskCount: highRiskLoans.length,
    totalOutstanding,
    overdueLoans,
    defaultedLoans
  });
});


// ================= FREEZE / UNFREEZE =================
router.post("/freeze/:userId", isAuthenticated, isAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (user) {
    user.accountFrozen = true;
    await user.save();
  }
  res.redirect("/admin/risk");
});

router.post("/unfreeze/:userId", isAuthenticated, isAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (user) {
    user.accountFrozen = false;
    await user.save();
  }
  res.redirect("/admin/risk");
});


module.exports = router;