const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const earningController = require("../controllers/earningController");

router.post("/add", isAuthenticated, earningController.addEarning);

module.exports = router;