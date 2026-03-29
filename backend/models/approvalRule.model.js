import mongoose from "mongoose";

const approvalRuleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
    },
    // Ordered list of approver user IDs (defines the sequence)
    approvers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Whether approvals run in sequence (true) or can be parallel (false)
    sequence: { type: Boolean, default: true },
    // Rule type: "percent" | "specific" | "hybrid"
    ruleType: {
      type: String,
      enum: ["percent", "specific", "hybrid"],
      default: "percent",
    },
    // Percentage of approvers required for "percent" and "hybrid" types
    // e.g. 60 means 60% of approvers must approve
    minApprovalPercent: { type: Number, default: 100 },
    // Specific approver whose approval alone can resolve the expense ("specific" / "hybrid")
    specificApproverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Minimum expense amount that triggers multi-level approval
    // Below this threshold only manager approval is needed (if isManagerApprover is set)
    thresholdAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("ApprovalRule", approvalRuleSchema);