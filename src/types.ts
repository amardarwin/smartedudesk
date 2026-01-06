
// Fix: Added 'Free Period' to Subject union type to resolve assignment errors in AdjustmentPanel
export type Subject = 'Math' | 'Science' | 'English' | 'SST' | 'Punjabi' | 'Hindi' | 'Computer' | 'Phy Edu' | 'Agri' | 'W.L.' | 'Art' | 'Physics' | 'Free Period';

export enum Day {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT'
}

export interface TeacherAssignment {
  classId: string;
  subject: Subject;
  periodsPerWeek: number;
}

export interface Teacher {
  id: string;
  name: string;
  designation: string;
  subjects: Subject[];
  assignments: TeacherAssignment[];
  weeklyLimit: number;
  classInchargeOf?: string;
}

export interface TimetableEntry {
  classId: string;
  subject: Subject;
  teacherId: string;
}

export type MasterTimetable = Record<Day, Record<number, Record<string, TimetableEntry>>>;

export interface Substitution {
  id: string;
  date: string;
  day: Day;
  absentTeacherId: string;
  period: number;
  classId: string;
  originalSubject: Subject;
  substituteTeacherId: string;
  reason: string;
  isOverride?: boolean;
}

export interface PeriodConfig {
  number: number;
  start: string;
  end: string;
  isRecess?: boolean;
}

export interface ClassSubjectRequirement {
  subject: Subject;
  periodsPerWeek: number;
}

export interface ClassRequirement {
  classId: string;
  requirements: ClassSubjectRequirement[];
}

export interface SchoolSettings {
  name: string;
  address: string;
  session: string;
}

export interface ValidationIssue {
  id: string;
  type: 'ERROR' | 'WARNING';
  message: string;
  location?: {
    day: Day;
    period: number;
    classId?: string;
    teacherId?: string;
  };
}