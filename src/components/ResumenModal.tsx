import React, { useState } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  Copy,
  CheckCircle2,
  TrendingUp,
  Check,
} from 'lucide-react';
import { MonthSummary } from '../types';
import {
  downloadQuincenasPDF,
  downloadQuincenasCSV,
  buildSummaryShareText,
  copyTextToClipboard,
} from '../utils/exportReport';
import { playTapSound, playSuccessSound, triggerVibration } from '../utils/feedback';

interface ResumenModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthName: string;
  monthKey: string;
  summary: MonthSummary;
  ratePerVisit: number;
}

export const ResumenModal: React.FC<ResumenModalProps> = ({
  isOpen,
  onClose,
  monthName,
  monthKey,
  summary,
  ratePerVisit,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingPDF, setDownloadingPDF] = useState<boolean>(false);
  const [downloadingCSV, setDownloadingCSV] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);
  const [csvDownloaded, setCsvDownloaded] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    try {
      playTapSound();
      setDownloadingPDF(true);
      const success = await downloadQuincenasPDF(monthName, monthKey, summary, ratePerVisit);
      if (success) {
        playSuccessSound();
        triggerVibration([25, 40]);
        setPdfDownloaded(true);
        setTimeout(() => setPdfDownloaded(false), 2500);
      }
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadSpreadsheet = async () => {
    try {
      playTapSound();
      setDownloadingCSV(true);
      const success = await downloadQuincenasCSV(monthName, monthKey, summary, ratePerVisit);
      if (success) {
        playSuccessSound();
        triggerVibration([25, 40]);
        setCsvDownloaded(true);
        setTimeout(() => setCsvDownloaded(false), 2500);
      }
    } finally {
      setDownloadingCSV(false);
    }
  };

  const handleCopy = async () => {
    playTapSound();
    const text = buildSummaryShareText(monthName, summary, ratePerVisit);
    const success = await copyTextToClipboard(text);
    if (success) {
      playSuccessSound();
      triggerVibration([30, 40]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-sm sm:max-w-md bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0056b3] text-[#FFE600] flex items-center justify-center font-black shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#002d62] leading-tight">
                Resumen de Facturación
              </h2>
              <p className="text-xs font-bold text-slate-500 capitalize leading-tight mt-0.5">
                {monthName} • <span className="text-[#0056b3]">x${ratePerVisit} por visita</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
            aria-label="Cerrar resumen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Totales discriminados por quincenas y mensual (sin detalles diarios) */}
        <div className="py-3.5 space-y-2.5">
          {/* 1° Quincena (1 al 15) */}
          <div className="p-3.5 rounded-2xl bg-[#FFFDE7] border-2 border-yellow-300/90 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-[#002d62] tracking-wider">
                  1° Quincena (Días 1 al 15)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-1">
                {summary.q1Visits} visitas efectivas ({summary.q1DaysCompleted} de {summary.q1TotalDays} días)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block leading-tight">
                Subtotal
              </span>
              <span className="text-base sm:text-lg font-black text-[#0056b3] leading-tight font-mono">
                ${summary.q1Subtotal.toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {/* 2° Quincena (16 al fin de mes) */}
          <div className="p-3.5 rounded-2xl bg-[#EBF3FC] border-2 border-[#0056b3]/30 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-[#002d62] tracking-wider">
                  2° Quincena (Días 16 al fin)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-1">
                {summary.q2Visits} visitas efectivas ({summary.q2DaysCompleted} de {summary.q2TotalDays} días)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block leading-tight">
                Subtotal
              </span>
              <span className="text-base sm:text-lg font-black text-[#0056b3] leading-tight font-mono">
                ${summary.q2Subtotal.toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {/* Gran Total Mensual */}
          <div className="p-4 rounded-2xl bg-[#0056b3] text-white shadow-md border-b-4 border-[#003d80] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#FFE600] tracking-wider block">
                Total Mensual Acumulado
              </span>
              <span className="text-xs font-medium text-blue-100 mt-0.5 block">
                {summary.totalVisits} visitas efectivas ({summary.totalDaysRecorded} de {summary.totalWorkingDays} días)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#FFE600] font-bold uppercase block">
                Total a Cobrar
              </span>
              <span className="text-2xl font-black text-[#FFE600] leading-none font-mono">
                ${summary.totalSubtotal.toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {/* Action Download Buttons */}
          <div className="pt-2 grid grid-cols-2 gap-2.5">
            {/* Bajar en PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="p-3 rounded-2xl bg-[#FFE600] hover:bg-[#F0D800] text-[#002d62] font-black text-xs shadow-md border-b-3 border-yellow-500 flex flex-col items-center justify-center gap-1.5 active:translate-y-0.5 transition cursor-pointer"
            >
              {pdfDownloaded ? (
                <>
                  <Check className="w-5 h-5 text-emerald-700 stroke-[3]" />
                  <span>¡PDF Guardado!</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 text-[#0056b3]" />
                  <span>{downloadingPDF ? 'Generando...' : 'Bajar en PDF'}</span>
                </>
              )}
            </button>

            {/* Bajar en Hoja de Cálculo (.CSV / Excel) */}
            <button
              type="button"
              onClick={handleDownloadSpreadsheet}
              disabled={downloadingCSV}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#002d62] font-black text-xs shadow-xs border border-slate-300 flex flex-col items-center justify-center gap-1.5 active:translate-y-0.5 transition cursor-pointer"
            >
              {csvDownloaded ? (
                <>
                  <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>{downloadingCSV ? 'Preparando...' : 'Hoja de Cálculo'}</span>
                </>
              )}
            </button>
          </div>

          {/* Copiar texto para compartir en WhatsApp */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-black">¡Copiado al portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar Resumen para Enviar</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="py-2 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
