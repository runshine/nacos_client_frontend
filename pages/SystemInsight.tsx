
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
  Monitor
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
        api.system.processes({ limit: 20 })
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
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Insights</h1>
          <p className="text-slate-500 mt-1">Deep analysis of hardware and runtime environment.</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-white border rounded-xl hover:bg-slate-50">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Hardware Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Monitor className="text-indigo-500" /> Host Environment
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <InfoItem label="Hostname" value={sysInfo?.hostname} />
            <InfoItem label="OS" value={sysInfo?.os_name} />
            <InfoItem label="Kernel" value={sysInfo?.kernel_version} />
            <InfoItem label="Uptime" value={sysInfo?.formatted?.uptime} />
            <InfoItem label="CPU Model" value={sysInfo?.cpu?.model} className="col-span-2" />
            <InfoItem label="Architecture" value={sysInfo?.architecture} />
            <InfoItem label="Logical Cores" value={sysInfo?.cpu?.logical_cores} />
          </div>
        </div>
        
        <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-lg shadow-indigo-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity /> Docker Stats
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-indigo-100">
              <span>Containers</span>
              <span className="font-bold text-white">{sysInfo?.docker?.containers_running} / {sysInfo?.docker?.containers_total}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-100">
              <span>Images</span>
              <span className="font-bold text-white">{sysInfo?.docker?.images_total}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-100">
              <span>Storage Usage</span>
              <span className="font-bold text-white">{sysInfo?.formatted?.docker?.images_size}</span>
            </div>
            <div className="pt-4 border-t border-indigo-400/30 text-xs text-indigo-200">
              API Version: {sysInfo?.docker?.api_version}
            </div>
          </div>
        </div>
      </div>

      {/* Processes Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Terminal size={20} className="text-slate-400" /> Top Processes
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter processes..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase">
                <th className="px-6 py-4">PID</th>
                <th className="px-6 py-4">Process Name</th>
                <th className="px-6 py-4">CPU %</th>
                <th className="px-6 py-4">MEM %</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProcesses.map(p => (
                <tr key={p.pid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-slate-400">{p.pid}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{p.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(p.cpu_percent, 100)}%` }} />
                      </div>
                      <span className="text-xs font-medium">{p.cpu_percent.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{p.memory_percent.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{p.username || 'root'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-semibold text-slate-700 truncate">{value || 'N/A'}</p>
  </div>
);

export default SystemInsight;
