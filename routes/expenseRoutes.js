const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const expenseController = require("../controllers/expenseController");

router.get("/", isAuthenticated, expenseController.getExpenses);
router.post("/add", isAuthenticated, expenseController.addExpense);
router.get("/export/csv", isAuthenticated, expenseController.exportCSV);

module.exports = router;