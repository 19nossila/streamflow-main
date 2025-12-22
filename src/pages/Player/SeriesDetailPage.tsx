
import React, { useState, useMemo } from 'react';
import { Series, Episode } from '../../types';
import { ArrowLeft, Play, Star } from 'lucide-react';

interface SeriesDetailPageProps {
  series: Series;
  onPlayEpisode: (episode: Episode) => void;
  onBack: () => void;
}

const SeriesDetailPage: React.FC<SeriesDetailPageProps> = ({ series, onPlayEpisode, onBack }) => {
  // Group episodes by season
  const seasons = useMemo(() => {
    const seasonMap = new Map<number, Episode[]>();
    series.episodes.forEach(episode => {
      const seasonNum = episode.season || 1;
      if (!seasonMap.has(seasonNum)) {
        seasonMap.set(seasonNum, []);
      }
      seasonMap.get(seasonNum)!.push(episode);
    });
    return Array.from(seasonMap.entries())
      .map(([seasonNumber, episodes]) => ({ seasonNumber, episodes }))
      .sort((a, b) => a.seasonNumber - b.seasonNumber);
  }, [series.episodes]);

  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.seasonNumber || 1);
  const activeSeason = seasons.find(s => s.seasonNumber === selectedSeason);

  return (
    <div className="w-full h-full bg-[#0B0C10] text-white overflow-y-auto">
      {/* --- Header & Background --- */}
      <div className="relative h-[40vh] min-h-[300px]">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={series.logo || ''} 
            alt={series.title} 
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] to-transparent"></div>
        </div>
        
        <button onClick={onBack} className="absolute top-6 left-6 z-10 bg-black/50 p-2 rounded-full hover:bg-white/20 transition-all">
          <ArrowLeft size={24} />
        </button>

        <div className="absolute bottom-0 left-0 p-8 z-10">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-2">{series.title}</h1>
          <div className="flex items-center gap-4 text-gray-300">
            {series.rating && <div className="flex items-center gap-1 text-yellow-400"><Star size={16} fill="currentColor" /> <span className="font-bold">{series.rating}</span></div>}
            {series.year && <span>{series.year}</span>}
          </div>
          <p className="mt-4 max-w-2xl text-gray-400 text-sm leading-relaxed">
            {series.description || 'No description available.'}
          </p>
        </div>
      </div>

      {/* --- Content Section --- */}
      <div className="p-8">
        {/* --- Season Selector --- */}
        <div className="mb-8">
          <label htmlFor="season-select" className="text-lg font-bold mb-2 block">Season</label>
          <select 
            id="season-select"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 w-full md:w-auto"
          >
            {seasons.map(season => (
              <option key={season.seasonNumber} value={season.seasonNumber}>
                Season {season.seasonNumber}
              </option>
            ))}
          </select>
        </div>

        {/* --- Episodes Grid --- */}
        <h2 className="text-2xl font-bold mb-4">Episodes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {activeSeason?.episodes.map(episode => (
            <button 
              key={episode.id}
              onClick={() => onPlayEpisode(episode)}
              className="group bg-gray-900 rounded-lg overflow-hidden text-left transition-transform hover:scale-105 shadow-lg"
            >
              <div className="relative aspect-video bg-gray-800">
                 <img src={episode.logo || series.logo || ''} alt={`Episode ${episode.episode}`} className="w-full h-full object-cover"/>
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={48} className="text-white"/>
                 </div>
                 <span className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md">
                    E{episode.episode}
                 </span>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm truncate">{`S${episode.season} E${episode.episode} - ${episode.title}`}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeriesDetailPage;
