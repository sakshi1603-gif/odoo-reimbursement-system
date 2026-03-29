import mongoose from "mongoose";

const approvalEntrySchema = new mongoose.Schema(
  {
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The order in which this approver acts (0 = first)
    order: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    comment: { type: String, default: "" },
    actionAt: { type: Date, default: null },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    // Amount converted to the company's base currency
    amountInBaseCurrency: { type: Number, default: null },
    category: {
      type: String,
      enum: ["travel", "meals", "accommodation", "office", "training", "other"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    receiptUrl: { type: String, default: null },
    // OCR extracted data stored here
    ocrData: { type: Object, default: null },
    status: {
      type: String,
      enum: ["draft", "submitted", "pending_approval", "approved", "rejected"],
      default: "draft",
    },
    // Sequential approval chain for this expense
    approvals: [approvalEntrySchema],
    // Which step in the approvals array is currently active
    currentApproverIndex: { type: Number, default: 0 },
    // If admin overrides, store reason
    overrideBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    overrideReason: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);