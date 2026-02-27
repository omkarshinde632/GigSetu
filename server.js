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

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.render("landing");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});