
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Types ---
interface AdminPanelProps { admin: any; onLogout: () => void; }
interface Source { id: number; type: 'xtream'; identifier: string; xtream_url: string; xtream_user: string; }
interface Playlist { id: number; name: string; sources: Source[]; }
interface PlayerUser { id: number; username: string; }

// --- Reusable Components ---
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="input" />;
const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
    <button {...props} className={`font-bold py-2 px-4 rounded ${props.className}`}>
        {children}
    </button>
);

// --- Main Component ---
const AdminPanel: React.FC<AdminPanelProps> = ({ admin, onLogout }) => {
  // State
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playerUsers, setPlayerUsers] = useState<PlayerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Forms State
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newSourceForms, setNewSourceForms] = useState<any>({});
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '' });

  // Modal State
  const [managingUser, setManagingUser] = useState<PlayerUser | null>(null);
  const [userPlaylistAccess, setUserPlaylistAccess] = useState<number[]>([]);

  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      const [playlistsRes, usersRes] = await Promise.all([
        axios.get('/api/playlists'),
        axios.get('/api/player-users'),
      ]);
      setPlaylists(playlistsRes.data);
      setPlayerUsers(usersRes.data);
    } catch (err) {
      setError('Failed to fetch initial data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Event Handlers ---
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName) return;
    try {
      await axios.post('/api/playlists', { name: newPlaylistName });
      setNewPlaylistName('');
      await fetchData();
    } catch (err) { setError('Failed to create playlist.'); }
  };

  const handleDeletePlaylist = async (id: number) => {
    if (window.confirm('Delete this playlist? This cannot be undone.')) {
      try { await axios.delete(`/api/playlists/${id}`); await fetchData(); } 
      catch (err) { setError('Failed to delete playlist.'); }
    }
  };

  const handleAddSource = async (e: React.FormEvent, playlistId: number) => {
    e.preventDefault();
    const formData = newSourceForms[playlistId];
    if (!formData?.identifier || !formData?.xtream_url || !formData?.xtream_user || !formData?.xtream_pass) {
        return alert('All source fields are required.');
    }
    try {
      await axios.post(`/api/playlists/${playlistId}/sources`, { ...formData, type: 'xtream' });
      setNewSourceForms(prev => ({ ...prev, [playlistId]: undefined }));
      await fetchData();
    } catch (err) { setError('Failed to add source.'); }
  };

  const handleDeleteSource = async (playlistId: number, sourceId: number) => {
    try { await axios.delete(`/api/playlists/${playlistId}/sources/${sourceId}`); await fetchData(); } 
    catch (err) { setError('Failed to delete source.'); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newUserForm.username || !newUserForm.password) return alert('Username and password are required.');
    try {
        await axios.post('/api/player-users', newUserForm);
        setNewUserForm({ username: '', password: '' });
        await fetchData();
    } catch (err) { setError('Failed to create user.'); }
  }

  const handleDeleteUser = async (userId: number) => {
      if(window.confirm('Delete this user? This will revoke all their access.')){
          try { await axios.delete(`/api/player-users/${userId}`); await fetchData(); } 
          catch (err) { setError('Failed to delete user.'); }
      }
  }

  const openAccessManager = async (user: PlayerUser) => {
      setManagingUser(user);
      const res = await axios.get(`/api/player-users/${user.id}/playlists`);
      setUserPlaylistAccess(res.data);
  }

  const handleAccessChange = async (playlistId: number, hasAccess: boolean) => {
      if (!managingUser) return;
      const { id: userId } = managingUser;
      try {
          if (hasAccess) {
              await axios.delete(`/api/player-users/${userId}/playlists/${playlistId}`);
          } else {
              await axios.post(`/api/player-users/${userId}/playlists`, { playlist_id: playlistId });
          }
          // Optimistic update
          setUserPlaylistAccess(prev => hasAccess ? prev.filter(id => id !== playlistId) : [...prev, playlistId]);
      } catch (err) {
          setError('Failed to update access.');
      }
  }

  // --- Render --- 
  if (loading) return <div className="h-screen bg-gray-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-gray-800 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <div>
            <span className="mr-4 text-gray-300">Welcome, <strong>{admin.username}</strong>!</span>
            <Button onClick={onLogout} className="bg-red-600 hover:bg-red-700">Logout</Button>
          </div>
        </div>

        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded mb-6">{error}</div>}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Playlist Management */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Playlists</h2>
            <div className="bg-gray-900 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Create New Playlist</h3>
                <form onSubmit={handleCreatePlaylist} className="flex gap-2">
                    <Input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} placeholder="New Playlist Name" className="flex-grow" />
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create</Button>
                </form>
            </div>
            {playlists.map(p => (
                <details key={p.id} className="bg-gray-900 rounded-lg mb-3 open:ring-2 open:ring-red-500">
                    <summary className="font-bold text-lg p-4 cursor-pointer flex justify-between">
                        {p.name}
                        <button onClick={(e) => { e.preventDefault(); handleDeletePlaylist(p.id);}} className="text-gray-500 hover:text-red-500 text-sm"><i className="fas fa-trash"></i></button>
                    </summary>
                    <div className="p-4 border-t border-gray-700">
                        {p.sources.map(s => <div key={s.id} className="bg-gray-700 p-2 rounded flex justify-between items-center mb-2 text-sm"><span>{s.identifier}</span><button onClick={() => handleDeleteSource(p.id, s.id)} className="text-gray-400 hover:text-red-500"><i className="fas fa-times"></i></button></div>)}
                        <form onSubmit={(e) => handleAddSource(e, p.id)} className="border-t border-gray-600 pt-3 mt-3">
                            <h4 className="font-semibold mb-2 text-sm">Add Xtream Source</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <Input placeholder="Identifier" onChange={e => setNewSourceForms({...newSourceForms, [p.id]: {...newSourceForms[p.id], identifier: e.target.value}})} required />
                                <Input placeholder="Server URL" onChange={e => setNewSourceForms({...newSourceForms, [p.id]: {...newSourceForms[p.id], xtream_url: e.target.value}})} required />
                                <Input placeholder="Username" onChange={e => setNewSourceForms({...newSourceForms, [p.id]: {...newSourceForms[p.id], xtream_user: e.target.value}})} required />
                                <Input type="password" placeholder="Password" onChange={e => setNewSourceForms({...newSourceForms, [p.id]: {...newSourceForms[p.id], xtream_pass: e.target.value}})} required />
                            </div>
                            <Button type="submit" className="mt-3 bg-green-600 hover:bg-green-700 text-xs">Add Source</Button>
                        </form>
                    </div>
                </details>
            ))}
          </div>

          {/* Right Column: User Management */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Player Users</h2>
            <div className="bg-gray-900 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Create New User</h3>
                <form onSubmit={handleCreateUser} className="flex gap-2">
                    <Input value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} placeholder="Username" className="flex-grow" required />
                    <Input value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} placeholder="Password" className="flex-grow" required />
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create</Button>
                </form>
            </div>
            {playerUsers.map(u => (
                <div key={u.id} className="bg-gray-900 p-3 rounded-lg mb-3 flex justify-between items-center">
                    <span className="font-bold">{u.username}</span>
                    <div>
                        <Button onClick={() => openAccessManager(u)} className="bg-gray-600 hover:bg-gray-500 text-xs mr-2">Manage Access</Button>
                        <Button onClick={() => handleDeleteUser(u.id)} className="bg-red-800 hover:bg-red-700 text-xs"><i className="fas fa-trash"></i></Button>
                    </div>
                </div>
            ))}
          </div>
        </div>

        {/* Access Management Modal */}
        {managingUser && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setManagingUser(null)}>
                <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-gray-700">
                        <h3 className="text-xl font-bold">Manage Access for <span className="text-red-500">{managingUser.username}</span></h3>
                    </div>
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {playlists.length > 0 ? playlists.map(p => {
                            const hasAccess = userPlaylistAccess.includes(p.id);
                            return (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-md mb-2">
                                    <span className="font-semibold">{p.name}</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={hasAccess} onChange={() => handleAccessChange(p.id, hasAccess)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                </div>
                            )
                        }) : <p className="text-gray-500">No playlists exist. Create a playlist first.</p>}
                    </div>
                    <div className="p-4 bg-gray-800/50 text-right rounded-b-lg">
                        <Button onClick={() => setManagingUser(null)} className="bg-gray-600 hover:bg-gray-500">Done</Button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;

const _ = `
.input { background-color: #374151; border: 1px solid #4B5563; border-radius: 0.375rem; padding: 0.5rem 0.75rem; color: white; width: 100%; }
.input:focus { outline: none; box-shadow: 0 0 0 2px #EF4444; }
`
