
import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Loader2 } from 'lucide-react';
import { api } from '../api';

interface LoginProps {
  onLogin: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter your authentication token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.auth.validate(token);
      if (res.data.authenticated) {
        onLogin(token);
      } else {
        setError(res.data.message || 'Authentication failed');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid token. Please check your configuration.');
      } else {
        setError('Server connection error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Manager Login</h1>
          <p className="text-indigo-100 mt-2">Docker Compose Dashboard Authentication</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm border border-rose-100">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block text-center">API Access Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="••••••••••••••••"
              disabled={loading}
              className="w-full px-4 py-3 text-center text-lg tracking-widest rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Authenticate'}
          </button>
          
          <div className="text-center">
            <p className="text-xs text-slate-400 px-4">
              Access is protected via X-Auth-Token. Ensure the token matches the value defined in your <code>config.json</code> file.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
