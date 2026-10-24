export interface DayRecord {
  visits: number;
  subtotal: number;
  notes?: string;
  updatedAt: string;
}

export interface WorkingDayInfo {
  dateStr: string; // 'YYYY-MM-DD'
  workingDayNumber: number; // 1 to 20 (or >20 if month has extra weekdays)
  quincena: 1 | 2; // 1: Días 1-10 (Semanas 1 y 2), 2: Días 11-20 (Semanas 3 y 4)
  weekNumber: number; // 1 to 4+
  dayName: string; // 'Lunes', 'Martes', ...
  dayOfMonth: number; // 1 to 31
  formattedDate: string; // 'Lun 24 Oct'
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  record?: DayRecord;
}

export interface MonthData {
  monthKey: string; // 'YYYY-MM', e.g. '2026-10'
  monthName: string; // 'Octubre 2026'
  year: number;
  monthIndex: number; // 0-11
  records: Record<string, DayRecord>; // keyed by 'YYYY-MM-DD'
  updatedAt: string;
}

export interface AppDatabase {
  version: number;
  months: Record<string, MonthData>; // Keyed by 'YYYY-MM'
  ratePerVisit: number; // Default 50
  dailyGoal: number; // Default 15
  lastActiveMonthKey: string;
}

export interface MonthSummary {
  todayVisits: number;
  todaySubtotal: number;
  q1Visits: number;
  q1Subtotal: number;
  q1DaysCompleted: number;
  q2Visits: number;
  q2Subtotal: number;
  q2DaysCompleted: number;
  totalVisits: number;
  totalSubtotal: number;
  totalDaysRecorded: number;
  totalWorkingDays: number;
}
