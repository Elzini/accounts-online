import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useReportSettings, defaultReportSettings } from '@/hooks/useUnifiedPrintReport';
import { useAppSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  const textStr = String(text);
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  };
  return textStr.replace(/[&<>"']/g, (m) => map[m]);
}

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return new Intl.NumberFormat('en-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export function useDetailedJournalPrint() {
  const { companyId } = useCompany();
  const { data: reportSettings = defaultReportSettings } = useReportSettings();
  const { data: appSettings } = useAppSettings();

  const printDetailedJournal = async (entryIds?: string[]) => {
    if (!companyId) return;

    // Fetch company data
    const { data: companyData } = await supabase
      .from('companies')
      .select('name, address, phone, logo_url, invoice_settings')
      .eq('id', companyId)
      .single();

    // Fetch entries with lines
    let query = supabase
      .from('journal_entries')
      .select(`
        *,
        lines:journal_entry_lines(
          *,
          account:account_categories(id, code, name)
        )
      `)
      .eq('company_id', companyId)
      .order('entry_number', { ascending: true });

    if (entryIds && entryIds.length > 0) {
      query = query.in('id', entryIds);
    }

    const { data: entries, error } = await query;
    if (error || !entries || entries.length === 0) {
      toast.error('لا توجد قيود للطباعة');
      return;
    }

    const companyName = companyData?.name || appSettings?.app_name || 'اسم الشركة';
    const companyAddress = companyData?.address || '';
    const companyPhone = companyData?.phone || '';
    const logoUrl = companyData?.logo_url || '';
    const vatNumber = (companyData?.invoice_settings as any)?.vatNumber || '';
    const headerColor = reportSettings.header_color || '#3b82f6';

    // حساب إجمالي جميع القيود
    const grandTotalDebit = entries.reduce((sum: number, e: any) => {
      const lines = e.lines || [];
      return sum + lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
    }, 0);
    const grandTotalCredit = entries.reduce((sum: number, e: any) => {
      const lines = e.lines || [];
      return sum + lines.reduce((s: number, l: any) => s + (l.credit || 0), 0);
    }, 0);

    // Build entries HTML
    const entriesHtml = entries.map((entry: any) => {
      const lines = entry.lines || [];
      const totalDebit = lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
      const totalCredit = lines.reduce((s: number, l: any) => s + (l.credit || 0), 0);
      const entryDate = entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('en-CA') : '';

      const linesHtml = lines.map((line: any, idx: number) => `
        <tr>
          <td style="text-align:center; width:40px;">${idx + 1}</td>
          <td style="text-align:center; width:80px;">${escapeHtml(line.account?.code || '')}</td>
          <td style="text-align:right;">${escapeHtml(line.account?.name || '')}</td>
          <td style="text-align:center; width:120px;">${line.debit > 0 ? formatNumber(line.debit) : ''}</td>
          <td style="text-align:center; width:120px;">${line.credit > 0 ? formatNumber(line.credit) : ''}</td>
          <td style="text-align:center; width:80px;">${escapeHtml(line.cost_center_id ? '—' : '')}</td>
          <td style="text-align:right; width:150px;">${escapeHtml(line.description || '')}</td>
        </tr>
      `).join('');

      return `
        <div class="entry-block">
          <div class="entry-header">
            <div class="entry-header-right">
              <span class="entry-label">الفرع: <strong>1</strong></span>
            </div>
            <div class="entry-header-center">
              <span class="entry-type">قيد يومية</span>
            </div>
            <div class="entry-header-left">
              <span class="entry-label">التاريخ: <strong>${escapeHtml(entryDate)}</strong></span>
            </div>
          </div>
          
          <div class="entry-number-row">
            <span>رقم القيد: <strong>${entry.entry_number}</strong></span>
          </div>

          <div class="entry-description">
            <span class="desc-label">البيان:</span>
            <span class="desc-value">${escapeHtml(entry.description || '')}</span>
          </div>

          <table class="entry-table">
            <thead>
              <tr>
                <th style="width:40px;">م</th>
                <th style="width:80px;">حساب رقم</th>
                <th>اسم الحساب</th>
                <th style="width:120px;">مدين</th>
                <th style="width:120px;">دائن</th>
                <th style="width:80px;">مركز تكلفة</th>
                <th style="width:150px;">البيان</th>
              </tr>
            </thead>
            <tbody>
              ${linesHtml}
              <tr class="total-row">
                <td colspan="3" style="text-align:center; font-weight:700;">الإجـمــــالي</td>
                <td style="text-align:center; font-weight:700;">${formatNumber(totalDebit)}</td>
                <td style="text-align:center; font-weight:700;">${formatNumber(totalCredit)}</td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>

          <div class="signatures-row">
            <div class="sig-box">
              <div class="sig-title">المدير المالي</div>
              <div class="sig-line"></div>
            </div>
            <div class="sig-box">
              <div class="sig-title">المراجع</div>
              <div class="sig-line"></div>
            </div>
            <div class="sig-box">
              <div class="sig-title">المحاسب</div>
              <div class="sig-line"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('يرجى السماح بالنوافذ المنبثقة');
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>كشف القيود التفصيلي</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 portrait; margin: 8mm; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl; text-align: right; background: #fff; color: #1f2937;
      line-height: 1.4; font-size: 12px; padding: 10px;
    }

    .company-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 3px solid ${headerColor}; padding-bottom: 10px; margin-bottom: 15px;
    }
    .company-info { text-align: right; }
    .company-name { font-size: 22px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
    .company-address { font-size: 12px; color: #6b7280; }
    .company-vat { display: flex; gap: 30px; margin-top: 6px; font-size: 11px; color: #6b7280; }
    .company-logo { max-height: 70px; max-width: 130px; object-fit: contain; }

    .report-main-title {
      text-align: center; margin: 10px 0 20px; font-size: 20px; font-weight: 700; color: ${headerColor};
    }

    .entry-block {
      border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 20px;
      page-break-inside: avoid; overflow: hidden;
    }

    .entry-header {
      display: flex; justify-content: space-between; align-items: center;
      background: #f0f4ff; padding: 6px 12px; border-bottom: 1px solid #d1d5db;
      font-size: 12px;
    }
    .entry-header-center { font-weight: 700; font-size: 14px; color: ${headerColor}; }
    .entry-label { color: #374151; }
    .entry-label strong { color: #1f2937; }

    .entry-number-row {
      padding: 4px 12px; font-size: 12px; color: #374151; background: #fafbfc;
      border-bottom: 1px solid #e5e7eb;
    }
    .entry-number-row strong { color: ${headerColor}; font-size: 14px; }

    .entry-description {
      padding: 8px 12px; border-bottom: 1px solid #e5e7eb;
      font-size: 13px; background: #fffbeb;
    }
    .desc-label { font-weight: 700; color: #92400e; margin-left: 8px; }
    .desc-value { color: #1f2937; }

    .entry-table { width: 100%; border-collapse: collapse; }
    .entry-table th {
      background: ${headerColor}; color: #fff; padding: 6px 8px;
      font-size: 11px; font-weight: 600; text-align: center;
      border: 1px solid ${headerColor};
    }
    .entry-table td {
      padding: 5px 8px; border: 1px solid #e5e7eb; font-size: 12px;
    }
    .entry-table tbody tr:nth-child(even) { background: #f9fafb; }
    .total-row { background: #e0e7ff !important; }
    .total-row td { border-top: 2px solid ${headerColor}; }

    .signatures-row {
      display: flex; justify-content: space-around; padding: 15px 12px 10px;
      border-top: 1px solid #e5e7eb;
    }
    .sig-box { text-align: center; min-width: 130px; }
    .sig-title { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 20px; }
    .sig-line { border-top: 1px solid #374151; width: 100%; }

    .footer {
      margin-top: 15px; padding-top: 8px; border-top: 1px solid #e5e7eb;
      display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af;
    }

    .print-actions {
      position: fixed; bottom: 20px; left: 20px; display: flex; gap: 10px; z-index: 1000;
    }
    .print-btn {
      padding: 10px 22px; border: none; border-radius: 8px;
      font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .print-btn-primary { background: ${headerColor}; color: #fff; }
    .print-btn-primary:hover { opacity: 0.9; }
    .print-btn-secondary { background: #f1f5f9; color: #475569; }
    .print-btn-secondary:hover { background: #e2e8f0; }

    @media print {
      .print-actions { display: none !important; }
      body { padding: 0; }
      .entry-block { page-break-inside: avoid; }
      th, .total-row { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .entry-header, .entry-description { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <!-- Company Header -->
  <div class="company-header">
    <div class="company-info">
      <div class="company-name">${escapeHtml(companyName)}</div>
      ${companyAddress ? `<div class="company-address">${escapeHtml(companyAddress)}</div>` : ''}
      ${companyPhone ? `<div class="company-address">هاتف: ${escapeHtml(companyPhone)}</div>` : ''}
      ${vatNumber ? `<div class="company-vat"><span>الرقم الضريبي: ${escapeHtml(vatNumber)}</span></div>` : ''}
    </div>
    ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" class="company-logo" />` : ''}
  </div>

  <div class="report-main-title">كشف القيود التفصيلي</div>

  ${entriesHtml}

  <div class="footer">
    <div>${formattedDate} ${formattedTime}</div>
    <div>عدد القيود: ${entries.length}</div>
  </div>

  <div class="print-actions">
    <button class="print-btn print-btn-primary" onclick="window.print()">🖨️ طباعة</button>
    <button class="print-btn print-btn-secondary" onclick="window.close()">✕ إغلاق</button>
  </div>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return { printDetailedJournal };
}
