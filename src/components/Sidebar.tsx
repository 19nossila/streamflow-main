
import React, { useState, useMemo, useEffect } from 'react';
import { Channel, Category } from '../types';
import { FixedSizeList } from 'react-window';

interface SidebarProps {
  channels: Channel[];
  categories: Category[];
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}

// A single row in the channel list
const ChannelRow = ({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
    const { channels, currentChannel, onSelectChannel } = data;
    const channel = channels[index];
    const isSelected = currentChannel?.stream_id === channel.stream_id;

    return (
        <div style={style}>
            <button 
                onClick={() => onSelectChannel(channel)}
                className={`w-full text-left px-3 py-3 flex items-center gap-3 transition-colors duration-150 ${isSelected ? 'bg-red-700' : 'hover:bg-gray-700/50'}`}
            >
                <img 
                    src={channel.stream_icon || 'https://i.imgur.com/LhB23B7.png'} 
                    alt="" 
                    className="w-10 h-10 object-contain rounded-md bg-gray-900/50 flex-shrink-0"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://i.imgur.com/LhB23B7.png'; }}
                />
                <div className="overflow-hidden">
                    <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{channel.name}</p>
                </div>
            </button>
        </div>
    );
};

const ALL_CATEGORIES: Category = { category_id: 'all', category_name: 'All Channels', parent_id: 0 };

const Sidebar: React.FC<SidebarProps> = ({ channels, categories, currentChannel, onSelectChannel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(ALL_CATEGORIES);

  // When categories load, if there's a current channel, find and select its category
  useEffect(() => {
    if (currentChannel && categories.length > 0) {
        const currentCategory = categories.find(c => c.category_id === currentChannel.category_id);
        if (currentCategory) {
            setSelectedCategory(currentCategory);
        }
    }
  }, [currentChannel, categories]);

  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const matchesCategory = selectedCategory.category_id === 'all' || channel.category_id === selectedCategory.category_id;
      const matchesSearch = searchTerm === '' || channel.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [channels, searchTerm, selectedCategory]);

  const allCategories = [ALL_CATEGORIES, ...categories];

  return (
    <div className="w-full md:w-[450px] bg-gray-800 flex h-full border-r border-gray-700">
        {/* Categories Column */}
        <div className="w-40 bg-gray-900 flex-shrink-0 flex flex-col">
            <div className="h-14 border-b border-gray-700/50 flex items-center justify-center font-bold text-gray-300 text-sm">Categories</div>
            <div className="flex-1 overflow-y-auto">
                {allCategories.map(cat => (
                    <button 
                        key={cat.category_id}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left text-sm px-3 py-2 transition-colors ${selectedCategory.category_id === cat.category_id ? 'bg-red-600 text-white font-semibold' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}>
                        {cat.category_name}
                    </button>
                ))}
            </div>
        </div>

        {/* Channels Column */}
        <div className="flex-1 flex flex-col">
            <div className="p-2 border-b border-gray-700 shrink-0">
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    />
                    <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                </div>
            </div>

            <div className="px-3 py-1.5 text-xs text-gray-400 font-medium bg-gray-900/20 border-b border-gray-700 shrink-0">
                {filteredChannels.length} channel{filteredChannels.length !== 1 && 's'} in {selectedCategory.category_name}
            </div>

            <div className="flex-1 overflow-hidden bg-gray-800">
                {filteredChannels.length > 0 ? (
                    <FixedSizeList
                        height={window.innerHeight} // This will be dynamically calculated
                        itemCount={filteredChannels.length}
                        itemSize={60} // Height of each ChannelRow
                        width="100%"
                        itemData={{
                            channels: filteredChannels,
                            currentChannel,
                            onSelectChannel
                        }}
                    >
                        {ChannelRow}
                    </FixedSizeList>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <p>No channels found.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Sidebar;
