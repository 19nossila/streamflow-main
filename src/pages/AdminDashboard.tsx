import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUser, deleteUser, getPlaylists, addPlaylist, updatePlaylist, deletePlaylist, getSettings, updateSettings } from '../utils/api';
import { User, StoredPlaylist } from '../types';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import PlaylistForm from '../components/PlaylistForm';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

type PlaylistType = 'url' | 'xtream' | 'file';

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingPlaylist, setEditingPlaylist] = useState<StoredPlaylist | null>(null);
    const [isPlaylistModalOpen, setPlaylistModalOpen] = useState(false);
    
    // Explicitly type the state here
    const [newPlaylistType, setNewPlaylistType] = useState<PlaylistType>('url');

    const loadData = useCallback(async () => {
        try {
            const usersData = await getUsers();
            const playlistsData = await getPlaylists();
            const settingsData = await getSettings();
            setUsers(usersData);
            setPlaylists(playlistsData);
            setSettings(settingsData);
        } catch (error) {
            console.error("Error loading admin data:", error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // User Management Handlers
    const handleUserUpdate = async (user: User) => {
        try {
            const updatedUser = await updateUser(user.id, user);
            setUsers(users.map(u => u.id === user.id ? updatedUser : u));
            setEditingUser(null);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const handleUserDelete = async (userId: string) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteUser(userId);
                setUsers(users.filter(u => u.id !== userId));
            } catch (error) {
                console.error("Error deleting user:", error);
            }
        }
    };

    // Playlist Management Handlers
    const handlePlaylistSubmit = async (playlistData: Omit<StoredPlaylist, 'id'>) => {
        try {
            if (editingPlaylist) {
                const updatedPlaylist = await updatePlaylist(editingPlaylist.id, playlistData);
                setPlaylists(playlists.map(p => p.id === editingPlaylist.id ? updatedPlaylist : p));
            } else {
                const newPlaylist = await addPlaylist(playlistData);
                setPlaylists([...playlists, newPlaylist]);
            }
            setPlaylistModalOpen(false);
            setEditingPlaylist(null);
        } catch (error) {
            console.error("Error saving playlist:", error);
        }
    };

    const handlePlaylistDelete = async (playlistId: string) => {
        if (window.confirm("Are you sure you want to delete this playlist?")) {
            try {
                await deletePlaylist(playlistId);
                setPlaylists(playlists.filter(p => p.id !== playlistId));
            } catch (error) {
                console.error("Error deleting playlist:", error);
            }
        }
    };
    
    const openPlaylistModal = (type: PlaylistType, playlist: StoredPlaylist | null = null) => {
        setNewPlaylistType(type);
        setEditingPlaylist(playlist);
        setPlaylistModalOpen(true);
    };

    // Settings Handler
    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings({
            ...settings,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSettingsSave = async () => {
        try {
            await updateSettings(settings);
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        }
    };

    return (
        <div className="p-4 md:p-8 bg-gray-900 text-white min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-cyan-400">Admin Dashboard</h1>

            <Tabs selectedTabClassName="bg-gray-700 text-white" selectedTabPanelClassName="border-t-2 border-cyan-400 bg-gray-800">
                <TabList className="flex border-b border-gray-600">
                    <Tab className="px-4 py-2 cursor-pointer focus:outline-none -mb-px border-b-2 border-transparent">User Management</Tab>
                    <Tab className="px-4 py-2 cursor-pointer focus:outline-none -mb-px border-b-2 border-transparent">Playlist Management</Tab>
                    <Tab className="px-4 py-2 cursor-pointer focus:outline-none -mb-px border-b-2 border-transparent">Settings</Tab>
                </TabList>

                {/* User Management Panel */}
                <TabPanel className="p-4">
                    <h2 className="text-2xl font-semibold mb-4 text-cyan-300">Users</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-800 border border-gray-700">
                            <thead>
                                <tr className="bg-gray-700">
                                    <th className="px-4 py-2 text-left">Username</th>
                                    <th className="px-4 py-2 text-left">Role</th>
                                    <th className="px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700">
                                        <td className="px-4 py-2">{user.username}</td>
                                        <td className="px-4 py-2">{user.role}</td>
                                        <td className="px-4 py-2 flex justify-center items-center space-x-2">
                                            <button onClick={() => setEditingUser(user)} className="p-1 text-blue-400 hover:text-blue-300"><Edit size={18} /></button>
                                            <button onClick={() => handleUserDelete(user.id)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabPanel>

                {/* Playlist Management Panel */}
                <TabPanel className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-cyan-300">Playlists</h2>
                        <div className="flex space-x-2">
                            <button onClick={() => openPlaylistModal('url')} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                                <PlusCircle size={20} className="mr-2"/> Add from URL
                            </button>
                             <button onClick={() => openPlaylistModal('xtream')} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                                <PlusCircle size={20} className="mr-2"/> Add Xtream
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-800 border border-gray-700">
                             <thead>
                                <tr className="bg-gray-700">
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">Source URL/Host</th>
                                    <th className="px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {playlists.map(playlist => (
                                    <tr key={playlist.id} className="border-t border-gray-700 hover:bg-gray-700">
                                        <td className="px-4 py-2">{playlist.name}</td>
                                        <td className="px-4 py-2 truncate max-w-xs">{playlist.url || 'N/A'}</td>
                                        <td className="px-4 py-2 flex justify-center items-center space-x-2">
                                            <button onClick={() => openPlaylistModal(playlist.url ? 'url' : 'xtream', playlist)} className="p-1 text-blue-400 hover:text-blue-300"><Edit size={18} /></button>
                                            <button onClick={() => handlePlaylistDelete(playlist.id)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabPanel>

                {/* Settings Panel */}
                <TabPanel className="p-4">
                    <h2 className="text-2xl font-semibold mb-4 text-cyan-300">Application Settings</h2>
                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block mb-1 font-medium" htmlFor="appName">Application Name</label>
                            <input
                                type="text"
                                id="appName"
                                name="appName"
                                value={settings.appName || ''}
                                onChange={handleSettingsChange}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                        </div>
                         <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="allowPublicRegistration"
                                    checked={settings.allowPublicRegistration || false}
                                    onChange={handleSettingsChange}
                                    className="mr-2 h-4 w-4 bg-gray-600 border-gray-500 rounded text-cyan-500 focus:ring-cyan-500"
                                />
                                <span>Allow Public Registration</span>
                            </label>
                        </div>
                        <button onClick={handleSettingsSave} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                            Save Settings
                        </button>
                    </div>
                </TabPanel>
            </Tabs>

            {/* Playlist Modal */}
            {isPlaylistModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4 text-cyan-400">{editingPlaylist ? 'Edit' : 'Add'} Playlist</h3>
                        <PlaylistForm
                            type={newPlaylistType}
                            initialData={editingPlaylist}
                            onSubmit={handlePlaylistSubmit}
                            onCancel={() => {
                                setPlaylistModalOpen(false);
                                setEditingPlaylist(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* User Edit Modal */}
            {editingUser && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                         <h3 className="text-xl font-bold mb-4 text-cyan-400">Edit User</h3>
                         <form onSubmit={(e) => { e.preventDefault(); handleUserUpdate(editingUser); }}>
                            <div className="mb-4">
                                <label className="block mb-1">Username</label>
                                <input type="text" value={editingUser.username} disabled className="w-full p-2 bg-gray-700 border-gray-600 rounded cursor-not-allowed"/>
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1">Role</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'user' })}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setEditingUser(null)} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded">Cancel</button>
                                <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded">Save</button>
                            </div>
                         </form>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default AdminDashboard;
