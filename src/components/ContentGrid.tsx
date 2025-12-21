
import React from 'react';
import { ContentItem, Series } from '../types';
import ContentCard from './ContentCard';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

interface ContentGridProps {
  items: ContentItem[];
  groups: string[];
  onSelectItem: (item: ContentItem) => void;
  selectedGroup: string | null;
}

// --- Grid Components for VirtuosoGrid ---
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

// --- Main ContentGrid Component ---
const ContentGrid: React.FC<ContentGridProps> = ({ items, groups, onSelectItem, selectedGroup }) => {

  const groupedItems = React.useMemo(() => {
    const groupMap: { [key: string]: ContentItem[] } = {};
    items.forEach(item => {
      const group = item.group || 'Uncategorized';
      if (!groupMap[group]) {
        groupMap[group] = [];
      }
      groupMap[group].push(item);
    });
    return groupMap;
  }, [items]);

  // RENDER A SPECIFIC GROUP (VIRTUALIZED GRID)
  if (selectedGroup) {
    const itemsInGroup = items.filter(i => i.group === selectedGroup);
    return (
      <VirtuosoGrid
        style={{ height: '100%' }}
        totalCount={itemsInGroup.length}
        components={{
            List: GridList,
            Item: GridItem,
        }}
        itemContent={index => (
            <ContentCard item={itemsInGroup[index]} onSelect={onSelectItem} />
        )}
        data={itemsInGroup}
      />
    );
  }

  const filteredGroups = groups.filter(group => groupedItems[group] && groupedItems[group].length > 0);

  // RENDER ALL GROUPS (VIRTUALIZED LIST OF HORIZONTAL SCROLLS)
  return (
    <Virtuoso
        style={{ height: '100%' }}
        data={filteredGroups}
        className="py-6"
        itemContent={(_index, group) => {
            const itemsInGroup = groupedItems[group];
            return (
                <div key={group} className="pb-8">
                    <h2 className="text-xl font-bold text-white px-6 mb-3 capitalize">{group}</h2>
                    <div className="px-6 overflow-x-auto scrollbar-hide">
                        <div className="flex flex-nowrap gap-4 w-max">
                            {itemsInGroup.map(item => (
                                <div key={item.id} className="w-40 flex-shrink-0">
                                    <ContentCard item={item} onSelect={onSelectItem} />
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
