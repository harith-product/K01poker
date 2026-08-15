import { useState, useEffect } from 'react';
import { AdminLogin } from './admin/AdminLogin';
import { AdminHome } from './admin/AdminHome';
import { CreateSession } from './admin/CreateSession';
import { SessionDetails } from './admin/SessionDetails';
import { OnlineSessionDetails } from './admin/OnlineSessionDetails';
import { ManageMembers } from './admin/ManageMembers';
import { PastSessions } from './admin/PastSessions';
import { PastSessionDetails } from './admin/PastSessionDetails';
import { RecordPayment } from './admin/RecordPayment';
import { getMembers, getSessions } from '../lib/adminData';
import type { Member } from '../lib/adminData';

export type AdminScreen =
  | 'login' | 'home' | 'createSessionOffline' | 'createSessionOnline' | 'createSessionTournament'
  | 'createSessionOfflineTournament' | 'sessionDetails'
  | 'manageMembers' | 'pastSessions' | 'pastSessionDetails' | 'recordPayment';

const ADMIN_SCREEN_KEY = 'adminScreen';
const ADMIN_SESSION_KEY = 'adminSelectedSessionId';

function readAdminSession(): { loggedIn: boolean; adminId: string } {
  const data = localStorage.getItem('adminSession');
  if (!data) return { loggedIn: false, adminId: '' };
  const { timestamp, id } = JSON.parse(data);
  if (Date.now() - timestamp >= 60 * 60 * 1000) {
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem(ADMIN_SCREEN_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return { loggedIn: false, adminId: '' };
  }
  return { loggedIn: true, adminId: id ?? '' };
}

function initialAdminScreen(loggedIn: boolean): AdminScreen {
  if (!loggedIn) return 'login';
  const saved = sessionStorage.getItem(ADMIN_SCREEN_KEY) as AdminScreen | null;
  return saved && saved !== 'login' ? saved : 'home';
}

function SessionRouter({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const [gameType, setGameType] = useState<'online' | 'offline' | 'tournament' | 'offline_tournament' | null>(null);

  useEffect(() => {
    getSessions().then(sessions => {
      const s = sessions.find(x => x.id === sessionId);
      setGameType(s?.gameType ?? 'offline');
    });
  }, [sessionId]);

  if (!gameType) return <div className="max-w-lg mx-auto px-4 pt-20 text-center text-gray-400">Loading…</div>;
  if (gameType === 'online' || gameType === 'tournament' || gameType === 'offline_tournament') {
    return <OnlineSessionDetails sessionId={sessionId} onBack={onBack} />;
  }
  return <SessionDetails sessionId={sessionId} onBack={onBack} />;
}

export function AdminTab() {
  const initial = readAdminSession();
  const [isLoggedIn, setIsLoggedIn] = useState(initial.loggedIn);
  const [adminId, setAdminId] = useState(initial.adminId);
  const [screen, setScreen] = useState<AdminScreen>(() => initialAdminScreen(initial.loggedIn));
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY),
  );
  const [prefetchedMembers, setPrefetchedMembers] = useState<Member[]>([]);

  useEffect(() => {
    getMembers().then(setPrefetchedMembers);
  }, []);

  function handleLogin(id: string) {
    localStorage.setItem('adminSession', JSON.stringify({ timestamp: Date.now(), id }));
    setAdminId(id);
    setIsLoggedIn(true);
    setScreen('home');
  }

  function handleLogout() {
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem(ADMIN_SCREEN_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsLoggedIn(false);
    setScreen('login');
  }

  function navigateTo(s: AdminScreen, sessionId?: string) {
    setScreen(s);
    sessionStorage.setItem(ADMIN_SCREEN_KEY, s);
    if (sessionId) {
      setSelectedSessionId(sessionId);
      sessionStorage.setItem(ADMIN_SESSION_KEY, sessionId);
    }
  }

  if (!isLoggedIn) return <AdminLogin onLoginSuccess={handleLogin} />;

  return (
    <>
      {screen === 'home' && <AdminHome onNavigate={navigateTo} onLogout={handleLogout} />}
      {screen === 'createSessionOffline' && (
        <CreateSession gameType="offline" onBack={() => navigateTo('home')}
          onSessionCreated={id => navigateTo('sessionDetails', id)}
          prefetchedMembers={prefetchedMembers} />
      )}
      {screen === 'createSessionOnline' && (
        <CreateSession gameType="online" onBack={() => navigateTo('home')}
          onSessionCreated={id => navigateTo('sessionDetails', id)}
          prefetchedMembers={prefetchedMembers} />
      )}
      {screen === 'createSessionTournament' && (
        <CreateSession gameType="tournament" onBack={() => navigateTo('home')}
          onSessionCreated={id => navigateTo('sessionDetails', id)}
          prefetchedMembers={prefetchedMembers} />
      )}
      {screen === 'createSessionOfflineTournament' && (
        <CreateSession gameType="offline_tournament" onBack={() => navigateTo('home')}
          onSessionCreated={id => navigateTo('sessionDetails', id)}
          prefetchedMembers={prefetchedMembers} />
      )}
      {screen === 'sessionDetails' && selectedSessionId && (
        <SessionRouter sessionId={selectedSessionId} onBack={() => navigateTo('home')} />
      )}
      {screen === 'manageMembers' && <ManageMembers onBack={() => navigateTo('home')} />}
      {screen === 'pastSessions' && (
        <PastSessions onBack={() => navigateTo('home')} onSelectSession={id => navigateTo('pastSessionDetails', id)} />
      )}
      {screen === 'pastSessionDetails' && selectedSessionId && (
        <PastSessionDetails sessionId={selectedSessionId} onBack={() => navigateTo('pastSessions')} />
      )}
      {screen === 'recordPayment' && (
        <RecordPayment onBack={() => navigateTo('home')} adminId={adminId} />
      )}
    </>
  );
}
