import { useState, useEffect } from 'react';
import {
  type BalanceDataResponse,
  balanceMapToList,
  getBalanceMap,
} from '../lib/balance';

interface PlayerBalance { name: string; balance: number; }

interface BalanceTabProps {
  refreshKey?: number;
}

function BalanceList({ houseOwes, owesHouse }: { houseOwes: PlayerBalance[]; owesHouse: PlayerBalance[] }) {
  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-gray-900 text-sm font-semibold">💰 House Owes Players</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {houseOwes.map(p => (
            <div key={p.name} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">{p.name.charAt(0)}</div>
                <span className="text-gray-900 text-sm font-medium">{p.name}</span>
              </div>
              <span className="font-mono text-green-600 font-semibold text-sm">+₹{p.balance.toLocaleString()}</span>
            </div>
          ))}
          {houseOwes.length === 0 && <p className="px-4 py-3 text-gray-400 text-sm">No entries</p>}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-gray-900 text-sm font-semibold">💸 Players Owe House</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {owesHouse.map(p => (
            <div key={p.name} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-xs font-bold">{p.name.charAt(0)}</div>
                <span className="text-gray-900 text-sm font-medium">{p.name}</span>
              </div>
              <span className="font-mono text-red-600 font-semibold text-sm">₹{Math.abs(p.balance).toLocaleString()}</span>
            </div>
          ))}
          {owesHouse.length === 0 && <p className="px-4 py-3 text-gray-400 text-sm">No entries</p>}
        </div>
      </div>
    </>
  );
}

export function BalanceTab({ refreshKey = 0 }: BalanceTabProps) {
  const [data, setData] = useState<BalanceDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/balance-data')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 pt-20 text-center text-gray-400">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      Loading balance…
    </div>
  );
  if (!data) return <div className="max-w-lg mx-auto px-4 pt-20 text-center text-gray-400">Failed to load balance</div>;

  const balances = balanceMapToList(getBalanceMap(data));
  const houseOwes = balances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);
  const owesHouse = balances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);

  return (
    <div className="max-w-lg mx-auto px-3 pt-3 pb-8 space-y-3">
      <h1 className="text-gray-900 text-lg font-bold px-1">Balance</h1>

      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 text-white text-lg">
            ∑
          </div>
          <div>
            <p className="text-sm font-bold text-violet-900">Net balance — all game types</p>
            <p className="text-xs text-violet-700/90 mt-1 leading-relaxed">
              One combined total per player across offline cash, online cash, offline tournaments, and online tournaments.
              Leaderboard & stats still split by mode above.
            </p>
          </div>
        </div>
      </div>

      <BalanceList houseOwes={houseOwes} owesHouse={owesHouse} />
      {data.settlements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-gray-900 text-sm font-semibold">✅ Recent Settlements</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.settlements.slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-gray-900 text-sm font-medium">{s.playerName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.direction === 'player_paid_house' ? 'Player paid house' : 'House paid player'}
                    {s.notes ? ` · ${s.notes}` : ''}
                  </p>
                </div>
                <span className={`font-mono text-sm font-semibold ${s.direction === 'player_paid_house' ? 'text-blue-600' : 'text-violet-600'}`}>
                  ₹{s.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
