
import React from 'react';
import { Channel } from '../types';
import ChannelCard from './ChannelCard';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

interface ContentGridProps {
  channels: Channel[];
  groups: string[];
  onSelectChannel: (channel: Channel) => void;
  selectedGroup: string | null;
}

const GridList = React.forwardRef<HTMLDivElement>(({ children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-6"
    >
      {children}
    </div>
));

const GridItem = ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>
      {children}
    </div>
);


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

  // If a group is selected, use VirtuosoGrid for a virtualized grid
  if (selectedGroup) {
    return (
      <VirtuosoGrid
        style={{ height: '100%' }}
        totalCount={channels.length}
        components={{
            List: GridList,
            Item: GridItem,
        }}
        itemContent={index => (
            <ChannelCard channel={channels[index]} onSelect={onSelectChannel} />
        )}
        data={channels}
      />
    );
  }

  const filteredGroups = groups.filter(group => groupedChannels[group] && groupedChannels[group].length > 0);

  // Otherwise, use Virtuoso for a virtualized list of horizontal rows
  return (
    <Virtuoso
        style={{ height: '100%' }}
        data={filteredGroups}
        className="py-6"
        itemContent={(_index, group) => {
            const channelsInGroup = groupedChannels[group];
            return (
                <div key={group} className="pb-8">
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
        }}
    />
  );
};

export default ContentGrid;
