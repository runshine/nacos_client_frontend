
import React, { useState, useEffect } from 'react';
import { Service, SystemMetrics } from '../types';
import { api } from '../api';
import { 
  Play, 
  Square, 
  AlertCircle, 
  CheckCircle2, 
  Server,
  Zap,
  Box,
  Cpu,
  Database,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

interface DashboardProps {
  services: Service[];
  onQuickAction: (serviceName: string, action: 'start' | 'stop') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ services, onQuickAction }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.system.metrics();
        setMetrics(res.data);
      } catch (e) {
        console.error("Metrics failed", e);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: services.length,
    running: services.filter(s => s.real_status?.status === 'running').length,
    stopped: services.filter(s => s.real_status?.status === 'stopped').length,
    unhealthy: services.filter(s => s.real_status?.status === 'partially_running' || s.real_status?.status === 'error').length,
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">System Dashboard</h1>
        <p className="text-slate-500 mt-1">Real-time infrastructure and service health.</p>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="CPU Load" 
          value={metrics?.formatted.cpu_percent || '0%'} 
          percent={metrics?.cpu.percent || 0}
          icon={Cpu}
          color="indigo"
          detail={`${metrics?.cpu.cores || 0} Logical Cores`}
        />
        <MetricCard 
          label="Memory Usage" 
          value={metrics?.formatted.memory_percent || '0%'} 
          percent={metrics?.memory.percent || 0}
          icon={Database}
          color="emerald"
          detail={`${metrics?.formatted.memory_used} / ${metrics?.formatted.memory_total}`}
        />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Network IO</p>
              <div className="mt-2 space-y-1">
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpRight className="text-rose-500" size={16}/> {metrics?.formatted.network_sent || '0 B'}
                </p>
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ArrowDownLeft className="text-indigo-500" size={16}/> {metrics?.formatted.network_recv || '0 B'}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-slate-400">
              <Zap size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">Aggregated interface traffic</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickStat label="Total Projects" value={stats.total} icon={Box} color="text-indigo-600" bg="bg-indigo-50" />
        <QuickStat label="Running" value={stats.running} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <QuickStat label="Stopped" value={stats.stopped} icon={Square} color="text-slate-500" bg="bg-slate-100" />
        <QuickStat label="Alerts" value={stats.unhealthy} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Server className="text-indigo-500" size={20} />
            Recent Services
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Service</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.slice(0, 5).map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">{service.name}</td>
                    <td className="px-6 py-4"><StatusBadge status={service.real_status?.status} /></td>
                    <td className="px-6 py-4 text-right">
                      {service.real_status?.status === 'running' ? (
                        <button onClick={() => onQuickAction(service.name, 'stop')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Square size={18} /></button>
                      ) : (
                        <button onClick={() => onQuickAction(service.name, 'start')} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Play size={18} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Environment</h2>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <EnvRow label="API Status" value="Online" status="ok" />
            <EnvRow label="Docker Engine" value={metrics?.cpu.cores ? 'Connected' : 'Disconnected'} status={metrics?.cpu.cores ? 'ok' : 'err'} />
            <div className="pt-2 border-t border-slate-50 text-xs text-slate-400">
              Last Update: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, percent, icon: Icon, color, detail }: any) => {
  const barColors: any = { indigo: 'bg-indigo-500', emerald: 'bg-emerald-500' };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl text-slate-400"><Icon size={24} /></div>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
        <div className={`${barColors[color]} h-full transition-all duration-1000`} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-slate-400 font-medium">{detail}</p>
    </div>
  );
};

const QuickStat = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`${bg} ${color} p-3 rounded-xl`}><Icon size={24} /></div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const EnvRow = ({ label, value, status }: any) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
    <span className="text-slate-500 text-sm">{label}</span>
    <span className={`text-sm font-bold ${status === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`}>{value}</span>
  </div>
);

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    running: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    partially_running: 'bg-amber-100 text-amber-700 border-amber-200',
    stopped: 'bg-slate-100 text-slate-600 border-slate-200',
    error: 'bg-rose-100 text-rose-700 border-rose-200',
    unknown: 'bg-slate-100 text-slate-400 border-slate-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${styles[status] || styles.unknown}`}>
      {status?.replace('_', ' ') || 'unknown'}
    </span>
  );
};

export default Dashboard;
