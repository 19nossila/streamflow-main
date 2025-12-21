
import React from 'react';
import { List, Users, Settings } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'playlists' | 'users' | 'settings';
  onTabChange: (tab: 'playlists' | 'users' | 'settings') => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'playlists', icon: <List size={24} />, label: 'Playlists' },
    { id: 'users', icon: <Users size={24} />, label: 'Users' },
    { id: 'settings', icon: <Settings size={24} />, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 md:hidden flex justify-around items-center p-2 shadow-lg">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id as 'playlists' | 'users' | 'settings')}
          className={`flex flex-col items-center justify-center w-full py-2 rounded-md transition-colors ${
            activeTab === item.id ? 'text-red-500' : 'text-gray-400 hover:bg-gray-700'
          }`}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavBar;
