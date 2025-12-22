import React from 'react';
import { ContentItem } from '../types';
import ContentCard from './ContentCard';
import { VirtuosoGrid } from 'react-virtuoso';

interface ContentGridProps {
  items: ContentItem[];
  onSelectItem: (item: ContentItem) => void;
}

// --- Grid Components for VirtuosoGrid ---
// We define them with explicit types for props to ensure type safety.

const GridList = React.forwardRef<HTMLDivElement, React.PropsWithChildren<{}>>(({ children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-6"
    >
      {children}
    </div>
));

const GridItem = ({ children, ...props }: React.PropsWithChildren<{}>) => (
    <div {...props}>
      {children}
    </div>
);

// --- Main ContentGrid Component ---
const ContentGrid: React.FC<ContentGridProps> = ({ items, onSelectItem }) => {
  if (!items || items.length === 0) {
    return <div className="p-6 text-center text-gray-400">No content available in this group.</div>;
  }

  return (
    <VirtuosoGrid
      style={{ height: 'calc(100vh - 8rem)' }} // Adjust height as needed
      totalCount={items.length}
      components={{
        List: GridList,
        Item: GridItem,
      }}
      itemContent={(index) => {
        const item = items[index];
        return (
          <ContentCard 
            item={item} 
            onSelect={() => onSelectItem(item)} 
          />
        );
      }}
    />
  );
};

export default ContentGrid;
