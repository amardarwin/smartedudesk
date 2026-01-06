
import React, { useState, useMemo, useEffect } from 'react';
import { Teacher, MasterTimetable, Day, Substitution, Subject, TimetableEntry } from '../types';
import { findSmartSubstitute, calculateConsecutiveStreak, isTeacherBusy } from '../services/timetableLogic';
import { DAYS, PERIODS, PERIOD_TIMINGS } from '../constants';
import { UserMinus, CheckCircle2, AlertCircle, FileText, Printer, ShieldCheck, MousePointer2, Plus, ListChecks, UserCog, UserCheck, FileDown, GraduationCap, Trash2, Lock } from 'lucide-react';

// Utility to handle naming rule: If rank is in name, hide secondary title
const getDisplayDesignation = (teacher: Teacher) => {
  const rankKeywords = ['HM', 'Principal', 'Head Master', 'Head Mistress'];
  const nameUpper = teacher.name.toUpperCase();
  const hasRankInName = rankKeywords.some(keyword => nameUpper.includes(keyword.toUpperCase()));
  const titlesToHide = ['MASTER', 'MISTRESS', 'HM', 'PRINCIPAL', 'HEAD MASTER', 'HEAD MISTRESS'];
  
  if (hasRankInName && titlesToHide.includes(teacher.designation.toUpperCase())) return null;
  return teacher.designation;
};

