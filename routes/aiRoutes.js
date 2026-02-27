const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");

router.post("/ask", isAuthenticated, aiController.askAI);

module.exports = router;