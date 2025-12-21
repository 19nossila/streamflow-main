
import React from 'react';
import { Search, Star, ArrowLeft } from 'lucide-react';

interface SidebarProps {
  groups: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  channelCount: number;
  onBackToMenu: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  groups, 
  searchQuery, 
  setSearchQuery, 
  selectedGroup, 
  setSelectedGroup, 
  channelCount, 
  onBackToMenu
}) => {
  return (
    <div className="w-full md:w-85 bg-[#0f1117] flex flex-col h-full border-r border-white/5 shadow-2xl">
      
      {/* Header */}
      <div className="p-5 pb-3 space-y-4 shrink-0 bg-[#0f1117]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={onBackToMenu} className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent">
                STREAMFLOW
            </h1>
          </div>
          <div className="flex gap-2 text-gray-500">
            <Star size={16} className="hover:text-yellow-500 cursor-pointer transition-colors" />
          </div>
        </div>

        <div className="relative group">
            <input 
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 outline-none transition-all placeholder:text-gray-600"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
        </div>
      </div>

      {/* Group Filters as a scrollable list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-5 pt-0">
        <button onClick={() => setSelectedGroup(null)} className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-lg transition-all ${!selectedGroup ? 'bg-red-600/10 text-red-400' : 'text-gray-400 hover:bg-white/5'}`}>
          All Categories
        </button>
        {groups.map(group => (
          <button key={group} onClick={() => setSelectedGroup(group)} className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-lg transition-all ${selectedGroup === group ? 'bg-red-600/10 text-red-400' : 'text-gray-400 hover:bg-white/5'}`}>
            {group}
          </button>
        ))}
      </div>

      {/* Footer Stats */}
       <div className="p-5 pt-3 mt-auto border-t border-white/5 shrink-0">
        <div className="flex justify-between text-[11px] text-gray-500 font-bold uppercase tracking-widest">
          <span>Channels</span>
          <span className="text-red-500">{channelCount}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
