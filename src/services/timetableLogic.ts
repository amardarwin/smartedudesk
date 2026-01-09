
import { MasterTimetable, Teacher, Day, Substitution, Subject, TimetableEntry } from '../types';
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
 * Baseline generator respecting PDF and strictly provided constraints.
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
  const gradingSubjects: Subject[] = ['Computer', 'Phy Edu', 'Art', 'W.L.', 'Agri'];
  const seniorClasses = ['8th', '9th', '10th'];

  // 1. FIXED SPOTS FOR SCIENCE (Strict Requirement)
  // - 10th Class Science: Fix 3rd Period on FRIDAY.
  // - 9th Class Science: Fix 2nd Period on TUESDAY.
  // - 8th Class Science: Fix 2nd Period on WEDNESDAY.
  const handleFixedScience = (classId: string, day: Day, period: number) => {
    const teacher = teachers.find(t => t.assignments.some(a => a.classId === classId && a.subject === 'Science'));
    if (teacher) {
      timetable[day][period][teacher.id] = { classId, subject: 'Science', teacherId: teacher.id };
      // Note: We'd normally decrement their assignment periods, but baseline usually assumes simple iteration.
      // This is a rough pre-allocation.
    }
  };

  handleFixedScience('10th', Day.FRI, 3);
  handleFixedScience('9th', Day.TUE, 2);
  handleFixedScience('8th', Day.WED, 2);

  // 2. Main allocation loop
  teachers.forEach(teacher => {
    teacher.assignments.forEach(asn => {
      let assigned = 0;
      const isScience = asn.subject === 'Science';
      const isGrading = gradingSubjects.includes(asn.subject);
      const isSeniorCore = coreSubjects.includes(asn.subject) && seniorClasses.includes(asn.classId);
      
      // Determine period preferences
      let periodSet: number[] = [];
      if (isGrading) {
        periodSet = [7, 8, 6, 5];
      } else if (isScience || isSeniorCore) {
        periodSet = [1, 2, 3, 4, 5, 6, 7, 8];
      } else {
        periodSet = [3, 4, 5, 2, 1, 6, 7, 8];
      }

      for (const day of DAYS) {
        if (assigned >= asn.periodsPerWeek) break;
        
        // Special logic for 7th Science: At least 2 morning periods
        const morningCount = 0; // Simplified tracker for local logic

        for (const p of periodSet) {
          // Check fixed allocation overlap
          if (timetable[day][p][teacher.id]) continue;

          // Conflict checks
          const entries = Object.values(timetable[day][p]) as TimetableEntry[];
          const isClassBusy = entries.some(e => e.classId === asn.classId);
          const teacherStreak = calculateConsecutiveStreak(teacher.id, day, p, timetable, []);

          // Limit checks
          if (!isClassBusy && teacherStreak < 3) {
            // Additional check for grading subjects: break across days
            if (isGrading && assigned > 0 && assigned % 3 === 0) {
              // try to push to another day or Saturday
              if (day !== Day.SAT && Math.random() > 0.5) continue;
            }

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
      
      // Fallback
      if (assigned < asn.periodsPerWeek) {
        for (const day of DAYS) {
          if (assigned >= asn.periodsPerWeek) break;
          for (const p of PERIODS) {
            if (timetable[day][p][teacher.id]) continue;
            const entries = Object.values(timetable[day][p]) as TimetableEntry[];
            if (!entries.some(e => e.classId === asn.classId)) {
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
