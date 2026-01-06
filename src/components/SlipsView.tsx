
import React from 'react';
import { Teacher, MasterTimetable, Day, SchoolSettings } from '../types';
import { DAYS, PERIODS, PERIOD_TIMINGS } from '../constants';
import { FileText, Printer, Search, FileDown } from 'lucide-react';

interface SlipsViewProps {
  teachers: Teacher[];
  timetable: MasterTimetable;
  schoolSettings?: SchoolSettings;
}

const SlipsView: React.FC<SlipsViewProps> = ({ teachers, timetable, schoolSettings }) => {
  const getDisplayDesignation = (teacher: Teacher) => {
    const rankKeywords = ['HM', 'Principal', 'Head Master', 'Head Mistress'];
    const nameUpper = teacher.name.toUpperCase();
    const hasRankInName = rankKeywords.some(keyword => nameUpper.includes(keyword.toUpperCase()));
    const titlesToHide = ['MASTER', 'MISTRESS', 'HM', 'PRINCIPAL', 'HEAD MASTER', 'HEAD MISTRESS'];
    
    if (hasRankInName && titlesToHide.includes(teacher.designation.toUpperCase())) return null;
    return teacher.designation;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Schedule Slips</h1>
          <p className="text-gray-500 font-medium">Generate individual weekly timetables for faculty</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3"
        >
          <FileDown size={24} />
          Save PDF / Print Slips
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 no-print">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600">
            <FileText size={32} />
          </div>
          <div>
            <h4 className="font-black text-gray-900">Weekly Teacher Slip</h4>
            <p className="text-xs text-gray-500 font-medium">Contains all 6 working days on a single page.</p>
          </div>
        </div>
      </div>

      {/* PRINT CONTENT */}
      <div className="space-y-16 print:space-y-8 print:block">
        {teachers.map(teacher => {
          const desig = getDisplayDesignation(teacher);
          return (
            <div key={teacher.id} className="bg-white p-10 border-4 border-black print:p-4 print:border-2 print:mb-8 print:page-break relative overflow-hidden">
              <div className="absolute top-4 right-4 text-[10px] font-black uppercase text-gray-400 no-print">Teacher ID: {teacher.id}</div>
              
              <div className="text-center border-b-4 border-black pb-6 mb-8 print:pb-2 print:mb-4 print:border-b-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter print:text-[18px]">{schoolSettings?.name || 'GHS Deon Khera'}</h2>
                {schoolSettings?.address && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mt-1 print:text-[8px]">{schoolSettings.address}</div>
                )}
                <div className="text-lg font-bold bg-black text-white inline-block px-6 py-1 mt-4 print:text-[11px] print:mt-1 print:px-3">Individual Weekly Schedule</div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10 print:gap-2 print:mb-4">
                <div className="space-y-2 print:space-y-0">
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest print:text-[8px]">Name of Faculty</div>
                  <div className="text-2xl font-black border-b-2 border-gray-200 pb-1 print:text-[14px] print:border-b">{teacher.name}</div>
                </div>
                <div className="space-y-2 text-right print:space-y-0">
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest print:text-[8px]">Designation</div>
                  <div className="text-xl font-bold border-b-2 border-gray-200 pb-1 print:text-[12px] print:border-b">{desig || 'Faculty'}</div>
                </div>
              </div>

              <div className="overflow-hidden border-2 border-black print:border">
                <table className="w-full text-center text-sm border-collapse">
                  <thead className="bg-black text-white font-black text-xs uppercase print:bg-white print:text-black">
                    <tr>
                      <th className="p-3 border border-black print:p-1 print:text-[9px]">Day</th>
                      {PERIODS.map(p => (
                        <th key={p} className="p-3 border border-black print:p-1 print:text-[9px]">P{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-bold">
                    {DAYS.map(day => (
                      <tr key={day} className="border-b-2 border-black last:border-0 print:border-b">
                        <td className="p-3 border-r-2 border-black bg-gray-50 font-black print:p-1 print:text-[10px] print:bg-white print:border-r">{day}</td>
                        {PERIODS.map(p => {
                          const entry = timetable[day]?.[p]?.[teacher.id];
                          return (
                            <td key={p} className="p-3 border-r-2 border-black last:border-0 h-16 print:p-1 print:h-auto print:border-r">
                              {entry ? (
                                <div>
                                  <div className="font-black text-lg print:text-[11px]">{entry.classId}</div>
                                  <div className="text-[10px] uppercase font-bold text-gray-500 print:text-[8px] print:text-black">{entry.subject}</div>
                                </div>
                              ) : (
                                <span className="text-gray-300 font-black print:text-gray-100">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-16 flex justify-between items-end print:mt-6">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-gray-400 print:text-[7px]">Generation Meta</div>
                  <div className="text-xs font-bold print:text-[8px]">Date: {new Date().toLocaleDateString()}</div>
                  <div className="text-xs font-bold print:text-[8px]">Load: {teacher.weeklyLimit}P</div>
                </div>
                <div className="text-center space-y-2 print:space-y-1">
                  <div className="w-48 h-px bg-black mx-auto print:w-32" />
                  <div className="text-[10px] font-black uppercase tracking-widest print:text-[7px]">Principal / HM Signature</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlipsView;
