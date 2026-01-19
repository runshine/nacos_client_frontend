
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ValidationResult } from '../types';
import { ShieldCheck, AlertCircle, RefreshCw, CheckCircle, Wrench, FileSearch, Activity } from 'lucide-react';

const Validation: React.FC = () => {
  const [dataValidation, setDataValidation] = useState<ValidationResult | null>(null);
  const [serviceValidation, setServiceValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const fetchValidation = async () => {
    setLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        api.validation.data(),
        api.validation.services()
      ]);
      setDataValidation(res1.data);
      setServiceValidation(res2.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidation();
  }, []);

  const handleFix = async (type: string) => {
    if (!confirm(`Execute automated repair for ${type}? This will modify system state.`)) return;
    setIsFixing(true);
    try {
      await api.validation.fix(type, true);
      alert('Fix executed successfully.');
      fetchValidation();
    } catch (e) {
      alert('Fix failed. Check server logs.');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Health & Validation</h1>
          <p className="text-slate-500 mt-1">Audit consistency between database, filesystem, and runtime environment.</p>
        </div>
        <button 
          onClick={fetchValidation}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Auditing...' : 'Run Global Audit'}
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Consistency Check */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
              <FileSearch size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Filesystem Integrity</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">DB vs Directory Sync</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl text-center border border-slate-100 shadow-inner">
              <p className="text-3xl font-bold text-indigo-600">{dataValidation?.summary.consistency_percentage || 0}%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Score</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl text-center border border-slate-100 shadow-inner">
              <p className="text-3xl font-bold text-rose-500">{dataValidation?.summary.inconsistent_count || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Anomalies</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {dataValidation?.inconsistent?.map((err, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-left duration-300">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-bold text-rose-800 text-sm">{err.service}</p>
                  <p className="text-rose-600 text-xs mt-0.5">{err.issue}</p>
                </div>
              </div>
            ))}
            {dataValidation?.orphaned_folders?.map((err, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-100 rounded-2xl animate-in slide-in-from-left duration-300">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-bold text-amber-800 text-sm">Orphaned: {err.folder}</p>
                  <p className="text-amber-600 text-xs mt-0.5">Found folder with no DB record</p>
                </div>
              </div>
            ))}
            {(dataValidation?.inconsistent?.length === 0 && dataValidation?.orphaned_folders?.length === 0) && (
              <div className="flex flex-col items-center justify-center py-20 text-emerald-500 opacity-60">
                 <CheckCircle size={48} />
                 <p className="text-xs font-bold uppercase tracking-widest mt-4">No deviations detected</p>
              </div>
            )}
          </div>

          <button 
            disabled={isFixing}
            onClick={() => handleFix('all')}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
          >
            <Wrench size={20} />
            {isFixing ? 'Repairing...' : 'Sync Filesystem State'}
          </button>
        </div>

        {/* Runtime Audit */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
              <Activity size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Runtime Policy Audit</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Compliance Alignment</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl text-center border border-slate-100 shadow-inner">
              <p className="text-3xl font-bold text-emerald-600">{serviceValidation?.summary.valid_count || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Healthy</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl text-center border border-slate-100 shadow-inner">
              <p className="text-3xl font-bold text-rose-500">{serviceValidation?.summary.invalid_count || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Violations</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {serviceValidation?.invalid?.map((err, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-right duration-300">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-rose-800 text-sm truncate">{err.service}</p>
                  <ul className="mt-2 space-y-1">
                    {err.validation_errors.map((v: string, j: number) => (
                      <li key={j} className="text-rose-600 text-xs flex items-center gap-2">
                        <div className="w-1 h-1 bg-rose-400 rounded-full" /> {v}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            {serviceValidation?.invalid?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-emerald-500 opacity-60">
                <CheckCircle size={48} />
                <p className="text-xs font-bold uppercase tracking-widest mt-4">Policy compliance 100%</p>
              </div>
            )}
          </div>

          <button 
            disabled={isFixing}
            onClick={() => handleFix('state')}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
          >
            <Activity size={20} />
            {isFixing ? 'Realigning...' : 'Realign Container Policies'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Validation;
