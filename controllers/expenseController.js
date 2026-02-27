const Expense = require("../models/Expense");
const Earning = require("../models/Earnings");

const TAX_RATE = 0.05;

const DEDUCTIBLE_CATEGORIES = ["fuel", "repair", "rent", "mobile"];

exports.getExpenses = async (req, res) => {
  try {
    const userId = req.session.userId;

    const expenses = await Expense.find({ user: userId }).sort({ date: -1 });

    const monthlyExpenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);


    const deductibleTotal = expenses
      .filter(e => DEDUCTIBLE_CATEGORIES.includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0);

    const earnings = await Earning.find({ user: userId });
    const monthlyIncome = earnings.reduce((sum, e) => sum + e.amount, 0);

    const taxableIncome = Math.max(0, monthlyIncome - deductibleTotal);
    const estimatedTax = Math.round(taxableIncome * TAX_RATE);

    const taxReminderMessage =
      estimatedTax > 0
        ? `Set aside ₹${estimatedTax} this month for taxes to avoid year-end burden.`
        : "No tax due estimated this month.";

    res.render("expenses", {
      expenses,
      monthlyExpenseTotal,
      deductibleTotal,
      monthlyIncome,
      taxableIncome,
      estimatedTax,
      taxReminderMessage
    });

  } catch (err) {
    console.log("Expense Controller Error:", err);
    res.redirect("/dashboard");
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { category, amount, note } = req.body;

    await Expense.create({
      user: req.session.userId,
      category,
      amount: Number(amount),
      note
    });

    res.redirect("/expenses");
  } catch (err) {
    console.log("Add Expense Error:", err);
    res.redirect("/expenses");
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const userId = req.session.userId;
    const expenses = await Expense.find({ user: userId }).sort({ date: -1 });

    let csv = "Date,Category,Amount,Note\n";

    expenses.forEach(e => {
      csv += `${new Date(e.date).toISOString()},${e.category},${e.amount},"${e.note || ""}"\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("gigsetu-expenses.csv");
    res.send(csv);

  } catch (err) {
    console.log("Export CSV Error:", err);
    res.redirect("/expenses");
  }
};