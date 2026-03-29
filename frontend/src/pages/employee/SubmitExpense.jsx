import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { scanReceipt } from '../../utils/ocr';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['TRAVEL','MEALS','ACCOMMODATION','OFFICE_SUPPLIES','SOFTWARE','TRAINING','OTHER'];

export default function SubmitExpense() {
  const { company } = useAuth();
  const navigate    = useNavigate();
  const fileRef     = useRef();

  const [form, setForm] = useState({
    amount: '', currency: company?.currency || 'USD',
    category: 'OTHER', description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [converted,  setConverted]  = useState(null);
  const [scanning,   setScanning]   = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    try {
      const extracted = await scanReceipt(file, p => setOcrProgress(Math.round(p * 100)));
      setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(extracted).filter(([,v]) => v)) }));
    } finally {
      setScanning(false);
    }
  }

  async function handleAmountBlur() {
    if (!form.amount || form.currency === company?.currency) return setConverted(null);
    try {
      const { data } = await api.get(
        `/currency/convert?amount=${form.amount}&from=${form.currency}&to=${company.currency}`
      );
      setConverted(data.converted);
    } catch { setConverted(null); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/expenses', form);
      navigate('/expenses');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Submit Expense</h1>

      {/* OCR Upload Zone */}
      <div
        onClick={() => fileRef.current.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer
                   hover:border-blue-400 hover:bg-blue-50 transition mb-6"
      >
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
        {scanning ? (
          <div>
            <p className="text-blue-600 font-medium">Scanning receipt… {ocrProgress}%</p>
            <div className="mt-2 h-1.5 bg-gray-200 rounded">
              <div className="h-1.5 bg-blue-500 rounded transition-all" style={{ width: `${ocrProgress}%` }}/>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Click to upload receipt — fields auto-fill via OCR</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <input
            type="number" step="0.01" required placeholder="Amount"
            className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={form.amount} onChange={set('amount')} onBlur={handleAmountBlur}
          />
          <input
            type="text" placeholder="Currency (e.g. USD)"
            className="border rounded-lg px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={form.currency} onChange={set('currency')} onBlur={handleAmountBlur}
          />
        </div>

        {converted !== null && (
          <p className="text-sm text-gray-500 -mt-2">
            ≈ {converted} {company?.currency} at current exchange rate
          </p>
        )}

        <select required className="border rounded-lg px-3 py-2 w-full"
                value={form.category} onChange={set('category')}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <input type="date" required
               className="border rounded-lg px-3 py-2 w-full"
               value={form.date} onChange={set('date')}/>

        <textarea required rows={3} placeholder="Description"
                  className="border rounded-lg px-3 py-2 w-full resize-none"
                  value={form.description} onChange={set('description')}/>

        <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium
                           hover:bg-blue-700 disabled:opacity-50 transition">
          {submitting ? 'Submitting…' : 'Submit Expense'}
        </button>
      </form>
    </div>
  );
}