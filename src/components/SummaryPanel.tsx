import React from 'react';
import { MonthSummary, WorkingDayInfo } from '../types';

interface SummaryPanelProps {
  summary: MonthSummary;
  selectedDay: WorkingDayInfo | null;
  ratePerVisit: number;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summary,
  selectedDay,
  ratePerVisit,
}) => {
  const currentVisits = selectedDay?.record?.visits ?? 0;
  const currentSubtotal = currentVisits * ratePerVisit;

  const q1Progress = Math.min(100, Math.round((summary.q1DaysCompleted / 10) * 100));
  const q2Progress = Math.min(100, Math.round((summary.q2DaysCompleted / 10) * 100));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#002d62]">
          Panel de Resultados
        </h3>
        <span className="text-[11px] bg-[#FFE600] text-[#002d62] font-black px-2.5 py-0.5 rounded-full border border-yellow-400">
          ${ratePerVisit} / visita
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* 1. Resultado del día actual: Visitas × $50 */}
        <div className="bg-white border-2 border-[#0056b3]/20 rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0056b3] block mb-0.5">
            Día Seleccionado
          </span>
          <div className="text-2xl font-black text-[#002d62] font-mono">
            ${currentSubtotal.toLocaleString('es-ES')}
          </div>
          <div className="mt-1 text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>Visitas del día:</span>
            <span className="text-[#0056b3] font-mono font-black">{currentVisits} visitas</span>
          </div>
        </div>

        {/* 2. Resumen acumulado 1° Quincena ($) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              1° Quincena ($)
            </span>
            <span className="text-[9px] font-black bg-[#FFE600] text-[#002d62] px-2 py-0.2 rounded border border-yellow-400">
              Días 1 - 10
            </span>
          </div>
          <div className="text-2xl font-black text-[#002d62] font-mono">
            ${summary.q1Subtotal.toLocaleString('es-ES')}
          </div>
          <div className="mt-1 text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>Visitas (Sem 1 y 2):</span>
            <span className="text-[#002d62] font-mono font-black">{summary.q1Visits}</span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>{summary.q1DaysCompleted} de 10 días</span>
              <span className="font-bold text-[#002d62]">{q1Progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#FFE600] h-full rounded-full transition-all duration-300"
                style={{ width: `${q1Progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Resumen acumulado 2° Quincena ($) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              2° Quincena ($)
            </span>
            <span className="text-[9px] font-black bg-[#0056b3] text-white px-2 py-0.2 rounded">
              Días 11 - 20
            </span>
          </div>
          <div className="text-2xl font-black text-[#002d62] font-mono">
            ${summary.q2Subtotal.toLocaleString('es-ES')}
          </div>
          <div className="mt-1 text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>Visitas (Sem 3 y 4):</span>
            <span className="text-[#002d62] font-mono font-black">{summary.q2Visits}</span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>{summary.q2DaysCompleted} de 10 días</span>
              <span className="font-bold text-[#0056b3]">{q2Progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0056b3] h-full rounded-full transition-all duration-300"
                style={{ width: `${q2Progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Total Mensual acumulado ($) - SoyDelivery Blue Background */}
        <div className="bg-[#0056b3] text-white rounded-2xl p-4 shadow-md sm:col-span-2 border-b-4 border-[#003d80]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#FFE600] block mb-0.5">
                Total Mensual Acumulado ($)
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#FFE600] font-mono tracking-tight">
                ${summary.totalSubtotal.toLocaleString('es-ES')}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-blue-100 block">Total Visitas</span>
              <span className="text-2xl font-black text-white font-mono">
                {summary.totalVisits}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-blue-400/40 flex items-center justify-between text-xs text-blue-100">
            <span>
              {summary.totalDaysRecorded} de {summary.totalWorkingDays} días registrados
            </span>
            <span className="font-black text-[#FFE600]">
              {summary.totalWorkingDays > 0
                ? Math.round((summary.totalDaysRecorded / summary.totalWorkingDays) * 100)
                : 0}
              % completado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
