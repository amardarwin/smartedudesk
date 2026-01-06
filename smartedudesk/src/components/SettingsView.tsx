
import React, { useRef } from 'react';
import { SchoolSettings } from '../types';
import { Building2, Save, Trash2, Shield, Printer, Download, CheckCircle2, Lock, Unlock, UserCheck, Upload, MapPin } from 'lucide-react';

interface SettingsViewProps {
  settings: SchoolSettings;
  onUpdate: (updates: Partial<SchoolSettings>) => void;
  onFactoryReset?: () => void;
  isInchargeMode?: boolean;
  onToggleInchargeMode?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate, onFactoryReset, isInchargeMode = false, onToggleInchargeMode }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);
        if (parsed && confirm("Restore backup? This will overwrite your current settings and data.")) {
          // This logic relies on the App.tsx picking up localStorage after reload
          localStorage.setItem('smartedudesk_v2_storage', json);
          window.location.reload();
        }
      } catch (err) {
        alert("Error: Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">System Configuration</h1>
          <p className="text-gray-500 font-medium">Define school identity and manage academic session data.</p>
        </div>
        <div className="flex gap-3 no-print">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border-2 border-gray-100 text-gray-700 px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all font-black shadow-sm"
          >
            <Printer size={20} /> Print Status
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          
          <div className={`p-8 rounded-3xl border-2 transition-all ${isInchargeMode ? 'bg-emerald-50 border-emerald-200 shadow-xl shadow-emerald-100/50' : 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-100/50'}`}>
            <div className="flex items-start gap-6">
              <div className={`p-5 rounded-[1.5rem] shadow-sm border ${isInchargeMode ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-amber-600 border-amber-100'}`}>
                {isInchargeMode ? <Unlock size={32} /> : <Lock size={32} />}
              </div>
              <div className="flex-1">
                <h4 className={`text-xl font-black uppercase tracking-tight ${isInchargeMode ? 'text-emerald-900' : 'text-amber-900'}`}>
                  {isInchargeMode ? 'Incharge Mode Unlocked' : 'Incharge Controls Locked'}
                </h4>
                <p className={`text-sm font-medium mt-1 mb-6 ${isInchargeMode ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isInchargeMode 
                    ? 'All administrative actions are enabled. Aap ab teachers add kar sakte hain aur schedule generate kar sakte hain.' 
                    : 'System is in Read-Only mode. Please click below to verify you are the Timetable Incharge.'}
                </p>
                <button 
                  onClick={onToggleInchargeMode}
                  className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
                    isInchargeMode 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  {isInchargeMode ? <Lock size={16} /> : <Unlock size={16} />}
                  {isInchargeMode ? 'Lock Admin Controls' : 'Unlock Incharge Powers'}
                </button>
              </div>
            </div>
          </div>

          <div className={`bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8 ${!isInchargeMode ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">
              <Building2 size={18} /> Institutional Identity
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">School Name</label>
                  <input 
                    type="text"
                    value={settings.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    className="w-full text-xl font-black p-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    placeholder="e.g. GHS Deon Khera"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Academic Session</label>
                  <input 
                    type="text"
                    value={settings.session}
                    onChange={(e) => onUpdate({ session: e.target.value })}
                    className="w-full text-base font-bold p-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    placeholder="2024-25"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">School Address</label>
                <input 
                  type="text"
                  value={settings.address}
                  onChange={(e) => onUpdate({ address: e.target.value })}
                  className="w-full text-base font-bold p-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  placeholder="e.g. Deon Khera, Punjab"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">
              <Save size={18} /> Manual Data Management
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  const raw = localStorage.getItem('smartedudesk_v2_storage');
                  if (!raw) return;
                  const blob = new Blob([raw], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `smartedudesk_backup_${new Date().toISOString().split('T')[0]}.json`;
                  link.click();
                }}
                className="flex items-center gap-3 p-5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all font-black text-sm"
              >
                <Download size={20} /> Download Backup (.json)
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 p-5 bg-gray-50 text-gray-700 rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all font-black text-sm"
              >
                <Upload size={20} /> Restore from File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileUpload} 
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium italic">Tip: Use these buttons to manually save your data to your computer for extra safety.</p>
          </div>

          <div className={`bg-red-50 p-8 rounded-3xl border border-red-100 ${!isInchargeMode ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <h4 className="text-lg font-black text-red-900 uppercase tracking-tight flex items-center gap-2">
              <Shield size={20} /> Factory Reset
            </h4>
            <p className="text-sm text-red-700 font-medium mt-1 mb-6">Resetting will permanently clear all stored data. This action cannot be undone.</p>
            <button 
              onClick={onFactoryReset}
              className="text-xs font-black bg-red-600 text-white px-8 py-4 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center gap-2"
            >
              <Trash2 size={16} /> Factory Reset System
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
             <div className="text-center space-y-6">
                <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-white font-black text-5xl shadow-2xl border-8 border-white">
                  {settings.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-gray-900 leading-tight">{settings.name}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">Public Brand Identity</p>
                </div>
                <div className="h-px bg-gray-100 w-full" />
                <div className="space-y-4">
                  <div className="text-xs font-bold text-gray-500 text-left px-2 flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 text-gray-300 shrink-0" />
                    <div>
                      <span className="block text-[9px] font-black text-gray-300 uppercase mb-1">Address</span>
                      {settings.address || 'Not Configured'}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-500 text-left px-2">
                    <span className="block text-[9px] font-black text-gray-300 uppercase mb-1">Session</span>
                    {settings.session}
                  </div>
                </div>
                {isInchargeMode && (
                  <div className="pt-4 flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                    <UserCheck size={14} /> Verified Incharge
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
