import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CalendarCheck,
} from 'lucide-react';
import { WorkingDayInfo } from '../types';
import { playSuccessSound, playTapSound, triggerVibration } from '../utils/feedback';

interface DailyEntryCardProps {
  selectedDay: WorkingDayInfo | null;
  ratePerVisit: number;
  onSaveDayVisits: (dateStr: string, visits: number, notes?: string) => void;
  onSelectPrevDay: () => void;
  onSelectNextDay: () => void;
  onJumpToToday: () => void;
  hasPrevDay: boolean;
  hasNextDay: boolean;
  todayDateKey: string;
}

export const DailyEntryCard: React.FC<DailyEntryCardProps> = ({
  selectedDay,
  ratePerVisit,
  onSaveDayVisits,
  onSelectPrevDay,
  onSelectNextDay,
  onJumpToToday,
  hasPrevDay,
  hasNextDay,
  todayDateKey,
}) => {
  const [inputValue, setInputValue] = useState<string>('0');
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when selectedDay changes
  useEffect(() => {
    if (selectedDay) {
      const currentVisits = selectedDay.record?.visits ?? 0;
      setInputValue(currentVisits.toString());
      setIsSavedFeedback(false);
    }
  }, [selectedDay?.dateStr, selectedDay?.record?.visits]);

  if (!selectedDay) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 shadow-sm">
        <p>No se encontraron días hábiles para este mes.</p>
      </div>
    );
  }

  const visitsNum = Math.max(0, parseInt(inputValue, 10) || 0);
  const dailySubtotal = visitsNum * ratePerVisit;
  const isToday = selectedDay.dateStr === todayDateKey;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setInputValue('');
      return;
    }
    const cleaned = val.replace(/\D/g, '');
    const num = Math.min(999, parseInt(cleaned, 10) || 0);
    setInputValue(num.toString());
  };

  const handleSave = () => {
    inputRef.current?.blur(); // Dismiss mobile keyboard on submit
    playSuccessSound();
    triggerVibration([25, 40, 25]);
    onSaveDayVisits(selectedDay.dateStr, visitsNum);
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
    }, 2200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm relative">
      {/* Day Selector Navigation Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onSelectPrevDay();
          }}
          disabled={!hasPrevDay}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-[#0056b3] active:scale-95 transition-all"
          title="Día hábil anterior"
          aria-label="Día anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center px-1">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                selectedDay.quincena === 1
                  ? 'bg-[#FFE600] text-[#002d62] border border-yellow-400'
                  : 'bg-[#0056b3] text-white border border-[#004494]'
              }`}
            >
              {selectedDay.quincena === 1 ? '1° Quincena' : '2° Quincena'} (Semana {selectedDay.weekNumber})
            </span>

            {isToday && (
              <span className="bg-[#FFE600] text-[#002d62] text-[11px] font-black px-2 py-0.5 rounded-full border border-yellow-400">
                Hoy
              </span>
            )}
          </div>

          <h2 className="text-base font-black text-[#002d62] mt-1">
            Día Hábil #{selectedDay.workingDayNumber} • {selectedDay.formattedDate}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            playTapSound();
            onSelectNextDay();
          }}
          disabled={!hasNextDay}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-[#0056b3] active:scale-95 transition-all"
          title="Día hábil siguiente"
          aria-label="Día siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {!isToday && (
        <div className="flex justify-center mb-3">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onJumpToToday();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0056b3] bg-[#EBF3FC] hover:bg-[#dbe9fa] border border-[#0056b3]/30 px-3 py-1 rounded-full transition-all"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-[#0056b3]" />
            Volver al día de hoy
          </button>
        </div>
      )}

      {/* Form supporting Enter key submission on mobile keypad */}
      <form onSubmit={handleSubmit}>
        {/* 2. Campo de entrada numérico bien grande que active directamente el teclado numérico */}
        <div className="text-center py-2">
          <label
            htmlFor="visits-input"
            className="block text-xs uppercase tracking-wider font-black text-slate-500 mb-1"
          >
            Cantidad de Visitas Efectivas
          </label>

          <div className="relative inline-flex items-center justify-center w-full max-w-xs mx-auto">
            <input
              ref={inputRef}
              id="visits-input"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max="999"
              step="1"
              enterKeyHint="done"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              className="w-full text-center text-6xl sm:text-7xl font-black font-mono tracking-tight bg-slate-50/80 border-3 border-[#FFE600] focus:border-[#0056b3] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0056b3]/15 text-[#002d62] rounded-2xl py-3 px-4 shadow-inner transition-all selection:bg-[#FFE600] selection:text-[#002d62]"
              placeholder="0"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Presiona <span className="font-extrabold text-[#0056b3]">Enter / Listo</span> en el teclado para guardar
          </p>
        </div>

        {/* Subtotal del día: Visitas × $50 */}
        <div className="bg-[#FFFDE7] border-2 border-yellow-300/80 rounded-2xl p-3 my-3 text-center shadow-xs">
          <div className="text-xs font-bold text-slate-600">
            Cálculo del día: <span className="font-mono text-[#002d62] font-black">{visitsNum} visitas × ${ratePerVisit}</span>
          </div>
          <div className="text-2xl font-black text-[#002d62] mt-0.5 font-mono">
            Subtotal Día: <span className="text-[#0056b3]">${dailySubtotal.toLocaleString('es-ES')}</span>
          </div>
        </div>

        {/* 3. Botón destacado "Guardar / Calcular" */}
        <button
          type="submit"
          className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-md transition-all duration-150 active:scale-[0.98] ${
            isSavedFeedback
              ? 'bg-emerald-600 text-white'
              : 'bg-[#FFE600] hover:bg-[#F0D800] text-[#002d62] border-b-4 border-yellow-500 active:border-b-0 active:translate-y-0.5'
          }`}
        >
          {isSavedFeedback ? (
            <>
              <Check className="w-6 h-6 stroke-[3]" />
              <span>¡Guardado con éxito!</span>
            </>
          ) : (
            <span>Guardar / Calcular (${dailySubtotal.toLocaleString('es-ES')})</span>
          )}
        </button>
      </form>

      {/* Small status note */}
      {selectedDay.record?.updatedAt && (
        <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">
          Último guardado: {new Date(selectedDay.record.updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
};
