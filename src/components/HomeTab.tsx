import { Trophy, Crown, Medal, Award, ChevronRight } from 'lucide-react';
import type { Player, GameSession } from '../lib/types';

function formatWithSign(value: number): string {
  const str = value.toLocaleString();
  return value >= 0 ? `+${str}` : str;
}

export type TimePeriod = 'overall' | '30days' | '7days' | 'all';

interface HomeTabProps {
  players: Player[];
  sessions: GameSession[];
  onPlayerClick: (playerId: string) => void;
  period: TimePeriod;
}

function filterByPeriod(players: Player[], sessions: GameSession[], period: TimePeriod): Player[] {
  const now = new Date();
  const cutoff =
    period === '7days'
      ? new Date(now.getTime() - 7 * 86400000)
      : period === '30days'
      ? new Date(now.getTime() - 30 * 86400000)
      : null;

  // For all periods except 'all', hide players inactive in last 60 games with <20 total games
  const last60Sessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 60);
  const activeInLast60 = new Set(
    last60Sessions.flatMap(s => Object.entries(s.players).filter(([, v]) => v !== 0).map(([k]) => k))
  );

  return players
    .map(p => {
      const results = cutoff
        ? p.results.filter(r => new Date(r.date) >= cutoff)
        : p.results;
      const totalWinnings = results.reduce((s, r) => s + r.amount, 0);
      return { ...p, results, totalWinnings, gamesPlayed: results.length };
    })
    .filter(p => {
      if (period === 'all') return true;
      const isInactive = !activeInLast60.has(p.name) && p.gamesPlayed < 20;
      return !isInactive;
    })
    .sort((a, b) => b.totalWinnings - a.totalWinnings);
}


export function HomeTab({ players, sessions, onPlayerClick, period }: HomeTabProps) {

  const sorted = filterByPeriod(players, sessions, period);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  if (players.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center text-gray-500">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No data yet. Connect your Google Sheet to get started.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-4">

      {/* Podium - Top 3 */}
      {top3.length >= 3 && (
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h2 className="text-gray-900 text-xl font-bold mb-6">Top 3 Players</h2>
          <div className="flex items-end justify-evenly">
            {/* 2nd */}
            <button onClick={() => onPlayerClick(top3[1].id)} className="flex flex-col items-center w-24">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-4 border-white shadow-lg">
                  <Medal className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-md">
                  <span className="text-gray-600 text-sm font-bold">2</span>
                </div>
              </div>
              <p className="text-gray-900 font-bold truncate w-full text-center text-sm mb-1">{top3[1].name}</p>
              <p className={`font-mono font-semibold text-sm ${top3[1].totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatWithSign(top3[1].totalWinnings)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{top3[1].gamesPlayed} games</p>
            </button>

            {/* 1st */}
            <button onClick={() => onPlayerClick(top3[0].id)} className="flex flex-col items-center w-28 -mt-6">
              <Crown className="w-8 h-8 text-yellow-500 mb-2" />
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-4 border-white shadow-xl">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border-2 border-yellow-400 flex items-center justify-center shadow-md">
                  <span className="text-orange-600 font-bold">1</span>
                </div>
              </div>
              <p className="text-gray-900 font-bold truncate w-full text-center mb-1">{top3[0].name}</p>
              <p className={`font-mono font-semibold ${top3[0].totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatWithSign(top3[0].totalWinnings)}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">{top3[0].gamesPlayed} games</p>
            </button>

            {/* 3rd */}
            <button onClick={() => onPlayerClick(top3[2].id)} className="flex flex-col items-center w-24">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center border-4 border-white shadow-lg">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-orange-300 flex items-center justify-center shadow-md">
                  <span className="text-orange-600 text-sm font-bold">3</span>
                </div>
              </div>
              <p className="text-gray-900 font-bold truncate w-full text-center text-sm mb-1">{top3[2].name}</p>
              <p className={`font-mono font-semibold text-sm ${top3[2].totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatWithSign(top3[2].totalWinnings)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{top3[2].gamesPlayed} games</p>
            </button>
          </div>
        </div>
      )}

      {/* 4th onwards */}
      <div className="space-y-2">
        {rest.map((player, index) => {
          const rank = index + 4;
          return (
            <button
              key={player.id}
              onClick={() => onPlayerClick(player.id)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gray-100 text-gray-500 flex-shrink-0">
                {rank}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-gray-900 font-bold text-base truncate">{player.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{player.gamesPlayed} games</p>
              </div>
              <p className={`font-mono font-semibold text-base ${player.totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatWithSign(player.totalWinnings)}
              </p>
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
