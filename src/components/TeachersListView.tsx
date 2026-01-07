
import React, { useState, useEffect } from 'react';
import { Teacher, Subject, TeacherAssignment } from '../types';
import { Search, UserPlus, ShieldCheck, BookOpen, Clock, Users, X, CheckCircle2, PlusCircle, Trash2, Printer, Plus, Edit3, Lock } from 'lucide-react';

interface TeachersListViewProps {
  teachers: Teacher[];
  onAddTeacher?: (teacher: Teacher) => void;
  onUpdateTeacher?: (teacher: Teacher) => void;
  isInchargeMode?: boolean;
}

const TeachersListView: React.FC<TeachersListViewProps> = ({ teachers, onAddTeacher, onUpdateTeacher, isInchargeMode = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  
  // Form state
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    designation: 'Master',
    subjects: [] as Subject[],
    assignments: [] as TeacherAssignment[],
    weeklyLimit: 23,
    classInchargeOf: ''
  });

  // State for the "assignment row" being built in the modal
  const [currentAsn, setCurrentAsn] = useState({ 
    classId: '6th', 
    subject: '' as Subject, 
    periods: 6 
  });

  const availableSubjects: Subject[] = ['Math', 'Science', 'English', 'SST', 'Punjabi', 'Hindi', 'Computer', 'Phy Edu', 'Agri', 'W.L.'];
  const availableClasses = ['6th', '7th', '8th', '9th', '10th'];

  // Handle Edit Trigger
  const handleEditClick = (teacher: Teacher) => {
    if (!isInchargeMode) return;
    setEditingTeacherId(teacher.id);
    setNewTeacher({
      name: teacher.name,
      designation: teacher.designation,
      subjects: teacher.subjects,
      assignments: teacher.assignments,
      weeklyLimit: teacher.weeklyLimit,
      classInchargeOf: teacher.classInchargeOf || ''
    });
    setShowAddModal(true);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
    t.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInchargeMode) return;
    if (!newTeacher.name) {
      alert("Please enter a faculty name.");
      return;
    }

    if (newTeacher.subjects.length === 0) {
      alert("Please select at least one subject the teacher is qualified to teach.");
      return;
    }

    const teacherObj: Teacher = {
      id: editingTeacherId || `T${Date.now().toString().slice(-3)}`,
      name: newTeacher.name,
      designation: newTeacher.designation,
      subjects: newTeacher.subjects,
      weeklyLimit: newTeacher.weeklyLimit,
      assignments: newTeacher.assignments,
      classInchargeOf: newTeacher.classInchargeOf === 'None' || !newTeacher.classInchargeOf ? undefined : newTeacher.classInchargeOf
    };

    if (editingTeacherId) {
      onUpdateTeacher?.(teacherObj);
    } else {
      onAddTeacher?.(teacherObj);
    }
    
    // Reset form
    setNewTeacher({ name: '', designation: 'Master', subjects: [], assignments: [], weeklyLimit: 23, classInchargeOf: '' });
    setEditingTeacherId(null);
    setShowAddModal(false);
  };

  const addAssignmentToTeacher = () => {
    if (!currentAsn.subject) {
      alert("Please select a subject for this assignment.");
      return;
    }
    
    setNewTeacher(prev => ({
      ...prev,
      assignments: [...prev.assignments, { 
        classId: currentAsn.classId, 
        subject: currentAsn.subject, 
        periodsPerWeek: currentAsn.periods 
      }]
    }));
  };

  const removeAssignmentFromTeacher = (idx: number) => {
    setNewTeacher(prev => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== idx)
    }));
  };

  const toggleSubject = (s: Subject) => {
    setNewTeacher(prev => {
      const isSelected = prev.subjects.includes(s);
      const nextSubjects = isSelected 
        ? prev.subjects.filter(x => x !== s) 
        : [...prev.subjects, s];
      
      // If we just selected the first subject, set it as default for the assignment row
      if (!isSelected && nextSubjects.length === 1) {
        setCurrentAsn(cur => ({ ...cur, subject: s }));
      }
      
      return { ...prev, subjects: nextSubjects };
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Faculty Database</h1>
          <p className="text-gray-500 font-medium">Manage staff, define subject expertise, and set class-wise period loads.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto no-print">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all font-black shadow-sm"
          >
            <Printer size={18} /> Print List
          </button>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-bold"
            />
          </div>
          {isInchargeMode ? (
            <button 
              onClick={() => {
                setEditingTeacherId(null);
                setNewTeacher({ name: '', designation: 'Master', subjects: [], assignments: [], weeklyLimit: 23, classInchargeOf: '' });
                setShowAddModal(true);
              }}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 font-black whitespace-nowrap"
            >
              <UserPlus size={18} />
              Add Faculty
            </button>
          ) : (
            <div className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-400 rounded-xl border border-dashed border-gray-300 font-bold text-xs">
              <Lock size={14} /> Incharge Locked
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative print:border-2 print:border-black print:rounded-none">
            {isInchargeMode && (
              <button 
                onClick={() => handleEditClick(t)}
                className="absolute top-6 right-16 p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all no-print"
                title="Edit Teacher"
              >
                <Edit3 size={16} />
              </button>
            )}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg print:bg-black print:text-white">
                {t.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 leading-tight">{t.name}</h3>
                <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] print:text-black">{t.designation}</p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[9px] font-black text-gray-300 uppercase">Limit</div>
                <div className="text-xl font-black text-gray-900 leading-none">{t.weeklyLimit}</div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <BookOpen className="text-gray-300 mt-0.5 shrink-0" size={16} />
                <div>
                  <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5">Expertise</div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.subjects.map((s, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-black border border-indigo-100 uppercase">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-gray-50 print:border-black">
                <Clock className="text-gray-300 mt-0.5 shrink-0" size={16} />
                <div className="flex-1">
                  <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">Class Assignments</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {t.assignments.map((asn, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 print:border-black">
                        <span className="text-[11px] font-black text-gray-800">{asn.classId}: {asn.subject}</span>
                        <span className="text-[10px] font-bold text-indigo-600">{asn.periodsPerWeek} Periods</span>
                      </div>
                    ))}
                    {t.assignments.length === 0 && <span className="text-[10px] text-gray-400 italic font-medium">No direct classes assigned</span>}
                  </div>
                </div>
              </div>
              
              {t.classInchargeOf && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black flex items-center gap-2 border border-emerald-100 print:bg-white print:border-black">
                  <ShieldCheck size={14} /> In-charge: {t.classInchargeOf}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredTeachers.length === 0 && (
          <div className="col-span-full py-24 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <Users size={64} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-2xl font-black text-gray-400">Empty Database</h3>
            <p className="text-gray-400 font-medium max-w-sm mx-auto">Start by adding teachers and assigning them classes to generate your master timetable.</p>
          </div>
        )}
      </div>

      {showAddModal && isInchargeMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md no-print animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b flex justify-between items-center bg-indigo-600 text-white">
              <div>
                <h3 className="text-2xl font-black tracking-tight">{editingTeacherId ? 'Edit Faculty Member' : 'Register New Faculty'}</h3>
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Staff Panel</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-2xl transition-all"><X size={28}/></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-8 space-y-8 overflow-y-auto flex-1">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2.5 tracking-widest">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    value={newTeacher.name} 
                    onChange={e => setNewTeacher(p => ({...p, name: e.target.value}))} 
                    className="w-full border-0 bg-gray-50 rounded-2xl px-5 py-4 font-black text-lg outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all shadow-sm placeholder:text-gray-300" 
                    placeholder="e.g. Amarjeet Singh" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2.5 tracking-widest">Designation</label>
                  <select value={newTeacher.designation} onChange={e => setNewTeacher(p => ({...p, designation: e.target.value}))} className="w-full border-0 bg-gray-50 rounded-2xl px-5 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm">
                    <option>Master</option><option>Mistress</option><option>HM</option><option>Principal</option><option>Lecturer</option><option>Guest Faculty</option>
                  </select>
                </div>
              </div>

              {/* Limits & Roles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2.5 tracking-widest">Total Periods / Week Limit</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="48" 
                    value={newTeacher.weeklyLimit} 
                    onChange={e => setNewTeacher(p => ({...p, weeklyLimit: parseInt(e.target.value) || 0}))} 
                    className="w-full border-0 bg-gray-50 rounded-2xl px-5 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2.5 tracking-widest">Class In-charge Responsibility</label>
                  <select value={newTeacher.classInchargeOf} onChange={e => setNewTeacher(p => ({...p, classInchargeOf: e.target.value}))} className="w-full border-0 bg-gray-50 rounded-2xl px-5 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm">
                    <option value="">None (General Staff)</option>
                    {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Subject Expertise */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Qualified Subjects (Expertise)</label>
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map(s => (
                    <button 
                      key={s} 
                      type="button" 
                      onClick={() => toggleSubject(s)} 
                      className={`px-5 py-2.5 rounded-xl text-[12px] font-black border-2 transition-all ${newTeacher.subjects.includes(s) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mandatory Class Assignments */}
              <div className="bg-indigo-50/50 p-8 rounded-[2rem] border-2 border-dashed border-indigo-100 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Direct Class Assignments</h4>
                  <span className="text-[9px] font-bold text-indigo-400 italic">This data drives the Automatic Timetable Generator</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div className="sm:col-span-1">
                    <label className="block text-[9px] font-black text-gray-400 mb-1.5 uppercase">Class</label>
                    <select value={currentAsn.classId} onChange={e => setCurrentAsn(p => ({...p, classId: e.target.value}))} className="w-full border-0 bg-white rounded-xl px-4 py-3 text-sm font-black shadow-sm">
                      {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[9px] font-black text-gray-400 mb-1.5 uppercase">Subject</label>
                    <select 
                      value={currentAsn.subject} 
                      onChange={e => setCurrentAsn(p => ({...p, subject: e.target.value as Subject}))} 
                      className="w-full border-0 bg-white rounded-xl px-4 py-3 text-sm font-black shadow-sm"
                    >
                      <option value="">Select...</option>
                      {newTeacher.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[9px] font-black text-gray-400 mb-1.5 uppercase">P/Week</label>
                    <input type="number" min="1" max="12" value={currentAsn.periods} onChange={e => setCurrentAsn(p => ({...p, periods: parseInt(e.target.value) || 0}))} className="w-full border-0 bg-white rounded-xl px-4 py-3 text-sm font-black shadow-sm" />
                  </div>
                  <button 
                    type="button" 
                    onClick={addAssignmentToTeacher} 
                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center"
                  >
                    <Plus size={24}/>
                  </button>
                </div>

                <div className="space-y-3">
                  {newTeacher.assignments.map((asn, i) => (
                    <div key={i} className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-indigo-100 shadow-sm animate-in slide-in-from-left-2">
                      <div className="flex items-center gap-5">
                        <span className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-black text-xs">{asn.classId}</span>
                        <div>
                          <div className="text-sm font-black text-gray-800">{asn.subject}</div>
                          <div className="text-[10px] font-bold text-gray-400">{asn.periodsPerWeek} Dedicated Periods Per Week</div>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeAssignmentFromTeacher(i)} className="text-red-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20}/></button>
                    </div>
                  ))}
                  {newTeacher.assignments.length === 0 && (
                    <div className="text-center py-6 text-[10px] font-black text-gray-300 uppercase italic">No manual assignments added yet.</div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 pt-4 bg-white">
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  <CheckCircle2 size={28} />
                  {editingTeacherId ? 'Update Faculty Details' : 'Register Faculty Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersListView;
