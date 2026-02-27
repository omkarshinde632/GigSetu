const router = require("express").Router();
const razorpay = require("../utils/razorpay");
const WeeklyPayoutPlan = require("../models/WeeklyPayoutPlan");
const { isAuthenticated } = require("../middleware/authMiddleware");

// Create Razorpay Order
router.post("/create-order/:planId", isAuthenticated, async (req, res) => {

  const plan = await WeeklyPayoutPlan.findById(req.params.planId);

  if (!plan) return res.status(404).send("Plan not found");

  const options = {
    amount: plan.processingFee * 100, // in paise
    currency: "INR",
    receipt: "receipt_" + Date.now()
  };

  const order = await razorpay.orders.create(options);

  res.json({
    orderId: order.id,
    amount: options.amount,
    key: process.env.RAZORPAY_KEY_ID
  });
});

const crypto = require("crypto");
const LiquidityPool = require("../models/LiquidityPool");

router.post("/verify-payment", isAuthenticated, async (req, res) => {

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).send("Payment verification failed");
  }

  const plan = await WeeklyPayoutPlan.findById(planId);
  const pool = await LiquidityPool.findOne();

  // Check liquidity
  if (pool.totalCapital < plan.weeklyAmount) {
    return res.send("Insufficient liquidity pool");
  }

  plan.status = "active";
  plan.startDate = new Date();

  pool.totalCapital -= plan.weeklyAmount;

  await plan.save();
  await pool.save();

  res.json({ success: true });
});

module.exports = router;