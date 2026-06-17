import { useEffect, useState } from 'react';
import { ChevronRight, Plus, Users, Clock, Zap, LogOut } from 'lucide-react';
import { getActiveSession } from '../../lib/adminData';
import type { Session } from '../../lib/adminData';
import type { AdminScreen } from '../AdminTab';

interface AdminHomeProps {
  onNavigate: (screen: AdminScreen, sessionId?: string) => void;
  onLogout: () => void;
  refreshKey?: number;
}

export function AdminHome({ onNavigate, onLogout, refreshKey }: AdminHomeProps) {
  const [activeSession, setActiveSession] = useState<Session | undefined>(undefined);

  useEffect(() => {
    getActiveSession().then(setActiveSession);
  }, [refreshKey]);

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
        {activeSession ? (
          <button onClick={() => onNavigate('currentSession')} className="w-full p-4 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl transition-all text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Current Session</h3>
                  <p className="text-sm text-gray-600">{activeSession.members.length} players active</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        ) : (
          <div className="w-full p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                <Zap className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-500">Current Session</h3>
                <p className="text-sm text-gray-400">No session running right now</p>
              </div>
            </div>
            <button onClick={() => onNavigate('createSession')} className="mt-3 text-sm text-purple-600 font-medium">
              Create a session →
            </button>
          </div>
        )}

        {activeSession && (
          <button onClick={() => onNavigate('createSession')} className="w-full p-4 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl transition-all text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">New Session</h3>
                  <p className="text-sm text-gray-600">Create a new game session</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        )}

        <button onClick={() => onNavigate('manageMembers')} className="w-full p-4 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl transition-all text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
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

        <button onClick={() => onNavigate('pastSessions')} className="w-full p-4 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 rounded-2xl transition-all text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Past Sessions</h3>
                <p className="text-sm text-gray-600">View and edit previous sessions</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      </div>
    </div>
  );
}
