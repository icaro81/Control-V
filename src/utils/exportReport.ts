import { jsPDF } from 'jspdf';
import { MonthSummary } from '../types';

/**
 * Robust clipboard copy supporting modern Clipboard API and fallback for Android WebViews.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Continue to fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
    return false;
  }
}

/**
 * Downloads the summary of quincenas and monthly total as a clean PDF file.
 * Strictly adheres to requirement:
 * Totales discriminados por quincenas (1-15 y 16-fin) y total mensual, sin detalles diarios.
 */
export async function downloadQuincenasPDF(
  monthName: string,
  monthKey: string,
  summary: MonthSummary,
  rate: number
): Promise<boolean> {
  try {
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
    doc.text(
      new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      58,
      y
    );

    // 1° Quincena Box (Días 1 al 15)
    y += 14;
    doc.setFillColor(254, 252, 232); // Light yellow
    doc.setDrawColor(250, 204, 21); // Yellow border
    doc.roundedRect(18, y, pageWidth - 36, 26, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 45, 98);
    doc.text('1° QUINCENA  (Días 1 al 15)', 24, y + 8);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Días registrados: ${summary.q1DaysCompleted} de ${summary.q1TotalDays} hábiles`,
      24,
      y + 15
    );
    doc.text(`Visitas efectivas: ${summary.q1Visits} visitas × $${rate}`, 24, y + 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 86, 179);
    doc.text(`$${summary.q1Subtotal.toLocaleString('es-ES')}`, pageWidth - 24, y + 17, {
      align: 'right',
    });

    // 2° Quincena Box (Días 16 al fin de mes)
    y += 31;
    doc.setFillColor(235, 243, 252); // Light blue
    doc.setDrawColor(186, 215, 248); // Blue border
    doc.roundedRect(18, y, pageWidth - 36, 26, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 45, 98);
    doc.text('2° QUINCENA  (Días 16 al fin de mes)', 24, y + 8);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Días registrados: ${summary.q2DaysCompleted} de ${summary.q2TotalDays} hábiles`,
      24,
      y + 15
    );
    doc.text(`Visitas efectivas: ${summary.q2Visits} visitas × $${rate}`, 24, y + 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 86, 179);
    doc.text(`$${summary.q2Subtotal.toLocaleString('es-ES')}`, pageWidth - 24, y + 17, {
      align: 'right',
    });

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
    doc.text(
      `Días totales laborados: ${summary.totalDaysRecorded} de ${summary.totalWorkingDays} hábiles`,
      24,
      y + 24
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 230, 0); // Yellow
    doc.text(`$${summary.totalSubtotal.toLocaleString('es-ES')}`, pageWidth - 24, y + 21, {
      align: 'right',
    });

    // Footer note
    y += 44;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Documento generado automáticamente por Control Diario de Visitas.',
      pageWidth / 2,
      y,
      { align: 'center' }
    );

    const fileName = `Resumen_Facturacion_${monthKey}.pdf`;

    // Try web share first if on mobile (e.g. Android WhatsApp/Drive sharing)
    const pdfBlob = doc.output('blob');
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Resumen de Visitas - ${monthName}`,
            files: [file],
          });
          return true;
        }
      } catch (shareErr) {
        // User cancelled share or unsupported; fallback to file download
      }
    }

    // Standard download
    try {
      doc.save(fileName);
    } catch {
      // Fallback via Blob URL
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 2000);
    }

    return true;
  } catch (err) {
    console.error('Error al generar PDF:', err);
    return false;
  }
}

/**
 * Downloads the summary of quincenas as a clean CSV spreadsheet file (compatible with Excel)
 */
export async function downloadQuincenasCSV(
  monthName: string,
  monthKey: string,
  summary: MonthSummary,
  rate: number
): Promise<boolean> {
  try {
    const headers = [
      'Concepto',
      'Período',
      'Días Laborados',
      'Visitas Efectivas',
      'Tarifa x Visita ($)',
      'Subtotal ($)',
    ];

    const rows = [
      [
        '1° Quincena',
        'Días 1 al 15',
        `${summary.q1DaysCompleted} de ${summary.q1TotalDays}`,
        summary.q1Visits,
        rate,
        summary.q1Subtotal,
      ],
      [
        '2° Quincena',
        'Días 16 al fin de mes',
        `${summary.q2DaysCompleted} de ${summary.q2TotalDays}`,
        summary.q2Visits,
        rate,
        summary.q2Subtotal,
      ],
      [
        'TOTAL MENSUAL ACUMULADO',
        'Mes Completo',
        `${summary.totalDaysRecorded} de ${summary.totalWorkingDays}`,
        summary.totalVisits,
        rate,
        summary.totalSubtotal,
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [
        `CONTROL DIARIO - RESUMEN DE FACTURACIÓN`,
        `Mes: ${monthName}`,
        `Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`,
        `Tarifa: $${rate} por visita efectiva`,
        '',
        headers.join(';'),
        ...rows.map((r) => r.join(';')),
      ].join('\r\n');

    const fileName = `Resumen_Facturacion_${monthKey}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Try web share if available on mobile
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'text/csv' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Resumen de Visitas - ${monthName}`,
            files: [file],
          });
          return true;
        }
      } catch {
        // Fallback to download
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2000);

    return true;
  } catch (err) {
    console.error('Error al exportar CSV:', err);
    return false;
  }
}

/**
 * Builds friendly plain text summary for quick copy/pasting in WhatsApp or email.
 */
export function buildSummaryShareText(
  monthName: string,
  summary: MonthSummary,
  rate: number
): string {
  return `📊 *RESUMEN DE FACTURACIÓN - VISITAS EFECTIVAS*
📅 *Mes:* ${monthName}
💵 *Tarifa:* $${rate} por visita efectiva

1️⃣ *1° Quincena (Días 1 al 15):*
• Visitas Efectivas: ${summary.q1Visits}
• Días Laborados: ${summary.q1DaysCompleted} de ${summary.q1TotalDays} hábiles
• Subtotal: $${summary.q1Subtotal.toLocaleString('es-ES')}

2️⃣ *2° Quincena (Días 16 al fin de mes):*
• Visitas Efectivas: ${summary.q2Visits}
• Días Laborados: ${summary.q2DaysCompleted} de ${summary.q2TotalDays} hábiles
• Subtotal: $${summary.q2Subtotal.toLocaleString('es-ES')}

💰 *TOTAL MENSUAL ACUMULADO:*
• Visitas Totales: ${summary.totalVisits}
• Días Registrados: ${summary.totalDaysRecorded} de ${summary.totalWorkingDays} hábiles
• *Total a Cobrar: $${summary.totalSubtotal.toLocaleString('es-ES')}*`;
}
