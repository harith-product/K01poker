import { Gamepad2 } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import type { GameSession, Player } from '../lib/types';

interface GamesTabProps {
  sessions: GameSession[];
  players: Player[];
  onPlayerClick: (playerId: string) => void;
}

export function GamesTab({ sessions, players, onPlayerClick }: GamesTabProps) {
  const uniqueDates = [...new Set(sessions.map(s => s.date))].sort((a, b) => b.localeCompare(a));
  const [selectedDate, setSelectedDate] = useState(uniqueDates[0] ?? '');

  const daysSessions = sessions.filter(s => s.date === selectedDate);

  // Aggregate all sessions for the selected date into a per-player total
  const playerTotals: Record<string, number> = {};
  daysSessions.forEach(session => {
    Object.entries(session.players).forEach(([name, amount]) => {
      if (amount !== 0) {
        playerTotals[name] = (playerTotals[name] ?? 0) + amount;
      }
    });
  });

  const sorted = Object.entries(playerTotals)
    .map(([name, amount]) => {
      const player = players.find(p => p.name === name);
      return { name, amount, playerId: player?.id ?? name };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-gray-900 text-2xl">
          {selectedDate ? `Results for ${format(new Date(selectedDate), 'dd-MMM-yy')}` : 'Games'}
        </h1>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {uniqueDates.map(date => {
            const isSelected = date === selectedDate;
            const dateObj = new Date(date);
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 px-4 py-3 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="text-center">
                  <div className="text-xs mb-1 opacity-80">{format(dateObj, 'MMM')}</div>
                  <div className="font-mono">{format(dateObj, 'dd')}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sessions for the day */}
      {daysSessions.length > 1 && (
        <div className="space-y-2">
          {daysSessions.map((session, i) => {
            const sessionPlayers = Object.entries(session.players)
              .filter(([, v]) => v !== 0)
              .sort(([, a], [, b]) => b - a);
            return (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">{session.session}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {sessionPlayers.map(([name, amount], rank) => {
                    const player = players.find(p => p.name === name);
                    return (
                      <button
                        key={name}
                        onClick={() => player && onPlayerClick(player.id)}
                        className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-gray-50 transition-colors w-full"
                      >
                        <div className="col-span-2 text-gray-500 font-mono text-sm">{rank + 1}</div>
                        <div className="col-span-6 text-gray-900 text-left text-sm">{name}</div>
                        <div className={`col-span-4 font-mono text-right text-sm ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {amount >= 0 ? '+' : ''}{amount.toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Combined totals */}
      {sorted.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="col-span-2 text-xs text-gray-500 uppercase">Rank</div>
            <div className="col-span-6 text-xs text-gray-500 uppercase">Player</div>
            <div className="col-span-4 text-xs text-gray-500 uppercase text-right">
              {daysSessions.length > 1 ? 'Day Total' : 'Winnings'}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {sorted.map(({ name, amount, playerId }, rank) => (
              <button
                key={name}
                onClick={() => onPlayerClick(playerId)}
                className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-gray-50 transition-colors w-full"
              >
                <div className="col-span-2 text-gray-600 font-mono">{rank + 1}</div>
                <div className="col-span-6 text-gray-900 text-left">{name}</div>
                <div className={`col-span-4 font-mono text-right ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {amount >= 0 ? '+' : ''}{amount.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No games on this date</p>
        </div>
      )}
    </div>
  );
}
