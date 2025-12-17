
// User object from Xtream Codes API
export interface User {
  username: string;
  password?: string; 
  message?: string;
  auth?: 1 | 0;
  status?: 'Active' | 'Expired' | 'Banned' | 'Disabled';
  exp_date?: string | null;
  is_trial?: '0' | '1';
  max_connections?: string;
  created_at?: string;
  role: 'user' | 'admin'; // Role for our app, not from XC API
}

// --- Stream Types ---

// Live TV stream
export interface Channel {
  num: number;
  name: string;
  stream_type: 'live';
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string | null;
  added: string;
  category_id: string;
  custom_sid: string | null;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

// VOD stream (Movie)
export interface VodStream {
  num: number;
  name: string;
  stream_type: 'movie';
  stream_id: number;
  stream_icon: string;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string | null;
  rating: string;
  rating_5based: number;
  direct_source: string;
}

// Series stream (summary)
export interface SeriesStream {
    num: number;
    name: string;
    series_id: number;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    last_modified: string;
    rating: string;
    rating_5based: number;
    backdrop_path: string[];
    youtube_trailer: string;
    episode_run_time: string;
    category_id: string;
}

// --- Detailed Info Types ---

export interface Episode {
    id: string;
    episode_num: number;
    title: string;
    container_extension: string;
    info: {
        movie_image: string;
        plot: string;
        duration: string;
    };
    added: string;
    season: number;
}

export interface Season {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    season_number: number;
    cover: string;
    cover_big: string;
}

export interface SeriesInfo {
    episodes: Record<string, Episode[]>; // Key is season number
    seasons: Season[];
    info: SeriesStream; // The API nests the base info inside
}

// --- Utility Types ---

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}
