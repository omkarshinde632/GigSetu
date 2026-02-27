const router = require("express").Router();
const razorpay = require("../utils/razorpay");
const WeeklyPayoutPlan = require("../models/WeeklyPayoutPlan");
const LiquidityPool = require("../models/LiquidityPool");
const User = require("../models/User");
const { isAuthenticated } = require("../middleware/authMiddleware");

const crypto = require("crypto");
const path = require("path");

const generateInvoice = require("../utils/invoiceGenerator");


router.post("/create-order/:planId", isAuthenticated, async (req, res) => {

  try {
    const plan = await WeeklyPayoutPlan.findById(req.params.planId);

    if (!plan) return res.status(404).send("Plan not found");

    const options = {
      amount: plan.processingFee * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: options.amount,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.log("Create Order Error:", err);
    res.status(500).send("Error creating order");
  }
});


router.post("/verify-payment", isAuthenticated, async (req, res) => {
  try {

    const sessionUser = await User.findById(req.session.userId);
    if (!sessionUser) {
      return res.status(401).send("User not found");
    }

    if (sessionUser.verificationStatus !== "verified") {
      return res.status(403).send("User not verified");
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).send("Payment verification failed");
    }

    const plan = await WeeklyPayoutPlan.findById(planId);
    if (!plan) {
      return res.status(404).send("Plan not found");
    }

    if (plan.user.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized plan access");
    }

    if (plan.status !== "pending_payment") {
      return res.status(400).send("Plan already activated");
    }

    const pool = await LiquidityPool.findOne();
    if (!pool) {
      return res.status(500).send("Liquidity pool missing");
    }

    if (pool.totalCapital < plan.weeklyAmount) {
      return res.status(400).send("Insufficient liquidity pool");
    }

    plan.status = "active";
    plan.startDate = new Date();
    plan.paymentId = razorpay_payment_id;

    pool.totalCapital -= plan.weeklyAmount;

    const invoiceData = generateInvoice(
      plan,
      sessionUser,
      razorpay_payment_id
    );

    plan.invoiceId = invoiceData.invoiceId;
    plan.invoiceFile = invoiceData.fileName;

    await plan.save();
    await pool.save();

    res.json({ success: true });

  } catch (err) {
    console.log("Verify Payment Error:", err);
    res.status(500).send("Payment verification error");
  }
});
router.get("/invoice/:planId", isAuthenticated, async (req, res) => {

  try {

    const plan = await WeeklyPayoutPlan.findById(req.params.planId);

    if (!plan || !plan.invoiceFile) {
      return res.send("Invoice not found");
    }

    const filePath = path.join(__dirname, "../invoices", plan.invoiceFile);

    res.download(filePath);

  } catch (err) {
    res.status(500).send("Error downloading invoice");
  }
});


module.exports = router;