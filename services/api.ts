
import { User, StoredPlaylist, PlaylistSource } from '../types';

const API_BASE_URL = 'http://localhost:3001/api'; // Assuming the server runs on port 3001

// Helper to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || response.statusText);
  }
  return response.json();
};

export const apiService = {
  // --- Auth ---
  login: async (username: string, password: string): Promise<User | null> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  logout: async (): Promise<void> => {
    await fetch(`${API_BASE_URL}/logout`, { method: 'POST' });
  },

  // --- Users ---
  getUsers: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`);
    return handleResponse(response);
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return handleResponse(response);
  },

  updateUserPassword: async (userId: string, newPassword: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
  },

  deleteUser: async (id: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
  },

  // --- Playlists (Collections) ---
  getPlaylists: async (): Promise<StoredPlaylist[]> => {
    const response = await fetch(`${API_BASE_URL}/playlists`);
    return handleResponse(response);
  },

  createPlaylist: async (name: string): Promise<StoredPlaylist> => {
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },

  deletePlaylist: async (id: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/playlists/${id}`, { method: 'DELETE' });
  },

  // --- Sources within Playlists ---
  addSourceToPlaylist: async (playlistId: string, source: Omit<PlaylistSource, 'id' | 'addedAt'>): Promise<PlaylistSource> => {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(source),
    });
    return handleResponse(response);
  },

  removeSourceFromPlaylist: async (playlistId: string, sourceId: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/playlists/${playlistId}/sources/${sourceId}`, { method: 'DELETE' });
  },

  // --- Sync / Backup (Simplified) ---
  exportData: async (): Promise<string> => {
    // This now fetches all data from the server and bundles it.
    const [users, playlists] = await Promise.all([this.getUsers(), this.getPlaylists()]);
    const data = { users, playlists };
    return JSON.stringify(data, null, 2);
  },

  importData: async (jsonString: string): Promise<boolean> => {
    // This is a client-side interpretation of import. 
    // A more robust solution would be a dedicated server endpoint.
    console.warn('Import functionality is now handled client-side and is for demonstration. A robust implementation would require a dedicated server endpoint to avoid race conditions and ensure data integrity.');
    const data = JSON.parse(jsonString);

    // Clear existing data (DANGEROUS - for demo only)
    const existingPlaylists = await this.getPlaylists();
    for (const p of existingPlaylists) {
      await this.deletePlaylist(String(p.id));
    }
    const existingUsers = await this.getUsers();
    for (const u of existingUsers) {
        // Assuming we don't delete the main admin user
        if (u.username !== 'admin') {
            await this.deleteUser(String(u.id));
        }
    }

    // Import new data
    if (data.playlists) {
      for (const p of data.playlists) {
        const newPlaylist = await this.createPlaylist(p.name);
        if (p.sources) {
          for (const s of p.sources) {
            await this.addSourceToPlaylist(String(newPlaylist.id), { type: s.type, content: s.content, identifier: s.identifier });
          }
        }
      }
    }
    if (data.users) {
        for (const u of data.users) {
            // Avoid re-creating admin if it exists
            if(u.username !== 'admin') {
                await this.addUser({ username: u.username, password: u.password, role: u.role });
            }
        }
    }
    return true;
  }
};
