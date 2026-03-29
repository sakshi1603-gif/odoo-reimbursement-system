import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const statusColors = {
  PENDING:  'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100  text-green-800',
  REJECTED: 'bg-red-100    text-red-800',
};

export default function ApprovalQueue() {
  const { company }         = useAuth();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => {
    api.get('/approvals/pending').then(r => {
      setItems(r.data);
      setLoading(false);
    });
  }, []);

  async function decide(expenseId, decision) {
    await api.post(`/approvals/${expenseId}/decide`, { decision, comment });
    setItems(prev => prev.filter(e => e._id !== expenseId));
    setComment('');
  }

  if (loading) return <div className="p-8 text-gray-400">Loading queue…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Approval Queue</h1>

      {items.length === 0 && (
        <p className="text-gray-500 text-center py-12">No expenses waiting for your approval.</p>
      )}

      {items.map(exp => (
        <div key={exp._id} className="border rounded-2xl p-5 mb-4 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold text-lg">{exp.submitterId?.name}</p>
              <p className="text-sm text-gray-500">{exp.category} · {exp.date?.slice(0,10)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {exp.amountInCompanyCurrency} {company?.currency}
              </p>
              {exp.currency !== company?.currency &&
                <p className="text-xs text-gray-400">{exp.amount} {exp.currency}</p>
              }
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-4">{exp.description}</p>

          {/* Approval trail */}
          <div className="flex gap-2 flex-wrap mb-4">
            {exp.steps?.map((s, i) => (
              <span key={i}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[s.status] || 'bg-gray-100 text-gray-600'}`}>
                Step {i+1}: {s.status}
              </span>
            ))}
          </div>

          <textarea
            rows={2} placeholder="Comment (optional for rejection)"
            className="border rounded-lg px-3 py-2 w-full text-sm mb-3 resize-none"
            value={comment} onChange={e => setComment(e.target.value)}
          />

          <div className="flex gap-3">
            <button onClick={() => decide(exp._id, 'APPROVE')}
                    className="flex-1 bg-green-600 text-white rounded-xl py-2.5 font-medium
                               hover:bg-green-700 transition">
              Approve
            </button>
            <button onClick={() => decide(exp._id, 'REJECT')}
                    className="flex-1 bg-red-500 text-white rounded-xl py-2.5 font-medium
                               hover:bg-red-600 transition">
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}