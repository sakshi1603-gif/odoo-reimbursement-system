import Expense from "../models/expense.model.js";
import ApprovalRule from "../models/approvalRule.model.js";
import User from "../models/user.model.js";

// CREATE EXPENSE
export const createExpense = async (req, res) => {
  try {
    const { amount, currency, category, description, date } = req.body;

    const user = await User.findById(req.user._id);

    const rule = await ApprovalRule.findOne({
      companyId: user.companyId,
    });

    let approvals = [];

    // Manager first
    if (user.isManagerApprover && user.managerId) {
      approvals.push({
        approverId: user.managerId,
        order: 0,
      });
    }

    // Threshold logic
    if (amount >= (rule?.thresholdAmount || 0)) {
      rule?.approvers.forEach((approverId) => {
        approvals.push({
          approverId,
          order: approvals.length,
        });
      });
    }

    const expense = await Expense.create({
      userId: user._id,
      companyId: user.companyId,
      amount,
      currency,
      category,
      description,
      date,
      status: "pending_approval",
      approvals,
      currentApproverIndex: 0,
    });

    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// APPROVE / REJECT
export const takeAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    const expense = await Expense.findById(id);

    const current = expense.approvals[expense.currentApproverIndex];

    if (!current) return res.status(400).json({ message: "No active step" });

    if (current.approverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your turn" });
    }

    current.status = action;
    current.comment = comment;
    current.actionAt = new Date();

    if (action === "rejected") {
      expense.status = "rejected";
      await expense.save();
      return res.json({ message: "Rejected" });
    }

    const rule = await ApprovalRule.findOne({
      companyId: expense.companyId,
    });

    // Specific approver
    if (
      rule?.specificApproverId &&
      rule.specificApproverId.toString() === req.user._id.toString()
    ) {
      expense.status = "approved";
      await expense.save();
      return res.json({ message: "Approved by specific approver" });
    }

    // Percentage
    const approvedCount = expense.approvals.filter(
      (a) => a.status === "approved"
    ).length;

    const percent =
      (approvedCount / expense.approvals.length) * 100;

    if (
      (rule?.ruleType === "percent" || rule?.ruleType === "hybrid") &&
      percent >= (rule?.minApprovalPercent || 100)
    ) {
      expense.status = "approved";
      await expense.save();
      return res.json({ message: "Approved by percentage" });
    }

    // Sequential
    if (rule?.sequence !== false) {
      expense.currentApproverIndex++;

      if (expense.currentApproverIndex >= expense.approvals.length) {
        expense.status = "approved";
        await expense.save();
        return res.json({ message: "Fully approved" });
      }
    }

    await expense.save();

    res.json({ message: "Moved to next approver" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// MY EXPENSES
export const getMyExpenses = async (req, res) => {
  const expenses = await Expense.find({
    userId: req.user._id,
  }).sort({ createdAt: -1 });

  res.json(expenses);
};

// PENDING APPROVALS
export const getPendingApprovals = async (req, res) => {
  const expenses = await Expense.find({
    status: "pending_approval",
  });

  const filtered = expenses.filter((exp) => {
    const current = exp.approvals[exp.currentApproverIndex];

    return (
      current &&
      current.approverId.toString() === req.user._id.toString()
    );
  });

  res.json(filtered);
};