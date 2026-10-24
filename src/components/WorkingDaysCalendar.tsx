import React, { useState } from 'react';
import { Calendar, Check, Clock, ChevronRight } from 'lucide-react';
import { WorkingDayInfo } from '../types';
import { playTapSound, triggerVibration } from '../utils/feedback';

interface WorkingDaysCalendarProps {
  workingDays: WorkingDayInfo[];
  selectedDateStr: string;
  todayDateKey: string;
  ratePerVisit: number;
  onSelectDay: (day: WorkingDayInfo) => void;
}

export const WorkingDaysCalendar: React.FC<WorkingDaysCalendarProps> = ({
  workingDays,
  selectedDateStr,
  todayDateKey,
  ratePerVisit,
  onSelectDay,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'q1' | 'q2'>('all');

  const q1Days = workingDays.filter((d) => d.quincena === 1);
  const q2Days = workingDays.filter((d) => d.quincena === 2);

  const displayedDays =
    activeTab === 'q1' ? q1Days : activeTab === 'q2' ? q2Days : workingDays;

  const handleDayClick = (day: WorkingDayInfo) => {
    playTapSound();
    triggerVibration(15);
    onSelectDay(day);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div>
          <h3 className="text-sm font-black text-[#002d62] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0056b3]" />
            Días Hábiles del Mes
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Lunes a Viernes • Toca para seleccionar y editar
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-[#002d62] shadow-xs'
                : 'text-slate-500 hover:text-[#002d62]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab('q1')}
            className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
              activeTab === 'q1'
                ? 'bg-[#FFE600] text-[#002d62] shadow-xs'
                : 'text-slate-500 hover:text-[#002d62]'
            }`}
          >
            1° Quincena (1-10)
          </button>
          <button
            onClick={() => setActiveTab('q2')}
            className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
              activeTab === 'q2'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-500 hover:text-[#002d62]'
            }`}
          >
            2° Quincena (11-20)
          </button>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
        {displayedDays.map((day) => {
          const isSelected = day.dateStr === selectedDateStr;
          const isToday = day.dateStr === todayDateKey;
          const visits = day.record?.visits ?? 0;
          const hasRecord = day.record && day.record.visits > 0;
          const subtotal = visits * ratePerVisit;

          return (
            <div
              key={day.dateStr}
              onClick={() => handleDayClick(day)}
              className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer border transition-all active:scale-[0.99] ${
                isSelected
                  ? 'bg-yellow-50/90 border-[#0056b3] shadow-xs ring-2 ring-[#0056b3]/20'
                  : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'
              }`}
            >
              {/* Left Day Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                    isToday
                      ? 'bg-[#FFE600] text-[#002d62] ring-2 ring-yellow-400 font-black'
                      : isSelected
                      ? 'bg-[#0056b3] text-white font-black'
                      : hasRecord
                      ? 'bg-[#EBF3FC] text-[#0056b3] border border-[#0056b3]/20'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span className="text-[8px] uppercase leading-none font-bold">Día</span>
                  <span className="text-sm font-black leading-none">{day.workingDayNumber}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#002d62] truncate">
                      {day.formattedDate}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-black bg-[#FFE600] text-[#002d62] px-1.5 py-0.2 rounded-full border border-yellow-400">
                        Hoy
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    {day.quincena === 1 ? '1° Quincena' : '2° Quincena'} • Sem {day.weekNumber}
                  </span>
                </div>
              </div>

              {/* Right Metrics */}
              <div className="flex items-center gap-2.5 text-right shrink-0">
                <div>
                  <div className="text-sm font-black text-[#002d62] font-mono">
                    ${subtotal.toLocaleString('es-ES')}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 block">
                    {visits} {visits === 1 ? 'visita' : 'visitas'}
                  </span>
                </div>

                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    hasRecord
                      ? 'bg-[#EBF3FC] text-[#0056b3]'
                      : 'bg-slate-200/70 text-slate-400'
                  }`}
                >
                  {hasRecord ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Clock className="w-3.5 h-3.5" />}
                </div>

                <ChevronRight
                  className={`w-4 h-4 ${isSelected ? 'text-[#0056b3]' : 'text-slate-400'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
