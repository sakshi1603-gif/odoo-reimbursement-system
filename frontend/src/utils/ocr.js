import Tesseract from 'tesseract.js';

export async function scanReceipt(imageFile, onProgress) {
  const { data: { text } } = await Tesseract.recognize(imageFile, 'eng', {
    logger: m => { if (onProgress && m.status === 'recognizing text') onProgress(m.progress) }
  });

  const amount   = text.match(/(?:total|amount|grand\s*total)[^\d]*(\d+[.,]\d{2})/i);
  const date     = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  const currency = text.match(/\b(USD|EUR|GBP|INR|JPY|AUD|CAD|SGD|AED)\b/i);
  const firstLine= text.match(/^(.+)/m);

  return {
    amount:      amount   ? parseFloat(amount[1].replace(',', '.')) : '',
    currency:    currency ? currency[1].toUpperCase() : 'USD',
    date:        date     ? date[1] : new Date().toISOString().split('T')[0],
    description: firstLine ? firstLine[1].trim().substring(0, 100) : '',
    category:    guessCategory(text),
  };
}

function guessCategory(text) {
  const t = text.toLowerCase();
  if (/restaurant|cafe|food|meal|dining|bistro/.test(t)) return 'MEALS';
  if (/hotel|inn|resort|accommodation|lodg/.test(t))     return 'ACCOMMODATION';
  if (/flight|airline|train|taxi|uber|lyft|transport/.test(t)) return 'TRAVEL';
  if (/amazon|staples|office|supply/.test(t))            return 'OFFICE_SUPPLIES';
  if (/software|saas|subscription|license/.test(t))      return 'SOFTWARE';
  return 'OTHER';
}