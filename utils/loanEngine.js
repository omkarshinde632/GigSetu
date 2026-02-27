const calculateLoanEligibility = (user, earnings) => {
  if (!earnings || earnings.length === 0) {
    return {
      eligible: false,
      reason: "No earnings history available."
    };
  }

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

  const activeMonths = Math.max(
    1,
    new Set(
      earnings.map(e =>
        new Date(e.createdAt).getMonth()
      )
    ).size
  );

  const avgMonthlyEarning = totalEarnings / activeMonths;

  const gigScore = user.gigScore;

  let riskTier;
  let interestRate;

  if (gigScore > 80) {
    riskTier = "LOW";
    interestRate = 0.08;
  } else if (gigScore >= 65) {
    riskTier = "MEDIUM";
    interestRate = 0.12;
  } else {
    riskTier = "HIGH";
    interestRate = 0.18;
  }

  const loanLimit =
    avgMonthlyEarning * 2 * (gigScore / 100);

  if (loanLimit < 2000) {
    return {
      eligible: false,
      reason: "Income too low for loan eligibility."
    };
  }

  const recommendedTenure = 6;

  return {
    eligible: true,
    avgMonthlyEarning: Math.round(avgMonthlyEarning),
    loanLimit: Math.round(loanLimit),
    riskTier,
    interestRate,
    recommendedTenure
  };
};

const calculateEMI = (amount, tenure, interestRate) => {
  const totalPayable = amount + amount * interestRate;
  const emi = totalPayable / tenure;

  return {
    totalPayable: Math.round(totalPayable),
    emiAmount: Math.round(emi)
  };
};

module.exports = {
  calculateLoanEligibility,
  calculateEMI
};