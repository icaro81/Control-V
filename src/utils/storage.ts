import { AppDatabase, MonthData, MonthSummary, WorkingDayInfo } from '../types';
import {
  formatMonthYearSpanish,
  getWorkingDaysForMonth,
  toDateKey,
  toMonthKey,
} from './calendar';

export const STORAGE_KEY = 'CONTROL_DIARIO_APP_STORAGE_V2';
export const DEFAULT_RATE = 50; // $50 por visita efectiva

/**
 * Enforces the strict 2-month cyclic retention rule:
 * "La base de datos debe acumular 2 meses al tercer mes reemplaza la primera
 * para no incrementar volumen de APK y así cíclicamente"
 */
export function enforceTwoMonthRetention(db: AppDatabase): { db: AppDatabase; purgedMonths: string[] } {
  const monthKeys = Object.keys(db.months).sort();
  const purgedMonths: string[] = [];

  if (monthKeys.length > 2) {
    const keepKeys = monthKeys.slice(-2);
    const prunedMonths: Record<string, MonthData> = {};

    for (const key of monthKeys) {
      if (keepKeys.includes(key)) {
        prunedMonths[key] = db.months[key];
      } else {
        purgedMonths.push(key);
      }
    }

    db.months = prunedMonths;
  }

  return { db, purgedMonths };
}

/**
 * Loads the database from localStorage or initializes default state with 0 records (clean start).
 */
export function loadDatabase(): AppDatabase {
  const now = new Date();
  const currentMonthKey = toMonthKey(now);
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  const defaultDb: AppDatabase = {
    version: 2,
    ratePerVisit: DEFAULT_RATE,
    dailyGoal: 15,
    lastActiveMonthKey: currentMonthKey,
    months: {
      [currentMonthKey]: {
        monthKey: currentMonthKey,
        monthName: formatMonthYearSpanish(currentYear, currentMonthIndex),
        year: currentYear,
        monthIndex: currentMonthIndex,
        records: {}, // Starts completely clean, 0 visits, no demo data
        updatedAt: new Date().toISOString(),
      },
    },
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveDatabase(defaultDb);
      return defaultDb;
    }

    const parsed: AppDatabase = JSON.parse(raw);

    if (!parsed.months || typeof parsed.months !== 'object') {
      saveDatabase(defaultDb);
      return defaultDb;
    }

    if (!parsed.months[currentMonthKey]) {
      parsed.months[currentMonthKey] = {
        monthKey: currentMonthKey,
        monthName: formatMonthYearSpanish(currentYear, currentMonthIndex),
        year: currentYear,
        monthIndex: currentMonthIndex,
        records: {},
        updatedAt: new Date().toISOString(),
      };
    }

    const { db: cleanedDb } = enforceTwoMonthRetention(parsed);
    return cleanedDb;
  } catch (err) {
    console.error('Error loading database:', err);
    return defaultDb;
  }
}

/**
 * Saves database to localStorage after applying 2-month retention.
 */
export function saveDatabase(db: AppDatabase): { purged: string[] } {
  try {
    const { db: cleanedDb, purgedMonths } = enforceTwoMonthRetention(db);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedDb));
    return { purged: purgedMonths };
  } catch (err) {
    console.error('Error saving to localStorage:', err);
    return { purged: [] };
  }
}

/**
 * Computes live metrics for a given month and selected/current day:
 * 1. Resultado del día actual: Visitas × $50
 * 2. Resumen acumulado 1° Quincena ($) (Días 1 al 10)
 * 3. Resumen acumulado 2° Quincena ($) (Días 11 al 20)
 * 4. Total Mensual acumulado ($)
 */
export function computeMonthSummary(
  workingDays: WorkingDayInfo[],
  todayKey: string,
  ratePerVisit: number = DEFAULT_RATE
): MonthSummary {
  let todayVisits = 0;
  let todaySubtotal = 0;

  let q1Visits = 0;
  let q1Subtotal = 0;
  let q1DaysCompleted = 0;

  let q2Visits = 0;
  let q2Subtotal = 0;
  let q2DaysCompleted = 0;

  let totalVisits = 0;
  let totalSubtotal = 0;
  let totalDaysRecorded = 0;

  for (const day of workingDays) {
    const visits = day.record?.visits || 0;
    const subtotal = visits * ratePerVisit;

    if (day.record && day.record.visits > 0) {
      totalDaysRecorded++;
    }

    if (day.dateStr === todayKey) {
      todayVisits = visits;
      todaySubtotal = subtotal;
    }

    if (day.quincena === 1) {
      q1Visits += visits;
      q1Subtotal += subtotal;
      if (day.record && day.record.visits > 0) {
        q1DaysCompleted++;
      }
    } else {
      q2Visits += visits;
      q2Subtotal += subtotal;
      if (day.record && day.record.visits > 0) {
        q2DaysCompleted++;
      }
    }

    totalVisits += visits;
    totalSubtotal += subtotal;
  }

  return {
    todayVisits,
    todaySubtotal,
    q1Visits,
    q1Subtotal,
    q1DaysCompleted,
    q2Visits,
    q2Subtotal,
    q2DaysCompleted,
    totalVisits,
    totalSubtotal,
    totalDaysRecorded,
    totalWorkingDays: workingDays.length,
  };
}

/**
 * Exports data to CSV string for download / Excel
 */
export function exportToCSV(monthData: MonthData, workingDays: WorkingDayInfo[], rate: number): string {
  const headers = [
    'Día Hábil',
    'Fecha',
    'Día Semana',
    'Quincena',
    'Visitas Efectivas',
    `Valor x Visita ($)`,
    'Subtotal ($)',
    'Notas',
    'Última Modificación',
  ];

  const rows = workingDays.map((wd) => {
    const visits = wd.record?.visits ?? 0;
    const subtotal = visits * rate;
    const notes = wd.record?.notes ? `"${wd.record.notes.replace(/"/g, '""')}"` : '""';
    const updated = wd.record?.updatedAt ? new Date(wd.record.updatedAt).toLocaleString('es-ES') : '-';

    return [
      `Día #${wd.workingDayNumber}`,
      wd.dateStr,
      wd.dayName,
      `${wd.quincena}° Quincena`,
      visits,
      rate,
      subtotal,
      notes,
      `"${updated}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
