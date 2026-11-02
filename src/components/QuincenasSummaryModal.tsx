import React, { useState } from 'react';
import { X, FileText, FileSpreadsheet, Check, ArrowDownToLine } from 'lucide-react';
import { MonthSummary } from '../types';
import { downloadQuincenasPDF, downloadQuincenasCSV } from '../utils/exportReport';
import { playSuccessSound, playTapSound } from '../utils/feedback';

interface QuincenasSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthName: string;
  monthKey: string;
  summary: MonthSummary;
  ratePerVisit: number;
}

export const QuincenasSummaryModal: React.FC<QuincenasSummaryModalProps> = ({
  isOpen,
  onClose,
  monthName,
  monthKey,
  summary,
  ratePerVisit,
}) => {
  const [downloadedType, setDownloadedType] = useState<'pdf' | 'csv' | null>(null);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    playSuccessSound();
    downloadQuincenasPDF(monthName, monthKey, summary, ratePerVisit);
    setDownloadedType('pdf');
    setTimeout(() => setDownloadedType(null), 2500);
  };

  const handleDownloadCSV = () => {
    playSuccessSound();
    downloadQuincenasCSV(monthName, monthKey, summary, ratePerVisit);
    setDownloadedType('csv');
    setTimeout(() => setDownloadedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border-2 border-[#0056b3] text-left relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-[#002d62]">
              Resumen de Facturación
            </h3>
            <p className="text-xs text-slate-500 font-bold capitalize">
              {monthName} • <span className="text-[#0056b3]">x${ratePerVisit} por visita</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quincenas Breakdown (Sin detalles diarios) */}
        <div className="space-y-2.5 my-4">
          {/* 1° Quincena (1 al 15) */}
          <div className="bg-[#FFFDE7] border-2 border-yellow-300/90 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase text-[#002d62]">
                1° Quincena (1 al 15)
              </span>
              <span className="text-lg font-black text-[#0056b3] font-mono">
                ${summary.q1Subtotal.toLocaleString('es-ES')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Visitas efectivas:</span>
              <span className="font-bold text-[#002d62] font-mono">{summary.q1Visits} visitas</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
              <span>Días hábiles laborados:</span>
              <span className="font-bold text-slate-600">{summary.q1DaysCompleted} de {summary.q1TotalDays}</span>
            </div>
          </div>

          {/* 2° Quincena (16 al fin de mes) */}
          <div className="bg-[#EBF3FC] border-2 border-[#0056b3]/30 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase text-[#002d62]">
                2° Quincena (16 al fin de mes)
              </span>
              <span className="text-lg font-black text-[#0056b3] font-mono">
                ${summary.q2Subtotal.toLocaleString('es-ES')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Visitas efectivas:</span>
              <span className="font-bold text-[#002d62] font-mono">{summary.q2Visits} visitas</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
              <span>Días hábiles laborados:</span>
              <span className="font-bold text-slate-600">{summary.q2DaysCompleted} de {summary.q2TotalDays}</span>
            </div>
          </div>

          {/* Total Mensual */}
          <div className="bg-[#0056b3] text-white rounded-2xl p-3.5 shadow-sm border-b-4 border-[#003d80]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#FFE600]">
                Total Mensual
              </span>
              <span className="text-2xl font-black text-[#FFE600] font-mono">
                ${summary.totalSubtotal.toLocaleString('es-ES')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-blue-100 font-medium">
              <span>Total visitas del mes:</span>
              <span className="font-black text-white font-mono">{summary.totalVisits}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-blue-200 mt-0.5">
              <span>Días totales registrados:</span>
              <span className="font-bold text-white">{summary.totalDaysRecorded} de {summary.totalWorkingDays}</span>
            </div>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          {/* Bajar en PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="w-full py-3 px-4 rounded-xl bg-[#FFE600] hover:bg-[#F0D800] text-[#002d62] font-black text-xs flex items-center justify-center gap-2 shadow-xs border-b-2 border-yellow-500 active:border-b-0 active:translate-y-0.5 transition"
          >
            {downloadedType === 'pdf' ? (
              <>
                <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                <span>¡PDF Descargado!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-[#0056b3]" />
                <span>Bajar en PDF</span>
              </>
            )}
          </button>

          {/* Bajar en Hoja de cálculo (.CSV) */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#002d62] font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-200 active:scale-98 transition"
          >
            {downloadedType === 'csv' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>¡Hoja de Cálculo Descargada!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Bajar Hoja de cálculo (.CSV / Excel)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
