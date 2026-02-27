const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/User");
const Loan = require("../models/Loan");
const Expense = require("../models/Expense");
const Earning = require("../models/Earnings");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.askAI = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { question } = req.body;

    const user = await User.findById(userId);
    const loans = await Loan.find({ user: userId });
    const expenses = await Expense.find({ user: userId });
    const earnings = await Earning.find({ user: userId });

    const totalEarnings = earnings.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const activeLoan = loans.find(l => l.status === "active");

    const context = `
User Info:
Name: ${user.name}
Gig Score: ${user.gigScore}
Verification: ${user.verificationStatus}
Wallet Balance: ${user.walletBalance}

Total Earnings: ${totalEarnings}
Total Expenses: ${totalExpenses}

Active Loan: ${activeLoan ? `₹${activeLoan.amount} remaining ₹${activeLoan.remainingBalance}` : "No active loan"}

User Question: ${question}

Give a helpful, short fintech-style answer.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(context);
    const response = result.response.text();

    res.json({ reply: response });

  } catch (err) {
    console.log("AI Error:", err);
    res.json({ reply: "AI service is currently unavailable." });
  }
};