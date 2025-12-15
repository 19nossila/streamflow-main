import { User, StoredPlaylist, PlaylistSource } from '../types';
import { apiService } from './api';

const SESSION_KEY = 'streamflow_session';

export const storageService = {
  // --- Auth ---
  login: async (username: string, password: string): Promise<User | null> => {
    const user = await apiService.login(username, password);
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
    return user;
  },

  logout: async () => {
    await apiService.logout();
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  // --- Users ---
  getUsers: (): Promise<User[]> => {
    return apiService.getUsers();
  },

  addUser: (user: Omit<User, 'id'>) => {
    return apiService.addUser(user);
  },

  updateUserPassword: (userId: string, newPassword: string) => {
    return apiService.updateUserPassword(userId, newPassword);
  },

  deleteUser: (id: string) => {
    return apiService.deleteUser(id);
  },

  // --- Playlists (Collections) ---
  getPlaylists: (): Promise<StoredPlaylist[]> => {
    return apiService.getPlaylists();
  },

  createPlaylist: (name: string) => {
    return apiService.createPlaylist(name);
  },

  deletePlaylist: (id: string) => {
    return apiService.deletePlaylist(id);
  },

  // --- Sources within Playlists ---
  addSourceToPlaylist: (playlistId: string, source: Omit<PlaylistSource, 'id' | 'addedAt'>) => {
    return apiService.addSourceToPlaylist(playlistId, source);
  },

  removeSourceFromPlaylist: (playlistId: string, sourceId: string) => {
    return apiService.removeSourceFromPlaylist(playlistId, sourceId);
  },

  // --- Sync / Backup ---
  exportData: (): Promise<string> => {
    return apiService.exportData();
  },

  importData: (jsonString: string) => {
    return apiService.importData(jsonString);
  }
};