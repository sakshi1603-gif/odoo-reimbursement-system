import Expense from "../models/expense.model.js";
import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import catchAsync from "../utils/catchAsync.js";
import { buildApprovalChain, processAction, getPendingForUser } from "../services/approvalWorkflow.service.js";
import { convertCurrency } from "../services/currency.service.js";
import { extractReceiptData } from "../services/ocr.service.js";
import ApprovalRule from "../models/approvalRule.model.js";

export const createExpense = catchAsync(async (req, res) => {
  const { amount, currency, category, description, date, receiptUrl } = req.body;

  if (!amount || !currency || !category || !description || !date) {
    return res.status(400).json({ message: "amount, currency, category, description and date are required" });
  }

  const user = await User.findById(req.user._id);
  const company = await Company.findById(user.companyId);
  const rule = await ApprovalRule.findOne({ companyId: user.companyId });

  let amountInBaseCurrency = null;
  try {
    amountInBaseCurrency = await convertCurrency(amount, currency, company.baseCurrency);
  } catch {
    amountInBaseCurrency = null;
  }

  const effectiveAmount = amountInBaseCurrency ?? amount;
  const approvals = buildApprovalChain(user, effectiveAmount, rule);
  const initialStatus = approvals.length === 0 ? "approved" : "pending_approval";

  const expense = await Expense.create({
    userId: user._id,
    companyId: user.companyId,
    amount,
    currency: currency.toUpperCase(),
    amountInBaseCurrency,
    category,
    description,
    date,
    receiptUrl: receiptUrl || null,
    status: initialStatus,
    approvals,
    currentApproverIndex: 0,
  });

  await expense.populate("userId", "name email role");
  res.status(201).json(expense);
});

export const scanReceipt = catchAsync(async (req, res) => {
  const { imageBase64, mediaType } = req.body;
  if (!imageBase64) return res.status(400).json({ message: "imageBase64 is required" });

  const extracted = await extractReceiptData(imageBase64, mediaType || "image/jpeg");
  res.json(extracted);
});

export const getMyExpenses = catchAsync(async (req, res) => {
  const { status, category, from, to } = req.query;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const expenses = await Expense.find(filter)
    .populate("approvals.approverId", "name email role")
    .sort({ createdAt: -1 });

  res.json(expenses);
});

export const getExpenseById = catchAsync(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === "employee") {
    filter.userId = req.user._id;
  } else {
    filter.companyId = req.user.companyId;
  }

  const expense = await Expense.findOne(filter)
    .populate("userId", "name email role")
    .populate("approvals.approverId", "name email role")
    .populate("overrideBy", "name email");

  if (!expense) return res.status(404).json({ message: "Expense not found" });
  res.json(expense);
});

export const takeAction = catchAsync(async (req, res) => {
  const { action, comment } = req.body;
  if (!["approved", "rejected"].includes(action)) {
    return res.status(400).json({ message: "action must be 'approved' or 'rejected'" });
  }

  const { expense, message } = await processAction(
    req.params.id,
    req.user._id.toString(),
    action,
    comment || ""
  );

  await expense.populate("userId", "name email role");
  await expense.populate("approvals.approverId", "name email role");
  res.json({ message, expense });
});

export const getPendingApprovals = catchAsync(async (req, res) => {
  const expenses = await getPendingForUser(req.user._id, req.user.companyId);
  res.json(expenses);
});

export const getTeamExpenses = catchAsync(async (req, res) => {
  let subordinateIds = [];
  if (req.user.role === "manager") {
    const subs = await User.find({ managerId: req.user._id, companyId: req.user.companyId }).select("_id");
    subordinateIds = subs.map((u) => u._id);
  } else {
    const all = await User.find({ companyId: req.user.companyId }).select("_id");
    subordinateIds = all.map((u) => u._id);
  }

  const filter = { userId: { $in: subordinateIds }, companyId: req.user.companyId };
  if (req.query.status) filter.status = req.query.status;

  const expenses = await Expense.find(filter)
    .populate("userId", "name email role")
    .populate("approvals.approverId", "name email role")
    .sort({ createdAt: -1 });

  res.json(expenses);
});

export const previewConversion = catchAsync(async (req, res) => {
  const { amount, from, to } = req.query;
  if (!amount || !from || !to) {
    return res.status(400).json({ message: "amount, from and to are required query params" });
  }
  const converted = await convertCurrency(parseFloat(amount), from, to);
  res.json({ amount: parseFloat(amount), from: from.toUpperCase(), to: to.toUpperCase(), converted });
});
