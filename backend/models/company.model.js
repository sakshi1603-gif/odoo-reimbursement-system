import mongoose from "mongoose";
import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // ISO 4217 currency code e.g. "USD", "INR", "EUR"
    baseCurrency: { type: String, required: true, default: "USD" },
    country: { type: String, default: "" },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
