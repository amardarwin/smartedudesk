
import React, { useState } from 'react';
import { ClassRequirement, Teacher, MasterTimetable, TimetableEntry, SchoolSettings, Subject } from '../types';
import { DAYS, PERIODS, PERIOD_TIMINGS } from '../constants';
import { GraduationCap, BookOpen, Clock, Printer, Edit2, Check, X, AlertTriangle, FileDown, Lock } from 'lucide-react';

interface ClassesViewProps {
  requirements: ClassRequirement[];
  teachers: Teacher[];
  timetable: MasterTimetable;
  schoolSettings?: SchoolSettings;
  onUpdateRequirement?: (classId: string, subject: Subject, periods: number) => void;
  isInchargeMode?: boolean;
}

const ClassesView: React.FC<ClassesViewProps> = ({ requirements, teachers, timetable, schoolSettings, onUpdateRequirement, isInchargeMode = false }) => {
  const [editingClass, setEditingClass] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end no-print">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Configuration</h1>
          <p className="text-gray-500 font-medium">Define period load for each class and subject</p>
        </div>
        <button 
            onClick={() => window.print()}
            className="bg-indigo-600 text-white font-black py-3 px-8 rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
            <FileDown size={20} />
            Save PDF / Print All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-12 print:gap-4">
        {requirements.map(req => {
          const incharge = teachers.find(t => t.classInchargeOf === req.classId);
          const totalPeriods = req.requirements.reduce((acc, r) => acc + r.periodsPerWeek, 0);
          const isEditing = editingClass === req.classId && isInchargeMode;

          return (
            <div key={req.classId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all print:border-2 print:border-black print:rounded-none print:shadow-none print:mb-4 print:page-break">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex justify-between items-center print:p-2 print:from-white print:to-white print:text-black print:border-b-2 print:border-black">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md print:hidden">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 print:text-[14px]">
                        Class {req.classId}
                        {isInchargeMode ? (
                          <button 
                              onClick={() => setEditingClass(isEditing ? null : req.classId)}
                              className="no-print bg-white/10 p-1.5 rounded-lg hover:bg-white/20 transition-all"
                          >
                              {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                          </button>
                        ) : (
                          <span className="no-print bg-black/10 p-1.5 rounded-lg text-white/50" title="Unlock in Settings to edit">
                            <Lock size={16} />
                          </span>
                        )}
                    </h3>
                    <div className="text-xs font-bold opacity-80 uppercase tracking-widest print:text-[8px]">{schoolSettings?.name}</div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  {incharge && (
                    <div className="text-right">
                        <div className="text-[10px] font-black opacity-70 uppercase tracking-widest print:text-[8px]">In-charge</div>
                        <div className="font-black text-sm print:text-[10px]">{incharge.name}</div>
                    </div>
                  )}
                  <div className="h-10 w-px bg-white/20 print:bg-black" />
                  <div className="text-right">
                    <div className="text-2xl font-black print:text-[14px]">{totalPeriods}</div>
                    <div className="text-[10px] font-bold opacity-70 uppercase print:text-[8px]">Weekly</div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8 print:p-2 print:space-y-2">
                {/* Requirements Editor (Visible when editing and incharge) */}
                {isEditing && isInchargeMode && (
                    <div className="no-print bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                        <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Clock size={14} /> Update Period Counts for Class {req.classId}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {req.requirements.map(sub => (
                                <div key={sub.subject} className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">{sub.subject}</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        max="12"
                                        value={sub.periodsPerWeek}
                                        onChange={(e) => onUpdateRequirement?.(req.classId, sub.subject, parseInt(e.target.value) || 0)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timetable Grid View */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border-2 border-black text-center text-xs print:border-black print:border">
                        <thead className="bg-gray-100 font-black uppercase text-gray-600 print:bg-white print:text-black">
                            <tr>
                                <th className="p-3 border border-black w-24 print:p-1 print:w-16">Day</th>
                                {PERIODS.map(p => (
                                    <th key={p} className="p-3 border border-black print:p-1">P{p}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="font-bold">
                            {DAYS.map(day => (
                                <tr key={day}>
                                    <td className="p-3 border border-black bg-gray-50 font-black print:p-1 print:bg-white">{day}</td>
                                    {PERIODS.map(p => {
                                        const teacherEntries = Object.values(timetable[day]?.[p] || {}) as TimetableEntry[];
                                        const classEntry = teacherEntries.find(e => e.classId === req.classId);
                                        const teacher = classEntry ? teachers.find(t => t.id === classEntry.teacherId) : null;

                                        return (
                                            <td key={p} className={`p-2 border border-black h-20 min-w-[100px] transition-all print:h-auto print:min-w-0 print:p-1 ${!classEntry ? 'bg-red-50 print:bg-white' : ''}`}>
                                                {classEntry ? (
                                                    <div className="space-y-1 print:space-y-0">
                                                        <div className="text-indigo-600 print:text-black font-black text-[11px] leading-tight uppercase print:text-[10px]">
                                                            {classEntry.subject}
                                                        </div>
                                                        <div className="text-[9px] text-gray-500 print:text-black font-medium italic print:text-[8px] print:not-italic">
                                                            {teacher?.name}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-red-500 space-y-1 print:text-black print:space-y-0">
                                                      <AlertTriangle size={14} className="print:hidden" />
                                                      <span className="text-[10px] font-black uppercase print:text-[9px] print:text-gray-300">Vacant</span>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Distribution Summary */}
                <div className="no-print space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 font-black text-xs uppercase tracking-wider">
                    <BookOpen size={14} /> Assigned vs Goal
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {req.requirements.map(sub => (
                      <div key={sub.subject} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="font-bold text-gray-700 text-xs">{sub.subject}</span>
                        <span className="text-[10px] font-black text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                            {sub.periodsPerWeek}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default ClassesView;
