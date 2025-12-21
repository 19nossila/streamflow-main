
import React from 'react';
import { Search, ArrowLeft, LogOut, LayoutDashboard, Database, Wand2 } from 'lucide-react';

interface SidebarProps {
  groups: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  itemCount: number;
  onBackToMenu: () => void;
  onLogout: () => void;
  onGoToDashboard: () => void;
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  groups, 
  searchQuery, 
  setSearchQuery, 
  selectedGroup, 
  setSelectedGroup, 
  itemCount, 
  onBackToMenu,
  onLogout,
  onGoToDashboard,
  isAdmin
}) => {
  return (
    <div className="w-full md:w-64 bg-[#0f1117] flex flex-col h-full border-r border-white/5 shadow-2xl text-gray-300">
      
      {/* --- Header --- */}
      <div className="p-5 pb-3 space-y-4 shrink-0">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Wand2 size={24} className="text-red-500"/>
                <h1 className="text-lg font-black tracking-tighter text-white">
                    STREAMFLOW
                </h1>
            </div>
        </div>

        <div className="relative group">
            <input 
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 outline-none transition-all placeholder:text-gray-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
        </div>
      </div>

      {/* --- Group Filters --- */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-5 pt-2">
        <p className="text-xs font-bold uppercase text-gray-500 px-3 pb-2 tracking-wider">Categories</p>
        <button onClick={() => setSelectedGroup(null)} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-between ${!selectedGroup ? 'bg-red-600/10 text-red-400' : 'hover:bg-white/5'}`}>
          <span>All Content</span>
        </button>
        {groups.map(group => (
          <button key={group} onClick={() => setSelectedGroup(group)} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-md transition-all ${selectedGroup === group ? 'bg-red-600/10 text-red-400' : 'hover:bg-white/5'}`}>
            {group}
          </button>
        ))}
      </div>

      {/* --- Footer & Actions --- */}
       <div className="p-5 pt-3 mt-auto border-t border-white/5 shrink-0 space-y-4">
        <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
          <span>ITEMS</span>
          <span className="text-red-400">{itemCount}</span>
        </div>
        <div className="flex flex-col gap-2 text-sm">
            <button onClick={onBackToMenu} className="flex items-center gap-3 w-full h-10 px-3 rounded-md hover:bg-white/5 font-semibold transition-colors">
                <Database size={16}/>
                <span>Change Playlist</span>
            </button>
            {isAdmin && (
                 <button onClick={onGoToDashboard} className="flex items-center gap-3 w-full h-10 px-3 rounded-md hover:bg-white/5 font-semibold transition-colors">
                    <LayoutDashboard size={16}/>
                    <span>Admin Dashboard</span>
                </button>
            )}
            <button onClick={onLogout} className="flex items-center gap-3 w-full h-10 px-3 rounded-md hover:bg-white/5 font-semibold transition-colors">
                <LogOut size={16}/>
                <span>Logout</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
