import axios from "axios";

const EXCHANGE_API_BASE = "https://api.exchangerate-api.com/v4/latest";

// Simple in-memory cache: { baseCurrency: { rates: {...}, fetchedAt: Date } }
const rateCache = {};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange rates for a given base currency.
 * Returns { rates } or throws.
 */
export const fetchRates = async (baseCurrency) => {
  const ccy = baseCurrency.toUpperCase();
  const cached = rateCache[ccy];

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rates;
  }

  const { data } = await axios.get(`${EXCHANGE_API_BASE}/${ccy}`);
  rateCache[ccy] = { rates: data.rates, fetchedAt: Date.now() };
  return data.rates;
};

/**
 * Convert `amount` from `fromCurrency` to `toCurrency`.
 * Returns the converted amount (Number), rounded to 4 decimal places.
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) return amount;

  // Fetch rates relative to fromCurrency
  const rates = await fetchRates(from);

  if (!rates[to]) {
    throw new Error(`Unsupported currency pair: ${from} → ${to}`);
  }

  return parseFloat((amount * rates[to]).toFixed(4));
};

/**
 * GET /api/currencies  →  list all countries with their currencies
 * Fetches from restcountries and returns [{country, currency, code, symbol}]
 */
export const getAllCountryCurrencies = async () => {
  const { data } = await axios.get(
    "https://restcountries.com/v3.1/all?fields=name,currencies"
  );

  const result = [];
  for (const c of data) {
    if (!c.currencies) continue;
    for (const [code, info] of Object.entries(c.currencies)) {
      result.push({
        country: c.name.common,
        currencyCode: code,
        currencyName: info.name,
        symbol: info.symbol || code,
      });
    }
  }

  return result.sort((a, b) => a.country.localeCompare(b.country));
};
