import * as XLSX from 'xlsx';
import { VATReturnReport, VATInvoiceDetail } from '@/services/vatReturn';

interface VATExportOptions {
  report: VATReturnReport;
  companyName: string;
  taxNumber: string;
  taxRate: number;
  startDate: string;
  endDate: string;
}

function getQuarterLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startMonth = start.getMonth() + 1;
  const endMonth = end.getMonth() + 1;
  const year = end.getFullYear();
  
  if (startMonth === 1 && endMonth === 3) return `الربع الأول - ${year}`;
  if (startMonth === 4 && endMonth === 6) return `الربع الثاني - ${year}`;
  if (startMonth === 7 && endMonth === 9) return `الربع الثالث - ${year}`;
  if (startMonth === 10 && endMonth === 12) return `الربع الرابع - ${year}`;
  return `${startDate} إلى ${endDate}`;
}

function createHeaderRows(title: string, companyName: string, totals: {
  subtotal: number; vat: number; total: number; discount?: number; additions?: number;
}): any[][] {
  return [
    [null, null, null, null, null, null, null, null, null, null, null, null, null, title],
    [
      totals.total, null, totals.vat, totals.subtotal, 
      totals.discount ?? 0, totals.additions ?? 0, totals.subtotal,
      null, null, null, null, null, null, 'الإجمـــــالـــــــي'
    ],
    [
      'المجموع بعد الضريبة', null, 'ضريبة القيمة المضافة', 'المجموع قبل الضريبة',
      'الخصم', 'الإضافة', 'الإجمالي قبل الخصم والضريبة',
      null, null, null, null, null, null, null
    ],
  ];
}

function createInvoiceColumns(): string[] {
  return [
    'المجموع بعد الضريبة', '', 'ضريبة القيمة المضافة', 'المجموع قبل الضريبة',
    'الخصم', 'الإضافة', 'الإجمالي قبل الخصم والضريبة',
    'نوع المشتريات', 'الرقم الضريبي', 'المورد', 'رقم الفاتورة', 'التاريخ', 'المستند'
  ];
}

function createSalesColumns(): string[] {
  return [
    'المجموع بعد الضريبة', '', 'ضريبة القيمة المضافة', 'المجموع قبل الضريبة',
    'الخصم', 'الإضافة', 'الإجمالي قبل الخصم والضريبة',
    'نوع المبيعات', 'الرقم الضريبي', 'العميل', 'رقم الفاتورة', 'التاريخ', 'المستند'
  ];
}

function invoiceToRow(inv: VATInvoiceDetail, index: number, isPurchase: boolean): any[] {
  const subtotal = Math.abs(inv.subtotal);
  const vat = Math.abs(inv.vat_amount);
  const total = Math.abs(inv.total);
  
  return [
    total, null, vat, subtotal,
    0, 0, subtotal,
    '', // نوع المشتريات/المبيعات
    '', // الرقم الضريبي
    inv.customer_name || '',
    inv.supplier_invoice_number || inv.invoice_number,
    inv.invoice_date,
    index + 1
  ];
}

function setColumnWidths(ws: XLSX.WorkSheet, colCount: number) {
  ws['!cols'] = Array(colCount).fill(null).map((_, i) => {
    if (i === 9 || i === 10) return { wch: 35 }; // المورد/العميل + رقم الفاتورة
    if (i === 0 || i === 2 || i === 3 || i === 6) return { wch: 18 }; // أرقام
    return { wch: 14 };
  });
}

