import "./env.js";

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/admin.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import currencyRoutes from "./routes/currency.routes.js";

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/currencies", currencyRoutes);

app.get("/", (req, res) => res.json({ status: "ok", message: "Reimbursement API running" }));

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Express 5: error handler must have exactly 4 args AND be the last middleware
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
