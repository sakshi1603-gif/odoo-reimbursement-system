import express from "express";
import {
  createExpense,
  takeAction,
  getMyExpenses,
  getPendingApprovals,
} from "../controllers/expense.controller.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createExpense);
router.get("/my", protect, getMyExpenses);
router.get("/pending", protect, getPendingApprovals);
router.post("/:id/action", protect, takeAction);

export default router;