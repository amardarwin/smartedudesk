
import React, { useState } from 'react';
import { Teacher, MasterTimetable, Day, ValidationIssue, Subject } from '../types';
import { DAYS, PERIODS } from '../constants';
import { calculateConsecutiveStreak } from '../services/timetableLogic';
import { AlertTriangle, X, UserCog, Lock, Flame, Trash2, RotateCcw, UserMinus, AlertCircle } from 'lucide-react';

interface MasterTableViewProps {
  teachers: Teacher[];
  timetable: MasterTimetable;
  validationIssues?: ValidationIssue[];
  onUpdateCell?: (day: Day, period: number, teacherId: string, classId: string, subject: Subject) => void;
  onClearCell?: (day: Day, period: number, teacherId: string) => void;
  onClearClass?: (classId: string) => void;
  onClearTeacherSchedule?: (teacherId: string) => void;
  isInchargeMode?: boolean;
}

const getDisplayDesignation = (teacher: Teacher) => {
  const rankKeywords = ['HM', 'Principal', 'Head Master', 'Head Mistress'];
  const nameUpper = teacher.name.toUpperCase();
  const hasRankInName = rankKeywords.some(keyword => nameUpper.includes(keyword.toUpperCase()));
  const titlesToHide = ['MASTER', 'MISTRESS', 'HM', 'PRINCIPAL', 'HEAD MASTER', 'HEAD MISTRESS'];
  
  if (hasRankInName && titlesToHide.includes(teacher.designation.toUpperCase())) return null;
  return teacher.designation;
};

