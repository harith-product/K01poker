import { Home, BarChart2, Calendar, Wallet, Shield } from 'lucide-react';

export type TabType = 'home' | 'leaderboard' | 'games' | 'balance' | 'admin';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', Icon: Home },
    { id: 'leaderboard' as TabType, label: 'Stats', Icon: BarChart2 },
    { id: 'games' as TabType, label: 'Games', Icon: Calendar },
    { id: 'balance' as TabType, label: 'Balance', Icon: Wallet },
    { id: 'admin' as TabType, label: 'Admin', Icon: Shield },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center py-3 gap-1 transition-all"
            >
              <Icon className={`w-5 h-5 ${active ? 'text-purple-600' : 'text-gray-400'}`} />
              <span className={`text-xs ${active ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
