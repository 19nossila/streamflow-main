
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { xtreamService } from '../services/xtreamService';
import { User, StoredPlaylist } from '../types';
import { FaCogs, FaSignOutAlt, FaPlus, FaTrash, FaEdit, FaPlay, FaArrowLeft, FaUsers, FaLock, FaKey, FaSync, FaDownload, FaUpload, FaList, FaLink, FaFile, FaFileUpload, FaInbox, FaBolt, FaTimes } from 'react-icons/fa';


interface AdminDashboardProps {
  onLogout: () => void;
  onPreview: (playlist: StoredPlaylist) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onPreview }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'playlists' | 'settings'>('playlists');
  
  const [users, setUsers] = useState<User[]>([]);
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
  
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  
  const [sourceUrls, setSourceUrls] = useState('');
  const [xtreamCredentials, setXtreamCredentials] = useState({ serverUrl: '', username: '', password: '' });
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, playlists] = await Promise.all([
        storageService.getUsers(),
        storageService.getPlaylists(),
      ]);
      setUsers(users);
      setPlaylists(playlists);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
      setError(null);
      setSuccessMsg(null);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storageService.addUser({ ...newUser, role: 'user' });
      setNewUser({ username: '', password: '' });
      await loadData();
      clearMessages();
      setSuccessMsg('User added successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        await storageService.deleteUser(id);
        await loadData();
        clearMessages();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      clearMessages();
      
      if (passwords.new !== passwords.confirm) {
          setError("Passwords do not match.");
          return;
      }
      if (passwords.new.length < 3) {
          setError("Password must be at least 3 characters long.");
          return;
      }

      try {
          const currentUser = storageService.getCurrentUser();
          if (!currentUser) throw new Error("Not logged in");
          
          await storageService.updateUserPassword(currentUser.id, passwords.new);
          setPasswords({ new: '', confirm: '' });
          setSuccessMsg("Password updated successfully.");
      } catch (err: any) {
          setError(err.message);
      }
  };

  const handleExportBackup = async () => {
      try {
        const data = await storageService.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `streamflow_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccessMsg("Configuration exported successfully.");
      } catch (err: any) {
        setError("Export failed: " + err.message);
      }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!window.confirm("WARNING: This will replace all current data. Continue?")) {
          e.target.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const content = event.target?.result as string;
              await storageService.importData(content);
              alert("Import successful! Reloading now.");
              window.location.reload();
          } catch (err: any) {
              setError("Import failed: " + err.message);
          }
      };
      reader.readAsText(file);
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (!newPlaylistName.trim()) return;
          const newPl = await storageService.createPlaylist(newPlaylistName);
          setNewPlaylistName('');
          await loadData();
          setEditingPlaylistId(newPl.id);
          clearMessages();
      } catch (err: any) {
          setError(err.message);
      }
  };

  const handleDeletePlaylist = async (id: string) => {
      if (window.confirm('Delete this entire playlist?')) {
          await storageService.deletePlaylist(id);
          if (editingPlaylistId === id) setEditingPlaylistId(null);
          await loadData();
      }
  };

  const handleAddUrls = async (playlistId: string) => {
      setUploadLoading(true);
      clearMessages();
      const urls = sourceUrls.split('\n').map(u => u.trim()).filter(Boolean);
      if (urls.length === 0) {
          setError("No URLs provided");
          setUploadLoading(false);
          return;
      }
      let success = 0, fail = 0;
      try {
          for (const url of urls) {
              try {
                  const res = await fetch(url);
                  if (!res.ok) throw new Error(`Fetch failed for ${url}`);
                  const content = await res.text();
                  await storageService.addSourceToPlaylist(playlistId, { type: 'url', content, identifier: url });
                  success++;
              } catch (e) {
                  console.error(e);
                  fail++;
              }
          }
          setSourceUrls('');
          await loadData();
          if (fail > 0) setError(`Added ${success} URLs. Failed to add ${fail}.`);
          else setSuccessMsg(`Successfully added ${success} URLs.`);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setUploadLoading(false);
      }
  };

  const handleAddXtream = async (playlistId: string) => {
    setUploadLoading(true);
    clearMessages();
    const { serverUrl, username, password } = xtreamCredentials;
    if (!serverUrl || !username) {
        setError("Server URL and Username are required");
        setUploadLoading(false);
        return;
    }
    try {
        const channels = await xtreamService.getChannels(serverUrl, username, password);
        let m3uContent = '#EXTM3U\n';
        channels.forEach(ch => { m3uContent += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" tvg-logo="${ch.logo}" group-title="${ch.group}",${ch.name}\n${ch.url}\n`; });
        await storageService.addSourceToPlaylist(playlistId, { type: 'xtream', content: m3uContent, identifier: `${username}@${serverUrl}` });
        setXtreamCredentials({ serverUrl: '', username: '', password: '' });
        await loadData();
        setSuccessMsg(`Added ${channels.length} channels from Xtream.`);
    } catch (e: any) {
        setError(e.message);
    } finally {
        setUploadLoading(false);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, playlistId: string) => {
      const files = e.target.files;
      if (!files) return;
      setUploadLoading(true);
      clearMessages();
      let processed = 0;
      Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onload = async (event) => {
              try {
                  const content = event.target?.result as string;
                  await storageService.addSourceToPlaylist(playlistId, { type: 'file', content, identifier: file.name });
              } catch (e) { console.error(e); } 
              finally {
                  processed++;
                  if (processed === files.length) {
                      await loadData();
                      setUploadLoading(false);
                      setSuccessMsg(`Uploaded ${files.length} files.`);
                  }
              }
          };
          reader.readAsText(file);
      });
  };

  const handleRemoveSource = async (playlistId: string, sourceId: string) => {
      if (window.confirm("Remove this source?")) {
          await storageService.removeSourceFromPlaylist(playlistId, sourceId);
          await loadData();
      }
  };

  const activePlaylist = playlists.find(p => p.id === editingPlaylistId);
  
  const SourceIcon: React.FC<{ type: 'url' | 'file' | 'xtream' }> = ({ type }) => {
    const baseClasses = "w-8 h-8 rounded flex items-center justify-center shrink-0";
    switch (type) {
      case 'url': return <div className={`${baseClasses} bg-blue-900/30 text-blue-400`}><FaLink /></div>;
      case 'file': return <div className={`${baseClasses} bg-purple-900/30 text-purple-400`}><FaFile /></div>;
      case 'xtream': return <div className={`${baseClasses} bg-green-900/30 text-green-400`}><FaBolt /></div>;
      default: return null;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold text-red-500"><FaCogs className="inline mr-2" />Admin Dashboard</h1>
        <button onClick={onLogout} className="text-gray-300 hover:text-white"><FaSignOutAlt className="inline mr-1" /> Logout</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-gray-800 p-4 hidden md:block border-r border-gray-700">
          <nav className="space-y-2">
            <button onClick={() => { setActiveTab('playlists'); setEditingPlaylistId(null); }} className={`w-full text-left px-4 py-3 rounded transition-colors ${activeTab === 'playlists' ? 'bg-red-600' : 'text-gray-400 hover:bg-gray-700'}`}><FaList className="inline mr-2" /> Playlists</button>
            <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded transition-colors ${activeTab === 'users' ? 'bg-red-600' : 'text-gray-400 hover:bg-gray-700'}`}><FaUsers className="inline mr-2" /> Users</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-3 rounded transition-colors ${activeTab === 'settings' ? 'bg-red-600' : 'text-gray-400 hover:bg-gray-700'}`}><FaLock className="inline mr-2" /> Settings</button>
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {error && <div className="bg-red-900/50 border-red-500 p-4 rounded mb-6 flex justify-between">{error} <button onClick={() => setError(null)}><FaTimes /></button></div>}
          {successMsg && <div className="bg-green-900/50 border-green-500 p-4 rounded mb-6 flex justify-between">{successMsg} <button onClick={() => setSuccessMsg(null)}><FaTimes /></button></div>}

          {activeTab === 'playlists' && !editingPlaylistId && (
             <div className="max-w-4xl mx-auto">
                  <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700"><h3 className="text-lg font-bold mb-4">Create New Playlist</h3><form onSubmit={handleCreatePlaylist} className="flex gap-4"><input required placeholder="e.g. Live TV, Movies" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} className="flex-1 bg-gray-900 p-3 rounded"/><button type="submit" className="bg-red-600 px-6 py-2 rounded font-bold"><FaPlus className="inline mr-2"/>Create</button></form></div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{playlists.map(pl => (<div key={pl.id} className="bg-gray-800 border border-gray-700 rounded-xl flex flex-col"><div className="p-4 flex justify-between items-center"><h3 className="font-bold truncate">{pl.name}</h3><button onClick={() => handleDeletePlaylist(pl.id)} className="text-gray-500 hover:text-red-500"><FaTrash /></button></div><div className="p-4 flex-1 flex flex-col justify-center items-center"><span className="text-3xl font-bold">{pl.sources.length}</span><span className="text-sm text-gray-400">Sources</span></div><div className="p-3 bg-gray-900/30 flex gap-2"><button onClick={() => setEditingPlaylistId(pl.id)} className="flex-1 bg-gray-700 py-2 rounded text-sm"><FaEdit className="inline mr-2"/>Manage</button><button onClick={() => onPreview(pl)} className="px-3 bg-blue-600/50 rounded"><FaPlay /></button></div></div>))}{playlists.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">Create a playlist to get started.</div>}</div>
              </div>
          )}

          {activeTab === 'playlists' && editingPlaylistId && activePlaylist && (
              <div className="max-w-5xl mx-auto">
                  <button onClick={() => setEditingPlaylistId(null)} className="mb-4 text-gray-400 flex items-center gap-2"><FaArrowLeft /> Back to Playlists</button>
                  <h2 className="text-2xl font-bold mb-6">Editing: {activePlaylist.name}</h2>
                  <div className="grid lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1 space-y-6">
                          <div className="bg-gray-800 p-5 rounded-lg border border-gray-700"><h4>Add from URLs</h4><textarea placeholder="https://.../list.m3u\n..." value={sourceUrls} onChange={e => setSourceUrls(e.target.value)} className="w-full bg-gray-900 p-2 h-24"/><button onClick={() => handleAddUrls(activePlaylist.id)} disabled={uploadLoading} className="w-full bg-blue-600 py-2 rounded">{uploadLoading ? 'Processing...' : 'Fetch URLs'}</button></div>
                          <div className="bg-gray-800 p-5 rounded-lg border border-gray-700"><h4>Add from Xtream Codes</h4><div className="space-y-3"><input placeholder="Server URL" value={xtreamCredentials.serverUrl} onChange={e => setXtreamCredentials({ ...xtreamCredentials, serverUrl: e.target.value })} className="w-full bg-gray-900 p-2"/><input placeholder="Username" value={xtreamCredentials.username} onChange={e => setXtreamCredentials({ ...xtreamCredentials, username: e.target.value })} className="w-full bg-gray-900 p-2"/><input type="password" placeholder="Password" value={xtreamCredentials.password} onChange={e => setXtreamCredentials({ ...xtreamCredentials, password: e.target.value })} className="w-full bg-gray-900 p-2"/></div><button onClick={() => handleAddXtream(activePlaylist.id)} disabled={uploadLoading} className="w-full mt-3 bg-green-600 py-2 rounded">{uploadLoading ? 'Processing...' : 'Login & Add'}</button></div>
                          <div className="bg-gray-800 p-5 rounded-lg border border-gray-700"><h4>Upload Files</h4><label className="cursor-pointer bg-gray-900 p-6 flex flex-col items-center justify-center rounded"><FaFileUpload className="text-2xl mb-2"/><span className="text-xs">Select .m3u files</span><input type="file" multiple accept=".m3u,.m3u8" onChange={(e) => handleFileUpload(e, activePlaylist.id)} className="hidden"/></label></div>
                      </div>
                      <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700"><div className="p-4 border-b border-gray-700"><h3>Active Sources ({activePlaylist.sources.length})</h3></div><div className="divide-y divide-gray-700">{activePlaylist.sources.length === 0 ? <div className="p-10 text-center"><FaInbox className="mx-auto text-4xl opacity-30"/><p>No sources added.</p></div> : activePlaylist.sources.map(src => (<div key={src.id} className="p-4 flex items-center justify-between"> <div className="flex items-center gap-3 overflow-hidden"><SourceIcon type={src.type} /><div className="min-w-0"><p className="font-medium truncate text-sm">{src.identifier}</p><p className="text-xs text-gray-500">{new Date(src.addedAt).toLocaleDateString()}</p></div></div><button onClick={() => handleRemoveSource(activePlaylist.id, src.id)} className="text-gray-500"><FaTrash /></button></div>))}</div></div>
                  </div>
              </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
