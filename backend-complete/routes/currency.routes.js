import express from "express";
import { getCurrencies, getRates } from "../controllers/currency.controller.js";

const router = express.Router();

// Public — no auth needed for currency lookups
router.get("/", getCurrencies);
router.get("/rates/:base", getRates);

export default router;
