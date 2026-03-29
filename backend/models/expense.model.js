const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema({
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  comment: String,
  time: Date
});

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },
  amount: Number,
  currency: String,
  description: String,
  category: String,
  status: {
    type: String,
    enum: ["draft", "submitted", "approved", "rejected"],
    default: "draft"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  approvals: [approvalSchema]
});

module.exports = mongoose.model("Expense", expenseSchema);