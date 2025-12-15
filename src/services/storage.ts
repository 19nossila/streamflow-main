import { User, StoredPlaylist, PlaylistSource } from '../types';

// Define keys for localStorage
const USERS_KEY = 'streamflow_users';
const PLAYLISTS_KEY = 'streamflow_playlists';
const SESSION_KEY = 'streamflow_session';

// Helper to get item from localStorage
const getStore = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error(`Failed to parse localStorage key "${key}"`, e);
    return null;
  }
};

// Helper to set item in localStorage
const setStore = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to set localStorage key "${key}"`, e);
  }
};

// --- Initialize with default data if empty ---
const initializeData = () => {
    if (!getStore(USERS_KEY)) {
        const defaultAdmin: User = {
            id: 'user-001',
            username: 'admin',
            password: '123', // In a real app, this should be hashed
            role: 'admin'
        };
        setStore<User[]>(USERS_KEY, [defaultAdmin]);
    }
    if (!getStore(PLAYLISTS_KEY)) {
        setStore<StoredPlaylist[]>(PLAYLISTS_KEY, []);
    }
};

// Call initialization
initializeData();

export const storageService = {
  // --- Auth ---
  login: (username: string, password: string): User | null => {
    const users = getStore<User[]>(USERS_KEY) || [];
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setStore<User>(SESSION_KEY, user);
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    return getStore<User>(SESSION_KEY);
  },

  // --- Users ---
  getUsers: (): User[] => {
    return getStore<User[]>(USERS_KEY) || [];
  },

  addUser: (user: Omit<User, 'id' | 'role'> & { role?: 'user' | 'admin', password?: string }): User => {
      const users = getStore<User[]>(USERS_KEY) || [];
      const newUser: User = {
          id: `user-${Date.now()}`,
          role: 'user',
          ...user,
          password: user.password || '1234' // Default password
      };
      setStore(USERS_KEY, [...users, newUser]);
      return newUser;
  },

  updateUserPassword: (userId: string, newPassword: string): boolean => {
      const users = getStore<User[]>(USERS_KEY) || [];
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex > -1) {
          users[userIndex].password = newPassword;
          setStore(USERS_KEY, users);
          return true;
      }
      return false;
  },

  deleteUser: (id: string): boolean => {
    const users = getStore<User[]>(USERS_KEY) || [];
    const newUsers = users.filter(u => u.id !== id);
    if (users.length !== newUsers.length) {
      setStore(USERS_KEY, newUsers);
      return true;
    }
    return false;
  },

  // --- Playlists (Collections) ---
  getPlaylists: (): StoredPlaylist[] => {
    return getStore<StoredPlaylist[]>(PLAYLISTS_KEY) || [];
  },

  createPlaylist: (name: string): StoredPlaylist => {
    const playlists = getStore<StoredPlaylist[]>(PLAYLISTS_KEY) || [];
    const newPlaylist: StoredPlaylist = {
        id: `pl-${Date.now()}`,
        name,
        sources: []
    };
    setStore(PLAYLISTS_KEY, [...playlists, newPlaylist]);
    return newPlaylist;
  },

  deletePlaylist: (id: string): boolean => {
    const playlists = getStore<StoredPlaylist[]>(PLAYLISTS_KEY) || [];
    const newPlaylists = playlists.filter(p => p.id !== id);
     if (playlists.length !== newPlaylists.length) {
      setStore(PLAYLISTS_KEY, newPlaylists);
      return true;
    }
    return false;
  },

  // --- Sources within Playlists ---
  addSourceToPlaylist: (playlistId: string, source: Omit<PlaylistSource, 'id' | 'addedAt'>): StoredPlaylist | null => {
    const playlists = getStore<StoredPlaylist[]>(PLAYLISTS_KEY) || [];
    const plIndex = playlists.findIndex(p => p.id === playlistId);
    if (plIndex > -1) {
        const newSource: PlaylistSource = {
            ...source,
            id: `src-${Date.now()}`,
            addedAt: new Date().toISOString()
        };
        playlists[plIndex].sources.push(newSource);
        setStore(PLAYLISTS_KEY, playlists);
        return playlists[plIndex];
    }
    return null;
  },

  removeSourceFromPlaylist: (playlistId: string, sourceId: string): boolean => {
    const playlists = getStore<StoredPlaylist[]>(PLAYLISTS_KEY) || [];
    const plIndex = playlists.findIndex(p => p.id === playlistId);
     if (plIndex > -1) {
        const sourceCount = playlists[plIndex].sources.length;
        playlists[plIndex].sources = playlists[plIndex].sources.filter(s => s.id !== sourceId);
        if (playlists[plIndex].sources.length !== sourceCount) {
             setStore(PLAYLISTS_KEY, playlists);
             return true;
        }
    }
    return false;
  },
  
  // --- Sync / Backup ---
  exportData: (): object => {
    return {
      users: getStore(USERS_KEY),
      playlists: getStore(PLAYLISTS_KEY)
    };
  },
  
  importData: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) setStore(USERS_KEY, data.users);
      if (data.playlists) setStore(PLAYLISTS_KEY, data.playlists);
      return true;
    } catch(e) {
      return false;
    }
  }
};
