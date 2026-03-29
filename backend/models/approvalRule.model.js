const mongoose = require("mongoose");

const approvalRuleSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },
  approvers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  minApprovalPercent: Number,
  sequence: Boolean
});

module.exports = mongoose.model("ApprovalRule", approvalRuleSchema);