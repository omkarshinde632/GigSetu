const Loan = require("../models/Loan");
const User = require("../models/User");

exports.runPenaltyCheck = async () => {
  const today = new Date();

  const overdueLoans = await Loan.find({
    status: "active",
    nextDueDate: { $lt: today }
  }).populate("user");

  for (let loan of overdueLoans) {

    if (!loan.latePenaltyApplied) {

      const penalty = Math.round(loan.emiAmount * 0.02);

      loan.penaltyAmount += penalty;
      loan.remainingBalance += penalty;
      loan.latePenaltyApplied = true;

      loan.user.gigScore = Math.max(0, loan.user.gigScore - 10);

      const overdueDays =
        (today - loan.nextDueDate) / (1000 * 60 * 60 * 24);

      if (overdueDays > 60) {
        loan.status = "defaulted";
      }

      await loan.user.save();
      await loan.save();
    }
  }

  console.log("✅ Penalty engine executed");
};