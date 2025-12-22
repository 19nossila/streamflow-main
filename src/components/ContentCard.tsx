
import React from 'react';
import { ContentItem } from '../types';
import { Tv, Film, PlayCircle } from 'lucide-react';

interface ContentCardProps {
  item: ContentItem;
  onSelect: (item: ContentItem) => void;
}

const ContentCard: React.FC<ContentCardProps> = ({ item, onSelect }) => {
    
    const getTypeBadge = () => {
        switch (item.type) {
            case 'series':
                return <span className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">SERIES</span>;
            case 'movie':
                return <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">MOVIE</span>;
            case 'live':
                return <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">LIVE</span>;
            default:
                return null;
        }
    }

    const getFallbackIcon = () => {
         switch (item.type) {
            case 'series':
                return <PlayCircle size={40} />;
            case 'movie':
                return <Film size={40} />;
            case 'live':
                return <Tv size={40} />;
            default:
                return <Tv size={40}/>;
        }
    }

    return (
        <button 
            onClick={() => onSelect(item)}
            className="group relative w-full aspect-[2/3] bg-white/5 rounded-lg overflow-hidden transition-transform duration-300 transform hover:scale-105 hover:z-10 shadow-lg"
        >
            {item.logo ? (
                <img 
                    src={item.logo} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.fallback-icon-container');
                        fallback?.classList.remove('hidden');
                    }}
                />
            ) : null}
            <div className={`fallback-icon-container ${item.logo ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gray-800`}>
                 <div className="text-gray-500">
                    {getFallbackIcon()}
                 </div>
            </div>

            {/* Content Type Badge */}
            {getTypeBadge()}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-0 left-0 p-3 w-full">
                <h3 className="text-white text-sm font-bold truncate opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    {item.title}
                </h3>
            </div>
        </button>
    );
};

export default ContentCard;
