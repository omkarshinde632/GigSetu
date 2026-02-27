const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const User = require("../models/User");

router.get("/link", isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render("linkPayout", { user });
});

router.post("/link", isAuthenticated, async (req, res) => {
  const { upiId, accountNumber, ifsc, bankName } = req.body;

  const user = await User.findById(req.session.userId);

  if (upiId) {
    user.upiId = upiId;
  } else if (accountNumber && ifsc && bankName) {
    user.bankDetails = { accountNumber, ifsc, bankName };
  }

  user.isPayoutLinked = true;
  await user.save();

  res.redirect("/dashboard");
});

module.exports = router;