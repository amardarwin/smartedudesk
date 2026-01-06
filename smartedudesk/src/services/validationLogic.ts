
import { MasterTimetable, Teacher, ValidationIssue, Day, Subject } from '../types';
import { DAYS, PERIODS } from '../constants';

const CORE_SUBJECTS: Subject[] = ['Math', 'Science', 'English', 'SST'];

export const validateTimetable = (
  timetable: MasterTimetable,
  teachers: Teacher[]
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  
  // Deriving list of classes from teacher assignments to ensure we check all relevant groups
  const classesToCheck = Array.from(new Set(teachers.flatMap(t => t.assignments.map(a => a.classId))));

  DAYS.forEach(day => {
    PERIODS.forEach(period => {
      const entries = Object.entries(timetable[day]?.[period] || {});
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

      // 2. NEW RULE: Vacant Period Check
      // Check if any class is missing a teacher for this period
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

      // 3. Rule: Core subjects in morning (1-5) for senior classes (8th-10th)
      entries.forEach(([tId, entry]) => {
        if (['8th', '9th', '10th'].includes(entry.classId) && 
            CORE_SUBJECTS.includes(entry.subject) && 
            period > 5) {
          issues.push({
            id: `rule-core-${day}-${period}-${tId}`,
            type: 'WARNING',
            message: `${entry.subject} scheduled for Class ${entry.classId} after recess (Period ${period}). Core subjects are preferred in morning.`,
            location: { day, period, classId: entry.classId, teacherId: tId }
          });
        }
      });
    });

    // 4. Rule: Max 3 consecutive periods for a teacher
    teachers.forEach(teacher => {
      let streak = 0;
      PERIODS.forEach(period => {
        if (timetable[day]?.[period]?.[teacher.id]) {
          streak++;
          if (streak > 3) {
            issues.push({
              id: `streak-${day}-${period}-${teacher.id}`,
              type: 'WARNING',
              message: `${teacher.name} has ${streak} consecutive periods. Max 3 is recommended.`,
              location: { day, period, teacherId: teacher.id }
            });
          }
        } else {
          streak = 0;
        }
      });
    });
  });

  return issues;
};
