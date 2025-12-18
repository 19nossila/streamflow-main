import { User, StoredPlaylist, PlaylistSource } from '../types';
import { apiService } from './api';

const SESSION_KEY = 'streamflow_session';

export const storageService = {
  // --- Auth ---
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const user = await apiService.login(username, password);
      if (user) {
        // Store session info in localStorage for persistence across reloads
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      }
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      // On failure, ensure session is cleared
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  logout: () => {
    // No need to await an API call if it's just removing local state
    localStorage.removeItem(SESSION_KEY);
    // If you had a server-side session invalidation, you'd call it here:
    // return apiService.logout(); 
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  // --- Users ---
  getUsers: (): Promise<User[]> => {
    return apiService.getUsers();
  },

  addUser: (user: Omit<User, 'id'>): Promise<User> => {
    return apiService.addUser(user);
  },

  updateUserPassword: (userId: string | number, newPassword: string): Promise<void> => {
    return apiService.updateUserPassword(userId, newPassword);
  },

  deleteUser: (id: string | number): Promise<void> => {
    return apiService.deleteUser(id);
  },

  // --- Playlists (Collections) ---
  getPlaylists: (): Promise<StoredPlaylist[]> => {
    return apiService.getPlaylists();
  },

  createPlaylist: (name: string): Promise<StoredPlaylist> => {
    return apiService.createPlaylist(name);
  },

  deletePlaylist: (id: string | number): Promise<void> => {
    return apiService.deletePlaylist(id);
  },

  // --- Sources within Playlists ---
  addSourceToPlaylist: (playlistId: string | number, source: Omit<PlaylistSource, 'id' | 'addedAt'>): Promise<PlaylistSource> => {
    return apiService.addSourceToPlaylist(playlistId, source);
  },

  removeSourceFromPlaylist: (playlistId: string | number, sourceId: string | number): Promise<void> => {
    return apiService.removeSourceFromPlaylist(playlistId, sourceId);
  },

  // --- Sync / Backup (These would need server-side implementation if you want true sync) ---
  exportData: (): Promise<string> => {
    // This is a placeholder. A real implementation would fetch from a server endpoint.
    return Promise.reject(new Error('Export via server not implemented'));
  },

  importData: (jsonString: string): Promise<void> => {
    // This is a placeholder. A real implementation would post to a server endpoint.
    return Promise.reject(new Error('Import via server not implemented'));
  }
};
