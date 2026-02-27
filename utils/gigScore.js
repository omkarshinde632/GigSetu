exports.calculateGigScore = (totalEarnings, earningCount, walletBalance) => {

    let score = 50;

    if (totalEarnings > 20000) score += 15;
    if (earningCount > 10) score += 10;
    if (walletBalance > 5000) score += 10;
    if (totalEarnings > 50000) score += 15;

    if (score > 100) score = 100;

    return score;
};