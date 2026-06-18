import { Trophy, Crown, Medal, Award, ChevronRight } from 'lucide-react';
import type { Player, GameSession } from '../lib/types';
import { displayName } from '../lib/displayNames';

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

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeInLast50 = new Set(
    sortedSessions.slice(0, 50).flatMap(s => Object.entries(s.players).filter(([, v]) => v !== 0).map(([k]) => k))
  );
  const activeInLast30 = new Set(
    sortedSessions.slice(0, 30).flatMap(s => Object.entries(s.players).filter(([, v]) => v !== 0).map(([k]) => k))
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
      const totalGames = p.results.length; // use all-time games for inactive check
      const isInactive =
        (!activeInLast50.has(p.name) && totalGames < 20) ||
        (!activeInLast30.has(p.name) && totalGames < 5);
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
    <div className="max-w-lg mx-auto px-3 pt-2 pb-6 space-y-2">

      {/* Podium - Top 3 */}
      {top3.length >= 3 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-gray-900 text-base font-bold mb-4">Top 3 Players</h2>
          <div className="flex items-end justify-evenly">
            {/* 2nd */}
            <button onClick={() => onPlayerClick(top3[1].id)} className="flex flex-col items-center w-20">
              <div className="relative mb-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-3 border-white shadow-md">
                  <Medal className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-sm">
                  <span className="text-gray-600 text-xs font-bold">2</span>
                </div>
              </div>
              <p className="text-gray-900 font-bold truncate w-full text-center text-xs mb-0.5 mt-1">{displayName(top3[1].name)}</p>
              <p className={`font-mono font-semibold text-xs ${top3[1].totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatWithSign(top3[1].totalWinnings)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{top3[1].gamesPlayed} games</p>
            </button>

            {/* 1st */}
            <button onClick={() => onPlayerClick(top3[0].id)} className="flex flex-col items-center w-24 -mt-4">
              <Crown className="w-6 h-6 text-yellow-500 mb-1" />
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-3 border-white shadow-lg">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white border-2 border-yellow-400 flex items-center justify-center shadow-sm">
                  <span className="text-orange-600 text-xs font-bold">1</span>
                </div>
              </div>
              <p className="text-gray-900 font-bold truncate w-full text-center text-sm mb-0.5 mt-1">{displayName(top3[0].name)}</p>
              <p className={`font-mono font-semibold text-sm ${top3[0].totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatWithSign(top3[0].totalWinnings)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{top3[0].gamesPlayed} games</p>
            </button>

            {/* 3rd */}
            <button onClick={() => onPlayerClick(top3[2].id)} className="flex flex-col items-center w-20">
              <div className="relative mb-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center border-3 border-white shadow-md">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-orange-300 flex items-center justify-center shadow-sm">
                  <span className="text-orange-600 text-xs font-bold">3</span>
                </div>
              </div>
              <p className="text-gray-900 font-bold truncate w-full text-center text-xs mb-0.5 mt-1">{displayName(top3[2].name)}</p>
              <p className={`font-mono font-semibold text-xs ${top3[2].totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatWithSign(top3[2].totalWinnings)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{top3[2].gamesPlayed} games</p>
            </button>
          </div>
        </div>
      )}

      {/* 4th onwards */}
      <div className="space-y-1.5">
        {rest.map((player, index) => {
          const rank = index + 4;
          return (
            <button
              key={player.id}
              onClick={() => onPlayerClick(player.id)}
              className="w-full bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-gray-100 text-gray-500 flex-shrink-0">
                {rank}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-gray-900 font-bold text-sm truncate">{displayName(player.name)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{player.gamesPlayed} games</p>
              </div>
              <p className={`font-mono font-semibold text-sm ${player.totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatWithSign(player.totalWinnings)}
              </p>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
