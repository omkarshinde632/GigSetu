const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");

const Loan = require("../models/Loan");
const User = require("../models/User");
const Expense = require("../models/Expense");
const Earning = require("../models/Earnings");
const WeeklyPayoutPlan = require("../models/WeeklyPayoutPlan");

const TAX_RATE = 0.05;
const DEDUCTIBLE_CATEGORIES = ["fuel", "repair", "rent", "mobile"];

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/login");

    const loans = await Loan.find({ user: user._id }).sort({ createdAt: -1 });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const expenses = await Expense.find({
      user: user._id,
      date: { $gte: startOfMonth }
    });

    const monthlyExpenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    let categoryMap = {};
    expenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    let topCategory = "N/A";
    let maxSpend = 0;

    for (let cat in categoryMap) {
      if (categoryMap[cat] > maxSpend) {
        maxSpend = categoryMap[cat];
        topCategory = cat;
      }
    }

    const potentialSavings = Math.round(maxSpend * 0.1);

    const expenseBreakdown = Object.keys(categoryMap).map(cat => ({
      category: cat,
      amount: categoryMap[cat]
    }));

    const earnings = await Earning.find({
      user: user._id,
      date: { $gte: startOfMonth }
    });

    const monthlyIncome = earnings.reduce((sum, e) => sum + e.amount, 0);

    const deductibleTotal = expenses
      .filter(e => DEDUCTIBLE_CATEGORIES.includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0);

    const taxableIncome = Math.max(0, monthlyIncome - deductibleTotal);
    const estimatedTax = Math.round(taxableIncome * TAX_RATE);

    const payoutPlans = await WeeklyPayoutPlan.find({
      user: user._id
    }).sort({ createdAt: -1 });

    res.render("dashboard", {
      user,
      loans,
      monthlyExpenseTotal,
      topCategory,
      potentialSavings,
      expenseBreakdown,
      monthlyIncome,
      deductibleTotal,
      taxableIncome,
      estimatedTax,
      payoutPlans 
    });

  } catch (err) {
    return res.status(403).render("error", {
  status: 403,
  message: "Login Required",
  redirect: "/login"
});
  }
});

module.exports = router;