interface AdjustmentPanelProps {
  teachers: Teacher[];
  timetable: MasterTimetable;
  substitutions: Substitution[];
  onAddSubstitution: (sub: Substitution) => void;
  onUpdateSubstitution?: (subId: string, updates: Partial<Substitution>) => void;
  onRemoveSubstitution?: (subId: string) => void;
  isInchargeMode?: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ 
  teachers, 
  timetable, 
  substitutions, 
  onAddSubstitution,
  onUpdateSubstitution,
  onRemoveSubstitution,
  isInchargeMode = false
}) => {
  const [absentTeacherId, setAbsentTeacherId] = useState('');
  const [selectedDay, setSelectedDay] = useState<Day>(Day.MON);
  const [showManual, setShowManual] = useState(false);
  
  // Manual form state
  const [manualPeriod, setManualPeriod] = useState<number>(1);
  const [manualSubstituteId, setManualSubstituteId] = useState('');
  const [manualClassId, setManualClassId] = useState<string>('');

  const availableClasses = ['6th', '7th', '8th', '9th', '10th', 'Special Duty'];

  // Update manualClassId automatically ONLY when absentTeacherId or period changes, 
  // but let the user change it afterwards.
  useEffect(() => {
    if (absentTeacherId && manualPeriod) {
      const entry = timetable[selectedDay]?.[manualPeriod]?.[absentTeacherId];
      if (entry) {
        setManualClassId(entry.classId);
      } else {
        setManualClassId('Special Duty');
      }
    }
  }, [absentTeacherId, manualPeriod, selectedDay, timetable]);

  const availableSubstitutes = useMemo(() => {
    if (!manualPeriod) return [];
    return teachers.filter(t => {
      if (t.id === absentTeacherId) return false;
      return !isTeacherBusy(t.id, selectedDay, manualPeriod, timetable, substitutions);
    });
  }, [teachers, absentTeacherId, manualPeriod, selectedDay, timetable, substitutions]);

  const handleMarkAbsent = () => {
    if (!isInchargeMode) return;
    if (!absentTeacherId) return;

    let foundCount = 0;
    PERIODS.forEach(period => {
      const entry = timetable[selectedDay]?.[period]?.[absentTeacherId];
      if (entry) {
        foundCount++;
        const existing = substitutions.find(s => 
          s.absentTeacherId === absentTeacherId && 
          s.period === period && 
          s.day === selectedDay
        );
        
        if (existing) return;

        const { teacher: substitute, isViolation } = findSmartSubstitute(
          absentTeacherId,
          selectedDay,
          period,
          entry.classId,
          entry.subject,
          timetable,
          teachers,
          substitutions
        );

        if (substitute) {
          onAddSubstitution({
            id: `auto-${Date.now()}-${period}-${Math.random().toString(36).substr(2, 5)}`,
            date: new Date().toLocaleDateString(),
            day: selectedDay,
            absentTeacherId,
            period,
            classId: entry.classId,
            originalSubject: entry.subject,
            substituteTeacherId: substitute.id,
            reason: 'Leave',
            isOverride: isViolation
          });
        }
      }
    });

    if (foundCount === 0) {
      alert(`Note: ${teachers.find(t => t.id === absentTeacherId)?.name} has no scheduled classes on ${selectedDay}. No slips generated.`);
    }
  };

  const handleManualAssign = () => {
    if (!isInchargeMode) return;
    if (!absentTeacherId) {
      alert("Please select the teacher who is absent first.");
      return;
    }
    if (!manualSubstituteId || !manualPeriod || !manualClassId) {
      alert("Please select Period, Class, and a Free Substitute.");
      return;
    }

    const entry = timetable[selectedDay]?.[manualPeriod]?.[absentTeacherId];
    
    // Check if a substitution ALREADY exists for this specific combination
    const existingIndex = substitutions.findIndex(s => 
      s.absentTeacherId === absentTeacherId && 
      s.period === manualPeriod && 
      s.day === selectedDay
    );

    if (existingIndex !== -1) {
      const existing = substitutions[existingIndex];
      if (onUpdateSubstitution) {
        onUpdateSubstitution(existing.id, { 
          substituteTeacherId: manualSubstituteId,
          classId: manualClassId,
          reason: 'Manual Override (Updated)',
          isOverride: true 
        });
      }
    } else {
      onAddSubstitution({
        id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: new Date().toLocaleDateString(),
        day: selectedDay,
        absentTeacherId,
        period: manualPeriod,
        classId: manualClassId,
        originalSubject: entry?.subject || 'Free Period',
        substituteTeacherId: manualSubstituteId,
        reason: 'Manual Override',
        isOverride: true
      });
    }

    setManualSubstituteId('');
  };

  const getWorkloadDots = (teacherId: string, day: Day, period: number) => {
    const streak = calculateConsecutiveStreak(teacherId, day, period, timetable, substitutions);
    return (
      <div className="flex gap-1 mt-1">
        {[1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full ${
              streak >= i 
                ? (i === 3 ? 'bg-red-500' : i === 2 ? 'bg-yellow-500' : 'bg-green-500') 
                : 'bg-gray-200'
            }`} 
          />
        ))}
        {streak > 3 && <span className="text-[10px] text-red-600 font-bold ml-1">LIMIT!</span>}
      </div>
    );
  };

  const subSummary = substitutions.reduce((acc, sub) => {
    const teacher = teachers.find(t => t.id === sub.substituteTeacherId);
    if (!teacher) return acc;
    if (!acc[teacher.id]) acc[teacher.id] = { name: teacher.name, count: 0, classes: [] };
    acc[teacher.id].count++;
    acc[teacher.id].classes.push(`${sub.classId} (P${sub.period})`);
    return acc;
  }, {} as Record<string, {name: string, count: number, classes: string[]}>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4 no-print">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative">
            {!isInchargeMode && (
              <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 text-center max-w-[80%]">
                   <Lock className="mx-auto text-amber-500 mb-2" size={24} />
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Incharge Lock Active</p>
                   <p className="text-[9px] text-gray-400 mt-1">Unlock in Settings to adjust duties.</p>
                </div>
              </div>
            )}
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserMinus className="text-red-500" size={20} />
              Attendance Control
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Teacher on Leave</label>
                <select 
                  value={absentTeacherId}
                  onChange={(e) => setAbsentTeacherId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 bg-gray-50 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="">Select Faculty Member...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Adjust for Day</label>
                <select 
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as Day)}
                  className="w-full border rounded-lg px-3 py-2.5 bg-gray-50 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              <div className="pt-2 flex flex-col gap-2">
                <button 
                  onClick={handleMarkAbsent}
                  disabled={!absentTeacherId || !isInchargeMode}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Auto-Generate Slips
                </button>
                
                <button 
                  onClick={() => setShowManual(!showManual)}
                  disabled={!isInchargeMode}
                  className={`font-black py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border-2 ${
                    showManual 
                    ? 'bg-gray-800 text-white border-gray-800' 
                    : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-50 shadow-sm'
                  } disabled:opacity-50`}
                >
                  <Plus size={16} />
                  {showManual ? 'Hide Manual Entry' : 'Manual Period Override'}
                </button>
              </div>

              {showManual && isInchargeMode && (
                <div className="mt-4 p-5 bg-[#F9FAFF] rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-xs font-black text-indigo-700 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <UserCog size={14} /> Manual Period Duty
                  </h4>
                  <div className="space-y-4">
                    <div className="w-full">
                      <label className="block text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-wider">Select Period</label>
                      <select 
                        value={manualPeriod}
                        onChange={(e) => {
                          setManualPeriod(Number(e.target.value));
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                      >
                        {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="block text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-wider">Select Class</label>
                      <select 
                        value={manualClassId}
                        onChange={(e) => setManualClassId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                      >
                        {availableClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="block text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-wider">Select Free Substitute</label>
                      <select 
                        value={manualSubstituteId}
                        onChange={(e) => setManualSubstituteId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white font-bold text-gray-700 outline-none disabled:bg-gray-50 disabled:opacity-50 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                      >
                        <option value="">{availableSubstitutes.length > 0 ? "Choose available teacher..." : "No free teachers for this period"}</option>
                        {availableSubstitutes.map(t => {
                          const desig = getDisplayDesignation(t);
                          return (
                            <option key={t.id} value={t.id}>
                              {t.name}{desig ? ` (${desig})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <button 
                      onClick={handleManualAssign}
                      disabled={!absentTeacherId || !manualSubstituteId}
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-[13px] font-black py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2 mt-2"
                    >
                      <CheckCircle2 size={16} /> Assign Duty Manually
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 no-print">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ListChecks size={14} className="text-indigo-600" /> Duty Load Summary
            </h4>
            <div className="space-y-2">
                {Object.keys(subSummary).length === 0 ? (
                    <div className="text-[10px] text-gray-400 italic font-medium px-2">No active adjustments.</div>
                ) : (
                    (Object.entries(subSummary) as [string, {name: string, count: number, classes: string[]}][]).map(([id, data]) => (
                        <div key={id} className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                            <div>
                                <div className="text-xs font-black text-gray-900">{data.name}</div>
                                <div className="text-[9px] text-gray-500 font-bold">{data.classes.join(', ')}</div>
                            </div>
                            <div className="text-xs font-black bg-indigo-600 text-white px-2 py-1 rounded-md">+{data.count}</div>
                        </div>
                    ))
                )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 no-print min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={20} />
                Generated Adjustment Slips
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 text-xs font-black bg-gray-800 text-white px-5 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg shadow-gray-200"
                >
                  <FileDown size={16} /> Save PDF / Print Slips
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {substitutions.filter(s => s.day === selectedDay).length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed rounded-2xl border-gray-100">
                  <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} />
                  </div>
                  <div className="text-gray-400 mb-2 font-black text-lg">No Adjustments Found</div>
                  <p className="text-xs text-gray-400 font-medium">Select an absent teacher to auto-generate or manually assign duties.</p>
                </div>
              ) : (
                substitutions
                  .filter(s => s.day === selectedDay)
                  .sort((a, b) => a.period - b.period)
                  .map(sub => {
                  const absentT = teachers.find(t => t.id === sub.absentTeacherId);
                  
                  return (
                    <div key={sub.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 rounded-2xl bg-white transition-all hover:shadow-lg ${sub.isOverride ? 'border-indigo-100 bg-indigo-50/20' : 'border-gray-100'}`}>
                      <div className="flex gap-5 items-center">
                        <div className={`w-14 h-14 rounded-2xl shadow-inner border-2 flex items-center justify-center font-black text-xl shrink-0 ${sub.isOverride ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-gray-50 text-indigo-600 border-indigo-50'}`}>
                          {sub.period}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-lg text-gray-900 leading-none">{sub.classId}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sub.originalSubject}</span>
                          </div>
                          <div className="text-xs flex flex-wrap gap-2 items-center font-bold">
                            <span className="line-through text-red-400 opacity-60 italic">{absentT?.name}</span>
                            <span className="text-gray-300">→</span>
                            <div className="relative group/sub">
                                <select 
                                  disabled={!isInchargeMode}
                                  value={sub.substituteTeacherId}
                                  onChange={(e) => onUpdateSubstitution?.(sub.id, { 
                                    substituteTeacherId: e.target.value,
                                    reason: 'Manual Choice' 
                                  })}
                                  className={`appearance-none bg-indigo-50 text-indigo-700 font-black px-2 py-1 rounded-md pr-8 ${isInchargeMode ? 'hover:bg-indigo-100 cursor-pointer' : 'cursor-default'} outline-none transition-all border border-indigo-100 disabled:opacity-80`}
                                >
                                  {teachers.map(t => {
                                    const desig = getDisplayDesignation(t);
                                    return (
                                      <option key={t.id} value={t.id} disabled={t.id === sub.absentTeacherId}>
                                        {t.name}{desig ? ` (${desig})` : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                                  {isInchargeMode ? <UserCog size={12} /> : <Lock size={12} />}
                                </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 mt-4 sm:mt-0">
                        {isInchargeMode && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onRemoveSubstitution?.(sub.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        {sub.isOverride && (
                          <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1 shadow-sm">
                            <MousePointer2 size={10} /> Manual Adjustment
                          </span>
                        )}
                        <div className="flex items-center gap-3">
                           <div className="text-right">
                              <div className="text-[9px] font-black text-gray-400 uppercase leading-none">Status</div>
                              {getWorkloadDots(sub.substituteTeacherId, selectedDay, sub.period)}
                           </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentPanel;
