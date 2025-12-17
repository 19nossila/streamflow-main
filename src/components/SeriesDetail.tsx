
import React, { useState, useMemo } from 'react';
import { SeriesInfo, Episode, Season } from '../types';

interface SeriesDetailProps {
  seriesInfo: SeriesInfo;
  onPlayEpisode: (episode: Episode) => void;
  onBack: () => void;
}

const SeriesDetail: React.FC<SeriesDetailProps> = ({ seriesInfo, onPlayEpisode, onBack }) => {
  const { info, seasons, episodes } = seriesInfo;
  
  // Sort seasons by season number
  const sortedSeasons = useMemo(() => seasons.sort((a, b) => a.season_number - b.season_number), [seasons]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(sortedSeasons.length > 0 ? sortedSeasons[0] : null);

  const seasonEpisodes = useMemo(() => {
      if (!selectedSeason || !episodes) return [];
      return episodes[selectedSeason.season_number] || [];
  }, [episodes, selectedSeason]);

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-y-auto">
      {/* Backdrop and Header */}
      <div className="relative h-48 md:h-72 lg:h-96 w-full flex-shrink-0">
        <img src={info.backdrop_path?.[0] || info.cover} alt={`Backdrop for ${info.name}`} className="absolute top-0 left-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 md:p-8 flex items-end gap-6">
            <img src={info.cover} alt={info.name} className="w-24 md:w-40 rounded-lg shadow-2xl z-10" />
            <div className="z-10">
                <h1 className="text-2xl md:text-4xl font-bold text-white tracking-wide">{info.name}</h1>
                <div className="flex items-center gap-4 text-gray-300 text-sm mt-2">
                    <span>{info.releaseDate}</span>
                    {info.rating_5based > 0 && <span><i className="fas fa-star text-yellow-400 mr-1"></i>{info.rating_5based.toFixed(1)} / 5</span>}
                </div>
            </div>
        </div>
         <button onClick={onBack} className="absolute top-4 left-4 z-20 bg-black/50 hover:bg-red-600 p-2 rounded-full transition-colors">
            <i className="fas fa-arrow-left text-white"></i>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
            <h2 className="font-semibold text-white text-lg">Plot</h2>
            <p className="text-gray-400 text-sm mt-2 mb-6">{info.plot}</p>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Season List */}
                <div className="md:w-1/3 lg:w-1/4">
                    <h3 className="font-semibold text-white mb-3">Seasons</h3>
                    <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto gap-2 md:max-h-[50vh]">
                        {sortedSeasons.map(season => (
                            <button 
                                key={season.season_number}
                                onClick={() => setSelectedSeason(season)}
                                className={`shrink-0 w-full text-left p-3 rounded-lg transition-colors ${selectedSeason?.season_number === season.season_number ? 'bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
                                <p className="font-bold">{season.name}</p>
                                <p className="text-xs opacity-70">{season.episode_count} Episodes</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Episode List */}
                <div className="flex-1">
                    <h3 className="font-semibold text-white mb-3">Episodes</h3>
                    <div className="flex flex-col gap-2 md:max-h-[50vh] overflow-y-auto">
                        {seasonEpisodes.length > 0 ? seasonEpisodes.map(ep => (
                            <button 
                                key={ep.id}
                                onClick={() => onPlayEpisode(ep)}
                                className="w-full text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-700/70 flex items-center gap-4 group transition-colors">
                                <div className="text-red-500 font-bold w-8 text-center">{ep.episode_num}</div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold group-hover:text-red-400">{ep.title}</p>
                                    <p className="text-gray-400 text-xs mt-1">{ep.info.duration}</p>
                                </div>
                                <i className="fas fa-play text-gray-500 group-hover:text-white"></i>
                            </button>
                        )) : <p className="text-gray-500">No episodes found for this season.</p>}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetail;
