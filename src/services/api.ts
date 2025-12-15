import { User, StoredPlaylist, PlaylistSource } from '../types';

// Helper to perform fetch requests
async function fetchApi(path: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(`/api${path}`, { ...defaultOptions, ...options });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || 'API request failed');
  }
  
  // Return an empty object for DELETE requests, which have no body
  if (options.method === 'DELETE') {
      return {};
  }

  return response.json();
}

export const apiService = {
  // --- Auth ---
  login: (username: string, password: string): Promise<User> => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout: (): Promise<void> => {
    // This is often a client-side only operation, but we can have a placeholder
    return Promise.resolve();
  },

  // --- Users ---
  getUsers: (): Promise<User[]> => {
    return fetchApi('/users');
  },

  addUser: (user: Omit<User, 'id'>): Promise<User> => {
    return fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },
  
  updateUserPassword: (userId: string, newPassword: string): Promise<void> => {
    return fetchApi(`/users/${userId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
    });
  },

  deleteUser: (id: string): Promise<void> => {
    return fetchApi(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Playlists (Collections) ---
  getPlaylists: (): Promise<StoredPlaylist[]> => {
    return fetchApi('/playlists');
  },

  createPlaylist: (name: string): Promise<StoredPlaylist> => {
    return fetchApi('/playlists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  deletePlaylist: (id: string): Promise<void> => {
    return fetchApi(`/playlists/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Sources within Playlists ---
  addSourceToPlaylist: (playlistId: string, source: Omit<PlaylistSource, 'id' | 'addedAt'>): Promise<StoredPlaylist> => {
    return fetchApi(`/playlists/${playlistId}/sources`, {
      method: 'POST',
      body: JSON.stringify(source),
    });
  },

  removeSourceFromPlaylist: (playlistId: string, sourceId: string): Promise<void> => {
    return fetchApi(`/playlists/${playlistId}/sources/${sourceId}`, {
      method: 'DELETE',
    });
  },
    
  // --- Sync / Backup ---
  exportData: (): Promise<any> => {
      return fetchApi('/sync/export');
  },
    
  importData: (data: any): Promise<void> => {
      return fetchApi('/sync/import', {
          method: 'POST',
          body: JSON.stringify(data),
      });
  }
};
