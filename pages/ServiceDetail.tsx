
import React, { useState, useEffect } from 'react';
import { Service, ContainerInfo } from '../types';
import { api } from '../api';
import { StatusBadge } from './Dashboard';
import { 
  ArrowLeft, 
  Terminal, 
  FileText, 
  Settings, 
  Play, 
  Square, 
  RotateCcw, 
  Trash2,
  AlertTriangle,
  Code
} from 'lucide-react';

interface ServiceDetailProps {
  service: Service;
  onBack: () => void;
  onRefresh: () => void;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ service, onBack, onRefresh }) => {
  const [logs, setLogs] = useState<string>('Loading logs...');
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'config'>('status');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    try {
      const response = await api.services.logs(service.name);
      setLogs(response.data.logs);
    } catch (e) {
      setLogs('Error fetching logs.');
    }
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart' | 'enable' | 'disable') => {
    try {
      if (action === 'start') await api.services.start(service.name);
      if (action === 'stop') await api.services.stop(service.name);
      if (action === 'restart') await api.services.restart(service.name);
      if (action === 'enable') await api.services.enable(service.name);
      if (action === 'disable') await api.services.disable(service.name);
      onRefresh();
    } catch (e) {
      alert(`Action failed: ${action}`);
    }
  };

  const handleDelete = async (force: boolean) => {
    if (confirm(`Are you sure you want to delete ${service.name}? This cannot be undone.`)) {
      try {
        await api.services.delete(service.name, force);
        onBack();
      } catch (e) {
        alert('Delete failed. Ensure service is stopped.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{service.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={service.real_status?.status} />
            <span className="text-slate-400 text-sm font-mono">{service.path}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('status')}
            className={`px-6 py-4 font-semibold text-sm flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'status' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings size={18} />
            Control Center
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-4 font-semibold text-sm flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'logs' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Terminal size={18} />
            Runtime Logs
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`px-6 py-4 font-semibold text-sm flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'config' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code size={18} />
            YAML Configuration
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'status' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Operations</h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleAction('start')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700">
                    <Play size={18} /> Start
                  </button>
                  <button onClick={() => handleAction('stop')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-100 hover:bg-rose-700">
                    <Square size={18} /> Stop
                  </button>
                  <button onClick={() => handleAction('restart')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900">
                    <RotateCcw size={18} /> Restart
                  </button>
                  <div className="h-10 w-px bg-slate-200 mx-2" />
                  <button 
                    onClick={() => handleAction(service.enabled ? 'disable' : 'enable')}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 border rounded-xl font-bold text-sm transition-colors ${
                      service.enabled ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}
                  >
                    {service.enabled ? 'Disable Auto-boot' : 'Enable Auto-boot'}
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Containers ({service.real_status?.containers?.length || 0})</h3>
                <div className="grid grid-cols-1 gap-4">
                  {service.real_status?.containers?.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${c.State === 'running' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                          <Terminal size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.Name}</p>
                          <p className="text-xs text-slate-500 font-mono">{c.Image}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-sm font-bold ${c.State === 'running' ? 'text-emerald-600' : 'text-slate-400'}`}>{c.State.toUpperCase()}</p>
                          <p className="text-xs text-slate-400">{c.Status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="pt-8 border-t border-slate-100">
                <button 
                  onClick={() => handleDelete(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-rose-600 border border-rose-200 bg-rose-50/50 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={18} />
                  Remove Service Stack
                </button>
              </section>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-500 uppercase">Latest stdout/stderr</h3>
                <button onClick={fetchLogs} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                  <RotateCcw size={18} />
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-300 p-6 rounded-2xl overflow-auto text-sm font-mono max-h-[600px] leading-relaxed shadow-inner">
                {logs || 'Empty log buffer.'}
              </pre>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-500 uppercase">service.yaml Definition</h3>
              </div>
              <pre className="bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-auto text-sm font-mono max-h-[600px] text-slate-700 shadow-inner">
                {service.yaml_content || 'No YAML content found.'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
