import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: String,
    country: String,
    currency: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);