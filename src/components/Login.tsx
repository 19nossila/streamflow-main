
import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { xtreamService } from '../services/xtreamService';
import { User, StoredPlaylist } from '../types';
import { FaUserLock, FaBolt, FaExclamationCircle } from 'react-icons/fa';

interface LoginProps {
  onLogin: (user: User, playlist?: StoredPlaylist) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loginMode, setLoginMode] = useState<'standard' | 'xtream'>('standard');
  
  // Removendo credenciais hardcoded para admin
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [xtreamCredentials, setXtreamCredentials] = useState({ serverUrl: '', username: '', password: '' });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStandardSubmit = async () => {
    try {
      const user = await storageService.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'An unexpected error occurred.');
    }
  };

  const handleXtreamSubmit = async () => {
    const { serverUrl, username, password } = xtreamCredentials;
    if (!serverUrl || !username) {
        setError("Server URL and Username are required.");
        return;
    }
    try {
        const channels = await xtreamService.getChannels(serverUrl, username, password);
        if (channels.length === 0) {
            setError("No channels found on the Xtream server.");
            return;
        }

        let m3uContent = '#EXTM3U\n';
        channels.forEach(ch => { m3uContent += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.title}" tvg-logo="${ch.logo}" group-title="${ch.group}",${ch.title}\n${ch.url}\n`; });

        const tempUser: User = { id: 'xtream_user', username: 'Xtream', role: 'user' };
        const tempPlaylist: StoredPlaylist = {
            id: 'xtream_playlist',
            name: 'Xtream Channels',
            sources: [{
                id: 'xtream_source',
                type: 'xtream',
                content: m3uContent,
                identifier: `${username}@${serverUrl}`,
                addedAt: new Date().toISOString()
            }]
        };
        
        onLogin(tempUser, tempPlaylist);

    } catch (e: unknown) {
        setError((e as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (loginMode === 'standard') {
      await handleStandardSubmit();
    } else {
      await handleXtreamSubmit();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><FaUserLock /></div>
            <h2 className="text-2xl font-bold text-white">StreamFlow Login</h2>
            <p className="text-gray-400 mt-2">Select your login method</p>
        </div>

        <div className="flex rounded-md bg-gray-900/50 p-1 mb-6 border border-gray-700">
            <button onClick={() => setLoginMode('standard')} className={`flex-1 py-2 rounded-md text-sm font-bold ${loginMode === 'standard' ? 'bg-red-600 text-white' : 'text-gray-400'}`}><FaUserLock className="inline mr-2"/>Standard</button>
            <button onClick={() => setLoginMode('xtream')} className={`flex-1 py-2 rounded-md text-sm font-bold ${loginMode === 'xtream' ? 'bg-red-600 text-white' : 'text-gray-400'}`}><FaBolt className="inline mr-2"/>Xtream</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {loginMode === 'standard' ? (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-900 p-3 rounded" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900 p-3 rounded" required />
              </div>
            </>
          ) : (
            <>
              <div>
                  <label className="block text-sm text-gray-400 mb-1">Server URL</label>
                  <input type="text" placeholder="http://..." value={xtreamCredentials.serverUrl} onChange={(e) => setXtreamCredentials({...xtreamCredentials, serverUrl: e.target.value})} className="w-full bg-gray-900 p-3 rounded" required />
              </div>
              <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <input type="text" value={xtreamCredentials.username} onChange={(e) => setXtreamCredentials({...xtreamCredentials, username: e.target.value})} className="w-full bg-gray-900 p-3 rounded" required />
              </div>
              <div>
                  <label className="block text-sm text-gray-400 mb-1">Password</label>
                  <input type="password" value={xtreamCredentials.password} onChange={(e) => setXtreamCredentials({...xtreamCredentials, password: e.target.value})} className="w-full bg-gray-900 p-3 rounded" />
              </div>
            </>
          )}

          {error && <div className="text-red-400 text-sm"><FaExclamationCircle className="inline mr-2"/>{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-red-600 py-3 rounded font-bold disabled:bg-gray-700">{loading ? 'Loading...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
