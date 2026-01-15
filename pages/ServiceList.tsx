
import React, { useState } from 'react';
import { Service } from '../types';
import { StatusBadge } from './Dashboard';
import { 
  Search, 
  Plus, 
  Settings2, 
  Terminal, 
  Trash2, 
  Power, 
  RotateCcw,
  FileCode,
  Upload,
  // Added Play icon to fix reference error
  Play
} from 'lucide-react';

interface ServiceListProps {
  services: Service[];
  onViewService: (service: Service) => void;
  onAction: (name: string, action: string) => void;
  onCreateYaml: () => void;
  onCreateZip: () => void;
}

const ServiceList: React.FC<ServiceListProps> = ({ 
  services, 
  onViewService, 
  onAction,
  onCreateYaml,
  onCreateZip
}) => {
  const [search, setSearch] = useState('');

  const filtered = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Services</h1>
          <p className="text-slate-500 mt-1">Inventory of your deployed docker compose stacks.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onCreateZip}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm"
          >
            <Upload size={18} />
            Deploy ZIP
          </button>
          <button 
            onClick={onCreateYaml}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-lg shadow-indigo-100"
          >
            <Plus size={18} />
            New Stack
          </button>
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Search stacks by name..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((service) => (
          <div 
            key={service.id} 
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col group overflow-hidden"
          >
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                  <FileCode size={24} />
                </div>
                <StatusBadge status={service.real_status?.status} />
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-1">{service.name}</h3>
              <p className="text-xs text-slate-400 font-mono mb-4 truncate">{service.path}</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <p className="text-slate-400 text-xs">Containers</p>
                  <p className="font-bold text-slate-700">{service.real_status?.running}/{service.real_status?.total || 0}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <p className="text-slate-400 text-xs">Policy</p>
                  <p className="font-bold text-slate-700">{service.enabled ? 'Auto-boot' : 'Manual'}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex gap-1">
                <button 
                  onClick={() => onAction(service.name, service.real_status?.status === 'running' ? 'stop' : 'start')}
                  className={`p-2 rounded-lg transition-colors ${
                    service.real_status?.status === 'running' 
                      ? 'text-rose-500 hover:bg-rose-100' 
                      : 'text-emerald-500 hover:bg-emerald-100'
                  }`}
                  title={service.real_status?.status === 'running' ? 'Stop' : 'Start'}
                >
                  {service.real_status?.status === 'running' ? <Power size={18} /> : <Play size={18} />}
                </button>
                <button 
                  onClick={() => onAction(service.name, 'restart')}
                  className="p-2 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors"
                  title="Restart"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => onViewService(service)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
              <Search className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No services found</h3>
            <p className="text-slate-400">Try adjusting your search or create a new stack.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceList;
