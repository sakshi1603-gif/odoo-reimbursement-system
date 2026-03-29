import User from "../models/user.model.js";
import Expense from "../models/expense.model.js";
import ApprovalRule from "../models/approvalRule.model.js";
import Company from "../models/company.model.js";

// POST /api/admin/users — create employee or manager
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, managerId, isManagerApprover } =
      req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }

    const allowed = ["employee", "manager"];
    if (role && !allowed.includes(role)) {
      return res
        .status(400)
        .json({ message: "Admins can only create employees or managers" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "employee",
      companyId: req.user.companyId,
      managerId: managerId || null,
      isManagerApprover: isManagerApprover || false,
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ companyId: req.user.companyId })
      .populate("managerId", "name email role")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/admin/users/:id — update role, manager, isManagerApprover
export const updateUser = async (req, res) => {
  try {
    const { role, managerId, isManagerApprover, name } = req.body;

    const user = await User.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (managerId !== undefined) user.managerId = managerId;
    if (isManagerApprover !== undefined)
      user.isManagerApprover = isManagerApprover;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/approval-rule — create or update the company's approval rule
export const setApprovalRule = async (req, res) => {
  try {
    const {
      approvers,
      sequence,
      ruleType,
      minApprovalPercent,
      specificApproverId,
      thresholdAmount,
    } = req.body;

    const companyId = req.user.companyId;

    let rule = await ApprovalRule.findOne({ companyId });
    const data = {
      approvers: approvers || [],
      sequence: sequence !== undefined ? sequence : true,
      ruleType: ruleType || "percent",
      minApprovalPercent: minApprovalPercent ?? 100,
      specificApproverId: specificApproverId || null,
      thresholdAmount: thresholdAmount ?? 0,
    };

    if (rule) {
      Object.assign(rule, data);
      await rule.save();
    } else {
      rule = await ApprovalRule.create({ companyId, ...data });
    }

    await rule.populate("approvers", "name email role");
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/approval-rule
export const getApprovalRule = async (req, res) => {
  try {
    const rule = await ApprovalRule.findOne({
      companyId: req.user.companyId,
    }).populate("approvers", "name email role").populate("specificApproverId", "name email");
    if (!rule) return res.status(404).json({ message: "No approval rule set" });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/expenses — view all expenses for the company
export const getAllExpenses = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = { companyId: req.user.companyId };
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const expenses = await Expense.find(filter)
      .populate("userId", "name email role")
      .populate("approvals.approverId", "name email role")
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/admin/expenses/:id/override — force approve or reject
export const overrideExpense = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    expense.status = status;
    expense.overrideBy = req.user._id;
    expense.overrideReason = reason || "Admin override";
    await expense.save();

    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/company — get company info
export const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/admin/company — update company info
export const updateCompany = async (req, res) => {
  try {
    const { name, baseCurrency } = req.body;
    const company = await Company.findByIdAndUpdate(
      req.user.companyId,
      { name, baseCurrency },
      { new: true }
    );
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};