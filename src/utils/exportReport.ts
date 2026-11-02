import { jsPDF } from 'jspdf';
import { MonthSummary } from '../types';
import { exportQuincenasCSV } from './storage';

/**
 * Downloads the summary of quincenas and monthly total as a clean PDF file.
 * Strictly adheres to requirement:
 * "no debe contener los detalles diarios sino los totales de quincena y total mensual"
 */
export function downloadQuincenasPDF(
  monthName: string,
  monthKey: string,
  summary: MonthSummary,
  rate: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm

  // Top Accent Banner (#FFE600 - SoyDelivery Yellow)
  doc.setFillColor(255, 230, 0);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 45, 98); // #002d62
  doc.text('CONTROL DIARIO - VISITAS EFECTIVAS', pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('RESUMEN DE FACTURACIÓN POR QUINCENAS', pageWidth / 2, 18, { align: 'center' });

  // Blue divider bar (#0056b3)
  doc.setFillColor(0, 86, 179);
  doc.rect(0, 26, pageWidth, 2.5, 'F');

  // Meta Information Box
  let y = 37;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Mes de Facturación:', 18, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 45, 98);
  doc.text(monthName.toUpperCase(), 58, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tarifa por Visita:', 18, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 86, 179);
  doc.text(`$${rate} por visita efectiva`, 58, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Fecha de Emisión:', 18, y);
  doc.setTextColor(30, 41, 59);
  doc.text(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), 58, y);

  // 1° Quincena Box (Days 1 - 15)
  y += 14;
  doc.setFillColor(254, 252, 232); // Light yellow bg
  doc.setDrawColor(250, 204, 21); // Yellow border
  doc.roundedRect(18, y, pageWidth - 36, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 45, 98);
  doc.text('1° QUINCENA  (Días 1 al 15)', 24, y + 8);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Días registrados: ${summary.q1DaysCompleted} de ${summary.q1TotalDays} hábiles`, 24, y + 15);
  doc.text(`Visitas efectivas: ${summary.q1Visits} visitas × $${rate}`, 24, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 86, 179);
  doc.text(`$${summary.q1Subtotal.toLocaleString('es-ES')}`, pageWidth - 24, y + 17, { align: 'right' });

  // 2° Quincena Box (Days 16 - End of month)
  y += 31;
  doc.setFillColor(235, 243, 252); // Light blue bg
  doc.setDrawColor(186, 215, 248); // Blue border
  doc.roundedRect(18, y, pageWidth - 36, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 45, 98);
  doc.text('2° QUINCENA  (Días 16 al fin de mes)', 24, y + 8);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Días registrados: ${summary.q2DaysCompleted} de ${summary.q2TotalDays} hábiles`, 24, y + 15);
  doc.text(`Visitas efectivas: ${summary.q2Visits} visitas × $${rate}`, 24, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 86, 179);
  doc.text(`$${summary.q2Subtotal.toLocaleString('es-ES')}`, pageWidth - 24, y + 17, { align: 'right' });

  // Total Mensual Box (SoyDelivery Blue Background)
  y += 34;
  doc.setFillColor(0, 86, 179); // #0056b3
  doc.setDrawColor(0, 45, 98);
  doc.roundedRect(18, y, pageWidth - 36, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 230, 0); // Yellow
  doc.text('TOTAL MENSUAL ACUMULADO A FACTURAR', 24, y + 10);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255);
  doc.text(`Total Visitas del Mes: ${summary.totalVisits} visitas efectivas`, 24, y + 18);
  doc.text(`Días totales laborados: ${summary.totalDaysRecorded} de ${summary.totalWorkingDays} hábiles`, 24, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 230, 0); // Yellow
  doc.text(`$${summary.totalSubtotal.toLocaleString('es-ES')}`, pageWidth - 24, y + 21, { align: 'right' });

  // Footer note
  y += 44;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Documento generado automáticamente por Control Diario de Visitas.', pageWidth / 2, y, { align: 'center' });

  // Save PDF file
  const fileName = `Resumen_Facturacion_${monthKey}.pdf`;
  doc.save(fileName);
}

/**
 * Downloads the summary of quincenas as a clean CSV spreadsheet file
 */
export function downloadQuincenasCSV(
  monthName: string,
  monthKey: string,
  summary: MonthSummary,
  rate: number
) {
  const csvContent = exportQuincenasCSV(monthName, summary, rate);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Resumen_Facturacion_${monthKey}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
