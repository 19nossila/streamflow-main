import { User, StoredPlaylist, PlaylistSource } from '../types';
import { apiService } from './api';

const SESSION_KEY = 'streamflow_session';
const AUTH_TOKEN_KEY = 'auth_token';

export const storageService = {
  // --- Auth ---
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const user = await apiService.login(username, password);
      if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      }
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
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

  // --- Sync / Backup ---
  exportData: (): Promise<string> => {
    return Promise.reject(new Error('Export via server not implemented'));
  },

  importData: (jsonString: string): Promise<void> => {
    return Promise.reject(new Error('Import via server not implemented'));
  }
};
