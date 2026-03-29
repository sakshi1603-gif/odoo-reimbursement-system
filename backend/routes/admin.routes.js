import express from "express";
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  setApprovalRule,
  getApprovalRule,
  getAllExpenses,
  overrideExpense,
  getCompany,
  updateCompany,
} from "../controllers/admin.controller.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, adminOnly);

// Company
router.get("/company", getCompany);
router.patch("/company", updateCompany);

// User management
router.post("/users", createUser);
router.get("/users", getUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Approval rules
router.post("/approval-rule", setApprovalRule);
router.get("/approval-rule", getApprovalRule);

// Expense oversight
router.get("/expenses", getAllExpenses);
router.patch("/expenses/:id/override", overrideExpense);

export default router;