function createSheet(
  title: string,
  invoices: VATInvoiceDetail[],
  columnHeaders: string[],
  isPurchase: boolean,
): XLSX.WorkSheet {
  const totals = {
    subtotal: invoices.reduce((s, i) => s + Math.abs(i.subtotal), 0),
    vat: invoices.reduce((s, i) => s + Math.abs(i.vat_amount), 0),
    total: invoices.reduce((s, i) => s + Math.abs(i.total), 0),
  };

  const headerRows = createHeaderRows(title, '', totals);
  const dataRows = invoices.map((inv, idx) => invoiceToRow(inv, idx, isPurchase));
  
  // Add empty rows to match the Excel template style (at least 30 rows)
  const minRows = 30;
  while (dataRows.length < minRows) {
    dataRows.push([0, null, 0, 0, null, null, null, null, null, null, null, null, null]);
  }

  const allRows = [...headerRows, columnHeaders, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);
  setColumnWidths(ws, 14);
  
  // Set RTL
  ws['!sheetViews'] = [{ rightToLeft: true }];
  
  return ws;
}

export function exportVATReportToExcel(options: VATExportOptions) {
  const { report, companyName, taxNumber, taxRate, startDate, endDate } = options;
  const quarterLabel = getQuarterLabel(startDate, endDate);
  
  const wb = XLSX.utils.book_new();

  // 1. مشتريات ضريبة القيمة المضافة
  const purchaseInvoices = report.detailedInvoices.filter(i => i.type === 'purchase' && i.total >= 0);
  const purchaseTitle = `مشتريات ضريبة القيمة المضافة ${quarterLabel} - ${companyName}`;
  const purchaseSheet = createSheet(purchaseTitle, purchaseInvoices, createInvoiceColumns(), true);
  XLSX.utils.book_append_sheet(wb, purchaseSheet, 'مشتريات');

  // 2. مرتجعات المشتريات
  const purchaseReturns = report.detailedInvoices.filter(i => i.type === 'purchase' && i.total < 0);
  const purchaseReturnsTitle = `مرتجعات مشتريات ضريبة القيمة المضافة ${quarterLabel} - ${companyName}`;
  const purchaseReturnsSheet = createSheet(purchaseReturnsTitle, purchaseReturns, createInvoiceColumns(), true);
  XLSX.utils.book_append_sheet(wb, purchaseReturnsSheet, 'مرتجعات مشتريات');

  // 3. مبيعات ضريبة القيمة المضافة
  const salesInvoices = report.detailedInvoices.filter(i => i.type === 'sales' && i.total >= 0);
  const salesTitle = `مبيعات ضريبة القيمة المضافة ${quarterLabel} - ${companyName}`;
  const salesSheet = createSheet(salesTitle, salesInvoices, createSalesColumns(), false);
  XLSX.utils.book_append_sheet(wb, salesSheet, 'مبيعات');

  // 4. مرتجعات المبيعات
  const salesReturns = report.detailedInvoices.filter(i => i.type === 'sales' && i.total < 0);
  const salesReturnsTitle = `مرتجعات مبيعات ضريبة القيمة المضافة ${quarterLabel} - ${companyName}`;
  const salesReturnsSheet = createSheet(salesReturnsTitle, salesReturns, createSalesColumns(), false);
  XLSX.utils.book_append_sheet(wb, salesReturnsSheet, 'مرتجعات مبيعات');

  // 5. ملخص الإقرار الضريبي
  const summaryData = [
    [`ملخص إقرار ضريبة القيمة المضافة - ${companyName}`],
    [`الفترة: ${startDate} إلى ${endDate}`],
    [`الرقم الضريبي: ${taxNumber}`],
    [],
    ['المبيعات', 'المبلغ (ريال)', 'ضريبة القيمة المضافة'],
    [`1- مبيعات خاضعة للنسبة الأساسية (${taxRate}%)`, report.sales.standardRatedAmount, report.sales.standardRatedVAT],
    ['2- مبيعات للمواطنين (خدمات حكومية)', report.sales.citizenServicesAmount, report.sales.citizenServicesVAT],
    ['3- مبيعات خاضعة لنسبة الصفر', report.sales.zeroRatedAmount, 0],
    ['4- الصادرات', report.sales.exportsAmount, 0],
    ['5- مبيعات معفاة من الضريبة', report.sales.exemptAmount, 0],
    ['مرتجعات المبيعات', -(report.salesReturns?.amount || 0), -(report.salesReturns?.vat || 0)],
    ['6- إجمالي المبيعات', report.sales.totalAmount, report.sales.totalVAT],
    [],
    ['المشتريات', 'المبلغ (ريال)', 'ضريبة القيمة المضافة'],
    [`7- مشتريات خاضعة للنسبة الأساسية (${taxRate}%)`, report.purchases.standardRatedAmount, report.purchases.standardRatedVAT],
    ['8- استيرادات خاضعة للضريبة (دفعت في الجمارك)', report.purchases.importsAmount, report.purchases.importsVAT],
    ['9- استيرادات خاضعة للضريبة (آلية الاحتساب العكسي)', report.purchases.reverseChargeAmount, report.purchases.reverseChargeVAT],
    ['10- مشتريات خاضعة لنسبة الصفر', report.purchases.zeroRatedAmount, 0],
    ['11- مشتريات معفاة من الضريبة', report.purchases.exemptAmount, 0],
    ['مرتجعات المشتريات', -(report.purchaseReturns?.amount || 0), -(report.purchaseReturns?.vat || 0)],
    ['12- إجمالي المشتريات', report.purchases.totalAmount, report.purchases.totalVAT],
    [],
    ['صافي ضريبة القيمة المضافة'],
    ['13- إجمالي ضريبة المبيعات', report.sales.totalVAT],
    ['14- إجمالي ضريبة المشتريات', report.purchases.totalVAT],
    ['15- التصحيحات', report.corrections],
    ['16- صافي الضريبة المستحقة / المستردة', report.netVAT],
    [],
    [`الحالة: ${report.netVAT >= 0 ? 'مستحقة الدفع' : 'مستردة'}`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 20 }];
  summarySheet['!sheetViews'] = [{ rightToLeft: true }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'ملخص الإقرار');

  // Download
  const fileName = `إقرار-ضريبة-القيمة-المضافة-${startDate}-${endDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportVATReportToPDF(options: VATExportOptions) {
  // Use print-based PDF generation
  const { report, companyName, taxNumber, taxRate, startDate, endDate } = options;
  const quarterLabel = getQuarterLabel(startDate, endDate);
  
  const purchaseInvoices = report.detailedInvoices.filter(i => i.type === 'purchase' && i.total >= 0);
  const purchaseReturns = report.detailedInvoices.filter(i => i.type === 'purchase' && i.total < 0);
  const salesInvoices = report.detailedInvoices.filter(i => i.type === 'sales' && i.total >= 0);
  const salesReturns = report.detailedInvoices.filter(i => i.type === 'sales' && i.total < 0);

  const formatNum = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const buildInvoiceTable = (invoices: VATInvoiceDetail[], title: string, partyLabel: string) => {
    const totSubtotal = invoices.reduce((s, i) => s + Math.abs(i.subtotal), 0);
    const totVat = invoices.reduce((s, i) => s + Math.abs(i.vat_amount), 0);
    const totTotal = invoices.reduce((s, i) => s + Math.abs(i.total), 0);

    const rows = invoices.map((inv, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${inv.invoice_date}</td>
        <td>${inv.supplier_invoice_number || inv.invoice_number}</td>
        <td>${inv.customer_name || '-'}</td>
        <td class="num">${formatNum(Math.abs(inv.subtotal))}</td>
        <td class="num">${formatNum(Math.abs(inv.vat_amount))}</td>
        <td class="num">${formatNum(Math.abs(inv.total))}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>${title}</h2>
        <div class="summary-bar">
          <span>عدد الفواتير: <strong>${invoices.length}</strong></span>
          <span>الإجمالي قبل الضريبة: <strong>${formatNum(totSubtotal)}</strong></span>
          <span>الضريبة: <strong>${formatNum(totVat)}</strong></span>
          <span>الإجمالي: <strong>${formatNum(totTotal)}</strong></span>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>التاريخ</th><th>رقم الفاتورة</th><th>${partyLabel}</th><th>المبلغ</th><th>الضريبة</th><th>الإجمالي</th></tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#999">لا توجد بيانات</td></tr>'}</tbody>
          <tfoot>
            <tr class="total"><td colspan="4">الإجمالي</td><td class="num">${formatNum(totSubtotal)}</td><td class="num">${formatNum(totVat)}</td><td class="num">${formatNum(totTotal)}</td></tr>
          </tfoot>
        </table>
      </div>
    `;
  };

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>إقرار ضريبة القيمة المضافة - ${companyName}</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } @page { size: A4 landscape; margin: 10mm; } }
    body { font-family: 'Arial', 'Tahoma', sans-serif; direction: rtl; background: #fff; margin: 0; padding: 15px; font-size: 11px; }
    .header { text-align: center; margin-bottom: 15px; border-bottom: 3px solid #0d7377; padding-bottom: 10px; }
    .header h1 { color: #0d7377; margin: 0; font-size: 18px; }
    .header p { color: #666; margin: 3px 0; font-size: 11px; }
    .section { margin: 15px 0; page-break-inside: avoid; }
    .section h2 { background: #0d7377; color: white; padding: 8px 15px; margin: 0 0 0 0; font-size: 13px; border-radius: 4px 4px 0 0; }
    .summary-bar { background: #e8f5f5; padding: 6px 15px; display: flex; gap: 25px; font-size: 11px; border: 1px solid #b2dfdb; border-top: 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 5px 8px; text-align: right; border: 1px solid #ddd; font-size: 10px; }
    th { background: #f0f0f0; font-weight: bold; }
    .num { text-align: left; font-family: monospace; }
    .total { font-weight: bold; background: #e0f2f1 !important; }
    .btn-container { text-align: center; margin: 15px 0; }
    .print-btn { background: #0d7377; color: white; padding: 10px 25px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin: 5px; }
    .print-btn:hover { background: #0a5c5f; }
  </style>
</head>
<body>
  <div class="btn-container no-print">
    <button class="print-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
    <button class="print-btn" onclick="window.close()">✕ إغلاق</button>
  </div>

  <div class="header">
    <h1>إقرار ضريبة القيمة المضافة</h1>
    <p><strong>${companyName}</strong></p>
    <p>الرقم الضريبي: ${taxNumber}</p>
    <p>الفترة: ${startDate} إلى ${endDate}</p>
  </div>

  ${buildInvoiceTable(purchaseInvoices, `مشتريات ضريبة القيمة المضافة - ${quarterLabel}`, 'المورد')}
  ${purchaseReturns.length > 0 ? buildInvoiceTable(purchaseReturns, `مرتجعات مشتريات ضريبة القيمة المضافة - ${quarterLabel}`, 'المورد') : ''}
  ${buildInvoiceTable(salesInvoices, `مبيعات ضريبة القيمة المضافة - ${quarterLabel}`, 'العميل')}
  ${salesReturns.length > 0 ? buildInvoiceTable(salesReturns, `مرتجعات مبيعات ضريبة القيمة المضافة - ${quarterLabel}`, 'العميل') : ''}

  <div class="section">
    <h2>ملخص الإقرار الضريبي</h2>
    <table>
      <tr><td>ضريبة المخرجات (مبيعات)</td><td class="num">${formatNum(report.sales.totalVAT)}</td></tr>
      <tr><td>(-) ضريبة المدخلات (مشتريات)</td><td class="num">${formatNum(report.purchases.totalVAT)}</td></tr>
      <tr class="total"><td>صافي الضريبة ${report.netVAT >= 0 ? '(مستحقة الدفع)' : '(مستردة)'}</td><td class="num">${formatNum(report.netVAT)}</td></tr>
    </table>
  </div>

  <div class="btn-container no-print">
    <p style="color:#666;font-size:12px">💡 لحفظ كـ PDF: اضغط طباعة ← اختر "Save as PDF"</p>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
