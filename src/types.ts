export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this should be hashed!
  role: Role;
}

export interface PlaylistSource {
  id: string;
  type: 'url' | 'file';
  content: string; // The raw M3U content
  identifier: string; // The URL string or Filename
  addedAt: number;
}

export interface StoredPlaylist {
  id: string;
  name: string; // The display name of the collection (e.g. "Live TV")
  sources: PlaylistSource[]; // List of M3U sources merged into this playlist
}

// --- NEW CONTENT-AWARE TYPE SYSTEM ---

// Base interface for common properties
interface Content {
    id: string; // Unique ID (e.g., generated from name/group)
    name: string;
    logo: string | null;
    group?: string;
    description?: string;
    rating?: string;
    year?: string;
}

// Specific type for Live TV Channels
export interface LiveChannel extends Content {
    type: 'live';
    url: string; // Stream URL
}

// Specific type for Movies
export interface Movie extends Content {
    type: 'movie';
    url: string; // Stream URL
}

// Episodes are part of a Series
export interface Episode extends Content {
    episodeNumber: number;
    seasonNumber: number;
    url: string; // Stream URL
}

// Seasons group Episodes
export interface Season {
    seasonNumber: number;
    episodes: Episode[];
}

// Series group Seasons
export interface Series extends Content {
    type: 'series';
    seasons: Season[];
}

// A union type for any content item in the playlist
export type ContentItem = LiveChannel | Movie | Series;

// The main data structure holding all processed content
export interface PlaylistData {
  items: ContentItem[];
  groups: string[];
}


// --- EPG (Electronic Program Guide) --- (Kept for Live TV)

export interface EpgChannel {
  id: string;
  displayName: string;
  icon: string | null;
}

export interface EpgProgram {
  channelId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
}
