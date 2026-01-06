
import React, { useState, useEffect, useMemo } from 'react';
import Navigation from './components/Navigation';
import MasterTableView from './components/MasterTableView';
import AdjustmentPanel from './components/AdjustmentPanel';
import TeachersListView from './components/TeachersListView';
import ClassesView from './components/ClassesView';
import SlipsView from './components/SlipsView';
import SettingsView from './components/SettingsView';
import { INITIAL_TEACHERS, INITIAL_CLASS_REQUIREMENTS, DAYS, PERIODS } from './constants';
import { Teacher, MasterTimetable, Substitution, Day, Subject, SchoolSettings, ClassRequirement } from './types';
import { generateBaseTimetable } from './services/timetableLogic';
import { generateSmartTimetable } from './services/geminiService';
import { validateTimetable } from './services/validationLogic';
import { Sparkles, RefreshCw, FileSpreadsheet, CheckCircle2, Database, FileDown, Lock, Unlock, Save, UserPlus, Grid3X3, FileText, Printer, Info, CheckCircle } from 'lucide-react';

const STORAGE_KEY_V2 = 'smartedudesk_v2_storage';
const STORAGE_KEY_V1 = 'smartedudesk_data_v1';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Core Data States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [requirements, setRequirements] = useState<ClassRequirement[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    name: 'GHS Deon Khera',
    address: 'Deon Khera, Punjab',
    session: '2024-25'
  });
  const [timetable, setTimetable] = useState<MasterTimetable | null>(null);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [isInchargeMode, setIsInchargeMode] = useState<boolean>(false);

  // 1. Initial Load
  useEffect(() => {
    const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
    const savedV1 = localStorage.getItem(STORAGE_KEY_V1);
    const savedData = savedV2 || savedV1;

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTeachers(parsed.teachers || INITIAL_TEACHERS);
        setRequirements(parsed.requirements || INITIAL_CLASS_REQUIREMENTS);
        setSchoolSettings(parsed.schoolSettings || { name: 'GHS Deon Khera', address: 'Deon Khera, Punjab', session: '2024-25' });
        setTimetable(parsed.timetable || null);
        setSubstitutions(parsed.substitutions || []);
        setIsInchargeMode(parsed.isInchargeMode || false);
      } catch (e) {
        console.error("Failed to parse saved data", e);
        setTeachers(INITIAL_TEACHERS);
        setRequirements(INITIAL_CLASS_REQUIREMENTS);
      }
    } else {
      setTeachers(INITIAL_TEACHERS);
      setRequirements(INITIAL_CLASS_REQUIREMENTS);
    }
    setIsInitialized(true);
  }, []);

  // 2. Automatic Save Loop
  useEffect(() => {
    if (!isInitialized) return;

    const dataToSave = {
      teachers,
      requirements,
      schoolSettings,
      timetable,
      substitutions,
      isInchargeMode
    };
    
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(dataToSave));
    setLastSaved(new Date().toLocaleTimeString());
  }, [teachers, requirements, schoolSettings, timetable, substitutions, isInchargeMode, isInitialized]);

  // Ensure timetable structure
  useEffect(() => {
    if (isInitialized && !timetable) {
      const empty: MasterTimetable = {} as MasterTimetable;
      DAYS.forEach(day => {
        empty[day] = {};
        PERIODS.forEach(p => {
          empty[day][p] = {};
        });
      });
      setTimetable(empty);
    }
  }, [isInitialized, timetable]);

  const validationIssues = useMemo(() => {
    if (!timetable) return [];
    return validateTimetable(timetable, teachers);
  }, [timetable, teachers]);

  const handleResetTimetable = () => {
    if (!isInchargeMode) return;
    
    // Create a brand new structured object for the timetable
    const newTimetable: MasterTimetable = {} as MasterTimetable;
    DAYS.forEach(day => {
      newTimetable[day] = {};
      PERIODS.forEach(p => {
        newTimetable[day][p] = {};
      });
    });
    
    setTimetable(newTimetable);
    setSubstitutions([]); // Also clear substitutions to ensure a full grid reset
  };

  const handleClearClass = (classId: string) => {
    if (!isInchargeMode) return;
    setTimetable(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      DAYS.forEach(day => {
        PERIODS.forEach(p => {
          Object.keys(next[day]?.[p] || {}).forEach(tId => {
            if (next[day][p][tId].classId === classId) {
              delete next[day][p][tId];
            }
          });
        });
      });
      return next;
    });
  };

  const handleClearTeacherSchedule = (teacherId: string) => {
    if (!isInchargeMode) return;
    setTimetable(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      DAYS.forEach(day => {
        PERIODS.forEach(p => {
          if (next[day]?.[p]?.[teacherId]) {
            delete next[day][p][teacherId];
          }
        });
      });
      return next;
    });
  };

  const handleAiGenerate = async () => {
    if (!isInchargeMode) {
      alert("System Locked: Please enable 'Incharge Mode' in the Settings tab to modify the timetable.");
      setActiveTab('settings');
      return;
    }
    if (teachers.length === 0) {
      alert("No teachers found. Add teachers first.");
      setActiveTab('teachers');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateSmartTimetable(teachers, requirements);
      if (result) {
        setTimetable(result);
        alert("Automatic Timetable Generated Successfully!");
      } else {
        throw new Error("Empty result");
      }
    } catch (e) {
      console.warn("AI Generation failed, using local baseline", e);
      const base = generateBaseTimetable(teachers);
      setTimetable(base);
      alert("AI was busy. A baseline timetable has been generated locally.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSave = () => {
    const dataToSave = { teachers, requirements, schoolSettings, timetable, substitutions, isInchargeMode };
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(dataToSave));
    setLastSaved(new Date().toLocaleTimeString());
    alert("Data saved manually to your browser!");
  };

  const handleUpdateRequirement = (classId: string, subject: Subject, periods: number) => {
    if (!isInchargeMode) return;
    setRequirements(prev => prev.map(req => {
      if (req.classId !== classId) return req;
      const existing = req.requirements.find(r => r.subject === subject);
      if (existing) {
        return {
          ...req,
          requirements: req.requirements.map(r => r.subject === subject ? { ...r, periodsPerWeek: periods } : r)
        };
      } else {
        return { ...req, requirements: [...req.requirements, { subject, periodsPerWeek: periods }] };
      }
    }));
  };

  const handleUpdateCell = (day: Day, period: number, teacherId: string, classId: string, subject: Subject) => {
    if (!isInchargeMode) return;
    setTimetable(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[day]) next[day] = {};
      if (!next[day][period]) next[day][period] = {};
      next[day][period][teacherId] = { classId, subject, teacherId };
      return next;
    });
  };

  const handleClearCell = (day: Day, period: number, teacherId: string) => {
    if (!isInchargeMode) return;
    setTimetable(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      if (next[day]?.[period]?.[teacherId]) delete next[day][period][teacherId];
      return next;
    });
  };

  const handleAddTeacher = (teacher: Teacher) => {
    if (!isInchargeMode) return;
    setTeachers(prev => [...prev, teacher]);
  };

  const handleUpdateTeacher = (updated: Teacher) => {
    if (!isInchargeMode) return;
    setTeachers(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const addSubstitution = (sub: Substitution) => {
    if (!isInchargeMode) return;
    setSubstitutions(prev => [...prev, sub]);
  };

  const updateSubstitution = (subId: string, updates: Partial<Substitution>) => {
    if (!isInchargeMode) return;
    setSubstitutions(prev => prev.map(s => s.id === subId ? { ...s, ...updates } : s));
  };

  const removeSubstitution = (subId: string) => {
    if (!isInchargeMode) return;
    setSubstitutions(prev => prev.filter(s => s.id !== subId));
  };

  const handleFactoryReset = () => {
    if (!isInchargeMode) return;
    if (confirm("DANGER: This will delete everything (Teachers, Classes, and Timetable). Proceed?")) {
      localStorage.removeItem(STORAGE_KEY_V2);
      localStorage.removeItem(STORAGE_KEY_V1);
      window.location.reload();
    }
  };

  if (!isInitialized) return <div className="min-h-screen flex items-center justify-center font-black text-indigo-600">Syncing with Browser...</div>;

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            SmartEduDesk
            {isInchargeMode ? (
              <span className="text-xs bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full flex items-center gap-1 font-black uppercase tracking-widest border border-emerald-200">
                <Unlock size={12} /> Incharge Verified
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full flex items-center gap-1 font-black uppercase tracking-widest border border-gray-200">
                <Lock size={12} /> Read Only
              </span>
            )}
          </h1>
          <p className="text-gray-500 font-medium">Automatic Timetable & Adjustment System</p>
        </div>
        <div className="flex wrap gap-3 no-print items-center">
          <button 
            onClick={handleManualSave}
            className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-all font-black"
          >
            <Save size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sync: {lastSaved || 'Offline'}</span>
          </button>
          <button 
            onClick={handleAiGenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl transition-all font-black shadow-lg shadow-indigo-100 ${isInchargeMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
            Generate Automatic Timetable
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Database size={28} />
          </div>
          <div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Saved Staff</div>
            <div className="text-2xl font-black">{teachers.length} Faculty</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Classes</div>
            <div className="text-2xl font-black">{requirements.length} Groups</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-xl text-white">
          <div className="text-sm font-black opacity-70 uppercase tracking-wider">{schoolSettings.session}</div>
          <div className="text-xl font-black truncate">{schoolSettings.name}</div>
          <div className="mt-4 text-[10px] font-bold uppercase opacity-60 flex items-center gap-1">
             <CheckCircle2 size={12} /> Real-time Cloud Backup
          </div>
        </div>
      </div>

      {!isInchargeMode && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl flex items-center gap-4">
          <div className="bg-white p-3 rounded-xl text-amber-600 shadow-sm border border-amber-100">
            <Lock size={24} />
          </div>
          <div className="flex-1">
             <h4 className="text-sm font-black text-amber-900 uppercase">Administrator Lock Engaged</h4>
             <p className="text-xs text-amber-700 font-medium">To edit teachers or generate schedules, please unlock Incharge Mode in Settings.</p>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className="bg-amber-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-amber-700 transition-all shadow-md"
          >
            Go to Settings
          </button>
        </div>
      )}

      {/* SYSTEM GUIDE SECTION */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">System Usage Guide</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xl border border-indigo-100">1</div>
            <div className="space-y-2">
              <h4 className="font-black text-gray-900 flex items-center gap-2 uppercase text-xs tracking-wider">
                <UserPlus size={16} className="text-indigo-500" /> Add Faculty Data
              </h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Go to the <b>'Teachers'</b> tab to register your faculty members. Enter their qualifications and weekly period load limits.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xl border border-indigo-100">2</div>
            <div className="space-y-2">
              <h4 className="font-black text-gray-900 flex items-center gap-2 uppercase text-xs tracking-wider">
                <Grid3X3 size={16} className="text-indigo-500" /> Assign Periods
              </h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                In the <b>'Master Table'</b> view, manually insert period-wise class details. Simply click any cell while Incharge Mode is active.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xl border border-indigo-100">3</div>
            <div className="space-y-2">
              <h4 className="font-black text-gray-900 flex items-center gap-2 uppercase text-xs tracking-wider">
                <Printer size={16} className="text-indigo-500" /> Automatic Prints
              </h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                All formats of teacher timetable lists and slips are automatically ready. You can save and download these files in <b>PDF format</b>.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-50 flex items-center gap-4">
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
             Optimized for A4 Print & PDF Export
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    const timetableSafe = (timetable || {} as MasterTimetable);

    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'master': return (
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Master Timetable Grid</h1>
              <p className="text-gray-500 font-medium">Full view of teacher assignments across the week</p>
            </div>
            <div className="flex gap-2 no-print">
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all">
                <FileDown size={16} /> Print Table
              </button>
            </div>
          </div>
          <MasterTableView 
            teachers={teachers} 
            timetable={timetableSafe} 
            validationIssues={validationIssues} 
            onUpdateCell={handleUpdateCell} 
            onClearCell={handleClearCell}
            onClearClass={handleClearClass}
            onClearTeacherSchedule={handleClearTeacherSchedule}
            isInchargeMode={isInchargeMode}
          />
        </div>
      );
      case 'adjustment': return <AdjustmentPanel teachers={teachers} timetable={timetableSafe} substitutions={substitutions} onAddSubstitution={addSubstitution} onUpdateSubstitution={updateSubstitution} onRemoveSubstitution={removeSubstitution} isInchargeMode={isInchargeMode} />;
      case 'teachers': return <TeachersListView teachers={teachers} onAddTeacher={handleAddTeacher} onUpdateTeacher={handleUpdateTeacher} isInchargeMode={isInchargeMode} />;
      case 'classes': return <ClassesView requirements={requirements} teachers={teachers} timetable={timetableSafe} schoolSettings={schoolSettings} onUpdateRequirement={handleUpdateRequirement} isInchargeMode={isInchargeMode} />;
      case 'slips': return <SlipsView teachers={teachers} timetable={timetableSafe} schoolSettings={schoolSettings} />;
      case 'settings': return <SettingsView settings={schoolSettings} onUpdate={(u) => setSchoolSettings(prev => ({ ...prev, ...u }))} onFactoryReset={handleFactoryReset} isInchargeMode={isInchargeMode} onToggleInchargeMode={() => setIsInchargeMode(!isInchargeMode)} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans antialiased">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-[1600px] mx-auto px-6 py-10 pb-24">
        {renderContent()}
      </main>
    </div>
  );
};
