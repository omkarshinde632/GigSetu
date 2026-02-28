const router = require("express").Router();
const upload = require("../middleware/uploadMiddleware");
const { isAuthenticated } = require("../middleware/authMiddleware");
const User = require("../models/User");

router.get("/", isAuthenticated, (req, res) => {
    res.render("verify");
});

router.post(
  "/",
  isAuthenticated,
  upload.single("document"),
  async (req, res) => {
    try {
      const userId = req.session.userId;

      const user = await User.findById(userId);

      if (!user) {
        return res.redirect("/login");
      }

      user.platform = req.body.platform;
      user.documents = req.file ? req.file.filename : null;
      user.verificationStatus = "pending";

      await user.save();

      res.redirect("/dashboard");

    } catch (error) {
      return res.status(500).render("error", {
  status: 500,
  message: "Verification Upload Error",
  redirect: "/dashboard"
});
    }
  }
);

module.exports = router;