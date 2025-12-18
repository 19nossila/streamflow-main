import React, { useState, useMemo } from 'react';
import { Channel } from '../types';
import { FixedSizeList } from 'react-window';

interface SidebarProps {
  channels: Channel[];
  groups: string[];
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}

// A single row in our virtualized list
const Row = ({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
    const { channels, currentChannel, onSelectChannel } = data;
    const channel = channels[index];

    const isSelected = currentChannel?.url === channel.url;

    return (
        <div style={style}>
            <button 
                onClick={() => onSelectChannel(channel)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-150 ${isSelected ? 'bg-red-800/50' : 'hover:bg-gray-700/50'}`}
            >
                {channel.logo && <img src={channel.logo} alt={channel.name} className="w-10 h-10 object-contain rounded-full bg-gray-900/50 flex-shrink-0" onError={(e) => e.currentTarget.src = 'https://i.imgur.com/LhB23B7.png'} />}
                <div className="overflow-hidden">
                    <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{channel.name}</p>
                    <p className="text-xs text-gray-400">{channel.group}</p>
                </div>
            </button>
        </div>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ channels, groups, currentChannel, onSelectChannel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All Categories');

  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const matchesGroup = selectedGroup === 'All Categories' || channel.group === selectedGroup;
      const matchesSearch = searchTerm === '' || channel.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [channels, searchTerm, selectedGroup]);

  return (
    <div className="w-full md:w-80 bg-gray-800 flex flex-col h-full border-r border-gray-700">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-700 shrink-0">
        <div className="relative">
            <input 
                type="text"
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-red-500 outline-none"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
        <div className="mt-3 relative">
            <select 
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white appearance-none focus:ring-2 focus:ring-red-500 outline-none"
            >
                <option value="All Categories">All Categories</option>
                {groups.map(group => <option key={group} value={group}>{group}</option>)}
            </select>
             <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
        </div>
      </div>

      {/* Channel Count */}
       <div className="px-4 py-2 text-sm text-gray-400 font-medium bg-gray-900/40 border-b border-gray-700 shrink-0">
        {filteredChannels.length} channel{filteredChannels.length !== 1 && 's'} found
      </div>

      {/* Channel List - VIRTUALIZED */}
      <div className="flex-1 overflow-hidden">
        {filteredChannels.length > 0 ? (
             <FixedSizeList
                height={window.innerHeight - 200} // Example height, adjust as needed
                itemCount={filteredChannels.length}
                itemSize={68} // The height of each `Row` component (px-4 py-3 = 16+12=28, plus img height)
                width="100%"
                itemData={{
                    channels: filteredChannels,
                    currentChannel,
                    onSelectChannel
                }}
            >
                {Row}
            </FixedSizeList>
        ) : (
            <div className="p-8 text-center text-gray-500">
                <i className="fas fa-inbox text-4xl mb-3"></i>
                <p>No channels match your criteria.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
