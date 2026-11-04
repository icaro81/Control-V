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
import { APP_VERSION, checkForRemoteUpdate } from './utils/version';
import { RefreshCw, Check } from 'lucide-react';

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
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateToastMessage, setUpdateToastMessage] = useState<string | null>(null);
  const [forceUpdateModalOpen, setForceUpdateModalOpen] = useState<boolean>(false);
  const [forcedRemoteInfo, setForcedRemoteInfo] = useState<any>(null);

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

  // Calculate working days for the active month
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

  // Toggle or select rate per visit (50 or 62)
  const handleChangeRate = (newRate: number) => {
    playTapSound();
    triggerVibration(20);
    setDb((prevDb) => {
      const updatedDb: AppDatabase = {
        ...prevDb,
        ratePerVisit: newRate,
      };
      saveDatabase(updatedDb);
      return updatedDb;
    });
  };

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
      {/* 1. Muestra la fecha del día actual automáticamente en la parte superior */}
      <Header
        currentDate={currentDate}
        activeMonthKey={activeMonthKey}
        availableMonthKeys={availableMonthKeys}
        monthsData={db.months}
        onSelectMonth={(key) => setActiveMonthKey(key)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-3.5 py-3.5 space-y-3.5">
        {/* 2 & 3. Campo de entrada numérico bien grande con selección de tarifa x50 / x62 */}
        <DailyEntryCard
          selectedDay={selectedDayInfo}
          ratePerVisit={db.ratePerVisit}
          onSaveDayVisits={handleSaveDayVisits}
          onSelectPrevDay={handleSelectPrevDay}
          onSelectNextDay={handleSelectNextDay}
          onJumpToToday={handleJumpToToday}
          onChangeRate={handleChangeRate}
          hasPrevDay={hasPrevDay}
          hasNextDay={hasNextDay}
          todayDateKey={todayKey}
        />

        {/* 4. Panel de Resultados con totales discriminados por quincena (1-15 y 16-fin) y total */}
        <SummaryPanel
          summary={summary}
          selectedDay={selectedDayInfo}
          ratePerVisit={db.ratePerVisit}
          onChangeRate={handleChangeRate}
        />

        {/* 5. Calendario de Días Hábiles (Lunes a Viernes, Quincena 1 y Quincena 2) */}
        <WorkingDaysCalendar
          workingDays={workingDays}
          selectedDateStr={selectedDateStr}
          todayDateKey={todayKey}
          ratePerVisit={db.ratePerVisit}
          onSelectDay={(day) => setSelectedDateStr(day.dateStr)}
        />

        {/* Pie de la app: lado izquierdo 'resumen', centro versión check, lado derecho 'reset' */}
        <footer className="flex items-center justify-between px-2 pt-4 pb-2 border-t border-slate-200/60 mt-2 relative">
          {/* Lado izquierdo: hipervínculo resumen */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setShowResumenModal(true);
            }}
            className="text-xs text-[#0056b3] hover:text-[#003d80] underline cursor-pointer font-bold tracking-wide py-1 px-2 transition-colors active:scale-95"
          >
            resumen
          </button>

          {/* Centro: hipervínculo con la versión de la apk que sirve como check por si hay actualizaciones */}
          <button
            type="button"
            onClick={async () => {
              if (isCheckingUpdate) return;
              playTapSound();
              triggerVibration(20);
              setIsCheckingUpdate(true);
              setUpdateToastMessage(null);

              try {
                const { hasUpdate, remoteInfo } = await checkForRemoteUpdate();
                setIsCheckingUpdate(false);
                if (hasUpdate && remoteInfo) {
                  setForcedRemoteInfo(remoteInfo);
                  setForceUpdateModalOpen(true);
                } else {
                  setUpdateToastMessage(`Estás en la última versión (v${APP_VERSION})`);
                  setTimeout(() => setUpdateToastMessage(null), 3000);
                }
              } catch {
                setIsCheckingUpdate(false);
                setUpdateToastMessage(`v${APP_VERSION}`);
                setTimeout(() => setUpdateToastMessage(null), 2500);
              }
            }}
            disabled={isCheckingUpdate}
            className="text-[11px] text-slate-500 hover:text-[#0056b3] font-bold tracking-wider py-1 px-2.5 rounded-xl hover:bg-slate-200/60 active:scale-95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Tocar para buscar actualizaciones"
          >
            {isCheckingUpdate ? (
              <RefreshCw className="w-3 h-3 animate-spin text-[#0056b3]" />
            ) : null}
            <span>v{APP_VERSION}</span>
          </button>

          {/* Lado derecho: hipervínculo reset */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setShowResetModal(true);
            }}
            className="text-xs text-slate-400 hover:text-rose-600 underline cursor-pointer transition font-medium tracking-wide py-1 px-2 active:scale-95"
          >
            reset
          </button>
        </footer>
      </main>

      {/* Toast informativo al chequear versión manualmente (flotante, no bloquea clics) */}
      {updateToastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 bg-[#002d62] text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl border border-blue-400/30 flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-[#FFE600] stroke-[3]" />
          <span>{updateToastMessage}</span>
        </div>
      )}

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

      {/* Modal de Resumen por Quincenas (1-15 y 16-fin) y Total con descargas PDF, CSV y copiar al portapapeles */}
      <ResumenModal
        isOpen={showResumenModal}
        onClose={() => setShowResumenModal(false)}
        monthName={activeMonthData.monthName}
        monthKey={activeMonthKey}
        summary={summary}
        ratePerVisit={db.ratePerVisit}
      />

      <OfflineIndicator />
      <UpdatePromptModal
        forceOpen={forceUpdateModalOpen}
        forcedRemoteInfo={forcedRemoteInfo}
        onCloseForced={() => setForceUpdateModalOpen(false)}
      />
    </div>
  );
}
