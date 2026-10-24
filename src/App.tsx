/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DailyEntryCard } from './components/DailyEntryCard';
import { SummaryPanel } from './components/SummaryPanel';
import { WorkingDaysCalendar } from './components/WorkingDaysCalendar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { UpdatePromptModal } from './components/UpdatePromptModal';
import { AppDatabase, WorkingDayInfo } from './types';
import {
  computeMonthSummary,
  loadDatabase,
  saveDatabase,
} from './utils/storage';
import {
  formatMonthYearSpanish,
  getWorkingDaysForMonth,
  toDateKey,
  toMonthKey,
} from './utils/calendar';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [currentDate] = useState<Date>(() => new Date());
  const todayKey = useMemo(() => toDateKey(currentDate), [currentDate]);
  const defaultMonthKey = useMemo(() => toMonthKey(currentDate), [currentDate]);

  const [activeMonthKey, setActiveMonthKey] = useState<string>(() => {
    return db.months[defaultMonthKey] ? defaultMonthKey : Object.keys(db.months).sort().slice(-1)[0] || defaultMonthKey;
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayKey);

  // Available stored months (sorted chronologically)
  const availableMonthKeys = useMemo(() => {
    return Object.keys(db.months).sort();
  }, [db.months]);

  // Current active month data
  const activeMonthData = useMemo(() => {
    if (db.months[activeMonthKey]) {
      return db.months[activeMonthKey];
    }
    const now = new Date();
    const [y, m] = activeMonthKey.split('-').map(Number);
    return {
      monthKey: activeMonthKey,
      monthName: formatMonthYearSpanish(y || now.getFullYear(), (m ? m - 1 : now.getMonth())),
      year: y || now.getFullYear(),
      monthIndex: (m ? m - 1 : now.getMonth()),
      records: {},
      updatedAt: new Date().toISOString(),
    };
  }, [db.months, activeMonthKey]);

  // Calculate the 20 working days for the active month
  const workingDays = useMemo(() => {
    return getWorkingDaysForMonth(
      activeMonthData.year,
      activeMonthData.monthIndex,
      activeMonthData.records
    );
  }, [activeMonthData.year, activeMonthData.monthIndex, activeMonthData.records]);

  // Ensure a valid working day is selected
  useEffect(() => {
    if (workingDays.length === 0) return;

    const found = workingDays.find((d) => d.dateStr === selectedDateStr);
    if (!found) {
      const todayInMonth = workingDays.find((d) => d.dateStr === todayKey);
      if (todayInMonth) {
        setSelectedDateStr(todayKey);
      } else {
        const pastDays = workingDays.filter((d) => d.isPast);
        if (pastDays.length > 0) {
          setSelectedDateStr(pastDays[pastDays.length - 1].dateStr);
        } else {
          setSelectedDateStr(workingDays[0].dateStr);
        }
      }
    }
  }, [activeMonthKey, workingDays, selectedDateStr, todayKey]);

  const selectedDayInfo = useMemo<WorkingDayInfo | null>(() => {
    if (workingDays.length === 0) return null;
    return workingDays.find((d) => d.dateStr === selectedDateStr) || workingDays[0];
  }, [workingDays, selectedDateStr]);

  // Calculate live summary
  const summary = useMemo(() => {
    return computeMonthSummary(workingDays, todayKey, db.ratePerVisit);
  }, [workingDays, todayKey, db.ratePerVisit]);

  // Save visits for a given day
  const handleSaveDayVisits = (dateStr: string, visits: number, notes?: string) => {
    setDb((prevDb) => {
      const nextMonths = { ...prevDb.months };
      const currentMonth = nextMonths[activeMonthKey] || {
        monthKey: activeMonthKey,
        monthName: activeMonthData.monthName,
        year: activeMonthData.year,
        monthIndex: activeMonthData.monthIndex,
        records: {},
        updatedAt: new Date().toISOString(),
      };

      const updatedRecords = {
        ...currentMonth.records,
        [dateStr]: {
          visits,
          subtotal: visits * prevDb.ratePerVisit,
          notes: notes !== undefined ? notes : currentMonth.records[dateStr]?.notes,
          updatedAt: new Date().toISOString(),
        },
      };

      nextMonths[activeMonthKey] = {
        ...currentMonth,
        records: updatedRecords,
        updatedAt: new Date().toISOString(),
      };

      const updatedDb: AppDatabase = {
        ...prevDb,
        months: nextMonths,
        lastActiveMonthKey: activeMonthKey,
      };

      // Save and enforce 2-month cyclic retention silently in the background
      saveDatabase(updatedDb);
      return updatedDb;
    });
  };

  const currentIndex = workingDays.findIndex((d) => d.dateStr === selectedDateStr);
  const hasPrevDay = currentIndex > 0;
  const hasNextDay = currentIndex >= 0 && currentIndex < workingDays.length - 1;

  const handleSelectPrevDay = () => {
    if (hasPrevDay) {
      setSelectedDateStr(workingDays[currentIndex - 1].dateStr);
    }
  };

  const handleSelectNextDay = () => {
    if (hasNextDay) {
      setSelectedDateStr(workingDays[currentIndex + 1].dateStr);
    }
  };

  const handleJumpToToday = () => {
    const todayInMonth = workingDays.find((d) => d.dateStr === todayKey);
    if (todayInMonth) {
      setSelectedDateStr(todayKey);
    } else {
      if (db.months[defaultMonthKey]) {
        setActiveMonthKey(defaultMonthKey);
        setSelectedDateStr(todayKey);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-[#0F172A] flex flex-col font-sans pb-10">
      {/* 1. Muestra la fecha del día actual automáticamente en la parte superior (Sin franja de títulos ni iconos innecesarios) */}
      <Header
        currentDate={currentDate}
        activeMonthKey={activeMonthKey}
        availableMonthKeys={availableMonthKeys}
        monthsData={db.months}
        onSelectMonth={(key) => setActiveMonthKey(key)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-3.5 py-3.5 space-y-3.5">
        {/* 2 & 3. Campo de entrada numérico bien grande y Botón destacado Guardar/Calcular (Sin franja de +1 +2) */}
        <DailyEntryCard
          selectedDay={selectedDayInfo}
          ratePerVisit={db.ratePerVisit}
          onSaveDayVisits={handleSaveDayVisits}
          onSelectPrevDay={handleSelectPrevDay}
          onSelectNextDay={handleSelectNextDay}
          onJumpToToday={handleJumpToToday}
          hasPrevDay={hasPrevDay}
          hasNextDay={hasNextDay}
          todayDateKey={todayKey}
        />

        {/* 4. Panel de Resultados (Actualización al instante) */}
        <SummaryPanel
          summary={summary}
          selectedDay={selectedDayInfo}
          ratePerVisit={db.ratePerVisit}
        />

        {/* 5. Calendario de 20 Días Hábiles (Lunes a Viernes, Quincenas 1 y 2) */}
        <WorkingDaysCalendar
          workingDays={workingDays}
          selectedDateStr={selectedDateStr}
          todayDateKey={todayKey}
          ratePerVisit={db.ratePerVisit}
          onSelectDay={(day) => setSelectedDateStr(day.dateStr)}
        />
      </main>

      <OfflineIndicator />
      <UpdatePromptModal />
    </div>
  );
}
