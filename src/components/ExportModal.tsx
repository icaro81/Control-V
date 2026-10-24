import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Copy, CheckCircle2, Share2, FileText } from 'lucide-react';
import { MonthData, MonthSummary, WorkingDayInfo } from '../types';
import { exportToCSV } from '../utils/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMonthData: MonthData;
  workingDays: WorkingDayInfo[];
  summary: MonthSummary;
  ratePerVisit: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeMonthData,
  workingDays,
  summary,
  ratePerVisit,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    const csvContent = exportToCSV(activeMonthData, workingDays, ratePerVisit);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Control_Visitas_${activeMonthData.monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getWhatsAppSummaryText = () => {
    return `📊 *REPORTE DE VISITAS EFECTIVAS*
📅 Mes: ${activeMonthData.monthName}
💵 Valor x Visita: $${ratePerVisit}

1️⃣ *1° Quincena (Días 1-10):*
• Visitas: ${summary.q1Visits}
• Subtotal: $${summary.q1Subtotal.toLocaleString('es-ES')}

2️⃣ *2° Quincena (Días 11-20):*
• Visitas: ${summary.q2Visits}
• Subtotal: $${summary.q2Subtotal.toLocaleString('es-ES')}

💰 *TOTAL MENSUAL ACUMULADO:*
• Total Visitas: ${summary.totalVisits}
• Total a Cobrar: $${summary.totalSubtotal.toLocaleString('es-ES')}
• Días Registrados: ${summary.totalDaysRecorded} de ${summary.totalWorkingDays}`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(getWhatsAppSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Exportar y Compartir Datos
              </h2>
              <p className="text-xs text-slate-400">{activeMonthData.monthName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs">
          {/* CSV Excel Option */}
          <button
            onClick={handleDownloadCSV}
            className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between text-left group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">
                  Descargar para Excel (.CSV)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Incluye los 20 días hábiles, quincenas y subtotales
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
          </button>

          {/* Copy WhatsApp/Email Summary */}
          <button
            onClick={handleCopyReport}
            className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-left group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">
                  Copiar Resumen para WhatsApp
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Formato con subtotales de 1°Q, 2°Q y Total
                </span>
              </div>
            </div>
            {copied ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" /> Copiado
              </span>
            ) : (
              <Copy className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
            )}
          </button>

          {/* Preview card */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
            {getWhatsAppSummaryText()}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
