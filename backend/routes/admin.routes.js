const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const { isAdmin } = require("../middleware/auth.middleware");

// USER MANAGEMENT
router.post("/users", isAdmin, adminController.createUser);
router.get("/users", isAdmin, adminController.getUsers);
router.patch("/users/:id", isAdmin, adminController.updateUser);

// APPROVAL RULE
router.post("/approval-rule", isAdmin, adminController.setApprovalRule);
router.get("/approval-rule/:companyId", isAdmin, adminController.getApprovalRule);

// EXPENSES
router.get("/expenses", isAdmin, adminController.getAllExpenses);
router.patch("/expenses/:id/override", isAdmin, adminController.overrideExpense);

module.exports = router;