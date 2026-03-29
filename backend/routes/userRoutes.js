import express from "express";
import { createUser, getUsers } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, adminOnly, createUser);
router.get("/", protect, adminOnly, getUsers);

export default router;