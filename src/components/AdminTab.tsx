import { useState, useEffect } from 'react';
import { AdminLogin } from './admin/AdminLogin';
import { AdminHome } from './admin/AdminHome';
import { CreateSession } from './admin/CreateSession';
import { CurrentSession } from './admin/CurrentSession';
import { SessionDetails } from './admin/SessionDetails';
import { ManageMembers } from './admin/ManageMembers';
import { PastSessions } from './admin/PastSessions';
import { PastSessionDetails } from './admin/PastSessionDetails';
import { RecordPayment } from './admin/RecordPayment';
import { getMembers } from '../lib/adminData';
import type { Member } from '../lib/adminData';

export type AdminScreen =
  | 'login' | 'home' | 'createSession' | 'sessionDetails'
  | 'currentSession' | 'manageMembers' | 'pastSessions' | 'pastSessionDetails'
  | 'recordPayment';

export function AdminTab({ recentSessionsPlayers = [] }: { recentSessionsPlayers?: string[][] }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [screen, setScreen] = useState<AdminScreen>('login');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [prefetchedMembers, setPrefetchedMembers] = useState<Member[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('adminSession');
    if (data) {
      const { timestamp, id } = JSON.parse(data);
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        setAdminId(id ?? '');
        setIsLoggedIn(true);
        setScreen('home');
      } else {
        localStorage.removeItem('adminSession');
      }
    }
    // Prefetch members immediately so CreateSession loads instantly
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
    setIsLoggedIn(false);
    setScreen('login');
  }

  function navigateTo(s: AdminScreen, sessionId?: string) {
    setScreen(s);
    if (sessionId) setSelectedSessionId(sessionId);
  }

  if (!isLoggedIn) return <AdminLogin onLoginSuccess={handleLogin} />;

  return (
    <>
      {screen === 'home' && <AdminHome onNavigate={navigateTo} onLogout={handleLogout} />}
      {screen === 'createSession' && (
        <CreateSession onBack={() => navigateTo('home')} onSessionCreated={id => navigateTo('sessionDetails', id)} recentSessionsPlayers={recentSessionsPlayers} prefetchedMembers={prefetchedMembers} />
      )}
      {screen === 'sessionDetails' && selectedSessionId && (
        <SessionDetails sessionId={selectedSessionId} onBack={() => navigateTo('home')} />
      )}
      {screen === 'currentSession' && (
        <CurrentSession onBack={() => navigateTo('home')} onOpenSession={id => navigateTo('sessionDetails', id)} onNavigate={navigateTo} />
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
