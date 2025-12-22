export interface ContentItem {
  id: string;
  url: string;
  title: string;
  logo: string;
  group: string;
  [key: string]: any; // Allow other properties
}

export interface User {
  id: string;
  username: string;
  password?: string; // Made optional: Password should not be stored client-side.
  role: 'admin' | 'user';
}

// Represents a single source within a playlist
export interface PlaylistSource {
    id: string;
    type: string;
    content: string;
    identifier: string;
    addedAt: string;
}

export interface StoredPlaylist {
  id: string;
  name: string;
  url?: string; // Made optional, as it may not be present for already-saved lists.
  sources?: PlaylistSource[];
}
