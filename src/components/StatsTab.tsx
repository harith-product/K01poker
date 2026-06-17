import { TrendingUp, TrendingDown, Flame, Moon, Zap, Home, ChevronDown, Star, Percent } from 'lucide-react';
import { useState } from 'react';
import type { Player, GameSession } from '../lib/types';

interface StatsTabProps {
  players: Player[];
  sessions: GameSession[];
  onPlayerClick: (playerId: string) => void;
}

type TimePeriod = 'overall' | '30days' | '7days';

const labels: Record<TimePeriod, string> = {
  overall: 'Overall',
  '30days': 'Last 30 days',
  '7days': 'Last 7 days',
};

function filterPlayers(players: Player[], period: TimePeriod) {
  const now = new Date();
  const cutoff =
    period === '7days'
      ? new Date(now.getTime() - 7 * 86400000)
      : period === '30days'
      ? new Date(now.getTime() - 30 * 86400000)
      : null;

  return players.map(p => {
    const results = cutoff
      ? p.results.filter(r => new Date(r.date) >= cutoff)
      : p.results;
    return { ...p, results, totalWinnings: results.reduce((s, r) => s + r.amount, 0), gamesPlayed: results.length };
  }).filter(p => p.gamesPlayed > 0);
}

export function StatsTab({ players, sessions, onPlayerClick }: StatsTabProps) {
  const [period, setPeriod] = useState<TimePeriod>('overall');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fp = filterPlayers(players, period);

  const biggestWin = [...fp].map(p => ({ player: p, value: Math.max(...p.results.map(r => r.amount)) })).sort((a, b) => b.value - a.value).slice(0, 5);
  const biggestLoss = [...fp].map(p => ({ player: p, value: Math.abs(Math.min(...p.results.map(r => r.amount))) })).sort((a, b) => b.value - a.value).slice(0, 5);

  const winStreak = [...fp].map(p => {
    let max = 0, cur = 0;
    p.results.forEach(r => { if (r.amount > 0) { cur++; max = Math.max(max, cur); } else cur = 0; });
    return { player: p, value: max };
  }).sort((a, b) => b.value - a.value).slice(0, 5);

  const loseStreak = [...fp].map(p => {
    let max = 0, cur = 0;
    p.results.forEach(r => { if (r.amount < 0) { cur++; max = Math.max(max, cur); } else cur = 0; });
    return { player: p, value: max };
  }).sort((a, b) => b.value - a.value).slice(0, 5);

  const mostGames = [...fp].map(p => ({ player: p, value: p.gamesPlayed })).sort((a, b) => b.value - a.value).slice(0, 5);

  const topAvgWins = [...fp]
    .filter(p => p.gamesPlayed >= 5)
    .map(p => ({ player: p, avg: p.totalWinnings / p.gamesPlayed }))
    .filter(p => p.avg > 0)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const topAvgLosses = [...fp]
    .filter(p => p.gamesPlayed >= 5)
    .map(p => ({ player: p, avg: p.totalWinnings / p.gamesPlayed }))
    .filter(p => p.avg < 0)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5);

  const topWinPct = [...fp]
    .filter(p => p.gamesPlayed >= 30)
    .map(p => {
      const wins = p.results.filter(r => r.amount > 0).length;
      const losses = p.results.filter(r => r.amount < 0).length;
      const pct = Math.round((wins / p.gamesPlayed) * 100);
      return { player: p, wins, losses, pct };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const categories = [
    { label: 'Biggest Wins', data: biggestWin, Icon: TrendingUp, color: 'from-green-400 to-emerald-500', valueColor: 'text-green-700', fmt: (v: number) => `${v.toLocaleString()}` },
    { label: 'Biggest Losses', data: biggestLoss, Icon: TrendingDown, color: 'from-red-400 to-rose-500', valueColor: 'text-red-700', fmt: (v: number) => `${v.toLocaleString()}` },
    { label: 'Win Streaks', data: winStreak, Icon: Flame, color: 'from-orange-400 to-red-500', valueColor: 'text-green-700', fmt: (v: number) => `${v} games` },
    { label: 'Losing Streaks', data: loseStreak, Icon: Moon, color: 'from-indigo-400 to-purple-500', valueColor: 'text-red-700', fmt: (v: number) => `${v} games` },
    { label: 'Most Games Played', data: mostGames, Icon: Zap, color: 'from-purple-400 to-pink-500', valueColor: 'text-gray-900', fmt: (v: number) => `${v} games` },
  ];

  // House stats
  const uniqueDates = [...new Set(sessions.map(s => s.date))];
  const totalSessions = sessions.length;
  const playersPerSession = sessions.map(s => Object.values(s.players).filter(v => v !== 0).length);
  const avgPlayers = playersPerSession.length > 0 ? Math.round(playersPerSession.reduce((a, b) => a + b, 0) / playersPerSession.length) : 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-gray-900 text-2xl">Stats</h1>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm text-sm">
            <span className="text-gray-900">{labels[period]}</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg z-10 min-w-[140px]">
              {(['overall', '30days', '7days'] as TimePeriod[]).map((p, i, arr) => (
                <button key={p} onClick={() => { setPeriod(p); setDropdownOpen(false); }}
                  className={`w-full text-left py-2 px-3 hover:bg-gray-100 text-sm text-gray-900 ${i === 0 ? 'rounded-t-lg' : ''} ${i === arr.length - 1 ? 'rounded-b-lg' : ''}`}>
                  {labels[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {categories.map(({ label, data, Icon, color, valueColor, fmt }) => (
          <div key={label} className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-900 text-lg font-semibold">{label}</h3>
            </div>
            <div className="space-y-0">
              {data.map((item, index) => (
                <div key={item.player.id}>
                  <button
                    onClick={() => onPlayerClick(item.player.id)}
                    className="w-full flex items-center justify-between py-3 px-1 hover:bg-gray-50 rounded-lg transition-all"
                  >
                    <span className="text-gray-900">{item.player.name}</span>
                    <span className={`${valueColor} font-mono`}>{fmt(item.value)}</span>
                  </button>
                  {index < data.length - 1 && <div className="h-px bg-gray-100" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Top Average Wins (5+ games) */}
      {topAvgWins.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-gray-900 text-lg font-semibold">Top 5 Avg Wins <span className="text-sm font-normal text-gray-400">(5+ games)</span></h3>
          </div>
          <div className="space-y-0">
            {topAvgWins.map((item, index) => (
              <div key={item.player.id}>
                <button
                  onClick={() => onPlayerClick(item.player.id)}
                  className="w-full flex items-center gap-3 py-3 px-1 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <span className="text-indigo-500 font-semibold w-8 text-sm">#{index + 1}</span>
                  <div className="flex-1 text-left">
                    <p className="text-gray-900">{item.player.name}</p>
                    <p className="text-xs text-gray-400">{item.player.gamesPlayed} games</p>
                  </div>
                  <span className={`font-mono ${item.avg >= 0 ? 'text-green-600' : 'text-red-600'}`}>{item.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}/game</span>
                </button>
                {index < topAvgWins.length - 1 && <div className="h-px bg-gray-100" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Avg Losses (5+ games) */}
      {topAvgLosses.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-gray-900 text-lg font-semibold">Top 5 Avg Losses <span className="text-sm font-normal text-gray-400">(5+ games)</span></h3>
          </div>
          <div className="space-y-0">
            {topAvgLosses.map((item, index) => (
              <div key={item.player.id}>
                <button
                  onClick={() => onPlayerClick(item.player.id)}
                  className="w-full flex items-center gap-3 py-3 px-1 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <span className="text-indigo-500 font-semibold w-8 text-sm">#{index + 1}</span>
                  <div className="flex-1 text-left">
                    <p className="text-gray-900">{item.player.name}</p>
                    <p className="text-xs text-gray-400">{item.player.gamesPlayed} games</p>
                  </div>
                  <span className="text-red-600 font-mono">{item.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}/game</span>
                </button>
                {index < topAvgLosses.length - 1 && <div className="h-px bg-gray-100" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Win % (5+ games) */}
      {topWinPct.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md">
              <Percent className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-gray-900 text-lg font-semibold">Top Win % <span className="text-sm font-normal text-gray-400">(30+ games)</span></h3>
          </div>
          <div className="space-y-0">
            {topWinPct.map((item, index) => (
              <div key={item.player.id}>
                <button
                  onClick={() => onPlayerClick(item.player.id)}
                  className="w-full flex items-center gap-3 py-3 px-1 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <span className="text-indigo-500 font-semibold w-8 text-sm">#{index + 1}</span>
                  <div className="flex-1 text-left">
                    <p className="text-gray-900">{item.player.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] font-semibold text-green-600">{item.wins}W</span>
                      <span className="text-[10px] text-gray-300">/</span>
                      <span className="text-[10px] font-semibold text-red-500">{item.losses}L</span>
                      <span className="text-[10px] text-gray-300 ml-1">·</span>
                      <span className="text-[10px] text-gray-400">{item.player.gamesPlayed} games</span>
                    </div>
                  </div>
                  <span className="text-teal-600 font-mono font-semibold">{item.pct}%</span>
                </button>
                {index < topWinPct.length - 1 && <div className="h-px bg-gray-100" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* House Stats */}
      <div className="bg-white rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-md">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-gray-900 text-lg font-semibold">House Statistics</h3>
        </div>
        <div className="space-y-0">
          <div className="flex items-center justify-between py-3 px-1">
            <span className="text-gray-900">Total Sessions</span>
            <span className="text-gray-900 font-mono">{totalSessions}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between py-3 px-1">
            <span className="text-gray-900">Unique Game Days</span>
            <span className="text-gray-900 font-mono">{uniqueDates.length}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between py-3 px-1">
            <span className="text-gray-900">Avg Players Per Session</span>
            <span className="text-gray-900 font-mono">{avgPlayers}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between py-3 px-1">
            <span className="text-gray-900">Total Players</span>
            <span className="text-gray-900 font-mono">{players.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
