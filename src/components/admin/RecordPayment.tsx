import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, ClockIcon } from 'lucide-react';
import { getMembers } from '../../lib/adminData';
import type { Member } from '../../lib/adminData';
import {
  type BalanceDataResponse,
  type Settlement,
  balanceMapToList,
  getBalanceMap,
} from '../../lib/balance';

interface RecordPaymentProps {
  onBack: () => void;
  adminId: string;
}

interface PlayerBalance { name: string; balance: number; }

export function RecordPayment({ onBack, adminId }: RecordPaymentProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [balances, setBalances] = useState<PlayerBalance[] | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'player_paid_house' | 'house_paid_player'>('player_paid_house');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const refreshBalances = useCallback(async () => {
    const res = await fetch('/api/balance-data');
    const data: BalanceDataResponse = await res.json();
    setSettlements(data.settlements ?? []);
    setBalances(balanceMapToList(getBalanceMap(data)).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)));
  }, []);

  useEffect(() => {
    getMembers().then(setMembers);
    refreshBalances().catch(() => setBalances([]));
  }, [refreshBalances]);

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  async function handleSubmit() {
    if (!playerName || !amount || parseFloat(amount) <= 0) return;
    setSaving(true);
    try {
      await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName, amount: parseFloat(amount), direction,
          notes: notes || null, recordedBy: adminId,
        }),
      });
      setPlayerName(''); setSearch(''); setAmount(''); setNotes('');
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      await refreshBalances();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
      {done && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg">
          <CheckCircle className="w-4 h-4 text-green-400" /> Payment recorded!
        </div>
      )}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <h1 className="text-gray-900 font-bold text-lg">Record Payment</h1>
        <button onClick={() => setShowHistory(true)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl shadow-sm text-xs font-medium text-gray-600 border border-gray-100">
          <ClockIcon className="w-3.5 h-3.5 text-gray-400" /> Recorded
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Player</label>
          <div className="relative">
            <input type="text" placeholder="Search player…" value={playerName || search}
              onChange={e => { setSearch(e.target.value); setPlayerName(''); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-900 outline-none focus:border-violet-400 text-sm" style={{ fontSize: 16 }} />
            {showDropdown && search && !playerName && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-20 border border-gray-100 max-h-48 overflow-y-auto">
                  {filtered.map(m => (
                    <button key={m.id} onClick={() => { setPlayerName(m.name); setSearch(m.name); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-violet-50 border-b border-gray-50 last:border-0">{m.name}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Direction</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setDirection('player_paid_house')}
              className={`py-2.5 rounded-xl text-sm font-semibold border ${direction === 'player_paid_house' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>Player → House</button>
            <button onClick={() => setDirection('house_paid_player')}
              className={`py-2.5 rounded-xl text-sm font-semibold border ${direction === 'house_paid_player' ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>House → Player</button>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Amount (₹)</label>
          <input type="number" inputMode="decimal" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-900 outline-none focus:border-violet-400 text-sm font-mono" style={{ fontSize: 16 }} />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
          <input type="text" placeholder="e.g. partial payment" value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-900 outline-none focus:border-violet-400 text-sm" style={{ fontSize: 16 }} />
        </div>
      </div>

      <button onClick={handleSubmit} disabled={!playerName || !amount || parseFloat(amount) <= 0 || saving}
        className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold rounded-2xl shadow-md disabled:opacity-40">
        {saving ? 'Recording…' : 'Record Payment'}
      </button>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100"><h2 className="text-gray-900 text-sm font-semibold">Current Balances</h2></div>
        {balances === null ? (
          <div className="px-4 py-4 flex justify-center"><div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : balances.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-400">No balance data</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {balances.map(p => (
              <div key={p.name} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-gray-800 text-sm">{p.name}</span>
                <span className={`font-mono text-sm font-semibold ${p.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {p.balance > 0 ? '+' : ''}₹{Math.round(Math.abs(p.balance)).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showHistory && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowHistory(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-gray-900 font-bold text-base">Recorded Payments</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 text-sm font-medium">Close</button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {settlements.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">No payments recorded yet</p>
              ) : settlements.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-gray-900 text-sm font-medium">{s.playerName}</p>
                    <p className="text-xs text-gray-400">{s.direction === 'player_paid_house' ? 'Received' : 'Given out'}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold">₹{Number(s.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
