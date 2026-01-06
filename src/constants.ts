
import { Teacher, Subject, Day, ClassRequirement, PeriodConfig } from './types';

export const DAYS = [Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI, Day.SAT];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const PERIOD_TIMINGS: PeriodConfig[] = [
  { number: 1, start: '08:00', end: '08:45' },
  { number: 2, start: '08:45', end: '09:30' },
  { number: 3, start: '09:30', end: '10:15' },
  { number: 4, start: '10:15', end: '11:00' },
  { number: 5, start: '11:00', end: '11:45' },
  { number: 6, start: '12:15', end: '13:00' }, // Recess 11:45 - 12:15
  { number: 7, start: '13:00', end: '13:45' },
  { number: 8, start: '13:45', end: '14:30' },
];

// Removed sample teachers to provide a clean initial state
export const INITIAL_TEACHERS: Teacher[] = [];

// Clean class requirements - keeping IDs so the system knows the standard classes
export const INITIAL_CLASS_REQUIREMENTS: ClassRequirement[] = [
  {
    classId: '6th',
    requirements: []
  },
  {
    classId: '7th',
    requirements: []
  },
  {
    classId: '8th',
    requirements: []
  },
  {
    classId: '9th',
    requirements: []
  },
  {
    classId: '10th',
    requirements: []
  }
];
