import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Player } from '../lib/types';

interface PlayerDetailSheetProps {
  player: Player | null;
  allPlayers?: Player[];
  open: boolean;
  onClose: () => void;
  fullPage?: boolean;
}

function formatK(value: number) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(Math.round(value));
}

function fmt(value: number, sign = false): string {
  const str = value.toLocaleString();
  if (!sign) return str;
  return value >= 0 ? `+${str}` : str;
}

function CalendarView({ player }: { player: Player }) {
  const allDates = player.results.map(r => new Date(r.date));
  const latest = allDates.length ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();
  const [viewYear, setViewYear] = useState(latest.getFullYear());
  const [viewMonth, setViewMonth] = useState(latest.getMonth());

  // Map date string → amount for this player
  const dayMap = new Map<string, number>();
  player.results.forEach(r => {
    const key = r.date.slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + r.amount);
  });

  // Compute color intensity based on max abs value in the month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthAmounts = Array.from({ length: daysInMonth }, (_, i) => {
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    return dayMap.get(key) ?? null;
  }).filter(v => v !== null) as number[];
  const maxAbs = Math.max(...monthAmounts.map(Math.abs), 1);

  function getStyle(amount: number): { bg: string; text: string } {
    const intensity = Math.min(Math.abs(amount) / maxAbs, 1);
    if (amount > 0) {
      const r = Math.round(178 - intensity * 128);
      const g = Math.round(235 - intensity * 139);
      const b = Math.round(242 - intensity * 146);
      return { bg: `rgb(${r},${g},${b})`, text: intensity > 0.5 ? '#ffffff' : '#1f2937' };
    } else {
      const r = Math.round(252 - intensity * 100);
      const g = Math.round(228 - intensity * 190);
      const b = Math.round(236 - intensity * 200);
      return { bg: `rgb(${r},${g},${b})`, text: intensity > 0.5 ? '#ffffff' : '#1f2937' };
    }
  }

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon=0
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-bold text-gray-800">{monthName}</span>
        <button onClick={nextMonth} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map((d, i) => (
          <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const amount = dayMap.get(key) ?? null;
          const style = amount !== null ? getStyle(amount) : null;
          return (
            <div key={day} className="aspect-square rounded-lg flex flex-col items-center justify-center"
              style={{ backgroundColor: style?.bg ?? 'transparent' }}>
              <span className="text-xs font-semibold leading-none" style={{ color: style?.text ?? '#6b7280' }}>{day}</span>
              {amount !== null && (
                <span className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: style!.text }}>
                  {amount >= 0 ? '+' : ''}₹{Math.abs(amount) >= 1000 ? `${(amount / 1000).toFixed(1)}K` : amount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlayerDetailSheet({ player, allPlayers = [], open, onClose, fullPage = false }: PlayerDetailSheetProps) {
  const [view, setView] = useState<'curve' | 'calendar'>('curve');
  const [compareSearch, setCompareSearch] = useState('');
  const [comparePlayer, setComparePlayer] = useState<Player | null>(null);
  const [showCompareDropdown, setShowCompareDropdown] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  if (!open || !player) return null;

  const isPositive = player.totalWinnings >= 0;

  const chartData = player.results.map((_r, i) => ({
    index: i + 1,
    cumulative: player.results.slice(0, i + 1).reduce((s, x) => s + x.amount, 0),
  }));

  const values = chartData.map(d => d.cumulative);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 0);
  const range = maxVal - minVal || 1;
  const zeroPct = `${((maxVal / range) * 100).toFixed(1)}%`;

  // Compare chart: date-based axis, carry-forward last cumulative for missing dates
  const compareData = (() => {
    if (!comparePlayer) return [];
    const allDates = Array.from(new Set([
      ...player.results.map(r => r.date),
      ...comparePlayer.results.map(r => r.date),
    ])).sort();

    let cumA = 0, cumB = 0;
    const aByDate = new Map<string, number>();
    const bByDate = new Map<string, number>();
    player.results.forEach(r => aByDate.set(r.date, (aByDate.get(r.date) ?? 0) + r.amount));
    comparePlayer.results.forEach(r => bByDate.set(r.date, (bByDate.get(r.date) ?? 0) + r.amount));

    return allDates.map(date => {
      if (aByDate.has(date)) cumA += aByDate.get(date)!;
      if (bByDate.has(date)) cumB += bByDate.get(date)!;
      return { date: date.slice(5), [player.name]: cumA, [comparePlayer.name]: cumB };
    });
  })();

  const otherPlayers = allPlayers.filter(p => p.id !== player.id);

  const stats = [
    { label: 'Games Played', value: String(player.gamesPlayed), color: 'text-gray-900' },
    { label: 'Avg per Game', value: fmt(player.avgPerGame, true), color: player.avgPerGame >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: 'Best Game', value: fmt(player.bestResult, true), color: 'text-green-600' },
    { label: 'Worst Game', value: fmt(player.worstResult, true), color: 'text-red-600' },
  ];

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-pink-50 w-full ${fullPage ? 'min-h-screen' : 'rounded-t-3xl h-[90vh] overflow-auto'}`}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4">
        <button
          onClick={onClose}
          className={`absolute top-4 ${fullPage ? 'left-4' : 'right-6'} w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50`}
        >
          {fullPage ? <ChevronLeft className="w-5 h-5 text-gray-600" /> : <X className="w-5 h-5 text-gray-600" />}
        </button>
        <div className={`flex items-start gap-4 ${fullPage ? 'pt-2 pl-12' : 'pt-2'}`}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-gray-900 text-2xl font-bold mb-1">{player.name}</h2>
            <p className={`text-2xl font-mono font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(player.totalWinnings, true)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`font-mono font-semibold text-base ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Equity Curve / Calendar toggle */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 text-base font-bold">{view === 'curve' ? 'Equity Curve' : 'Calendar'}</h3>
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              <button onClick={() => setView('curve')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${view === 'curve' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
                Curve
              </button>
              <button onClick={() => setView('calendar')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
                Calendar
              </button>
            </div>
          </div>

          {view === 'curve' ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="strokeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={zeroPct} stopColor="#16a34a" />
                    <stop offset={zeroPct} stopColor="#dc2626" />
                  </linearGradient>
                  <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset={zeroPct} stopColor="#16a34a" stopOpacity={0.05} />
                    <stop offset={zeroPct} stopColor="#dc2626" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="index" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 6)} />
                <YAxis tickFormatter={formatK} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={42} />
                <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Cumulative']} labelFormatter={(label) => `Game ${label}`} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <ReferenceLine y={0} stroke="#000" strokeWidth={1.5} />
                <Area type="monotone" dataKey="cumulative" stroke="url(#strokeGrad)" strokeWidth={2} fill="url(#fillGrad)" dot={false} activeDot={{ r: 4, fill: '#16a34a' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <CalendarView player={player} />
          )}
        </div>

        {/* Compare */}
        {!showCompare ? (
          <button
            onClick={() => setShowCompare(true)}
            className="w-full rounded-3xl overflow-hidden shadow-sm relative"
            style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #c084fc 50%, #f9a8d4 100%)' }}
          >
            <div className="px-6 py-5 flex items-center justify-between">
              <span className="text-white text-base font-semibold">Compare with a player</span>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </div>
          </button>
        ) : (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 text-base font-bold">Compare</h3>
            <button onClick={() => { setShowCompare(false); setComparePlayer(null); setCompareSearch(''); }}
              className="text-xs text-gray-400 font-semibold">Close</button>
          </div>

          <>
              {/* Player chips row */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm font-bold text-gray-900">{player.name}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">vs</span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search player…"
                    value={showCompareDropdown ? compareSearch : (comparePlayer?.name ?? '')}
                    onFocus={() => { setShowCompareDropdown(true); setCompareSearch(''); }}
                    onChange={e => { setCompareSearch(e.target.value); setComparePlayer(null); }}
                    className="w-full px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-900 outline-none focus:border-purple-400 placeholder:font-normal placeholder:text-gray-400"
                  />
                  {showCompareDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCompareDropdown(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl z-20 overflow-hidden border border-gray-100 max-h-44 overflow-y-auto">
                        {otherPlayers.filter(p => p.name.toLowerCase().includes(compareSearch.toLowerCase())).map(p => (
                          <button key={p.id} onClick={() => { setComparePlayer(p); setShowCompareDropdown(false); setCompareSearch(''); }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-gray-900 hover:bg-purple-50 border-b border-gray-50 last:border-0">
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {comparePlayer ? (
                <>
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { p: player, color: '#8b5cf6', bg: 'bg-purple-50', border: 'border-purple-100' },
                      { p: comparePlayer, color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-100' },
                    ].map(({ p, color, bg, border }) => {
                      const wins = p.results.filter(r => r.amount > 0).length;
                      const losses = p.results.filter(r => r.amount < 0).length;
                      const winPct = p.gamesPlayed > 0 ? Math.round((wins / p.gamesPlayed) * 100) : 0;
                      return (
                        <div key={p.id} className={`${bg} border ${border} rounded-2xl px-3 py-2.5`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-xs text-gray-500 font-medium">{p.name}</span>
                          </div>
                          <p className={`text-base font-bold font-mono ${p.totalWinnings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {p.totalWinnings >= 0 ? '+' : ''}{p.totalWinnings.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.gamesPlayed} games</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-[10px] font-semibold text-green-600">{wins}W</span>
                            <span className="text-[10px] text-gray-300">/</span>
                            <span className="text-[10px] font-semibold text-red-500">{losses}L</span>
                            <span className="text-[10px] text-gray-300 ml-1">·</span>
                            <span className="text-[10px] font-semibold text-gray-500">{winPct}% win</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={compareData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={Math.floor(compareData.length / 5)} />
                      <YAxis tickFormatter={formatK} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={42} />
                      <Tooltip
                        formatter={(value, name) => [Number(value).toLocaleString(), name]}
                        labelFormatter={(l) => l}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <ReferenceLine y={0} stroke="#000" strokeWidth={1.5} />
                      <Line type="monotone" dataKey={player.name} stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey={comparePlayer.name} stroke="#f97316" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400">Search for a player above to compare curves</p>
                </div>
              )}
          </>
        </div>
        )}

        {/* Date wise results */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <h3 className="text-gray-900 text-base font-bold mb-3">Date wise</h3>
          <div className="space-y-0">
            {[...player.results].reverse().map((result, i) => (
              <div key={i}>
                <div className="flex items-center justify-between py-3 px-1">
                  <div>
                    <span className="text-gray-600 text-sm">
                      {new Date(result.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {result.session && result.session.toLowerCase() !== 'main' && <span className="text-xs text-gray-400 ml-2">{result.session}</span>}
                  </div>
                  <span className={`font-mono font-semibold text-sm ${result.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(result.amount, true)}
                  </span>
                </div>
                {i < player.results.length - 1 && <div className="h-px bg-gray-100" />}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