const MasterTableView: React.FC<MasterTableViewProps> = ({ 
  teachers, 
  timetable, 
  validationIssues = [],
  onUpdateCell,
  onClearCell,
  onClearClass,
  onClearTeacherSchedule,
  isInchargeMode = false
}) => {
  const [editingCell, setEditingCell] = useState<{ day: Day; period: number; teacherId: string } | null>(null);
  const [focusClass, setFocusClass] = useState<string | 'ALL'>('ALL');

  const getIssuesForCell = (day: Day, period: number, teacherId: string, classId?: string) => {
    return validationIssues.filter(i => 
      i.location?.day === day && 
      i.location?.period === period && 
      (i.location?.teacherId === teacherId || (classId && i.location?.classId === classId))
    );
  };

  const getMaxStreakForDay = (teacherId: string, day: Day) => {
    let maxStreak = 0;
    let currentStreak = 0;
    PERIODS.forEach(p => {
      if (timetable[day]?.[p]?.[teacherId]) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });
    return maxStreak;
  };

  const getLoadDots = (streak: number) => {
    if (streak === 0) return null;
    const color = streak >= 3 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : streak === 2 ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    return (
      <div className="flex gap-1 mt-1 justify-center no-print">
        {Array.from({ length: Math.min(streak, 3) }).map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${color}`} />
        ))}
        {streak > 3 && <div className="w-1.5 h-1.5 rounded-full bg-red-800 animate-pulse" />}
      </div>
    );
  };

  const handleSaveEdit = (classId: string, subject: Subject) => {
    if (!isInchargeMode) return;
    if (editingCell && onUpdateCell) {
      if (classId === "CLEAR") {
        onClearCell?.(editingCell.day, editingCell.period, editingCell.teacherId);
      } else {
        onUpdateCell(editingCell.day, editingCell.period, editingCell.teacherId, classId, subject);
      }
      setEditingCell(null);
    }
  };

  const availableClasses = ['6th', '7th', '8th', '9th', '10th'];

  if (teachers.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-center space-y-6">
        <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto">
          <Trash2 size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-gray-900">No Faculty Registered</h3>
          <p className="text-gray-500 font-medium max-w-sm mx-auto">Please add faculty members first to view and manage the master timetable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Table Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 flex-1 sm:flex-initial">
            <span className="text-xs font-black text-indigo-600 uppercase">Class Focus:</span>
            <select 
              value={focusClass}
              onChange={(e) => setFocusClass(e.target.value)}
              className="bg-transparent text-sm font-bold text-indigo-900 outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Classes View</option>
              {availableClasses.map(c => <option key={c} value={c}>Class {c} Only</option>)}
            </select>
          </div>
          {focusClass !== 'ALL' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFocusClass('ALL')}
                className="text-[10px] font-black text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <X size={12} /> Clear Filter
              </button>
              {isInchargeMode && (
                <button 
                  onClick={() => onClearClass?.(focusClass)}
                  className="text-[10px] font-black text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors bg-red-50 px-2 py-1 rounded border border-red-100"
                >
                  <UserMinus size={12} /> Clear Class {focusClass}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[8px] font-bold text-gray-400">1P</span>
             <div className="w-2 h-2 rounded-full bg-yellow-400" /> <span className="text-[8px] font-bold text-gray-400">2P</span>
             <div className="w-2 h-2 rounded-full bg-red-500" /> <span className="text-[8px] font-bold text-gray-400">3P</span>
          </div>
          <span className="opacity-20">|</span>
          {isInchargeMode ? (
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 flex items-center gap-1 text-[10px] font-black uppercase"><UserCog size={14} /> Editing Enabled</span>
            </div>
          ) : (
            <span className="text-gray-300 flex items-center gap-1 text-[10px] font-black uppercase"><Lock size={14} /> Read Only</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-2xl border-4 border-black print:border-black print:border-2">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-black text-white font-black uppercase text-center border-b-4 border-black print:bg-gray-100 print:text-black print:border-b-2">
              <th className="p-4 border-r border-black text-left sticky left-0 bg-black z-30 w-56 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] print:p-2 print:bg-gray-100 print:w-40">Teacher Directory</th>
              <th className="p-4 border-r border-black w-24 print:p-2 print:w-16">Day</th>
              {PERIODS.map(p => (
                <th key={p} className="p-4 border-r border-black min-w-[110px] print:p-2 print:min-w-0">P{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher, idx) => {
              const desigDisplay = getDisplayDesignation(teacher);

              return (
                <React.Fragment key={teacher.id}>
                  {DAYS.map((day, dIdx) => {
                    const maxStreak = getMaxStreakForDay(teacher.id, day);
                    const isOverloaded = maxStreak > 3;

                    return (
                      <tr key={`${teacher.id}-${day}`} className={`border-b border-black hover:bg-gray-50 transition-colors ${dIdx === DAYS.length - 1 ? 'border-b-4 print:border-b-2' : 'print:border-b'}`}>
                        {dIdx === 0 && (
                          <td 
                            rowSpan={6} 
                            className="p-4 border-r border-black font-medium sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group/teacher print:p-2 print:bg-white"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1 flex justify-between items-center print:text-black">
                                <span>Staff #{idx + 1}</span>
                                {isInchargeMode && (
                                  <button 
                                    onClick={() => onClearTeacherSchedule?.(teacher.id)}
                                    title="Reset Teacher Schedule"
                                    className="opacity-0 group-hover/teacher:opacity-100 text-red-400 hover:text-red-600 transition-opacity no-print"
                                  >
                                    <RotateCcw size={10} />
                                  </button>
                                )}
                              </span>
                              <div className="font-black text-gray-900 text-sm flex items-center gap-2 print:text-[11px]">
                                {teacher.name}
                                {teachers.some(t => t.id === teacher.id && DAYS.some(d => getMaxStreakForDay(t.id, d) > 3)) && (
                                  <span title="Schedule Warning: 3+ consecutive periods detected in weekly plan">
                                    <AlertCircle size={14} className="text-red-500 animate-pulse print:hidden" />
                                  </span>
                                )}
                              </div>
                              {desigDisplay && (
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter print:text-[9px] print:text-black">{desigDisplay}</div>
                              )}
                              <div className="mt-1 text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md inline-block w-fit print:hidden">Limit: {teacher.weeklyLimit}P</div>
                            </div>
                          </td>
                        )}
                        <td className="p-3 border-r border-black text-center bg-gray-50 print:p-1 print:bg-white">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-black uppercase print:text-[10px] ${isOverloaded ? 'text-red-600' : 'text-gray-900'}`}>{day}</span>
                            {getLoadDots(maxStreak)}
                            {isOverloaded && (
                              <span title="Teacher exceeds 3 consecutive periods today!">
                                <Flame size={12} className="text-red-500 animate-bounce mt-1 print:hidden" />
                              </span>
                            )}
                          </div>
                        </td>
                        {PERIODS.map(period => {
                          const entry = timetable[day]?.[period]?.[teacher.id];
                          const cellIssues = getIssuesForCell(day, period, teacher.id, entry?.classId);
                          const hasError = cellIssues.some(i => i.type === 'ERROR');
                          const isEditing = editingCell?.day === day && editingCell?.period === period && editingCell?.teacherId === teacher.id;
                          const isDimmed = focusClass !== 'ALL' && entry && entry.classId !== focusClass;

                          const streakIfAssigned = calculateConsecutiveStreak(teacher.id, day, period, timetable, []);
                          const showsWarning = !entry && streakIfAssigned >= 3;

                          return (
                            <td 
                              key={period} 
                              onClick={() => isInchargeMode && !isEditing && setEditingCell({ day, period, teacherId: teacher.id })}
                              className={`p-1 border-r border-black min-w-[110px] h-16 transition-all relative text-center print:h-auto print:min-w-0 print:p-1
                                ${entry ? 'bg-white' : 'bg-gray-50/30'}
                                ${hasError ? 'bg-red-50' : ''}
                                ${isEditing && isInchargeMode ? 'ring-2 ring-indigo-500 z-40 bg-white shadow-xl' : ''}
                                ${isDimmed ? 'opacity-20 grayscale' : 'opacity-100'}
                                ${isInchargeMode ? 'cursor-pointer' : 'cursor-default'}
                                ${showsWarning && !isEditing ? 'hover:bg-red-50' : ''}
                              `}
                            >
                              {isEditing && isInchargeMode ? (
                                <div className="p-1 space-y-1">
                                  {showsWarning && (
                                    <div className="flex items-center gap-1 justify-center text-[8px] font-black text-red-600 uppercase animate-pulse">
                                      <Flame size={10} /> Limit Warning
                                    </div>
                                  )}
                                  <select 
                                    autoFocus
                                    className={`w-full text-[10px] font-black border-2 rounded p-1 outline-none bg-white ${showsWarning ? 'border-red-500 text-red-700' : 'border-indigo-600'}`}
                                    onChange={(e) => {
                                      const selectedClassId = e.target.value;
                                      if (selectedClassId === "") return;
                                      const firstSubject = teacher.assignments.find(a => a.classId === selectedClassId)?.subject || teacher.subjects[0] || 'Free Period';
                                      handleSaveEdit(selectedClassId, firstSubject as Subject);
                                    }}
                                    onBlur={() => setEditingCell(null)}
                                  >
                                    <option value="">Select...</option>
                                    <option value="CLEAR" className="text-red-500 font-bold">CLEAR</option>
                                    {availableClasses.map(c => {
                                       const teacherAsn = teacher.assignments.find(a => a.classId === c);
                                       return (
                                         <option key={c} value={c}>
                                           Class {c} {teacherAsn ? `(${teacherAsn.subject})` : ''}
                                         </option>
                                       );
                                    })}
                                  </select>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full group/cell">
                                  {entry ? (
                                    <>
                                      <div className={`font-black text-base leading-none print:text-[11px] ${!isDimmed && focusClass !== 'ALL' ? 'text-indigo-600 scale-110' : 'text-gray-900'}`}>
                                        {entry.classId}
                                      </div>
                                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mt-1 print:text-[8px] print:text-black">{entry.subject}</div>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-gray-200 font-black group-hover/cell:text-gray-300 print:text-gray-200">-</span>
                                      {showsWarning && (
                                        <div className="absolute top-1 left-1 opacity-40 group-hover/cell:opacity-100 transition-opacity no-print">
                                          <Flame size={10} className="text-orange-400" />
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {hasError && (
                                    <div className="absolute top-1 right-1 no-print">
                                      <AlertTriangle size={12} className="text-red-500" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterTableView;
