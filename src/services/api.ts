import { User, StoredPlaylist, PlaylistSource, EpgChannel, EpgProgram } from '../types';

// Detect if we are in production based on hostname
const IS_PROD = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

// In production, the API is served from the same origin as the frontend
const API_BASE_URL = IS_PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

// Helper to perform fetch requests
async function fetchApi(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };

  const url = `${API_BASE_URL}${path}`;
  console.log(`[API] Requesting: ${url}`)

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
        // Token expirado ou inválido - poderia redirecionar para o login
        console.warn("[API] Auth error, clearing token.");
        localStorage.removeItem('auth_token');
    }
    const errorData = await response.json().catch(() => ({ message: `Request failed with status: ${response.status}` }));
    throw new Error(errorData.message || errorData.error || 'An unknown API error occurred');
  }
  
  if (response.status === 204) {
      return {};
  }

  return response.json();
}

export const apiService = {
  // --- Auth ---
  login: async (username: string, password: string): Promise<User> => {
    const response = await fetchApi('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.token) {
        localStorage.setItem('auth_token', response.token);
    }
    return response.user;
  },

  // --- Users ---
  getUsers: (): Promise<User[]> => {
    return fetchApi('/api/users');
  },

  addUser: (user: Omit<User, 'id'>): Promise<User> => {
    return fetchApi('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  updateUser: (id: string, user: Partial<User>): Promise<User> => {
    return fetchApi(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },
  
  updateUserPassword: (userId: number | string, newPassword: string): Promise<void> => {
    return fetchApi(`/api/users/${userId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword }),
    });
  },

  deleteUser: (id: number | string): Promise<void> => {
    return fetchApi(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Playlists (Collections) ---
  getPlaylists: (): Promise<StoredPlaylist[]> => {
    return fetchApi('/api/playlists');
  },

  createPlaylist: (name: string): Promise<StoredPlaylist> => {
    return fetchApi('/api/playlists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  addPlaylist: (playlist: Omit<StoredPlaylist, 'id'>): Promise<StoredPlaylist> => {
    return fetchApi('/api/playlists', {
      method: 'POST',
      body: JSON.stringify(playlist),
    });
  },

  updatePlaylist: (id: string, playlist: Partial<StoredPlaylist>): Promise<StoredPlaylist> => {
    return fetchApi(`/api/playlists/${id}`, {
        method: 'PUT',
        body: JSON.stringify(playlist),
    });
  },

  deletePlaylist: (id: number | string): Promise<void> => {
    return fetchApi(`/api/playlists/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Sources within Playlists ---
  addSourceToPlaylist: (playlistId: number | string, source: Omit<PlaylistSource, 'id' | 'addedAt'>): Promise<PlaylistSource> => {
    return fetchApi(`/api/playlists/${playlistId}/sources`, {
      method: 'POST',
      body: JSON.stringify(source),
    });
  },

  removeSourceFromPlaylist: (playlistId: number | string, sourceId: number | string): Promise<void> => {
    return fetchApi(`/api/playlists/${playlistId}/sources/${sourceId}`, {
      method: 'DELETE',
    });
  },

  // --- Settings ---
  getSettings: (): Promise<any> => {
    return fetchApi('/api/settings');
  },

  updateSettings: (settings: any): Promise<any> => {
    return fetchApi('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  // --- EPG ---
  saveEpgData: (channels: EpgChannel[], programs: EpgProgram[]): Promise<void> => {
    return fetchApi('/api/epg', {
      method: 'POST',
      body: JSON.stringify({ channels, programs }),
    });
  },

  getProgramsForChannel: (channelId: string): Promise<EpgProgram[]> => {
    return fetchApi(`/api/epg/channels/${channelId}/programs`);
  },
};
