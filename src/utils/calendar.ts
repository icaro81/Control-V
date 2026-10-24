import { WorkingDayInfo, DayRecord } from '../types';

export const SPANISH_DAYS_FULL = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export const SPANISH_DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatFullDateSpanish(date: Date): string {
  const dayName = SPANISH_DAYS_FULL[date.getDay()];
  const day = date.getDate();
  const monthName = SPANISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} de ${monthName} de ${year}`;
}

export function formatMonthYearSpanish(year: number, monthIndex: number): string {
  return `${SPANISH_MONTHS[monthIndex]} ${year}`;
}

/**
 * Calculates working days (Lunes a Viernes) for the given month.
 * Organizes them into:
 * - 1° Quincena: Días 1 al 10 hábiles (Semanas 1 y 2)
 * - 2° Quincena: Días 11 al 20 hábiles (Semanas 3 y 4)
 * - Any remaining working days beyond 20 are included in Quincena 2 / Extra.
 */
export function getWorkingDaysForMonth(
  year: number,
  monthIndex: number,
  records: Record<string, DayRecord> = {}
): WorkingDayInfo[] {
  const workingDays: WorkingDayInfo[] = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  let workingCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday

    // Working days are Monday (1) through Friday (5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingCount++;
      const dateStr = toDateKey(date);
      const isToday = dateStr === todayKey;

      // Compare dates without time
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const currentDate = new Date(year, monthIndex, day, 0, 0, 0, 0);

      const isPast = currentDate < todayDate;
      const isFuture = currentDate > todayDate;

      // 1° Quincena: Días 1 al 10 hábiles (Semanas 1 y 2)
      // 2° Quincena: Días 11 al 20+ hábiles (Semanas 3 y 4)
      const quincena: 1 | 2 = workingCount <= 10 ? 1 : 2;
      const weekNumber = Math.ceil(workingCount / 5);

      const dayName = SPANISH_DAYS_FULL[dayOfWeek];
      const shortMonth = SPANISH_MONTHS[monthIndex].slice(0, 3);
      const formattedDate = `${SPANISH_DAYS_SHORT[dayOfWeek]} ${day} ${shortMonth}`;

      workingDays.push({
        dateStr,
        workingDayNumber: workingCount,
        quincena,
        weekNumber,
        dayName,
        dayOfMonth: day,
        formattedDate,
        isToday,
        isPast,
        isFuture,
        record: records[dateStr],
      });
    }
  }

  return workingDays;
}

/**
 * Returns previous month details given year and monthIndex.
 */
export function getPreviousMonth(year: number, monthIndex: number): { year: number; monthIndex: number; monthKey: string } {
  if (monthIndex === 0) {
    return {
      year: year - 1,
      monthIndex: 11,
      monthKey: `${year - 1}-12`,
    };
  }
  const prevMonth = monthIndex - 1;
  const monthKey = `${year}-${String(prevMonth + 1).padStart(2, '0')}`;
  return {
    year,
    monthIndex: prevMonth,
    monthKey,
  };
}

/**
 * Returns next month details given year and monthIndex.
 */
export function getNextMonth(year: number, monthIndex: number): { year: number; monthIndex: number; monthKey: string } {
  if (monthIndex === 11) {
    return {
      year: year + 1,
      monthIndex: 0,
      monthKey: `${year + 1}-01`,
    };
  }
  const nextM = monthIndex + 1;
  const monthKey = `${year}-${String(nextM + 1).padStart(2, '0')}`;
  return {
    year,
    monthIndex: nextM,
    monthKey,
  };
}
