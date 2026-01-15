
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
    setIsFixing(true);
    try {
      await api.validation.fix(type, true);
      alert('Fix executed successfully. Refreshing status...');
      fetchValidation();
    } catch (e) {
      alert('Fix failed. Check server logs.');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Health & Validation</h1>
          <p className="text-slate-500 mt-1">Audit consistency between database, filesystem, and runtime.</p>
        </div>
        <button 
          onClick={fetchValidation}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Run Audit
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Consistency Check */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FileSearch size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Filesystem Audit</h2>
              <p className="text-sm text-slate-400">Database vs Directory Alignment</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <p className="text-2xl font-bold text-indigo-600">{dataValidation?.summary.consistency_percentage || 0}%</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Consistent</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <p className="text-2xl font-bold text-rose-500">{dataValidation?.summary.inconsistent_count || 0}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Issues</p>
            </div>
          </div>

          <div className="space-y-3">
            {dataValidation?.inconsistent?.map((err, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs">
                <AlertCircle className="text-rose-500 shrink-0" size={16} />
                <div>
                  <p className="font-bold text-rose-700">{err.service}</p>
                  <p className="text-rose-600">{err.issue}</p>
                </div>
              </div>
            ))}
            {dataValidation?.orphaned_folders?.map((err, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs">
                <AlertCircle className="text-amber-500 shrink-0" size={16} />
                <div>
                  <p className="font-bold text-amber-700">Orphaned: {err.folder}</p>
                  <p className="text-amber-600">{err.issue}</p>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => handleFix('all')}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Wrench size={18} />
            Auto-Repair Filesystem
          </button>
        </div>

        {/* Runtime Audit */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Activity size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Runtime Audit</h2>
              <p className="text-sm text-slate-400">Policy vs Actual Container State</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <p className="text-2xl font-bold text-emerald-600">{serviceValidation?.summary.valid_count || 0}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Healthy</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <p className="text-2xl font-bold text-rose-500">{serviceValidation?.summary.invalid_count || 0}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Violations</p>
            </div>
          </div>

          <div className="space-y-3">
            {serviceValidation?.invalid?.map((err, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs">
                <AlertCircle className="text-rose-500 shrink-0" size={16} />
                <div>
                  <p className="font-bold text-rose-700">{err.service}</p>
                  <ul className="list-disc ml-4 text-rose-600">
                    {err.validation_errors.map((v: string, j: number) => <li key={j}>{v}</li>)}
                  </ul>
                </div>
              </div>
            ))}
            {serviceValidation?.invalid?.length === 0 && (
              <div className="flex items-center justify-center py-10 text-emerald-500 flex-col gap-2">
                <CheckCircle size={32} />
                <p className="font-bold uppercase text-xs tracking-widest">Everything aligned</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => handleFix('state')}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Activity size={18} />
            Realign Container States
          </button>
        </div>
      </div>
    </div>
  );
};

export default Validation;
