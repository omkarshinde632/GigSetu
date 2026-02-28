const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const User = require("./models/User");

dotenv.config();

const connectDB = require("./config/db");
connectDB();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions"
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 
    }
  })
);

app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      res.locals.user = user;
    } catch (err) {
      console.log("User fetch error:", err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});


app.use("/", require("./routes/authRoutes"));
app.use("/dashboard", require("./routes/dashboardRoutes"));
app.use("/earnings", require("./routes/earningRoutes"));
app.use("/verify", require("./routes/verificationRoutes"));
app.use("/admin", require("./routes/adminRoutes"));

app.use("/loan", require("./routes/loanRoutes"));
app.use("/repayment", require("./routes/repaymentRoutes"));
app.use("/ai", require("./routes/aiRoutes"));

const { runPenaltyCheck } = require("./utils/penaltyEngine");
app.use("/expenses", require("./routes/expenseRoutes"));
app.use("/payout", require("./routes/payoutRoutes"));
app.use("/insurance", require("./routes/insuranceRoutes"));

app.use("/uploads", express.static("uploads"));


const bcrypt = require("bcryptjs");

const createAdmin = async () => {
    const adminExists = await User.findOne({ email: "admin@gigsetu.com" });

    if (!adminExists) {
        const hashedPassword = await bcrypt.hash("admin123", 10);

        await User.create({
            name: "Super Admin",
            email: "admin@gigsetu.com",
            password: hashedPassword,
            role: "admin",
            verificationStatus: "verified",
            gigScore: 100
        });

        console.log("Admin created: admin@gigsetu.com / admin123");
    }
};

createAdmin();

const LiquidityPool = require("./models/LiquidityPool");

async function initPool() {
  const existing = await LiquidityPool.findOne();
  if (!existing) {
    await LiquidityPool.create({ totalCapital: 100000 });
    console.log("Liquidity Pool Initialized");
  }
}

initPool();

const cron = require("node-cron");
const WeeklyPayoutPlan = require("./models/WeeklyPayoutPlan");

cron.schedule("0 0 * * *", async () => {
  console.log("Running daily payout release...");

  const activePlans = await WeeklyPayoutPlan.find({ status: "active" }).populate("user");

  for (let plan of activePlans) {

    if (plan.daysReleased >= 7) {
      plan.status = "completed";
      await plan.save();
      continue;
    }

    const user = plan.user;

    user.walletBalance += plan.dailyAmount;
    plan.daysReleased += 1;

    await user.save();
    await plan.save();
  }
});

const weeklyPayoutRoutes = require("./routes/weeklyPayoutRoutes");
app.use("/weekly-payout", weeklyPayoutRoutes);

setInterval(() => {
  runPenaltyCheck();
}, 60 * 1000);


const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.render("landing");
});

app.use((req, res) => {
  res.status(404).render("error", {
    status: 404,
    message: "Page not found.",
    redirect: "/dashboard"
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).render("error", {
    status: 500,
    message: "Something went wrong. Please try again.",
    redirect: "/dashboard"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});