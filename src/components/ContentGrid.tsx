
import React from 'react';
import { Channel } from '../types';
import ChannelCard from './ChannelCard';

interface ContentGridProps {
  channels: Channel[];
  groups: string[];
  onSelectChannel: (channel: Channel) => void;
  selectedGroup: string | null;
}

const ContentGrid: React.FC<ContentGridProps> = ({ channels, groups, onSelectChannel, selectedGroup }) => {

  const groupedChannels = React.useMemo(() => {
    const groupMap: { [key: string]: Channel[] } = {};
    channels.forEach(channel => {
      const group = channel.group || 'Uncategorized';
      if (!groupMap[group]) {
        groupMap[group] = [];
      }
      groupMap[group].push(channel);
    });
    return groupMap;
  }, [channels]);

  // If a group is selected, show a simple grid of that group's channels
  if (selectedGroup) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-6">
        {channels.map(channel => (
          <ChannelCard key={channel.url} channel={channel} onSelect={onSelectChannel} />
        ))}
      </div>
    );
  }

  // Otherwise, show channels grouped by category in horizontal rows
  return (
    <div className="space-y-8 py-6">
      {groups.map(group => {
        const channelsInGroup = groupedChannels[group];
        if (!channelsInGroup || channelsInGroup.length === 0) return null;

        return (
          <div key={group}>
            <h2 className="text-xl font-bold text-white px-6 mb-3 capitalize">{group}</h2>
            <div className="px-6 overflow-x-auto scrollbar-hide">
              <div className="flex flex-nowrap gap-4 w-max">
                {channelsInGroup.map(channel => (
                  <div key={channel.url} className="w-40 flex-shrink-0">
                     <ChannelCard channel={channel} onSelect={onSelectChannel} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContentGrid;
