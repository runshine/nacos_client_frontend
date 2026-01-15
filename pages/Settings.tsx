
import React, { useState } from 'react';
import { api } from '../api';
import { Upload, ShieldCheck, AlertCircle, RefreshCw, Zap } from 'lucide-react';

const Settings: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUpgrading(true);
    setMsg(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.system.upgrade(formData);
      setMsg({ type: 'success', text: response.data.message });
      setFile(null);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Upgrade failed' });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">System Maintenance</h1>
        <p className="text-slate-500 mt-1">Upgrade core components and manage global configurations.</p>
      </header>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Zap size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Hot Upgrade</h2>
            <p className="text-sm text-slate-400">Replace backend core logic without full downtime</p>
          </div>
        </div>

        <form onSubmit={handleUpgrade} className="space-y-6">
          {msg && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {msg.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
              {msg.text}
            </div>
          )}

          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-indigo-400 transition-colors">
            <input 
              type="file" 
              id="upgrade-file" 
              className="hidden" 
              accept=".py"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="upgrade-file" className="cursor-pointer">
              <Upload className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-600 font-semibold">{file ? file.name : 'Select server.py file'}</p>
              <p className="text-slate-400 text-sm mt-1">Only .py files are accepted</p>
            </label>
          </div>

          <button 
            type="submit"
            disabled={!file || isUpgrading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {isUpgrading ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
            Push Upgrade Package
          </button>
        </form>

        <div className="p-4 bg-slate-50 rounded-2xl">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>Note:</strong> Upgrading the server will trigger an automatic restart. All active API connections will be severed momentarily. A backup of the current script will be created in the <code>services</code> directory.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
