import { X, TrendingUp, TrendingDown, Target, Award } from 'lucide-react';
import { useState } from 'react';
import type { Player } from '../lib/types';

interface PlayerDetailSheetProps {
  player: Player | null;
  open: boolean;
  onClose: () => void;
}

export function PlayerDetailSheet({ player, open, onClose }: PlayerDetailSheetProps) {
  const [tab, setTab] = useState<'summary' | 'datewise'>('summary');

  if (!open || !player) return null;

  const isPositive = player.totalWinnings >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto bg-gradient-to-br from-purple-50 to-pink-50 rounded-t-3xl h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-6 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-start gap-4 pt-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl border-4 border-white shadow-lg">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-gray-900 text-2xl mb-1">{player.name}</h2>
              <p className={`text-2xl font-mono ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}₹{player.totalWinnings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Games Played', value: player.gamesPlayed, Icon: Target, color: 'from-blue-100 to-blue-200', iconColor: 'text-blue-600' },
              { label: 'Avg per Game', value: `${player.avgPerGame >= 0 ? '+' : ''}₹${player.avgPerGame.toLocaleString()}`, Icon: TrendingUp, color: 'from-green-100 to-green-200', iconColor: 'text-green-600' },
              { label: 'Best Game', value: `+₹${player.bestResult.toLocaleString()}`, Icon: Award, color: 'from-yellow-100 to-yellow-200', iconColor: 'text-yellow-600' },
              { label: 'Worst Game', value: `₹${player.worstResult.toLocaleString()}`, Icon: TrendingDown, color: 'from-red-100 to-red-200', iconColor: 'text-red-600' },
            ].map(({ label, value, Icon, color, iconColor }) => (
              <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-4`}>
                <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-gray-900 font-mono font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="grid grid-cols-2 bg-gray-100 rounded-xl p-1 mb-4">
              {(['summary', 'datewise'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`py-2 rounded-lg text-sm transition-all ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                  {t === 'summary' ? 'Summary' : 'Date wise'}
                </button>
              ))}
            </div>

            {tab === 'summary' && (
              <div className="space-y-0">
                {[
                  { label: 'Total Winnings', value: `${isPositive ? '+' : ''}₹${player.totalWinnings.toLocaleString()}`, color: isPositive ? 'text-green-600' : 'text-red-600' },
                  { label: 'Games Played', value: String(player.gamesPlayed), color: 'text-gray-900' },
                  { label: 'Average per Game', value: `${player.avgPerGame >= 0 ? '+' : ''}₹${player.avgPerGame.toLocaleString()}`, color: player.avgPerGame >= 0 ? 'text-green-600' : 'text-red-600' },
                  { label: 'Best Game', value: `+₹${player.bestResult.toLocaleString()}`, color: 'text-green-600' },
                  { label: 'Worst Game', value: `₹${player.worstResult.toLocaleString()}`, color: 'text-red-600' },
                ].map(({ label, value, color }, i, arr) => (
                  <div key={label}>
                    <div className="flex items-center justify-between py-3 px-1">
                      <span className="text-gray-600">{label}</span>
                      <span className={`font-mono ${color}`}>{value}</span>
                    </div>
                    {i < arr.length - 1 && <div className="h-px bg-gray-100" />}
                  </div>
                ))}
              </div>
            )}

            {tab === 'datewise' && (
              <div className="space-y-0 max-h-80 overflow-y-auto">
                {[...player.results].reverse().map((result, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <span className="text-gray-600 text-sm">
                          {new Date(result.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {result.session && <span className="text-xs text-gray-400 ml-2">{result.session}</span>}
                      </div>
                      <span className={`font-mono text-sm ${result.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.amount >= 0 ? '+' : ''}₹{result.amount.toLocaleString()}
                      </span>
                    </div>
                    {i < player.results.length - 1 && <div className="h-px bg-gray-100" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
