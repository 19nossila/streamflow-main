
import React from 'react';

// Basic definition for a VOD stream, will be expanded in types.ts later
export interface VodStream {
  stream_id: number;
  name: string;
  stream_icon: string;
  rating: string;
  category_id: string;
}

interface MovieCardProps {
  movie: VodStream;
  onClick: (movie: VodStream) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = 'https://i.imgur.com/LhB23B7.png'; // Fallback image
  };

  return (
    <div 
        className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-200 group"
        onClick={() => onClick(movie)}
    >
      <div className="relative pb-[150%] h-0"> {/* Aspect ratio 2:3 */}
          <img 
              src={movie.stream_icon}
              alt={movie.name}
              onError={handleError}
              className="absolute top-0 left-0 w-full h-full object-cover"
              loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <i className="fas fa-play-circle text-5xl text-white"></i>
          </div>
      </div>
      <div className="p-3">
        <p className="text-white font-semibold text-sm truncate" title={movie.name}>
          {movie.name}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
