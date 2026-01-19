
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
  Play,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface ServiceListProps {
  services: Service[];
  isRefreshing?: boolean;
  onViewService: (service: Service) => void;
  onRefresh: () => void;
  onAction: (name: string, action: string) => void;
  onCreateYaml: () => void;
  onCreateZip: () => void;
}

const ServiceList: React.FC<ServiceListProps> = ({ 
  services, 
  isRefreshing = false,
  onViewService, 
  onRefresh,
  onAction,
  onCreateYaml,
  onCreateZip
}) => {
  const [search, setSearch] = useState('');

  const filtered = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Services</h1>
          <p className="text-slate-500 mt-1">Inventory of your deployed docker compose stacks.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50"
            title="Refresh List"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={onCreateZip}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm"
          >
            <Upload size={18} />
            <span>Deploy Archive</span>
          </button>
          <button 
            onClick={onCreateYaml}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-lg shadow-indigo-100"
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
          placeholder="Search stacks by name or path..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stack Information</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Containers</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Policy</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((service) => (
                <tr 
                  key={service.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => onViewService(service)}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl group-hover:bg-indigo-100 transition-colors shrink-0">
                        <FileCode size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{service.name}</p>
                        <p className="text-xs text-slate-400 font-mono truncate" title={service.path}>
                          {service.path}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={service.real_status?.status} />
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-700">
                        {service.real_status?.running ?? 0} / {service.real_status?.total ?? 0}
                      </span>
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500" 
                          style={{ 
                            width: `${(service.real_status?.total ?? 0) > 0 ? ((service.real_status?.running ?? 0) / (service.real_status?.total ?? 1)) * 100 : 0}%` 
                          }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${
                      service.enabled 
                        ? 'text-emerald-600 bg-emerald-50' 
                        : 'text-slate-500 bg-slate-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${service.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {service.enabled ? 'Auto-boot' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => onAction(service.name, service.real_status?.status === 'running' ? 'stop' : 'start')}
                        className={`p-2.5 rounded-xl transition-all ${
                          service.real_status?.status === 'running' 
                            ? 'text-rose-500 hover:bg-rose-50' 
                            : 'text-emerald-500 hover:bg-emerald-50'
                        }`}
                        title={service.real_status?.status === 'running' ? 'Stop' : 'Start'}
                      >
                        {service.real_status?.status === 'running' ? <Power size={20} /> : <Play size={20} />}
                      </button>
                      <button 
                        onClick={() => onAction(service.name, 'restart')}
                        className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Restart"
                      >
                        <RotateCcw size={20} />
                      </button>
                      <div className="w-px h-6 bg-slate-200 mx-2" />
                      <button 
                        onClick={() => onViewService(service)}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Manage Details"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filtered.length === 0 && (
          <div className="py-24 text-center bg-white">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-full mb-4">
              <Search className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-700">No services found</h3>
            <p className="text-slate-400 max-w-sm mx-auto mt-2">Try adjusting your search filters or deploy a new Docker stack.</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center text-xs text-slate-400 px-4">
        <p>Showing {filtered.length} of {services.length} stacks</p>
        <p>Sync: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default ServiceList;
