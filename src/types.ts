// Basic user information
export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  expiresAt?: string | null; // Adicionado para a funcionalidade de expiração
}

// Playlist source representation
export interface PlaylistSource {
  id: string;
  type: 'url' | 'xtream' | 'file';
  content: string;
  identifier: string;
  addedAt: string;
}

// Stored playlist representation
export interface StoredPlaylist {
  id: string;
  name: string;
  url?: string;
  sources?: PlaylistSource[];
}

// Base interface for a playable or browsable item.
interface BaseContentItem {
  id: string;
  url: string;
  title: string;
  logo: string;
  group: string;
}

// Specific types of content
export interface LiveChannel extends BaseContentItem {
  type: 'live';
}

export interface Movie extends BaseContentItem {
  type: 'movie';
  description?: string;
  year?: number;
  rating?: string;
}

export interface Episode extends BaseContentItem {
  type: 'episode';
  season?: number;
  episode?: number;
  description?: string;
}

export interface Series extends BaseContentItem {
  type: 'series';
  episodes: Episode[];
  description?: string;
  year?: number;
  rating?: string;
}

// A union type representing any possible content item from a playlist
export type ContentItem = LiveChannel | Movie | Series | Episode;


// Represents the fully parsed data from one or more playlists
export interface PlaylistData {
  items: ContentItem[];
  groups: string[];
}

// EPG-related types
export interface EpgChannel {
  id: string;
  name: string;
  logo: string;
}

export interface EpgProgram {
  channelId: string;
  title: string;
  description: string;
  start: number;
  end: number;
}
