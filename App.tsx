
import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { Service } from './types';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServiceList from './pages/ServiceList';
import ServiceDetail from './pages/ServiceDetail';
import SystemInsight from './pages/SystemInsight';
import Validation from './pages/Validation';
import Settings from './pages/Settings';
import { FileCode, Upload, X } from 'lucide-react';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modals
  const [showYamlModal, setShowYamlModal] = useState(false);
  const [showZipModal, setShowZipModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newYamlContent, setNewYamlContent] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);

  const fetchServices = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const response = await api.services.list();
      setServices(response.data);
    } catch (e) {
      console.error(e);
      if ((e as any).response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchServices]);

  const handleLogin = (newToken: string) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
  };

  const handleAction = async (name: string, action: string) => {
    try {
      if (action === 'start') await api.services.start(name);
      if (action === 'stop') await api.services.stop(name);
      if (action === 'restart') await api.services.restart(name);
      fetchServices();
      // Update selected service if viewing it
      if (selectedService?.name === name) {
        const detail = await api.services.get(name);
        setSelectedService(detail.data);
      }
    } catch (e) {
      alert(`Action ${action} failed for ${name}`);
    }
  };

  const handleCreateYaml = async () => {
    try {
      await api.services.createYaml(newServiceName, newYamlContent);
      setShowYamlModal(false);
      setNewServiceName('');
      setNewYamlContent('');
      fetchServices();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Creation failed');
    }
  };

  const handleCreateZip = async () => {
    if (!zipFile) return;
    const formData = new FormData();
    formData.append('name', newServiceName);
    formData.append('file', zipFile);
    try {
      await api.services.createZip(formData);
      setShowZipModal(false);
      setNewServiceName('');
      setZipFile(null);
      fetchServices();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Zip deployment failed');
    }
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={(tab) => {
        setActiveTab(tab);
        setSelectedService(null);
      }} 
      onLogout={handleLogout}
    >
      {selectedService ? (
        <ServiceDetail 
          service={selectedService} 
          onBack={() => setSelectedService(null)} 
          onRefresh={async () => {
            const res = await api.services.get(selectedService.name);
            setSelectedService(res.data);
          }}
        />
      ) : (
        <>
          {activeTab === 'dashboard' && <Dashboard services={services} onQuickAction={handleAction} />}
          {activeTab === 'services' && (
            <ServiceList 
              services={services} 
              onViewService={async (s) => {
                const res = await api.services.get(s.name);
                setSelectedService(res.data);
              }}
              onAction={handleAction}
              onCreateYaml={() => setShowYamlModal(true)}
              onCreateZip={() => setShowZipModal(true)}
            />
          )}
          {activeTab === 'monitoring' && <SystemInsight />}
          {activeTab === 'validation' && <Validation />}
          {activeTab === 'settings' && <Settings />}
        </>
      )}

      {/* YAML Creation Modal */}
      {showYamlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileCode size={24} /> New Service Stack
              </h2>
              <button onClick={() => setShowYamlModal(false)} className="hover:bg-white/20 p-2 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Service Name (Alphanumeric only)</label>
                <input 
                  type="text" 
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="my-awesome-app"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Docker Compose YAML</label>
                <textarea 
                  rows={10}
                  value={newYamlContent}
                  onChange={(e) => setNewYamlContent(e.target.value)}
                  placeholder="services:\n  web:\n    image: nginx..."
                  className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm bg-slate-50"
                />
              </div>
              <button 
                onClick={handleCreateYaml}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                Create and Deploy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZIP Creation Modal */}
      {showZipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload size={24} /> Deploy ZIP Archive
              </h2>
              <button onClick={() => setShowZipModal(false)} className="hover:bg-white/20 p-2 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Service Name</label>
                <input 
                  type="text" 
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="project-bundle"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-indigo-400 transition-colors">
                <input type="file" id="zip-file" className="hidden" accept=".zip" onChange={(e) => setZipFile(e.target.files?.[0] || null)} />
                <label htmlFor="zip-file" className="cursor-pointer">
                  <Upload className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-600 font-semibold">{zipFile ? zipFile.name : 'Select stack .zip'}</p>
                </label>
              </div>
              <button 
                onClick={handleCreateZip}
                disabled={!zipFile || !newServiceName}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
              >
                Upload and Extract
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
