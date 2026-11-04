import React from 'react';
import { Calendar } from 'lucide-react';
import { formatFullDateSpanish } from '../utils/calendar';

interface HeaderProps {
  currentDate: Date;
  activeMonthKey: string;
  availableMonthKeys: string[];
  monthsData: Record<string, { monthName: string }>;
  onSelectMonth: (monthKey: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  activeMonthKey,
  availableMonthKeys,
  monthsData,
  onSelectMonth,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FFE600] shadow-sm border-b-2 border-yellow-400 px-3.5 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-2.5">
      <div className="max-w-md mx-auto">
        {/* 1. Muestra la fecha del día actual automáticamente en la parte superior */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#002d62] min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#0056b3] text-[#FFE600] flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#002d62]/75 block leading-tight">
                Fecha de hoy
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#002d62] capitalize block leading-tight truncate">
                {formatFullDateSpanish(currentDate)}
              </span>
            </div>
          </div>

          {/* Month Selector for the 2 active months */}
          {availableMonthKeys.length > 0 && (
            <div className="flex items-center gap-1 bg-[#0056b3]/10 p-0.5 rounded-xl border border-[#0056b3]/20 shrink-0">
              {availableMonthKeys.map((key) => {
                const isSelected = key === activeMonthKey;
                const name = monthsData[key]?.monthName || key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectMonth(key)}
                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0056b3] text-[#FFE600] shadow-xs'
                        : 'text-[#002d62] hover:bg-[#0056b3]/15'
                    }`}
                  >
                    {name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
