
import React from 'react';
import { Channel } from '../types';
import { Tv, Film, PlayCircle } from 'lucide-react';

interface ChannelCardProps {
  channel: Channel;
  onSelect: (channel: Channel) => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onSelect }) => {
    const groupLower = channel.group?.toLowerCase() || '';
    const isMovie = groupLower.includes('movie') || groupLower.includes('filme');
    const isSeries = groupLower.includes('series') || groupLower.includes('serie');

    return (
        <button 
            onClick={() => onSelect(channel)}
            className="group relative w-full aspect-[2/3] bg-white/5 rounded-lg overflow-hidden transition-transform duration-300 transform hover:scale-105 hover:z-10 shadow-lg"
        >
            {channel.logo ? (
                <img 
                    src={channel.logo} 
                    alt={channel.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.fallback-icon-container');
                        fallback?.classList.remove('hidden');
                    }}
                />
            ) : null}
            <div className={`fallback-icon-container ${channel.logo ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gray-800`}>
                 <div className="text-gray-500">
                    {isMovie ? <Film size={40} /> : isSeries ? <PlayCircle size={40} /> : <Tv size={40} />}
                 </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-0 left-0 p-3 w-full">
                <h3 className="text-white text-sm font-bold truncate opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    {channel.name}
                </h3>
            </div>
        </button>
    );
};

export default ChannelCard;
