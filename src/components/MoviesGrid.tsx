
import React, { useState, useMemo } from 'react';
import { Category } from '../types';
import MovieCard, { VodStream } from './MovieCard';

interface MoviesGridProps {
  movies: VodStream[];
  categories: Category[];
  onMovieSelect: (movie: VodStream) => void;
}

const ALL_CATEGORIES: Category = { category_id: 'all', category_name: 'All Movies', parent_id: 0 };

const MoviesGrid: React.FC<MoviesGridProps> = ({ movies, categories, onMovieSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(ALL_CATEGORIES);

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesCategory = selectedCategory.category_id === 'all' || movie.category_id === selectedCategory.category_id;
      const matchesSearch = searchTerm === '' || movie.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [movies, searchTerm, selectedCategory]);

  const allCategories = [ALL_CATEGORIES, ...categories];

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-800">
      {/* Categories Sidebar */}
      <div className="w-48 bg-gray-900 flex-shrink-0 flex flex-col">
        <div className="p-2 border-b border-gray-700 shrink-0">
            <input
                type="text"
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
            />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
        </div>
        <div className="flex-1 overflow-y-auto">
          {allCategories.map(cat => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left text-sm px-3 py-2 transition-colors ${selectedCategory.category_id === cat.category_id ? 'bg-red-600 text-white font-semibold' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}>
              {cat.category_name}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
         <div className="px-4 py-2 text-sm text-gray-300 font-medium bg-gray-800/80 border-b border-gray-700 shrink-0 shadow-md">
            {filteredMovies.length} movie{filteredMovies.length !== 1 && 's'} found in {selectedCategory.category_name}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {filteredMovies.map(movie => (
                <MovieCard key={movie.stream_id} movie={movie} onClick={onMovieSelect} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>No movies match your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoviesGrid;
