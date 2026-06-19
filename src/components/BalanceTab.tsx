import { useState, useEffect } from 'react';
import type { Player } from '../lib/types';

interface Settlement {
  id: number;
  playerName: string;
  amount: number;
  direction: string;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
}

interface BalanceDataResponse {
  initialBalances: { playerName: string; amount: number }[];
  sessionPnL: { playerName: string; netPnl: number; rake: number }[];
  settlements: Settlement[];
  totalRakeInitial: number;
  totalRakeNew: number;
}

interface PlayerBalance {
  name: string;
  balance: number; // positive = house owes, negative = player owes
}

interface BalanceTabProps {
  onlinePlayers: Player[];
}

export function BalanceTab({ onlinePlayers }: BalanceTabProps) {
  const [data, setData] = useState<BalanceDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/balance-data')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 pt-20 text-center text-gray-400">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      Loading balance…
    </div>
  );

  if (!data) return (
    <div className="max-w-lg mx-auto px-4 pt-20 text-center text-gray-400">Failed to load balance</div>
  );

  // Build combined balance map
  const balanceMap: Record<string, number> = {};

  // 1. Initial snapshot
  for (const { playerName, amount } of data.initialBalances) {
    balanceMap[playerName] = (balanceMap[playerName] ?? 0) + amount;
  }

  // 2. New offline sessions (from admin DB)
  for (const { playerName, netPnl } of data.sessionPnL) {
    balanceMap[playerName] = (balanceMap[playerName] ?? 0) + netPnl;
  }

  // 3. Online P&L (no rake)
  for (const player of onlinePlayers) {
    if (player.totalWinnings !== 0) {
      balanceMap[player.name] = (balanceMap[player.name] ?? 0) + player.totalWinnings;
    }
  }

  // 4. Apply settlements
  for (const s of data.settlements) {
    const adj = s.direction === 'player_paid_house' ? s.amount : -s.amount;
    balanceMap[s.playerName] = (balanceMap[s.playerName] ?? 0) + adj;
  }

  const balances: PlayerBalance[] = Object.entries(balanceMap)
    .filter(([, b]) => Math.abs(b) >= 0.01)
    .map(([name, balance]) => ({ name, balance }))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

  const houseOwes = balances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);
  const owesHouse = balances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);

  const totalRake = data.totalRakeInitial + data.totalRakeNew;

  return (
    <div className="max-w-lg mx-auto px-3 pt-3 pb-8 space-y-3">
      <h1 className="text-gray-900 text-lg font-bold px-1">Balance</h1>

      {/* Rake card */}
      <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl p-4 shadow-md">
        <p className="text-violet-100 text-xs font-medium mb-1">🏠 House Rake Collected</p>
        <p className="text-white text-2xl font-bold font-mono">₹{totalRake.toLocaleString()}</p>
        {data.totalRakeNew > 0 && (
          <p className="text-violet-200 text-xs mt-1">+₹{data.totalRakeNew.toLocaleString()} from new sessions</p>
        )}
      </div>

      {/* House Owes Players */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-gray-900 text-sm font-semibold">💰 House Owes Players</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {houseOwes.map(p => (
            <div key={p.name} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-900 text-sm font-medium">{p.name}</span>
              </div>
              <span className="font-mono text-green-600 font-semibold text-sm">+₹{p.balance.toLocaleString()}</span>
            </div>
          ))}
          {houseOwes.length === 0 && <p className="px-4 py-3 text-gray-400 text-sm">No entries</p>}
        </div>
      </div>

      {/* Players Owe House */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-gray-900 text-sm font-semibold">💸 Players Owe House</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {owesHouse.map(p => (
            <div key={p.name} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-xs font-bold">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-900 text-sm font-medium">{p.name}</span>
              </div>
              <span className="font-mono text-red-600 font-semibold text-sm">₹{Math.abs(p.balance).toLocaleString()}</span>
            </div>
          ))}
          {owesHouse.length === 0 && <p className="px-4 py-3 text-gray-400 text-sm">No entries</p>}
        </div>
      </div>

      {/* Recent settlements */}
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
