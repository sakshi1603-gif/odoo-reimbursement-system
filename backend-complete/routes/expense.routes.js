import express from "express";
import {
  createExpense,
  scanReceipt,
  getMyExpenses,
  getExpenseById,
  takeAction,
  getPendingApprovals,
  getTeamExpenses,
  previewConversion,
} from "../controllers/expense.controller.js";
import { protect, managerOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);
router.get("/pending-test", (req, res) => {
  res.json({ message: "PUBLIC ROUTE WORKING" });
});
// ── Static paths MUST come before /:id ──────────────────────────────────────

// Currency conversion preview
router.get("/convert", previewConversion);

// OCR receipt scan
router.post("/ocr", scanReceipt);

// Employee: own expenses
router.post("/", createExpense);
router.get("/my", getMyExpenses);

// Manager / Admin only — must be before /:id
router.get("/pending", managerOrAdmin, getPendingApprovals);
router.get("/team", managerOrAdmin, getTeamExpenses);

// ── Dynamic param routes ─────────────────────────────────────────────────────
router.get("/:id", getExpenseById);
router.post("/:id/action", takeAction);



export default router;
