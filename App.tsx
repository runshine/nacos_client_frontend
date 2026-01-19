
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
import { FileCode, Upload, X, Loader2, Zap, Archive } from 'lucide-react';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Processing States
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Modals
  const [showYamlModal, setShowYamlModal] = useState(false);
  const [showZipModal, setShowZipModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newYamlContent, setNewYamlContent] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    setIsActionLoading(true);
    setActionMessage(`${action.charAt(0).toUpperCase() + action.slice(1)}ing ${name}...`);
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
    } catch (e: any) {
      alert(`Action ${action} failed for ${name}: ${e.response?.data?.error || e.message}`);
    } finally {
      setIsActionLoading(false);
      setActionMessage('');
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
      alert(e.response?.data?.error || 'Archive deployment failed');
    }
  };

  // Drag and Drop Handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validExtensions = ['.zip', '.tar', '.tar.gz', '.tgz', '.tar.bz2', '.tbz', '.tbz2', '.tar.xz', '.txz'];
      const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (hasValidExt) {
        setZipFile(file);
      } else {
        alert("Invalid file format. Please upload a supported archive (ZIP, TAR, etc.)");
      }
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
              isRefreshing={isRefreshing}
              onRefresh={fetchServices}
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

      {/* Global Action Processing Modal */}
      {isActionLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center space-y-4 animate-in zoom-in duration-300">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center bg-indigo-50 rounded-full">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{actionMessage}</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Executing synchronous Docker operation. This may take up to a minute depending on image size and network speed.
              </p>
            </div>
            <div className="pt-2">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-1/3 animate-[loading_2s_infinite_linear]" style={{
                  animation: 'shimmer 1.5s infinite linear',
                  backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
                }} />
              </div>
            </div>
          </div>
        </div>
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

      {/* Archive (ZIP/TAR) Creation Modal */}
      {showZipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload size={24} /> Deploy Service Archive
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
              
              <div 
                className={`p-10 border-2 border-dashed rounded-3xl text-center transition-all duration-300 relative group cursor-pointer ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10' 
                    : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <input 
                  type="file" 
                  id="zip-file" 
                  className="hidden" 
                  accept=".zip,.tar,.tar.gz,.tgz,.tar.bz2,.tbz,.tbz2,.tar.xz,.txz" 
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)} 
                />
                <label htmlFor="zip-file" className="cursor-pointer block">
                  <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 ${
                    isDragging ? 'scale-110 bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50'
                  }`}>
                    {zipFile ? <Archive size={40} /> : <Upload size={40} />}
                  </div>
                  <p className="text-slate-700 font-bold text-lg mb-1">
                    {zipFile ? zipFile.name : 'Drop archive here'}
                  </p>
                  <p className="text-slate-400 text-sm mb-4">
                    {zipFile ? `${(zipFile.size / (1024 * 1024)).toFixed(2)} MB` : 'or click to browse local files'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 opacity-60">
                    {['.zip', '.tar', '.tgz', '.xz'].map(ext => (
                      <span key={ext} className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase">{ext}</span>
                    ))}
                  </div>
                </label>
                
                {zipFile && (
                  <button 
                    onClick={(e) => { e.preventDefault(); setZipFile(null); }}
                    className="absolute top-4 right-4 p-2 bg-white text-rose-500 border border-slate-100 rounded-full shadow-sm hover:bg-rose-50 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button 
                onClick={handleCreateZip}
                disabled={!zipFile || !newServiceName}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 active:scale-[0.99]"
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
