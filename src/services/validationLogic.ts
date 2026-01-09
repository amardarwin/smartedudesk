
import { MasterTimetable, Teacher, ValidationIssue, Day, Subject, TimetableEntry } from '../types';
import { DAYS, PERIODS } from '../constants';

const CORE_SUBJECTS: Subject[] = ['Math', 'Science', 'English', 'SST'];

export const validateTimetable = (
  timetable: MasterTimetable,
  teachers: Teacher[]
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  
  const classesToCheck = Array.from(new Set(teachers.flatMap(t => t.assignments.map(a => a.classId))));

  DAYS.forEach(day => {
    PERIODS.forEach(period => {
      const entries = Object.entries(timetable[day]?.[period] || {}) as [string, TimetableEntry][];
      const classEntries = entries.map(([, entry]) => entry.classId);

      // 1. Conflict Check: Class double-booked
      const classUsage: Record<string, string[]> = {};
      entries.forEach(([tId, entry]) => {
        if (!classUsage[entry.classId]) classUsage[entry.classId] = [];
        classUsage[entry.classId].push(tId);
      });

      Object.entries(classUsage).forEach(([cId, tIds]) => {
        if (tIds.length > 1) {
          issues.push({
            id: `conf-${day}-${period}-${cId}`,
            type: 'ERROR',
            message: `Class ${cId} has ${tIds.length} teachers assigned at once!`,
            location: { day, period, classId: cId }
          });
        }
      });

      // 2. Vacant Period Check
      classesToCheck.forEach(cId => {
        if (!classEntries.includes(cId)) {
          issues.push({
            id: `vacant-${day}-${period}-${cId}`,
            type: 'ERROR',
            message: `Vacant Period: Class ${cId} has no teacher assigned for Period ${period}.`,
            location: { day, period, classId: cId }
          });
        }
      });
    });

    // 3. Teacher Load & Continuous Streak Rules
    teachers.forEach(teacher => {
      let teachStreak = 0;
      let freeStreak = 0;
      let periodsBeforeRecess = 0;
      let periodsAfterRecess = 0;

      PERIODS.forEach(period => {
        const isBusy = !!timetable[day]?.[period]?.[teacher.id];
        
        if (isBusy) {
          teachStreak++;
          freeStreak = 0;
          if (period <= 5) periodsBeforeRecess++;
          else periodsAfterRecess++;

          if (teachStreak > 3) {
            issues.push({
              id: `streak-teach-${day}-${period}-${teacher.id}`,
              type: 'WARNING',
              message: `${teacher.name} has ${teachStreak} consecutive teaching periods. Max 3 allowed.`,
              location: { day, period, teacherId: teacher.id }
            });
          }
          
          if (period > 5 && teachStreak >= 3 && period === 8) {
            issues.push({
              id: `streak-afternoon-${day}-${period}-${teacher.id}`,
              type: 'ERROR',
              message: `${teacher.name} teaching all 3 periods after recess continuously. Prohibited.`,
              location: { day, period, teacherId: teacher.id }
            });
          }
        } else {
          teachStreak = 0;
          freeStreak++;

          if (freeStreak > 2) {
            issues.push({
              id: `streak-free-${day}-${period}-${teacher.id}`,
              type: 'ERROR',
              message: `${teacher.name} has ${freeStreak} consecutive free periods. Max 2 allowed.`,
              location: { day, period, teacherId: teacher.id }
            });
          }
        }
      });

      // Daily Balance Checks
      if (periodsBeforeRecess > 0 && periodsAfterRecess === 0) {
        issues.push({
          id: `balance-morning-only-${day}-${teacher.id}`,
          type: 'ERROR',
          message: `${teacher.name} is only busy before recess. Must have balanced load.`,
          location: { day, period: 1, teacherId: teacher.id }
        });
      }
      
      const isWorkingDay = PERIODS.some(p => !!timetable[day]?.[p]?.[teacher.id]);
      const hasAfterRecessLoad = [6, 7, 8].some(p => !!timetable[day]?.[p]?.[teacher.id]);
      if (isWorkingDay && !hasAfterRecessLoad) {
        issues.push({
          id: `vacant-post-recess-${day}-${teacher.id}`,
          type: 'ERROR',
          message: `${teacher.name} is completely vacant after recess. Prohibited.`,
          location: { day, period: 6, teacherId: teacher.id }
        });
      }
    });
  });

  // 4. Fixed Science Spot Validation
  const checkFixed = (day: Day, period: number, classId: string, subject: string) => {
    const entryFound = Object.values(timetable[day]?.[period] || {}).some(e => e.classId === classId && e.subject === subject);
    if (!entryFound) {
      issues.push({
        id: `fixed-missing-${day}-${period}-${classId}`,
        type: 'ERROR',
        message: `Strict Requirement: ${classId} Science must be at Period ${period} on ${day}.`,
        location: { day, period, classId }
      });
    }
  };

  checkFixed(Day.FRI, 3, '10th', 'Science');
  checkFixed(Day.TUE, 2, '9th', 'Science');
  checkFixed(Day.WED, 2, '8th', 'Science');

  return issues;
};
