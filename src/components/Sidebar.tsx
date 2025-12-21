
import React from 'react';
import { Channel } from '../types';
import { FixedSizeList } from 'react-window';
import { Search, Tv, Film, PlayCircle, Star } from 'lucide-react';

interface SidebarProps {
  channels: Channel[];
  groups: string[];
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
}

const Row = ({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
    const { channels, currentChannel, onSelectChannel } = data;
    const channel = channels[index];
    const isSelected = currentChannel?.url === channel.url;

    const groupLower = channel.group?.toLowerCase() || '';
    const isMovie = groupLower.includes('movie') || groupLower.includes('filme');
    const isSeries = groupLower.includes('series') || groupLower.includes('serie');
    
    return (
        <div style={style}>
            <button 
                onClick={() => onSelectChannel(channel)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                  isSelected 
                  ? 'bg-red-500/10 border-red-500 shadow-inner' 
                  : 'border-transparent hover:bg-white/5'
                }`}
            >
                <div className="relative flex-shrink-0">
                  {channel.logo ? (
                    <img 
                      src={channel.logo} 
                      alt={channel.name} 
                      className="w-12 h-12 object-contain rounded-lg bg-black/40 border border-white/10" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                      }} 
                    />
                  ) : null}
                  <div className={`fallback-icon ${channel.logo ? 'hidden' : ''} w-12 h-12 flex items-center justify-center bg-gray-700 rounded-lg text-gray-400`}>
                    {isMovie ? <Film size={24} /> : isSeries ? <PlayCircle size={24} /> : <Tv size={24} />}
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse" />
                  )}
                </div>
                
                <div className="overflow-hidden flex-1">
                    <p className={`font-medium truncate text-sm ${isSelected ? 'text-red-400' : 'text-gray-100'}`}>
                      {channel.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-black/30 px-1.5 py-0.5 rounded border border-white/5 truncate max-w-full">
                        {channel.group || 'General'}
                      </span>
                    </div>
                </div>
            </button>
        </div>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ 
  channels, 
  groups, 
  currentChannel, 
  onSelectChannel, 
  searchQuery, 
  setSearchQuery, 
  selectedGroup, 
  setSelectedGroup 
}) => {

  return (
    <div className="w-full md:w-85 bg-[#0f1117] flex flex-col h-full border-r border-white/5 shadow-2xl">
      
      {/* Header */}
      <div className="p-5 pb-3 space-y-4 shrink-0 bg-[#0f1117]">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent">
            STREAMFLOW
          </h1>
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

      {/* Group Filters */}
      <div className="px-5 pb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          <button onClick={() => setSelectedGroup(null)} className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${!selectedGroup ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            All
          </button>
          {groups.map(group => (
            <button key={group} onClick={() => setSelectedGroup(group)} className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${selectedGroup === group ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
       <div className="px-5 py-2 text-[11px] text-gray-500 font-bold uppercase tracking-widest bg-black/20 border-y border-white/5 shrink-0 flex justify-between">
        <span>Channels</span>
        <span className="text-red-500">{channels.length}</span>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-hidden">
        {channels.length > 0 ? (
             <FixedSizeList
                height={window.innerHeight - 250} // Adjust height to account for new layout
                itemCount={channels.length}
                itemSize={76}
                width="100%"
                className="scrollbar-hide"
                itemData={{
                    channels: channels,
                    currentChannel,
                    onSelectChannel
                }}
            >
                {Row}
            </FixedSizeList>
        ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-40">
                <Search size={48} className="mb-4" />
                <p className="text-sm font-medium">No results found</p>
                <p className="text-xs mt-1">Try a different search term or select another category</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;