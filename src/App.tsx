import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Navigation, type TabType } from './components/Navigation';
import { HomeTab, type TimePeriod } from './components/HomeTab';
import { StatsTab } from './components/StatsTab';
import { GamesTab } from './components/GamesTab';
import { BalanceTab } from './components/BalanceTab';
import { AdminTab } from './components/AdminTab';
import { PlayerDetailSheet } from './components/PlayerDetailSheet';
import { fetchSheetData, fetchOfflineSheetData, fetchBalanceData, fetchTournamentData } from './lib/googleSheets';
import type { Player, GameSession, BalanceData } from './lib/types';
import { displayName } from './lib/displayNames';

export type GameMode = 'online' | 'offline' | 'combined';
export type GameType = 'cash' | 'tournament';

interface AppData {
  onlinePlayers: Player[];
  onlineSessions: GameSession[];
  tournamentPlayers: Player[];
  tournamentSessions: GameSession[];
  offlinePlayers: Player[];
  offlineSessions: GameSession[];
  balance: BalanceData;
  loading: boolean;
  error: string | null;
}

function useAppData(): AppData {
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);
  const [onlineSessions, setOnlineSessions] = useState<GameSession[]>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<Player[]>([]);
  const [tournamentSessions, setTournamentSessions] = useState<GameSession[]>([]);
  const [offlinePlayers, setOfflinePlayers] = useState<Player[]>([]);
  const [offlineSessions, setOfflineSessions] = useState<GameSession[]>([]);
  const [balance, setBalance] = useState<BalanceData>({ owesHouse: [], houseOwes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOfflineSheetData()
      .then(offline => { setOfflinePlayers(offline.players); setOfflineSessions(offline.sessions); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });

    fetchSheetData()
      .then(online => { setOnlinePlayers(online.players); setOnlineSessions(online.sessions); })
      .catch(() => {});

    fetchTournamentData()
      .then(t => { setTournamentPlayers(t.players); setTournamentSessions(t.sessions); })
      .catch(() => {});

    fetchBalanceData()
      .then(bal => setBalance(bal))
      .catch(() => {});
  }, []);

  return { onlinePlayers, onlineSessions, tournamentPlayers, tournamentSessions, offlinePlayers, offlineSessions, balance, loading, error };
}

function PlayerPage({ data }: { data: AppData }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const mode = (localStorage.getItem('gameMode') as GameMode) ?? 'offline';
  const gameType = (localStorage.getItem('gameType') as GameType) ?? 'cash';
  const activeonlinePlayers = gameType === 'tournament' ? data.tournamentPlayers : data.onlinePlayers;
  const combined = mergePlayers(data.offlinePlayers, activeonlinePlayers);

  let players: Player[];
  let player: Player | null;

  if (mode === 'combined') {
    players = combined;
    player = combined.find(p => p.id === id) ?? null;
  } else {
    const source = mode === 'online' ? activeonlinePlayers : data.offlinePlayers;
    players = source;
    player = source.find(p => p.id === id) ?? null;
    if (!player) {
      const other = mode === 'online' ? data.offlinePlayers : activeonlinePlayers;
      player = other.find(p => p.id === id) ?? null;
      if (player) players = other;
    }
  }

  // Show spinner while data hasn't arrived yet (loading or no players fetched yet)
  const stillLoading = data.loading || (data.offlinePlayers.length === 0 && data.onlinePlayers.length === 0);

  if (stillLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-200 via-white to-fuchsia-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-200 via-white to-fuchsia-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Player not found</p>
          <button onClick={() => navigate('/')} className="text-violet-600 font-semibold">← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-200 via-white to-fuchsia-100">
      <div className="max-w-lg mx-auto">
        <PlayerDetailSheet
          player={player}
          allPlayers={players}
          open={true}
          onClose={() => navigate(-1)}
          fullPage
        />
      </div>
    </div>
  );
}

function mergePlayers(offline: Player[], online: Player[]): Player[] {
  const map = new Map<string, Player>();
  [...offline, ...online].forEach(p => {
    const key = displayName(p.name);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...p, name: key, id: key.toLowerCase().replace(/[^a-z0-9]/g, '_') });
    } else {
      const results = [...existing.results, ...p.results].sort((a, b) => a.date.localeCompare(b.date));
      const totalWinnings = results.reduce((s, r) => s + r.amount, 0);
      const gamesPlayed = results.length;
      map.set(key, {
        ...existing,
        results,
        totalWinnings,
        gamesPlayed,
        avgPerGame: gamesPlayed > 0 ? Math.round(totalWinnings / gamesPlayed) : 0,
        bestResult: Math.max(...results.map(r => r.amount)),
        worstResult: Math.min(...results.map(r => r.amount)),
      });
    }
  });
  return [...map.values()];
}

