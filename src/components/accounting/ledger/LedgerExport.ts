/**
 * General Ledger - Export Utilities
 * Extracted from GeneralLedgerPage.tsx
 */
import { format } from 'date-fns';
import { createSimpleExcel, downloadExcelBuffer } from '@/lib/excelUtils';

export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

export async function exportLedgerExcel(ledger: any, filteredEntries: any[], dateRange: { from?: Date; to?: Date }, t: any) {
  const data = [
    [t.gl_title],
    [`${t.acc_account}: ${ledger.account.code} - ${ledger.account.name}`],
    [`${t.gl_period_from} ${dateRange.from ? format(dateRange.from, 'yyyy/MM/dd') : '-'} ${t.gl_to} ${dateRange.to ? format(dateRange.to, 'yyyy/MM/dd') : '-'}`],
    [],
    [t.je_col_date, t.acc_entry_number, t.je_col_statement, t.je_col_type, t.acc_debit, t.acc_credit, t.acc_balance],
    ['', '', t.gl_opening_balance, '', '', '', ledger.openingBalance],
    ...filteredEntries.map(entry => [
      format(new Date(entry.date), 'yyyy/MM/dd'),
      entry.entry_number,
      entry.description,
      entry.reference_type || t.gl_general,
      entry.debit > 0 ? entry.debit : '',
      entry.credit > 0 ? entry.credit : '',
      entry.balance,
    ]),
    ['', '', t.total, '', ledger.totalDebit, ledger.totalCredit, ledger.closingBalance],
  ];

  const buffer = await createSimpleExcel(t.gl_title, data, { rtl: true });
  downloadExcelBuffer(buffer, `${t.gl_title}_${ledger.account.code}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

export async function exportLedgerPDF(printRef: React.RefObject<HTMLDivElement>, ledger: any, t: any) {
  if (!ledger || !printRef.current) return;
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, logging: false });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  pdf.save(`${t.gl_title}_${ledger.account.code}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function printLedger(printRef: React.RefObject<HTMLDivElement>, ledger: any, t: any) {
  const printContent = printRef.current;
  if (!printContent) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const clonedContent = printContent.cloneNode(true) as HTMLElement;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <title>${t.gl_title} - ${escapeHtml(ledger?.account.name || '')}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; direction: rtl; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 18px; margin-bottom: 5px; }
          .header p { font-size: 12px; color: #666; }
          .text-left { text-align: left; }
          .positive { color: green; }
          .negative { color: red; }
          .bg-muted { background-color: #f9f9f9; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${clonedContent.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
}
