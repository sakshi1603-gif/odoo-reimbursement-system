import catchAsync from "../utils/catchAsync.js";
import { getAllCountryCurrencies, fetchRates } from "../services/currency.service.js";

export const getCurrencies = catchAsync(async (req, res) => {
  const list = await getAllCountryCurrencies();
  res.json(list);
});

export const getRates = catchAsync(async (req, res) => {
  const base = req.params.base?.toUpperCase();
  if (!base) return res.status(400).json({ message: "base currency is required" });
  const rates = await fetchRates(base);
  res.json({ base, rates });
});
