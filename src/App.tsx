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
import { ResumenModal } from './components/ResumenModal';
import { AppDatabase, WorkingDayInfo } from './types';
import {
  computeMonthSummary,
  loadDatabase,
  saveDatabase,
  resetDatabase,
} from './utils/storage';
import {
  formatMonthYearSpanish,
  getWorkingDaysForMonth,
  toDateKey,
  toMonthKey,
} from './utils/calendar';
import { playTapSound, triggerVibration } from './utils/feedback';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [currentDate] = useState<Date>(() => new Date());
  const todayKey = useMemo(() => toDateKey(currentDate), [currentDate]);
  const defaultMonthKey = useMemo(() => toMonthKey(currentDate), [currentDate]);

  const [activeMonthKey, setActiveMonthKey] = useState<string>(() => {
    return db.months[defaultMonthKey] ? defaultMonthKey : Object.keys(db.months).sort().slice(-1)[0] || defaultMonthKey;
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayKey);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showResumenModal, setShowResumenModal] = useState<boolean>(false);

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

  const handleConfirmReset = () => {
    playTapSound();
    triggerVibration([30, 60, 30]);
    const freshDb = resetDatabase();
    setDb(freshDb);
    setShowResetModal(false);
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
        {/* 2 & 3. Campo de entrada numérico bien grande (Enter guarda y calcula directamente, sin botón innecesario) */}
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

        {/* Pie de la app: Resumen a la izquierda, Reset a la derecha */}
        <footer className="flex items-center justify-between pt-4 pb-2 px-1">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setShowResumenModal(true);
            }}
            className="text-xs text-slate-500 hover:text-[#0056b3] underline cursor-pointer transition font-bold tracking-wide py-1 px-2"
          >
            Resumen
          </button>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setShowResetModal(true);
            }}
            className="text-xs text-slate-400 hover:text-rose-600 underline cursor-pointer transition font-medium tracking-wide py-1 px-2"
          >
            Reset
          </button>
        </footer>
      </main>

      {/* Modal de Resumen Quincenal y Total */}
      <ResumenModal
        isOpen={showResumenModal}
        onClose={() => setShowResumenModal(false)}
        monthData={activeMonthData}
        summary={summary}
        ratePerVisit={db.ratePerVisit}
      />

      {/* Modal de confirmación para Reset */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border-2 border-slate-200 text-center">
            <h3 className="text-base font-black text-[#002d62]">¿Reiniciar todos los datos?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Se borrarán todos los registros guardados y el conteo comenzará desde cero.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="py-2.5 px-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100 active:scale-95 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md active:scale-95 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <OfflineIndicator />
      <UpdatePromptModal />
    </div>
  );
}
