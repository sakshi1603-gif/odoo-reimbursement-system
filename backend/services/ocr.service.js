import axios from "axios";

/**
 * Given a base64-encoded image (or a URL), call the Anthropic vision API
 * and extract structured expense data from the receipt.
 *
 * Returns an object:
 * {
 *   amount: Number | null,
 *   currency: String | null,
 *   date: String | null,       // ISO 8601
 *   description: String | null,
 *   category: String | null,   // one of the Expense category enums
 *   vendorName: String | null,
 *   rawText: String            // full OCR text for debugging
 * }
 *
 * env vars needed:
 *   ANTHROPIC_API_KEY
 */

const CATEGORY_KEYWORDS = {
  travel: ["flight", "airline", "train", "taxi", "uber", "lyft", "fuel", "petrol", "bus", "metro", "toll", "parking"],
  meals: ["restaurant", "cafe", "coffee", "food", "lunch", "dinner", "breakfast", "swiggy", "zomato", "domino", "mcdonald", "pizza", "burger", "hotel dining"],
  accommodation: ["hotel", "airbnb", "hostel", "lodging", "motel", "inn", "resort", "stay"],
  office: ["stationery", "printer", "ink", "supplies", "laptop", "monitor", "keyboard", "mouse", "desk", "chair", "amazon", "office depot"],
  training: ["course", "training", "udemy", "coursera", "seminar", "workshop", "conference", "certification", "exam"],
};

const guessCategory = (text) => {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "other";
};

/**
 * Parse the Claude response JSON safely.
 */
const parseClaudeJson = (text) => {
  try {
    // Strip markdown fences if any
    const cleaned = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

/**
 * Main OCR function.
 * @param {string} imageBase64  - base64 encoded image data (no data-url prefix)
 * @param {string} mediaType    - e.g. "image/jpeg", "image/png"
 * @returns {Promise<Object>}
 */
export const extractReceiptData = async (imageBase64, mediaType = "image/jpeg") => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const prompt = `You are an expert OCR assistant. Analyse this receipt image and extract the following fields in valid JSON format (no markdown, no extra text, just the JSON):

{
  "amount": <number or null>,
  "currency": <3-letter ISO 4217 code or null, e.g. "USD", "INR", "EUR">,
  "date": <ISO 8601 date string or null>,
  "description": <brief description of the purchase or null>,
  "vendorName": <name of the restaurant/store/vendor or null>,
  "rawText": <full text extracted from the receipt>
}

If a field cannot be determined, set it to null. Do not include any explanation outside the JSON.`;

  const { data } = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    },
    {
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    }
  );

  const responseText = data.content?.[0]?.text || "";
  const parsed = parseClaudeJson(responseText);

  if (!parsed) {
    return { amount: null, currency: null, date: null, description: null, vendorName: null, category: "other", rawText: responseText };
  }

  // Guess category from raw text + vendor name + description
  const combinedText = [parsed.rawText, parsed.vendorName, parsed.description].filter(Boolean).join(" ");
  const category = guessCategory(combinedText);

  return {
    amount: parsed.amount ?? null,
    currency: parsed.currency ?? null,
    date: parsed.date ?? null,
    description: parsed.description ?? null,
    vendorName: parsed.vendorName ?? null,
    category,
    rawText: parsed.rawText ?? responseText,
  };
};
