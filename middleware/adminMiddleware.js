const User = require("../models/User");
exports.isAdmin = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    console.log("No session userId");
    return res.redirect("/login");
  }

  const user = await User.findById(req.session.userId);

  console.log("Logged in user:", user.email);
  console.log("Role:", user.role);

  if (!user || user.role !== "admin") {
    console.log("Access denied");
    return res.send("Access Denied");
  }

  next();
};