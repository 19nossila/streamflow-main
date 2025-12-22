import React, { useState, useEffect } from 'react';
import { StoredPlaylist } from '../types';

type PlaylistType = 'url' | 'xtream' | 'file';

interface PlaylistFormProps {
  type: PlaylistType;
  initialData?: StoredPlaylist | null;
  onSubmit: (data: Omit<StoredPlaylist, 'id'>) => void;
  onCancel: () => void;
}

const PlaylistForm: React.FC<PlaylistFormProps> = ({ type, initialData, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      if (initialData.url) {
        // This regex is a simple check and might not cover all Xtream formats
        const xtreamMatch = initialData.url.match(/^(https?:\/\/[^\/]+)\/get\.php\?username=([^&]+)&password=([^&]+)/);
        if (type === 'xtream' && xtreamMatch) {
          setHost(xtreamMatch[1] || '');
          setUsername(xtreamMatch[2] || '');
          setPassword(xtreamMatch[3] || '');
        } else {
            setUrl(initialData.url || '');
        }
      }
    }
  }, [initialData, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let submissionData: Omit<StoredPlaylist, 'id'>;

    if (type === 'xtream') {
        const constructedUrl = `${host}/get.php?username=${username}&password=${password}&type=m3u_plus&output=ts`;
        submissionData = { name, url: constructedUrl };
    } else { // 'url' or 'file'
        submissionData = { name, url };
    }
    
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Playlist Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>

      {type === 'url' && (
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">M3U URL</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
      )}

      {type === 'xtream' && (
        <>
          <div>
            <label htmlFor="host" className="block text-sm font-medium text-gray-300 mb-1">Server URL (Host)</label>
            <input
              type="text"
              id="host"
              placeholder="http://example.com:8080"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </>
      )}

      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md transition duration-300">Cancel</button>
        <button type="submit" className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-md transition duration-300">{initialData ? 'Update' : 'Add'} Playlist</button>
      </div>
    </form>
  );
};

export default PlaylistForm;
