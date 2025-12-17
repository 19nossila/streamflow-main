
import React, { useState } from 'react';
import axios from 'axios';

interface PlayerLoginProps {
  onLogin: (data: any) => void;
}

const PlayerLogin: React.FC<PlayerLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
        setError("Username and Password are required.");
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post('/api/player/login', { username, password });
      onLogin(response.data);
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || 'Invalid credentials.');
      } else {
        setError('Could not connect to the server.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <i className="fas fa-play-circle text-6xl text-red-500"></i>
          <h1 className="text-3xl font-bold mt-4">StreamFlow</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 shadow-2xl rounded-lg px-8 pt-6 pb-8">
          {error && <div className="bg-red-800/50 border border-red-700 text-red-300 text-sm p-3 rounded-md mb-4">{error}</div>}

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <i className="fas fa-sign-in-alt"></i>}
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerLogin;
