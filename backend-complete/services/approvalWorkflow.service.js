/**
 * approvalWorkflow.service.js
 *
 * Centralises all approval-flow logic so controllers stay thin.
 * Works with the existing Mongoose models without modifying their schemas.
 */

import Expense from "../models/expense.model.js";
import ApprovalRule from "../models/approvalRule.model.js";
import User from "../models/user.model.js";

/**
 * Build the initial `approvals` array when an expense is submitted.
 *
 * Logic (matches problem statement):
 * 1. If user.isManagerApprover === true AND user.managerId is set,
 *    push manager as step 0 (first in sequence).
 * 2. If amount >= thresholdAmount (or no rule), push the company approvers
 *    in their configured order.
 * 3. De-duplicate by approverId (same person should not appear twice).
 *
 * @param {Object} user       - Mongoose User doc
 * @param {number} amount     - Expense amount (in expense's own currency)
 * @param {Object|null} rule  - Mongoose ApprovalRule doc or null
 * @returns {Array}           - array of approvalEntry objects
 */
export const buildApprovalChain = (user, amount, rule) => {
  const chain = [];
  const seen = new Set();

  const push = (approverId) => {
    const id = approverId.toString();
    if (seen.has(id)) return;
    seen.add(id);
    chain.push({ approverId, order: chain.length, status: "pending", comment: "", actionAt: null });
  };

  // Step 1 — manager-first gate
  if (user.isManagerApprover && user.managerId) {
    push(user.managerId);
  }

  // Step 2 — rule-based approvers (only above threshold)
  const threshold = rule?.thresholdAmount ?? 0;
  if (rule && amount >= threshold && rule.approvers?.length) {
    rule.approvers.forEach((id) => push(id));
  }

  return chain;
};

/**
 * Evaluate whether the expense should be auto-approved after an approver acts.
 *
 * Returns:
 *   "approved"   — all conditions met, mark as approved
 *   "rejected"   — one approver rejected (always final)
 *   "next"       — move to the next sequential approver
 *   "pending"    — nothing to do yet (parallel flow, waiting for others)
 *
 * @param {Object} expense   - Mongoose Expense doc (mutable, call save() outside)
 * @param {Object} rule      - Mongoose ApprovalRule doc or null
 * @param {string} action    - "approved" | "rejected"
 * @param {string} actorId   - req.user._id.toString()
 */
export const evaluateApproval = (expense, rule, action, actorId) => {
  // Rejection is always final
  if (action === "rejected") return "rejected";

  const approvals = expense.approvals;
  const approvedCount = approvals.filter((a) => a.status === "approved").length;
  const totalCount = approvals.length;

  // --- Specific approver rule ---
  if (
    rule &&
    (rule.ruleType === "specific" || rule.ruleType === "hybrid") &&
    rule.specificApproverId &&
    rule.specificApproverId.toString() === actorId
  ) {
    return "approved";
  }

  // --- Percentage rule ---
  if (
    rule &&
    (rule.ruleType === "percent" || rule.ruleType === "hybrid") &&
    totalCount > 0
  ) {
    const pct = (approvedCount / totalCount) * 100;
    if (pct >= (rule.minApprovalPercent ?? 100)) return "approved";
  }

  // --- Sequential flow ---
  // Default (sequence: true or rule missing): must go through all approvers in order
  if (!rule || rule.sequence !== false) {
    const nextIndex = expense.currentApproverIndex + 1;
    if (nextIndex >= totalCount) {
      // Every approver approved in sequence
      return "approved";
    }
    return "next";
  }

  // Parallel flow (sequence: false) — wait until percent/specific condition met
  return "pending";
};

/**
 * Process an approve/reject action on an expense.
 * Mutates the expense doc and saves it.
 *
 * @param {string} expenseId
 * @param {string} actorId       - req.user._id
 * @param {"approved"|"rejected"} action
 * @param {string} comment
 * @returns {Object}  { expense, message }
 */
export const processAction = async (expenseId, actorId, action, comment = "") => {
  const expense = await Expense.findById(expenseId);
  if (!expense) throw Object.assign(new Error("Expense not found"), { status: 404 });

  if (!["pending_approval", "submitted"].includes(expense.status)) {
    throw Object.assign(
      new Error(`Expense is already ${expense.status}`),
      { status: 400 }
    );
  }

  const rule = await ApprovalRule.findOne({ companyId: expense.companyId });
  const isSequential = !rule || rule.sequence !== false;

  // Find the approval entry for this actor
  let entry;
  if (isSequential) {
    // In sequential mode the actor MUST be the current step
    entry = expense.approvals[expense.currentApproverIndex];
    if (!entry) throw Object.assign(new Error("No active approval step"), { status: 400 });

    if (entry.approverId.toString() !== actorId) {
      throw Object.assign(new Error("It is not your turn to approve"), { status: 403 });
    }
  } else {
    // Parallel: find any pending entry for this actor
    entry = expense.approvals.find(
      (a) => a.approverId.toString() === actorId && a.status === "pending"
    );
    if (!entry) {
      throw Object.assign(
        new Error("You are not an approver for this expense or have already acted"),
        { status: 403 }
      );
    }
  }

  // Record the action
  entry.status = action;
  entry.comment = comment;
  entry.actionAt = new Date();

  const decision = evaluateApproval(expense, rule, action, actorId);

  let message;
  if (decision === "approved") {
    expense.status = "approved";
    message = "Expense approved";
  } else if (decision === "rejected") {
    expense.status = "rejected";
    message = "Expense rejected";
  } else if (decision === "next") {
    expense.currentApproverIndex += 1;
    message = "Moved to next approver";
  } else {
    // parallel pending
    message = "Action recorded, waiting for other approvers";
  }

  await expense.save();
  return { expense, message };
};

/**
 * Return all expenses currently awaiting this user's approval.
 * Works for both sequential and parallel flows.
 *
 * @param {string} userId
 * @param {string} companyId  - only look at expenses from the same company
 */
export const getPendingForUser = async (userId, companyId) => {
  const userIdStr = userId.toString();

  // Fetch all pending_approval expenses for the company
  const expenses = await Expense.find({
    companyId,
    status: "pending_approval",
  })
    .populate("userId", "name email role")
    .populate("approvals.approverId", "name email role")
    .sort({ createdAt: -1 });

  return expenses.filter((exp) => {
    const rule_sequence = true; // default; we'll rely on currentApproverIndex for sequential
    const current = exp.approvals[exp.currentApproverIndex];

    // Sequential: only the current step matters
    if (current && current.approverId._id?.toString() === userIdStr) return true;

    // Parallel fallback: check if user has any pending entry
    return exp.approvals.some(
      (a) => a.approverId._id?.toString() === userIdStr && a.status === "pending"
    );
  });
};
