const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const User = require("../models/User");
const InsuranceClaim = require("../models/InsuranceClaim");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/insurance/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const myClaims = await InsuranceClaim.find({ user: user._id }).sort({ createdAt: -1 });

    res.render("insurance", { user, myClaims });
  } catch (err) {
    console.log("Insurance Page Error:", err);
    res.redirect("/dashboard");
  }
});

router.post("/enroll", isAuthenticated, async (req, res) => {
  try {
    const { policyType } = req.body;
    const user = await User.findById(req.session.userId);

    user.insurance = {
      enrolled: true,
      policyType,
      policyId: "POL" + Date.now(),
      enrolledAt: new Date()
    };

    await user.save();
    res.redirect("/insurance");
  } catch (err) {
    console.log("Insurance Enroll Error:", err);
    res.redirect("/insurance");
  }
});

router.post("/claim", isAuthenticated, upload.single("document"), async (req, res) => {

  try {

    const user = await User.findById(req.session.userId);

    if (!user.insurance?.enrolled) {
      return res.send("Not enrolled in insurance.");
    }

    if (!req.file) {
      return res.send("Hospital document required.");
    }

    const { reason, requestedAmount } = req.body;

    if (!requestedAmount || requestedAmount <= 0) {
      return res.send("Invalid requested amount.");
    }

    await InsuranceClaim.create({
      user: user._id,
      policyType: user.insurance.policyType,
      reason,
      requestedAmount,
      document: req.file.filename,
      status: "pending_review"
    });

    res.redirect("/insurance");

  } catch (err) {
    console.log("Claim Error:", err);
    res.redirect("/insurance");
  }
});


router.get("/admin/claims", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const claims = await InsuranceClaim.find()
      .populate("user")
      .sort({ createdAt: -1 });

    res.render("adminClaims", { claims });
  } catch (err) {
    console.log("Admin Claims Error:", err);
    res.redirect("/admin/dashboard");
  }
});

router.post("/admin/claims/approve/:id", isAuthenticated, isAdmin, async (req, res) => {

  try {

    const claim = await InsuranceClaim.findById(req.params.id).populate("user");

    if (!claim) {
      return res.redirect("/insurance/admin/claims");
    }

    if (claim.status !== "pending_review") {
      return res.redirect("/insurance/admin/claims");
    }

    const payoutAmount = Number(req.body.payoutAmount);

    if (!payoutAmount || payoutAmount <= 0) {
      return res.send("Invalid payout amount");
    }

    claim.status = "approved";
    claim.payoutAmount = payoutAmount;

    const user = claim.user;
    user.walletBalance += payoutAmount;

    await user.save();
    await claim.save();

    console.log("Wallet credited:", user.walletBalance);

    res.redirect("/insurance/admin/claims");

  } catch (err) {
    console.log("Insurance Approval Error:", err);
    res.redirect("/insurance/admin/claims");
  }
});

router.post("/admin/claims/reject/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const claim = await InsuranceClaim.findById(req.params.id);
    if (!claim) return res.redirect("/insurance/admin/claims");

    claim.status = "rejected";
    await claim.save();

    res.redirect("/insurance/admin/claims");
  } catch (err) {
    console.log("Reject Claim Error:", err);
    res.redirect("/insurance/admin/claims");
  }
});



module.exports = router;