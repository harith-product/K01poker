import { X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Player } from '../lib/types';

interface PlayerDetailSheetProps {
  player: Player | null;
  open: boolean;
  onClose: () => void;
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

export function PlayerDetailSheet({ player, open, onClose }: PlayerDetailSheetProps) {
  if (!open || !player) return null;

  const isPositive = player.totalWinnings >= 0;

  const chartData = player.results.map((_r, i) => ({
    index: i + 1,
    cumulative: player.results.slice(0, i + 1).reduce((s, x) => s + x.amount, 0),
  }));

  const stats = [
    { label: 'Games Played', value: String(player.gamesPlayed), color: 'text-gray-900' },
    { label: 'Avg per Game', value: fmt(player.avgPerGame, true), color: player.avgPerGame >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: 'Best Game', value: fmt(player.bestResult, true), color: 'text-green-600' },
    { label: 'Worst Game', value: fmt(player.worstResult, true), color: 'text-red-600' },
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-t-3xl h-[90vh] overflow-auto w-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-6 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-start gap-4 pt-2">
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

        {/* Equity Curve */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <h3 className="text-gray-900 text-base font-bold mb-4">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="index"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                tickFormatter={formatK}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                width={42}
              />
              <Tooltip
                formatter={(value) => [Number(value).toLocaleString(), 'Cumulative']}
                labelFormatter={(label) => `Game ${label}`}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <ReferenceLine y={0} stroke="#000" strokeWidth={1.5} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#gradGreen)"
                dot={false}
                activeDot={{ r: 4, fill: '#16a34a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

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
                    {result.session && <span className="text-xs text-gray-400 ml-2">{result.session}</span>}
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
