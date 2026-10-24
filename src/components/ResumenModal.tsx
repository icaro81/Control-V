import React, { useState } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { MonthData, MonthSummary } from '../types';
import { playTapSound, playSuccessSound, triggerVibration } from '../utils/feedback';

interface ResumenModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthData: MonthData;
  summary: MonthSummary;
  ratePerVisit: number;
}

export const ResumenModal: React.FC<ResumenModalProps> = ({
  isOpen,
  onClose,
  monthData,
  summary,
  ratePerVisit,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingSheet, setDownloadingSheet] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    try {
      playTapSound();
      setDownloadingPDF(true);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Top brand header banner
      doc.setFillColor(0, 45, 98); // Deep Blue
      doc.rect(0, 0, 210, 32, 'F');

      // Title
      doc.setTextColor(255, 230, 0); // Yellow
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('CONTROL DIARIO - VISITAS EFECTIVAS', 14, 14);

      // Subtitle
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Resumen por Quincenas y Total Mensual - ${monthData.monthName}`, 14, 23);

      // Metadata section
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text(
        `Fecha de emisión: ${new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}`,
        14,
        41
      );
      doc.text(`Tarifa por visita efectiva: $${ratePerVisit}`, 14, 47);

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 53, 182, 10, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, 53, 182, 10, 'S');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('CONCEPTO', 18, 59.5);
      doc.text('PERÍODO', 75, 59.5);
      doc.text('VISITAS', 125, 59.5);
      doc.text('SUBTOTAL ($)', 160, 59.5);

      // Row 1: 1° Quincena
      doc.setFillColor(255, 255, 255);
      doc.rect(14, 63, 182, 15, 'FD');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('1° Quincena', 18, 71);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Días 1 al 10 de 20 días hábiles', 18, 75);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`${summary.q1DaysCompleted} de 10 días cargados`, 75, 72);

      doc.setFont('helvetica', 'bold');
      doc.text(`${summary.q1Visits}`, 125, 72);

      doc.setTextColor(0, 86, 179);
      doc.text(`$${summary.q1Subtotal.toLocaleString('es-ES')}`, 160, 72);

      // Row 2: 2° Quincena
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 78, 182, 15, 'FD');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('2° Quincena', 18, 86);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Días 11 al 20 de 20 días hábiles', 18, 90);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`${summary.q2DaysCompleted} de 10 días cargados`, 75, 87);

      doc.setFont('helvetica', 'bold');
      doc.text(`${summary.q2Visits}`, 125, 87);

      doc.setTextColor(0, 86, 179);
      doc.text(`$${summary.q2Subtotal.toLocaleString('es-ES')}`, 160, 87);

      // Row 3: Total Mensual
      doc.setFillColor(254, 240, 138); // Yellow highlight
      doc.setDrawColor(234, 179, 8);
      doc.rect(14, 93, 182, 17, 'FD');

      doc.setTextColor(0, 45, 98);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL MENSUAL ACUMULADO', 18, 103);
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Mes Completo (20 días hábiles)', 18, 107);

      doc.setFontSize(9.5);
      doc.setTextColor(0, 45, 98);
      doc.text(`${summary.totalDaysRecorded} de 20 días`, 75, 104);

      doc.setFontSize(11);
      doc.text(`${summary.totalVisits}`, 125, 104);

      doc.setFontSize(12);
      doc.setTextColor(0, 45, 98);
      doc.text(`$${summary.totalSubtotal.toLocaleString('es-ES')}`, 160, 104);

      // Explanatory note
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 118, 182, 28, 2.5, 2.5, 'FD');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen consolidado:', 18, 125);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `• 1° Quincena: ${summary.q1Visits} visitas efectivas = $${summary.q1Subtotal.toLocaleString('es-ES')}`,
        18,
        131
      );
      doc.text(
        `• 2° Quincena: ${summary.q2Visits} visitas efectivas = $${summary.q2Subtotal.toLocaleString('es-ES')}`,
        18,
        136
      );
      doc.text(
        `• Gran Total Mensual a Liquidar: ${summary.totalVisits} visitas = $${summary.totalSubtotal.toLocaleString('es-ES')}`,
        18,
        141
      );

      doc.save(`Resumen_Visitas_${monthData.monthKey}.pdf`);
      playSuccessSound();
      triggerVibration([25, 50]);
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadSpreadsheet = () => {
    try {
      playTapSound();
      setDownloadingSheet(true);

      const headers = [
        'Concepto',
        'Detalle Período',
        'Días con Visitas',
        'Visitas Efectivas',
        'Tarifa x Visita ($)',
        'Subtotal ($)',
      ];

      const rows = [
        [
          '1° Quincena',
          'Días 1 al 10 de 20 días hábiles',
          `${summary.q1DaysCompleted} de 10`,
          summary.q1Visits,
          ratePerVisit,
          summary.q1Subtotal,
        ],
        [
          '2° Quincena',
          'Días 11 al 20 de 20 días hábiles',
          `${summary.q2DaysCompleted} de 10`,
          summary.q2Visits,
          ratePerVisit,
          summary.q2Subtotal,
        ],
        [
          'TOTAL MENSUAL ACUMULADO',
          'Mes Completo (20 días hábiles)',
          `${summary.totalDaysRecorded} de 20`,
          summary.totalVisits,
          ratePerVisit,
          summary.totalSubtotal,
        ],
      ];

      // Formatted with semicolon for Spanish Excel compatibility, with UTF-8 BOM
      const csvContent =
        '\uFEFF' +
        [
          `CONTROL DIARIO - RESUMEN DE VISITAS EFECTIVAS`,
          `Mes: ${monthData.monthName}`,
          `Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`,
          `Tarifa: $${ratePerVisit} por visita`,
          '',
          headers.join(';'),
          ...rows.map((r) => r.join(';')),
        ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Resumen_Quincenal_${monthData.monthKey}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      playSuccessSound();
      triggerVibration([25, 50]);
    } catch (err) {
      console.error('Error al descargar hoja de cálculo:', err);
    } finally {
      setDownloadingSheet(false);
    }
  };

  const getSummaryText = () => {
    return `📊 *RESUMEN DE VISITAS EFECTIVAS*
📅 *Mes:* ${monthData.monthName}
💵 *Tarifa:* $${ratePerVisit} por visita

1️⃣ *1° Quincena (Días 1 al 10):*
• Visitas: ${summary.q1Visits}
• Subtotal: $${summary.q1Subtotal.toLocaleString('es-ES')}

2️⃣ *2° Quincena (Días 11 al 20):*
• Visitas: ${summary.q2Visits}
• Subtotal: $${summary.q2Subtotal.toLocaleString('es-ES')}

💰 *TOTAL MENSUAL ACUMULADO:*
• Visitas Totales: ${summary.totalVisits}
• *Total a Cobrar: $${summary.totalSubtotal.toLocaleString('es-ES')}*
• Días con registro: ${summary.totalDaysRecorded} de 20 días hábiles`;
  };

  const handleCopy = () => {
    playTapSound();
    navigator.clipboard.writeText(getSummaryText());
    setCopied(true);
    triggerVibration(20);
    setTimeout(() => setCopied(false), 2000);
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
                Resumen Quincenal y Total
              </h2>
              <p className="text-xs font-bold text-slate-500 capitalize leading-tight mt-0.5">
                {monthData.monthName}
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

        {/* Content: Summary by Quincenas & Monthly Total (NO daily details) */}
        <div className="py-3.5 space-y-2.5">
          {/* 1° Quincena Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                <span className="text-xs font-black uppercase text-[#002d62] tracking-wider">
                  1° Quincena (Días 1 al 10)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {summary.q1Visits} visitas efectivas ({summary.q1DaysCompleted}/10 días)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block leading-tight">
                Subtotal
              </span>
              <span className="text-base sm:text-lg font-black text-[#0056b3] leading-tight">
                ${summary.q1Subtotal.toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {/* 2° Quincena Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span className="text-xs font-black uppercase text-[#002d62] tracking-wider">
                  2° Quincena (Días 11 al 20)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {summary.q2Visits} visitas efectivas ({summary.q2DaysCompleted}/10 días)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block leading-tight">
                Subtotal
              </span>
              <span className="text-base sm:text-lg font-black text-[#0056b3] leading-tight">
                ${summary.q2Subtotal.toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {/* Gran Total Mensual */}
          <div className="p-4 rounded-2xl bg-[#FFE600] border-2 border-yellow-400 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#002d62]/80 tracking-wider block">
                Total Mensual Acumulado
              </span>
              <span className="text-xs font-bold text-[#002d62] mt-0.5 block">
                {summary.totalVisits} visitas en total
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#002d62]/75 font-bold uppercase block">
                Total a Cobrar
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#002d62] leading-none">
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
              className="p-3 rounded-2xl bg-[#0056b3] hover:bg-[#004494] text-white font-extrabold text-xs shadow-md border-b-3 border-[#003366] flex flex-col items-center justify-center gap-1.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <FileText className="w-5 h-5 text-[#FFE600]" />
              <span>Bajar en PDF</span>
            </button>

            {/* Bajar en Hoja de Cálculo */}
            <button
              type="button"
              onClick={handleDownloadSpreadsheet}
              disabled={downloadingSheet}
              className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md border-b-3 border-emerald-800 flex flex-col items-center justify-center gap-1.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
              <span>Hoja de Cálculo</span>
            </button>
          </div>

          {/* Copiar texto para compartir */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">¡Copiado al portapapeles!</span>
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
