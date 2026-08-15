import { useEffect, useState } from 'react';
import { ChevronRight, Plus, Users, Clock, Zap, LogOut, Wallet, Trophy } from 'lucide-react';
import { getActiveSessions, gameTypeLabel } from '../../lib/adminData';
import type { Session } from '../../lib/adminData';
import type { AdminScreen } from '../AdminTab';

interface AdminHomeProps {
  onNavigate: (screen: AdminScreen, sessionId?: string) => void;
  onLogout: () => void;
  refreshKey?: number;
}

const ACTIVE_CONFIG = [
  { type: 'offline' as const, icon: Zap, gradient: 'from-green-500 to-emerald-500', bg: 'from-green-50 to-emerald-50 hover:from-green-100' },
  { type: 'online' as const, icon: Zap, gradient: 'from-teal-500 to-cyan-500', bg: 'from-teal-50 to-cyan-50 hover:from-teal-100' },
  { type: 'tournament' as const, icon: Trophy, gradient: 'from-amber-500 to-orange-500', bg: 'from-amber-50 to-orange-50 hover:from-amber-100' },
  { type: 'offline_tournament' as const, icon: Trophy, gradient: 'from-orange-500 to-rose-500', bg: 'from-orange-50 to-rose-50 hover:from-orange-100' },
];

const CREATE_CONFIG = [
  { screen: 'createSessionOffline' as const, type: 'offline' as const, title: 'New Offline Cash', subtitle: 'Buy-ins & chip cashout', icon: Plus, gradient: 'from-violet-500 to-fuchsia-500', bg: 'from-violet-50 to-fuchsia-50 hover:from-violet-200' },
  { screen: 'createSessionOnline' as const, type: 'online' as const, title: 'New Online Cash', subtitle: 'Enter chip P&L per player', icon: Plus, gradient: 'from-teal-500 to-cyan-500', bg: 'from-teal-50 to-cyan-50 hover:from-teal-100' },
  { screen: 'createSessionTournament' as const, type: 'tournament' as const, title: 'New Online Tournament', subtitle: 'Enter chip P&L per player', icon: Trophy, gradient: 'from-amber-500 to-orange-500', bg: 'from-amber-50 to-orange-50 hover:from-amber-100' },
  { screen: 'createSessionOfflineTournament' as const, type: 'offline_tournament' as const, title: 'New Offline Tournament', subtitle: 'Enter chip P&L per player', icon: Trophy, gradient: 'from-orange-500 to-rose-500', bg: 'from-orange-50 to-rose-50 hover:from-orange-100' },
];

export function AdminHome({ onNavigate, onLogout, refreshKey }: AdminHomeProps) {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  useEffect(() => {
    getActiveSessions().then(setActiveSessions);
  }, [refreshKey]);

  const activeByType = (type: Session['gameType']) => activeSessions.find(s => s.gameType === type);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          <p className="text-gray-500 text-sm">Manage sessions & members</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white shadow-sm text-gray-500 text-sm border border-gray-100">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm space-y-3">
        {ACTIVE_CONFIG.map(({ type, icon: Icon, gradient, bg }) => {
          const s = activeByType(type);
          if (!s) return null;
          return (
            <button key={type} onClick={() => onNavigate('sessionDetails', s.id)}
              className={`w-full p-4 bg-gradient-to-br ${bg} rounded-2xl text-left`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{gameTypeLabel(type)} Active</h3>
                    <p className="text-sm text-gray-600">{s.members.length} players</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          );
        })}

        {CREATE_CONFIG.map(({ screen, type, title, subtitle, icon: Icon, gradient, bg }) => {
          if (activeByType(type)) return null;
          return (
            <button key={screen} onClick={() => onNavigate(screen)}
              className={`w-full p-4 bg-gradient-to-br ${bg} rounded-2xl text-left`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600">{subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          );
        })}

        <button onClick={() => onNavigate('manageMembers')} className="w-full p-4 bg-gradient-to-br from-blue-50 to-fuchsia-50 rounded-2xl text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Members</h3>
                <p className="text-sm text-gray-600">Add, rename members</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        <button onClick={() => onNavigate('recordPayment')} className="w-full p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Record Payment</h3>
                <p className="text-sm text-gray-600">Settle balance with a player</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        <button onClick={() => onNavigate('pastSessions')} className="w-full p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Past Sessions</h3>
                <p className="text-sm text-gray-600">View previous sessions</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      </div>
    </div>
  );
}
