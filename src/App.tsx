import { useState, useEffect } from 'react';
import { Navigation, type TabType } from './components/Navigation';
import { HomeTab } from './components/HomeTab';
import { StatsTab } from './components/StatsTab';
import { GamesTab } from './components/GamesTab';
import { PlayerDetailSheet } from './components/PlayerDetailSheet';
import { fetchSheetData } from './lib/googleSheets';
import type { Player, GameSession } from './lib/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSheetData()
      .then(({ players, sessions }) => {
        setPlayers(players);
        setSessions(sessions);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
      <main className="pb-24 min-h-screen">
        {loading && (
          <div className="max-w-lg mx-auto px-4 pt-20 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading leaderboard…</p>
          </div>
        )}
        {error && (
          <div className="max-w-lg mx-auto px-4 pt-20 text-center">
            <p className="text-red-500 mb-2">Failed to load data</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-4">Set VITE_SHEET_CSV_URL in your .env file</p>
          </div>
        )}
        {!loading && !error && (
          <>
            {activeTab === 'home' && <HomeTab players={players} onPlayerClick={setSelectedPlayerId} />}
            {activeTab === 'leaderboard' && <StatsTab players={players} sessions={sessions} onPlayerClick={setSelectedPlayerId} />}
            {activeTab === 'games' && <GamesTab sessions={sessions} players={players} onPlayerClick={setSelectedPlayerId} />}
          </>
        )}
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <PlayerDetailSheet
        player={selectedPlayer}
        open={!!selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
      />
    </div>
  );
}
