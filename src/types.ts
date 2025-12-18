
// --- Core Data Structures ---

export interface User {
  id: number | string;
  username: string;
  password?: string; // Should be handled securely, not stored long-term in client state
  role: 'admin' | 'user';
}

export interface Channel {
  id: string;
  name: string;
  logo: string | null;
  url: string;
  group: string;
}

export interface PlaylistData {
  channels: Channel[];
  groups: string[];
}

// --- Storage & API Layer ---

export interface PlaylistSource {
  id: number | string;
  type: 'url' | 'file';
  content: string; // URL or file content
  identifier: string; // The original URL or filename
  addedAt: string; // ISO 8601 date string
}

export interface StoredPlaylist {
  id: number | string;
  userId: number | string; // The user this playlist belongs to
  name: string;
  sources: PlaylistSource[];
}
