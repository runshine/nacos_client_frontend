
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ProcessInfo, CPUInfo, MemoryInfo, DockerGlobalInfo } from '../types';
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  Network, 
  RefreshCw, 
  Terminal,
  Search,
  Filter,
  Monitor,
  ChevronRight
} from 'lucide-react';

const SystemInsight: React.FC = () => {
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [infoRes, procRes] = await Promise.all([
        api.system.info(),
        api.system.processes({ limit: 30 })
      ]);
      setSysInfo(infoRes.data);
      setProcesses(procRes.data.processes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredProcesses = processes.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Insights</h1>
          <p className="text-slate-500 mt-1">Deep analysis of hardware and runtime environment.</p>
        </div>
        <button onClick={fetchData} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold shadow-sm transition-all">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </header>

      {/* Hardware Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            <Monitor className="text-indigo-500" /> Host Environment
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-10 gap-x-6">
            <InfoItem label="Hostname" value={sysInfo?.hostname} />
            <InfoItem label="OS Flavor" value={sysInfo?.os_name} />
            <InfoItem label="Kernel" value={sysInfo?.kernel_version} />
            <InfoItem label="Architecture" value={sysInfo?.architecture} />
            <InfoItem label="Uptime" value={sysInfo?.formatted?.uptime} />
            <InfoItem label="CPU Model" value={sysInfo?.cpu?.model} className="col-span-2 md:col-span-3 lg:col-span-2" />
            <InfoItem label="Logical Cores" value={sysInfo?.cpu?.logical_cores} />
            <InfoItem label="Boot Time" value={sysInfo?.boot_time ? new Date(sysInfo.boot_time).toLocaleDateString() : 'N/A'} />
          </div>
        </div>
        
        <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 flex flex-col justify-between">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity /> Docker Engine
          </h2>
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center text-indigo-100">
              <span className="text-sm font-medium">Containers</span>
              <span className="text-lg font-bold text-white">{sysInfo?.docker?.containers_running} / {sysInfo?.docker?.containers_total}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-100">
              <span className="text-sm font-medium">Image Inventory</span>
              <span className="text-lg font-bold text-white">{sysInfo?.docker?.images_total}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-100">
              <span className="text-sm font-medium">Total Storage</span>
              <span className="text-lg font-bold text-white">{sysInfo?.formatted?.docker?.images_size}</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-indigo-400/30 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-indigo-200">
            <span>v{sysInfo?.docker?.version}</span>
            <span>API {sysInfo?.docker?.api_version}</span>
          </div>
        </div>
      </div>

      {/* Processes Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Terminal size={22} className="text-slate-400" /> Active Processes
            </h2>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Showing top system consumers</p>
          </div>
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name or PID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-8 py-5">PID</th>
                <th className="px-8 py-5">Process</th>
                <th className="px-8 py-5">CPU Load</th>
                <th className="px-8 py-5">Memory %</th>
                <th className="px-8 py-5">System User</th>
                <th className="px-8 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProcesses.map(p => (
                <tr key={p.pid} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5 font-mono text-sm text-slate-400">{p.pid}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${Math.min(p.cpu_percent, 100)}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-600">{p.cpu_percent.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-medium text-slate-500">{p.memory_percent.toFixed(1)}%</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      {p.username || 'root'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      p.status === 'running' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, className = "" }: any) => (
  <div className={className}>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-base font-bold text-slate-800 truncate" title={value}>{value || 'N/A'}</p>
  </div>
);

export default SystemInsight;
