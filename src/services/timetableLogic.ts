
import { MasterTimetable, Teacher, Day, Substitution, Subject } from '../types';
import { DAYS, PERIODS } from '../constants';

/**
 * Checks if a teacher is busy in a specific period (Master + Adjustments).
 */
export const isTeacherBusy = (
  teacherId: string,
  day: Day,
  period: number,
  masterTimetable: MasterTimetable,
  substitutions: Substitution[]
): boolean => {
  if (masterTimetable[day]?.[period]?.[teacherId]) return true;
  if (substitutions.some(s => s.substituteTeacherId === teacherId && s.period === period)) return true;
  return false;
};

/**
 * Calculates the consecutive streak of periods for a teacher at a given period.
 */
export const calculateConsecutiveStreak = (
  teacherId: string,
  day: Day,
  period: number,
  masterTimetable: MasterTimetable,
  substitutions: Substitution[]
): number => {
  let streak = 1;
  for (let p = period - 1; p >= 1; p--) {
    if (isTeacherBusy(teacherId, day, p, masterTimetable, substitutions)) streak++;
    else break;
  }
  for (let p = period + 1; p <= 8; p++) {
    if (isTeacherBusy(teacherId, day, p, masterTimetable, substitutions)) streak++;
    else break;
  }
  return streak;
};

/**
 * Smart Substitution Logic
 */
export const findSmartSubstitute = (
  absentTeacherId: string,
  day: Day,
  period: number,
  classId: string,
  subject: Subject,
  masterTimetable: MasterTimetable,
  teachers: Teacher[],
  existingSubstitutions: Substitution[]
): { teacher: Teacher | null; isViolation: boolean; streak: number } => {
  const freeTeachers = teachers.filter(t => 
    t.id !== absentTeacherId && 
    !isTeacherBusy(t.id, day, period, masterTimetable, existingSubstitutions)
  );

  if (freeTeachers.length === 0) return { teacher: null, isViolation: false, streak: 0 };

  const scored = freeTeachers.map(t => {
    const streak = calculateConsecutiveStreak(t.id, day, period, masterTimetable, existingSubstitutions);
    const isViolation = streak > 3;
    
    let score = 0;
    if (t.subjects.includes(subject)) score += 100;
    if (t.classInchargeOf === classId) score += 50;
    if (streak === 3) score -= 10;
    if (streak > 3) score -= 200;

    const dailyLoad = PERIODS.filter(p => isTeacherBusy(t.id, day, p, masterTimetable, existingSubstitutions)).length;
    score -= dailyLoad;

    return { teacher: t, score, isViolation, streak };
  });

  const best = scored.sort((a, b) => b.score - a.score)[0];
  return { 
    teacher: best.teacher, 
    isViolation: best.isViolation, 
    streak: best.streak 
  };
};

/**
 * Baseline generator respecting PDF constraints:
 * 1. Science, Math, English, SST for 8th-10th in first 5 periods.
 * 2. If >6 periods per week for one class, adjust surplus in last 3 periods.
 * 3. Grading subjects mostly after 4 periods.
 */
export const generateBaseTimetable = (
  teachers: Teacher[]
): MasterTimetable => {
  const timetable: MasterTimetable = {} as MasterTimetable;
  DAYS.forEach(day => {
    timetable[day] = {};
    PERIODS.forEach(p => timetable[day][p] = {});
  });

  const coreSubjects: Subject[] = ['Science', 'Math', 'English', 'SST'];
  const seniorClasses = ['8th', '9th', '10th'];

  teachers.forEach(teacher => {
    teacher.assignments.forEach(asn => {
      let assigned = 0;
      const isCoreSenior = coreSubjects.includes(asn.subject) && seniorClasses.includes(asn.classId);
      
      // Determine period preferences based on PDF notes
      const preferredPeriods = isCoreSenior ? [1, 2, 3, 4, 5] : [5, 6, 7, 8];
      const backupPeriods = isCoreSenior ? [6, 7, 8] : [1, 2, 3, 4];
      
      // Special Rule: If more than 6 periods a week, 6 go to morning, others to evening
      const morningLimit = 6;

      for (const day of DAYS) {
        if (assigned >= asn.periodsPerWeek) break;
        
        // Find best period
        const periodSet = (assigned < morningLimit) ? preferredPeriods : backupPeriods;
        
        for (const p of periodSet) {
          const isClassBusy = Object.values(timetable[day][p]).some(e => e.classId === asn.classId);
          const isTeacherBusy = !!timetable[day][p][teacher.id];
          
          if (!isClassBusy && !isTeacherBusy) {
            timetable[day][p][teacher.id] = {
              classId: asn.classId,
              subject: asn.subject,
              teacherId: teacher.id
            };
            assigned++;
            break; 
          }
        }
      }
      
      // Final fallback if not all periods assigned
      if (assigned < asn.periodsPerWeek) {
        for (const day of DAYS) {
          if (assigned >= asn.periodsPerWeek) break;
          for (const p of PERIODS) {
            const isClassBusy = Object.values(timetable[day][p]).some(e => e.classId === asn.classId);
            const isTeacherBusy = !!timetable[day][p][teacher.id];
            if (!isClassBusy && !isTeacherBusy) {
              timetable[day][p][teacher.id] = {
                classId: asn.classId,
                subject: asn.subject,
                teacherId: teacher.id
              };
              assigned++;
              break; 
            }
          }
        }
      }
    });
  });

  return timetable;
};
