import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin'); // Default for easier testing
  const [password, setPassword] = useState('admin'); // Default for easier testing
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await storageService.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        // The error message will likely come from the API service now
        setError('Invalid username or password');
      }
    } catch (err: any) {
        console.error("Login Component Error:", err);
        setError(err.message || 'An unexpected error occurred during login.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-900/50">
            <i className="fas fa-user-lock text-2xl text-white"></i>
          </div>
          <h2 className="text-2xl font-bold text-white">StreamFlow Login</h2>
          <p className="text-gray-400 mt-2">Enter your credentials to access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="e.g. admin"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-800/50">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition-colors shadow-lg disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-600">
          Login via Server | Default: admin / admin
        </div>
      </div>
    </div>
  );
};

export default Login;