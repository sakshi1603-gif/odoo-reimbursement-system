const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: String,
  baseCurrency: String
});

module.exports = mongoose.model("Company", companySchema);
