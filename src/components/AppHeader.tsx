
import React from 'react';
import { User } from '../types';

export type ViewType = 'live' | 'movies' | 'series';

interface AppHeaderProps {
  user: User | null;
  currentView: ViewType;
  onNavClick: (view: ViewType) => void;
  onLogout: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ user, currentView, onNavClick, onLogout }) => {

  const navs: { key: ViewType, label: string, icon: string }[] = [
    { key: 'live', label: 'Live TV', icon: 'fa-tv' },
    { key: 'movies', label: 'Movies', icon: 'fa-film' },
    { key: 'series', label: 'Series', icon: 'fa-video' },
  ];

  return (
    <div className="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
      <div className="flex items-center gap-2 md:gap-6">
        <div className="font-bold text-xl text-red-500 flex items-center gap-2">
          <i className="fas fa-play-circle"></i>
          <span className="hidden sm:inline">StreamFlow</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2 bg-gray-800 rounded-lg p-1">
            {navs.map(nav => (
                <button 
                    key={nav.key}
                    onClick={() => onNavClick(nav.key)}
                    className={`px-3 py-1.5 md:px-4 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${currentView === nav.key ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}>
                    <i className={`fas ${nav.icon}`}></i>
                    <span className="hidden md:inline">{nav.label}</span>
                </button>
            ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-white">{user?.username}</p>
            <p className="text-xs text-gray-400">Expires: {user?.exp_date ? new Date(Number(user.exp_date) * 1000).toLocaleDateString() : 'N/A'}</p>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <i className="fas fa-sign-out-alt text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default AppHeader;