function MainApp({ data }: { data: AppData }) {
  const [activeTab, setActiveTab] = useState<TabType>(() => (localStorage.getItem('activeTab') as TabType) ?? 'home');
  const [mode, setMode] = useState<GameMode>(() => (localStorage.getItem('gameMode') as GameMode) ?? 'offline');
  const [gameType, setGameType] = useState<GameType>(() => (localStorage.getItem('gameType') as GameType) ?? 'cash');
  const [modeOpen, setModeOpen] = useState(false);
  const [period, setPeriod] = useState<TimePeriod>('overall');
  const [periodOpen, setPeriodOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const onlinePlayers = gameType === 'tournament' ? data.tournamentPlayers : data.onlinePlayers;
  const onlineSessions = gameType === 'tournament' ? data.tournamentSessions : data.onlineSessions;

  const combinedPlayers = mergePlayers(data.offlinePlayers, onlinePlayers);
  const combinedSessions = [...data.offlineSessions, ...onlineSessions];

  const players = mode === 'online' ? onlinePlayers : mode === 'offline' ? data.offlinePlayers : combinedPlayers;
  const sessions = mode === 'online' ? onlineSessions : mode === 'offline' ? data.offlineSessions : combinedSessions;

  const handleGameTypeChange = (t: GameType) => {
    setGameType(t);
    localStorage.setItem('gameType', t);
  };

  // Restore scroll position when returning from player page
  useEffect(() => {
    const saved = sessionStorage.getItem('mainScrollTop');
    if (saved && mainRef.current) {
      mainRef.current.scrollTop = parseInt(saved);
      sessionStorage.removeItem('mainScrollTop');
    }
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const handleModeChange = (m: GameMode) => {
    setMode(m);
    localStorage.setItem('gameMode', m);
    if (m === 'offline' && activeTab === 'balance') {
      handleTabChange('home');
    }
    mainRef.current?.scrollTo({ top: 0 });
  };

  const handlePlayerClick = (playerId: string) => {
    if (mainRef.current) sessionStorage.setItem('mainScrollTop', String(mainRef.current.scrollTop));
    navigate(`/player/${playerId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-200 via-white to-fuchsia-100">
      <main ref={mainRef} className="pb-24 min-h-screen overflow-y-auto" style={{ height: '100vh' }}>
        <div className="px-4 pt-3 pb-1">
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <h1 className="text-gray-900 text-2xl font-bold">K01 Poker</h1>
            <div className="relative">
              <button
                onClick={() => setModeOpen(o => !o)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg shadow-sm border border-gray-100"
              >
                <span className="text-teal-600 font-semibold text-sm">
                  {mode === 'online' ? 'Online' : mode === 'offline' ? 'Offline' : 'Combined'}
                </span>
                <svg className="w-3.5 h-3.5 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {modeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setModeOpen(false)} />
                  <div className="absolute left-0 mt-1 bg-white rounded-xl shadow-lg z-20 min-w-[130px] overflow-hidden border border-gray-100">
                    {(['offline', 'online', 'combined'] as GameMode[]).map(m => (
                      <button key={m} onClick={() => { handleModeChange(m); setModeOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 capitalize ${mode === m ? 'font-bold text-teal-600' : 'text-gray-700'}`}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Cash / Tournament toggle — when Online or Combined */}
            {(mode === 'online' || mode === 'combined') && (
              <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-100 p-0.5">
                <button
                  onClick={() => handleGameTypeChange('cash')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${gameType === 'cash' ? 'bg-teal-500 text-white' : 'text-gray-500'}`}
                >
                  Cash
                </button>
                <button
                  onClick={() => handleGameTypeChange('tournament')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${gameType === 'tournament' ? 'bg-teal-500 text-white' : 'text-gray-500'}`}
                >
                  Tourn.
                </button>
              </div>
            )}
            {activeTab === 'home' && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setPeriodOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-100 text-sm font-medium text-gray-700"
                >
                  {period === 'overall' ? 'Overall' : period === '30days' ? 'Last 30 days' : period === '7days' ? 'Last 7 days' : 'All players'}
                  <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {periodOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
                    <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg z-20 min-w-[170px] overflow-hidden border border-gray-100">
                      {(['overall', '30days', '7days', 'all'] as TimePeriod[]).map(p => (
                        <button key={p} onClick={() => { setPeriod(p); setPeriodOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${period === p ? 'font-bold text-violet-600' : 'text-gray-700'}`}>
                          {p === 'overall' ? 'Overall' : p === '30days' ? 'Last 30 days' : p === '7days' ? 'Last 7 days' : 'Add inactive players'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {data.loading && (
          <div className="max-w-lg mx-auto px-4 pt-20 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading leaderboard…</p>
          </div>
        )}
        {data.error && (
          <div className="max-w-lg mx-auto px-4 pt-20 text-center">
            <p className="text-red-500 mb-2">Failed to load data</p>
            <p className="text-gray-500 text-sm">{data.error}</p>
          </div>
        )}
        {!data.loading && !data.error && (
          <>
            {activeTab === 'home' && <HomeTab players={players} sessions={sessions} onPlayerClick={handlePlayerClick} period={period} />}
            {activeTab === 'leaderboard' && <StatsTab players={players} sessions={sessions} onPlayerClick={handlePlayerClick} />}
            {activeTab === 'games' && <GamesTab sessions={sessions} players={players} onPlayerClick={handlePlayerClick} />}
            {activeTab === 'balance' && <BalanceTab onlinePlayers={data.onlinePlayers} mode={mode} />}
            {activeTab === 'admin' && <AdminTab mode={mode} onlinePlayers={data.onlinePlayers} recentSessionsPlayers={
              [...(data.offlineSessions.length ? data.offlineSessions : data.onlineSessions)]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(s => Object.entries(s.players).filter(([, v]) => v !== 0).map(([k]) => k))
            } />}
          </>
        )}
      </main>

      <Navigation activeTab={activeTab} setActiveTab={handleTabChange} mode={mode} />
    </div>
  );
}

export default function App() {
  const data = useAppData();

  return (
    <Routes>
      <Route path="/" element={<MainApp data={data} />} />
      <Route path="/player/:id" element={<PlayerPage data={data} />} />
    </Routes>
  );
}
