
import React, { useState, useEffect } from 'react';
import { Service, ContainerInfo } from '../types';
import { api } from '../api';
import { StatusBadge } from './Dashboard';
import { 
  ArrowLeft, 
  Terminal, 
  Settings, 
  Play, 
  Square, 
  RotateCcw, 
  Trash2,
  AlertTriangle,
  Code,
  X,
  ShieldAlert,
  Info,
  Loader2,
  Zap,
  XCircle,
  FolderOpen,
  FileCode,
  FileText,
  Save,
  Download,
  ChevronRight,
  ChevronDown,
  Clock,
  HardDrive,
  Lock,
  LockOpen
} from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  extension?: string;
  children?: FileNode[];
}

interface ServiceDetailProps {
  service: Service;
  onBack: () => void;
  onRefresh: () => void;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ service, onBack, onRefresh }) => {
  const [logs, setLogs] = useState<string>('Loading logs...');
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'files' | 'config'>('status');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [forceDelete, setForceDelete] = useState(false);

  // File Management State
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Sync Action States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
    if (activeTab === 'files') fetchFileTree();
  }, [activeTab]);

  const fetchLogs = async () => {
    try {
      const response = await api.services.logs(service.name);
      setLogs(response.data.logs);
    } catch (e) {
      setLogs('Error fetching logs.');
    }
  };

  const fetchFileTree = async () => {
    setIsFetchingFiles(true);
    try {
      const res = await api.services.getFiles(service.name);
      setFileTree(res.data.structure);
      if (res.data.structure) {
        setExpandedFolders(new Set([res.data.structure.path]));
      }
    } catch (e) {
      console.error("Failed to fetch file tree", e);
    } finally {
      setIsFetchingFiles(false);
    }
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart' | 'enable' | 'disable') => {
    const isLongRunning = ['start', 'stop', 'restart'].includes(action);
    if (isLongRunning) {
      setIsProcessing(true);
      setProcessingMessage(`${action.charAt(0).toUpperCase() + action.slice(1)}ing ${service.name}...`);
    }

    try {
      if (action === 'start') await api.services.start(service.name);
      if (action === 'stop') await api.services.stop(service.name);
      if (action === 'restart') await api.services.restart(service.name);
      if (action === 'enable') await api.services.enable(service.name);
      if (action === 'disable') await api.services.disable(service.name);
      onRefresh();
    } catch (e: any) {
      alert(`Action failed: ${action}. ${e.response?.data?.error || e.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.services.delete(service.name, forceDelete);
      setShowDeleteModal(false);
      onBack();
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || 'Delete failed.';
      setDeleteError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteError(null);
  };

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'directory') {
      const newExpanded = new Set(expandedFolders);
      if (newExpanded.has(file.path)) newExpanded.delete(file.path);
      else newExpanded.add(file.path);
      setExpandedFolders(newExpanded);
      return;
    }

    try {
      const relativePath = file.path.replace(fileTree?.path + '/', '');
      const res = await api.services.downloadFile(service.name, relativePath);
      const text = await res.data.text();
      setEditContent(text);
      setSelectedFile(file);
      setIsEditMode(false); // Reset to read-only when switching files
    } catch (e) {
      alert("Could not load file content.");
    }
  };

  const handleDownloadFile = async (e: React.MouseEvent, file: FileNode) => {
    e.stopPropagation();
    try {
      const relativePath = file.path.replace(fileTree?.path + '/', '');
      const res = await api.services.downloadFile(service.name, relativePath);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Download failed.");
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const relativePath = selectedFile.path.replace(fileTree?.path + '/', '');
      await api.services.updateFile(service.name, relativePath, editContent);
      setIsSaving(false);
      setIsEditMode(false);
      if (selectedFile.name.includes('docker-compose') || selectedFile.name.includes('compose')) {
        if (confirm("Compose file updated. Restart service to apply?")) {
          handleAction('restart');
        }
      }
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to save file.");
      setIsSaving(false);
    }
  };

  const formatSize = (bytes: number = 0) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderFileTree = (node: FileNode) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile?.path === node.path;

    return (
      <div key={node.path} className="select-none">
        <div 
          onClick={() => handleFileSelect(node)}
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors text-sm group ${
            isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'
          }`}
        >
          {node.type === 'directory' ? (
            <>
              {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
              <FolderOpen size={16} className="text-amber-500 fill-amber-500/20" />
            </>
          ) : (
            <>
              <div className="w-[14px]" />
              {node.extension === '.yaml' || node.extension === '.yml' ? <FileCode size={16} className="text-indigo-500" /> : <FileText size={16} className="text-slate-400" />}
            </>
          )}
          <span className="truncate flex-1">{node.name}</span>
          
          {node.type === 'file' && (
            <button 
              onClick={(e) => handleDownloadFile(e, node)}
              className="p-1 hover:bg-indigo-100 rounded text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Download to local"
            >
              <Download size={14} />
            </button>
          )}
        </div>
        
        {node.type === 'directory' && isExpanded && node.children && (
          <div className="ml-4 pl-2 border-l border-slate-100">
            {node.children.map(child => renderFileTree(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{service.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <StatusBadge status={service.real_status?.status} />
              <span className="text-slate-400 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{service.path}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 self-end md:self-auto">
           <button onClick={onRefresh} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"><RotateCcw size={20}/></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative flex flex-col">
        <div className="flex flex-wrap border-b border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('status')}
            className={`px-6 py-4 font-semibold text-sm flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'status' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Control Center</span>
            <span className="sm:hidden">Control</span>
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={`px-6 py-4 font-semibold text-sm flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'files' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HardDrive size={18} />
            <span className="hidden sm:inline">Filesystem</span>
            <span className="sm:hidden">Files</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-4 font-semibold text-sm flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'logs' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Terminal size={18} />
            <span className="hidden sm:inline">Runtime Logs</span>
            <span className="sm:hidden">Logs</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'status' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Operations</h3>
                <div className="flex flex-wrap gap-3">
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleAction('start')} 
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Play size={18} /> Start
                  </button>
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleAction('stop')} 
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-100 hover:bg-rose-700 disabled:opacity-50"
                  >
                    <Square size={18} /> Stop
                  </button>
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleAction('restart')} 
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 disabled:opacity-50"
                  >
                    <RotateCcw size={18} /> Restart
                  </button>
                  <div className="hidden sm:block h-12 w-px bg-slate-200 mx-2" />
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleAction(service.enabled ? 'disable' : 'enable')}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${
                      service.enabled ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}
                  >
                    {service.enabled ? 'Disable Auto-boot' : 'Enable Auto-boot'}
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Containers ({service.real_status?.containers?.length || 0})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {service.real_status?.containers?.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${c.State === 'running' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                          <Terminal size={22} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{c.Name}</p>
                          <p className="text-xs text-slate-500 font-mono truncate">{c.Image}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${c.State === 'running' ? 'text-emerald-600' : 'text-slate-400'}`}>{c.State.toUpperCase()}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{c.Status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="pt-8 border-t border-slate-100">
                <button 
                  disabled={isProcessing}
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-rose-600 border border-rose-200 bg-rose-50/50 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={18} />
                  Remove Service Stack
                </button>
              </section>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 h-[calc(100vh-320px)] min-h-[500px]">
              <div className="lg:col-span-1 border-r border-slate-100 pr-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 z-10">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Files</h3>
                  <button onClick={fetchFileTree} className="p-1 hover:bg-slate-100 rounded text-indigo-600">
                    <RotateCcw size={12} />
                  </button>
                </div>
                {isFetchingFiles ? (
                  <div className="flex flex-col items-center py-20 text-slate-400">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Scanning...</span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {fileTree && renderFileTree(fileTree)}
                  </div>
                )}
              </div>

              <div className="lg:col-span-3 xl:col-span-4 flex flex-col bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
                {selectedFile ? (
                  <>
                    <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap gap-4 justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                           <FileCode size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                          <div className="flex items-center gap-4 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            <span className="flex items-center gap-1"><HardDrive size={10}/> {formatSize(selectedFile.size)}</span>
                            <span className="flex items-center gap-1"><Clock size={10}/> {selectedFile.modified ? new Date(selectedFile.modified).toLocaleString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setIsEditMode(!isEditMode)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isEditMode ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isEditMode ? <LockOpen size={16} /> : <Lock size={16} />}
                          {isEditMode ? 'Editing Mode' : 'Read Only'}
                        </button>
                        
                        {isEditMode && (
                          <button 
                            onClick={handleSaveFile}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                          >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Changes
                          </button>
                        )}
                        
                        <button 
                          onClick={(e) => handleDownloadFile(e, selectedFile)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="Download local"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    </div>
                    <textarea 
                      value={editContent}
                      readOnly={!isEditMode}
                      onChange={(e) => setEditContent(e.target.value)}
                      spellCheck={false}
                      className={`flex-1 p-8 font-mono text-sm outline-none resize-none leading-relaxed selection:bg-indigo-500/30 transition-colors ${
                        isEditMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-950 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50">
                      <FileText size={40} className="text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-600">Browse Files</h4>
                    <p className="text-sm max-w-xs mt-2 text-slate-400 leading-relaxed">Select a configuration or source file from the explorer on the left to view or edit.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregated stdout/stderr</h3>
                <button onClick={fetchLogs} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <RotateCcw size={14} /> Refresh Logs
                </button>
              </div>
              <pre className="flex-1 bg-slate-900 text-slate-300 p-8 rounded-3xl overflow-auto text-sm font-mono leading-relaxed shadow-inner scrollbar-thin scrollbar-thumb-slate-700">
                {logs || 'No log output available.'}
              </pre>
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-6 max-w-sm animate-in zoom-in duration-300">
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-indigo-50 rounded-full">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <Zap className="absolute text-indigo-400 w-6 h-6" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-900">{processingMessage}</h4>
                <p className="text-slate-400 text-sm mt-2">Communicating with Docker daemon. This may take a moment.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rose-700 flex items-center gap-3">
                <ShieldAlert className="w-8 h-8" /> Danger Zone
              </h2>
              <button onClick={closeDeleteModal} className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-8">
              {deleteError && (
                <div className="bg-rose-100 border border-rose-200 text-rose-800 p-5 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-2">
                  <XCircle className="shrink-0 text-rose-600 mt-0.5" size={24} />
                  <div><p className="font-bold">Cannot Proceed</p><p className="text-sm opacity-90 mt-1">{deleteError}</p></div>
                </div>
              )}

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stack to Remove</p>
                <p className="text-lg font-bold text-slate-800">{service.name}</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-5 bg-rose-50 text-rose-900 rounded-2xl border border-rose-100">
                  <AlertTriangle className="shrink-0 text-rose-600" size={24} />
                  <p className="text-sm leading-relaxed">You are about to permanently delete the <strong>{service.name}</strong> stack. All configuration files will be deleted and active containers will be forcefully stopped.</p>
                </div>

                <label className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                  <input type="checkbox" checked={forceDelete} onChange={(e) => setForceDelete(e.target.checked)} className="w-6 h-6 rounded-lg border-slate-300 text-rose-600 focus:ring-rose-500" />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-slate-800">Force cleanup</span>
                    <p className="text-xs text-slate-400 mt-0.5">Purge files even if containers fail to stop gracefully.</p>
                  </div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={closeDeleteModal} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={executeDelete} disabled={isDeleting} className="flex-[2] py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all disabled:opacity-50">
                  {isDeleting ? 'Processing...' : 'Delete Stack Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetail;
