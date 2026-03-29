const User = require("../models/user.model");
const Expense = require("../models/expense.model");
const ApprovalRule = require("../models/approvalRule.model");


// 👉 Create User
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, managerId, companyId } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role,
      managerId,
      companyId
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 👉 Get All Users
exports.getUsers = async (req, res) => {
  const users = await User.find().populate("managerId");
  res.json(users);
};


// 👉 Update User
exports.updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });
  res.json(user);
};


// 👉 Create / Update Approval Rule
exports.setApprovalRule = async (req, res) => {
  const { companyId, approvers, minApprovalPercent, sequence } = req.body;

  let rule = await ApprovalRule.findOne({ companyId });

  if (rule) {
    rule = await ApprovalRule.findByIdAndUpdate(
      rule._id,
      { approvers, minApprovalPercent, sequence },
      { new: true }
    );
  } else {
    rule = await ApprovalRule.create({
      companyId,
      approvers,
      minApprovalPercent,
      sequence
    });
  }

  res.json(rule);
};


// 👉 Get Approval Rule
exports.getApprovalRule = async (req, res) => {
  const rule = await ApprovalRule.findOne({ companyId: req.params.companyId });
  res.json(rule);
};


// 👉 Get All Expenses
exports.getAllExpenses = async (req, res) => {
  const expenses = await Expense.find()
    .populate("userId")
    .populate("companyId");

  res.json(expenses);
};


// 👉 Override Expense (Force approve/reject)
exports.overrideExpense = async (req, res) => {
  const { status } = req.body;

  const expense = await Expense.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(expense);
};