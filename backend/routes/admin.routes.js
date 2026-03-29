import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  setApprovalRule,
  getApprovalRule,
  getAllExpenses,
  getExpenseById,
  overrideExpense,
  getCompany,
  updateCompany,
  getStats,
} from "../controllers/admin.controller.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// Company
router.get("/company", getCompany);
router.patch("/company", updateCompany);

// Stats / dashboard
router.get("/stats", getStats);

// User management
router.post("/users", createUser);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Approval rule
router.post("/approval-rule", setApprovalRule);
router.get("/approval-rule", getApprovalRule);

// Expense oversight
router.get("/expenses", getAllExpenses);
router.get("/expenses/:id", getExpenseById);
router.patch("/expenses/:id/override", overrideExpense);

export default router;
