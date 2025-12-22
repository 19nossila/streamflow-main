
import React from 'react';
import { Movie } from '../../types';
import { ArrowLeft, Play, Star } from 'lucide-react';

interface MovieDetailPageProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onBack: () => void;
}

const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movie, onPlay, onBack }) => {

  return (
    <div className="w-full h-full bg-[#0B0C10] text-white overflow-y-auto">
      {/* --- Header & Background --- */}
      <div className="relative h-[60vh] min-h-[400px]">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={movie.logo || ''} 
            alt={movie.title} 
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/80 to-transparent"></div>
        </div>
        
        <button onClick={onBack} className="absolute top-6 left-6 z-20 bg-black/50 p-2 rounded-full hover:bg-white/20 transition-all">
          <ArrowLeft size={24} />
        </button>

        <div className="absolute bottom-0 left-0 p-8 z-10 w-full">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter mb-2">{movie.title}</h1>
            <div className="flex items-center gap-4 text-gray-300 mb-4">
              {movie.rating && <div className="flex items-center gap-1 text-yellow-400"><Star size={16} fill="currentColor" /> <span className="font-bold">{movie.rating}</span></div>}
              {movie.year && <span>{movie.year}</span>}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              {movie.description || 'No description available.'}
            </p>
            <button 
              onClick={() => onPlay(movie)}
              className="px-10 py-4 bg-red-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-red-700 transition-transform hover:scale-105 shadow-lg shadow-red-600/30"
            >
                <Play size={20} fill="currentColor" />
                PLAY
            </button>
          </div>
        </div>
      </div>

      {/* You can add more sections here, e.g., for cast, recommendations, etc. */}
    </div>
  );
};

export default MovieDetailPage;
