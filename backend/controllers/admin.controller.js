import User from "../models/user.model.js";
import Expense from "../models/expense.model.js";
import ApprovalRule from "../models/approvalRule.model.js";
import Company from "../models/company.model.js";
import catchAsync from "../utils/catchAsync.js";

/* ── USER MANAGEMENT ─────────────────────────────────────────────────────── */

export const createUser = catchAsync(async (req, res) => {
  const { name, email, password, role, managerId, isManagerApprover } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }
  if (role && !["employee", "manager"].includes(role)) {
    return res.status(400).json({ message: "role must be 'employee' or 'manager'" });
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) return res.status(400).json({ message: "Email already in use" });

  if (managerId) {
    const mgr = await User.findOne({ _id: managerId, companyId: req.user.companyId });
    if (!mgr) return res.status(400).json({ message: "managerId not found in your company" });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || "employee",
    companyId: req.user.companyId,
    managerId: managerId || null,
    isManagerApprover: isManagerApprover ?? false,
  });

  res.status(201).json(user);
});

export const getUsers = catchAsync(async (req, res) => {
  const filter = { companyId: req.user.companyId };
  if (req.query.role) filter.role = req.query.role;

  const users = await User.find(filter)
    .populate("managerId", "name email role")
    .sort({ createdAt: -1 });

  res.json(users);
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, companyId: req.user.companyId })
    .populate("managerId", "name email role");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

export const updateUser = catchAsync(async (req, res) => {
  const { role, managerId, isManagerApprover, name } = req.body;

  const user = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role === "admin") {
    return res.status(400).json({ message: "Cannot modify the admin user via this endpoint" });
  }

  if (name !== undefined) user.name = name;
  if (role !== undefined) {
    if (!["employee", "manager"].includes(role)) {
      return res.status(400).json({ message: "role must be 'employee' or 'manager'" });
    }
    user.role = role;
  }
  if (managerId !== undefined) {
    if (managerId) {
      const mgr = await User.findOne({ _id: managerId, companyId: req.user.companyId });
      if (!mgr) return res.status(400).json({ message: "managerId not found in your company" });
    }
    user.managerId = managerId || null;
  }
  if (isManagerApprover !== undefined) user.isManagerApprover = isManagerApprover;

  await user.save();
  res.json(user);
});

export const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role === "admin") return res.status(400).json({ message: "Cannot delete the company admin" });

  await User.deleteOne({ _id: user._id });
  res.json({ message: "User deleted successfully" });
});

/* ── APPROVAL RULES ──────────────────────────────────────────────────────── */

export const setApprovalRule = catchAsync(async (req, res) => {
  const { approvers, sequence, ruleType, minApprovalPercent, specificApproverId, thresholdAmount } = req.body;
  const companyId = req.user.companyId;

  if (approvers?.length) {
    const found = await User.find({ _id: { $in: approvers }, companyId });
    if (found.length !== approvers.length) {
      return res.status(400).json({ message: "One or more approver IDs are invalid or not in your company" });
    }
  }
  if (specificApproverId) {
    const sp = await User.findOne({ _id: specificApproverId, companyId });
    if (!sp) return res.status(400).json({ message: "specificApproverId not found in your company" });
  }

  const data = {
    approvers: approvers || [],
    sequence: sequence !== undefined ? sequence : true,
    ruleType: ruleType || "percent",
    minApprovalPercent: minApprovalPercent ?? 100,
    specificApproverId: specificApproverId || null,
    thresholdAmount: thresholdAmount ?? 0,
  };

  let rule = await ApprovalRule.findOne({ companyId });
  if (rule) {
    Object.assign(rule, data);
    await rule.save();
  } else {
    rule = await ApprovalRule.create({ companyId, ...data });
  }

  await rule.populate("approvers", "name email role");
  await rule.populate("specificApproverId", "name email role");
  res.json(rule);
});

export const getApprovalRule = catchAsync(async (req, res) => {
  const rule = await ApprovalRule.findOne({ companyId: req.user.companyId })
    .populate("approvers", "name email role")
    .populate("specificApproverId", "name email role");
  if (!rule) return res.status(404).json({ message: "No approval rule configured" });
  res.json(rule);
});

/* ── EXPENSE OVERSIGHT ───────────────────────────────────────────────────── */

export const getAllExpenses = catchAsync(async (req, res) => {
  const { status, userId, category, from, to } = req.query;
  const filter = { companyId: req.user.companyId };
  if (status) filter.status = status;
  if (userId) filter.userId = userId;
  if (category) filter.category = category;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const expenses = await Expense.find(filter)
    .populate("userId", "name email role")
    .populate("approvals.approverId", "name email role")
    .populate("overrideBy", "name email")
    .sort({ createdAt: -1 });

  res.json(expenses);
});

export const getExpenseById = catchAsync(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, companyId: req.user.companyId })
    .populate("userId", "name email role")
    .populate("approvals.approverId", "name email role")
    .populate("overrideBy", "name email");
  if (!expense) return res.status(404).json({ message: "Expense not found" });
  res.json(expense);
});

export const overrideExpense = catchAsync(async (req, res) => {
  const { status, reason } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
  }

  const expense = await Expense.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!expense) return res.status(404).json({ message: "Expense not found" });

  expense.status = status;
  expense.overrideBy = req.user._id;
  expense.overrideReason = reason || "Admin override";
  await expense.save();

  await expense.populate("userId", "name email role");
  res.json(expense);
});

/* ── COMPANY ─────────────────────────────────────────────────────────────── */

export const getCompany = catchAsync(async (req, res) => {
  const company = await Company.findById(req.user.companyId).populate("adminId", "name email");
  if (!company) return res.status(404).json({ message: "Company not found" });
  res.json(company);
});

export const updateCompany = catchAsync(async (req, res) => {
  const { name, baseCurrency } = req.body;
  const update = {};
  if (name) update.name = name;
  if (baseCurrency) update.baseCurrency = baseCurrency.toUpperCase();

  const company = await Company.findByIdAndUpdate(req.user.companyId, update, { new: true });
  res.json(company);
});

/* ── STATS ───────────────────────────────────────────────────────────────── */

export const getStats = catchAsync(async (req, res) => {
  const companyId = req.user.companyId;
  const [statusCounts, totalUsers] = await Promise.all([
    Expense.aggregate([
      { $match: { companyId } },
      { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$amountInBaseCurrency" } } },
    ]),
    User.countDocuments({ companyId }),
  ]);

  const stats = { totalUsers, expenses: {} };
  for (const s of statusCounts) {
    stats.expenses[s._id] = { count: s.count, totalAmount: s.totalAmount ?? 0 };
  }
  res.json(stats);
});
