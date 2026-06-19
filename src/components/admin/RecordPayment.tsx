import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { getMembers } from '../../lib/adminData';
import type { Member } from '../../lib/adminData';

interface RecordPaymentProps {
  onBack: () => void;
  adminId: string;
}

export function RecordPayment({ onBack, adminId }: RecordPaymentProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'player_paid_house' | 'house_paid_player'>('player_paid_house');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => { getMembers().then(setMembers); }, []);

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  async function handleSubmit() {
    if (!playerName || !amount || parseFloat(amount) <= 0) return;
    setSaving(true);
    try {
      await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          amount: parseFloat(amount),
          direction,
          notes: notes || null,
          recordedBy: adminId,
        }),
      });
      setDone(true);
      setTimeout(onBack, 1500);
    } catch {
      setSaving(false);
    }
  }

  if (done) return (
    <div className="max-w-lg mx-auto px-4 pt-20 flex flex-col items-center gap-3">
      <CheckCircle className="w-14 h-14 text-green-500" />
      <p className="text-gray-900 font-semibold text-lg">Payment recorded!</p>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <h1 className="text-gray-900 font-bold text-lg">Record Payment</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        {/* Player search */}
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Player</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search player…"
              value={playerName || search}
              onChange={e => { setSearch(e.target.value); setPlayerName(''); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-900 outline-none focus:border-violet-400 text-sm"
              style={{ fontSize: 16 }}
            />
            {showDropdown && search && !playerName && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-20 border border-gray-100 max-h-48 overflow-y-auto">
                  {filtered.map(m => (
                    <button key={m.id} onClick={() => { setPlayerName(m.name); setSearch(m.name); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-violet-50 border-b border-gray-50 last:border-0">
                      {m.name}
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">No match</p>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Direction */}
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Direction</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirection('player_paid_house')}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${direction === 'player_paid_house' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
            >
              Player → House
            </button>
            <button
              onClick={() => setDirection('house_paid_player')}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${direction === 'house_paid_player' ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
            >
              House → Player
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Amount (₹)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-900 outline-none focus:border-violet-400 text-sm font-mono"
            style={{ fontSize: 16 }}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
          <input
            type="text"
            placeholder="e.g. partial payment"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-900 outline-none focus:border-violet-400 text-sm"
            style={{ fontSize: 16 }}
          />
        </div>
      </div>

      {/* Summary */}
      {playerName && amount && parseFloat(amount) > 0 && (
        <div className={`rounded-2xl p-4 text-sm font-medium ${direction === 'player_paid_house' ? 'bg-blue-50 text-blue-800' : 'bg-violet-50 text-violet-800'}`}>
          {direction === 'player_paid_house'
            ? `${playerName} paid house ₹${parseFloat(amount).toLocaleString()}`
            : `House paid ${playerName} ₹${parseFloat(amount).toLocaleString()}`}
          {notes ? ` · ${notes}` : ''}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!playerName || !amount || parseFloat(amount) <= 0 || saving}
        className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold rounded-2xl shadow-md disabled:opacity-40"
      >
        {saving ? 'Recording…' : 'Record Payment'}
      </button>
    </div>
  );
}
