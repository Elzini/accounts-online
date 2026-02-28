import { useAppSettings } from '@/hooks/useSettings';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportSettings {
  show_logo: boolean;
  show_vat_number: boolean;
  show_company_address: boolean;
  show_company_phone: boolean;
  header_color: string;
  show_footer: boolean;
  footer_text: string;
  show_page_numbers: boolean;
  paper_size: 'A4' | 'A4-landscape';
  font_size: 'small' | 'medium' | 'large';
  page_margin: number; // mm
  body_padding: number; // px
  line_height: number;
  table_header_padding: number; // px
  table_cell_padding: number; // px
  header_margin_bottom: number; // px
  title_margin: number; // px
  signature_margin_top: number; // px
  footer_margin_top: number; // px
}

export const defaultReportSettings: ReportSettings = {
  show_logo: true,
  show_vat_number: true,
  show_company_address: true,
  show_company_phone: true,
  header_color: '#3b82f6',
  show_footer: true,
  footer_text: '',
  show_page_numbers: true,
  paper_size: 'A4-landscape',
  font_size: 'medium',
  page_margin: 8,
  body_padding: 10,
  line_height: 1.3,
  table_header_padding: 5,
  table_cell_padding: 4,
  header_margin_bottom: 10,
  title_margin: 10,
  signature_margin_top: 30,
  footer_margin_top: 15,
};

export interface UnifiedReportColumn {
  header: string;
  key: string;
  align?: 'right' | 'center' | 'left';
  width?: string;
  type?: 'text' | 'number' | 'currency' | 'date';
  className?: string;
}

export interface UnifiedReportOptions {
  title: string;
  subtitle?: string;
  reportType?: string;
  columns: UnifiedReportColumn[];
  data: Record<string, any>[];
  summaryRow?: Record<string, any>;
  headerInfo?: { label: string; value: string }[];
  dateRange?: { from?: string; to?: string };
  showSignatures?: boolean;
  signatureLabels?: string[];
}

// Fetch report settings
export function useReportSettings() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['report-settings', companyId],
    queryFn: async (): Promise<ReportSettings> => {
      if (!companyId) return defaultReportSettings;

      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('company_id', companyId)
        .like('key', 'report_%');

      if (error) throw error;

      const settings: ReportSettings = { ...defaultReportSettings };
      
      data?.forEach((row) => {
        const key = row.key.replace('report_', '') as keyof ReportSettings;
        if (key in settings) {
          if (typeof settings[key] === 'boolean') {
            (settings as any)[key] = row.value === 'true';
          } else {
            (settings as any)[key] = row.value;
          }
        }
      });

      return settings;
    },
    enabled: !!companyId,
  });
}

// HTML escaping function
function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  const textStr = String(text);
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return textStr.replace(/[&<>"']/g, (m) => map[m]);
}

// Format currency
function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function useUnifiedPrintReport() {
  const { data: appSettings } = useAppSettings();
  const { data: reportSettings = defaultReportSettings } = useReportSettings();
  const { companyId } = useCompany();

  const printReport = async (options: UnifiedReportOptions) => {
    // Fetch company data
    let companyData: any = null;
    if (companyId) {
      const { data } = await supabase
        .from('companies')
        .select('name, address, phone, logo_url, invoice_settings')
        .eq('id', companyId)
        .single();
      companyData = data;
    }

    const companyName = companyData?.name || appSettings?.app_name || 'اسم الشركة';
    const companyAddress = companyData?.address || '';
    const companyPhone = companyData?.phone || '';
    const logoUrl = companyData?.logo_url || '';
    const vatNumber = (companyData?.invoice_settings as any)?.vatNumber || '';

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('ar-SA');
    const formattedTime = currentDate.toLocaleTimeString('ar-SA');

    const headerColor = reportSettings.header_color || '#3b82f6';
    const fontSize = reportSettings.font_size === 'small' ? '11px' : 
                     reportSettings.font_size === 'large' ? '14px' : '12px';
    const paperSize = reportSettings.paper_size === 'A4' ? 'A4 portrait' : 'A4 landscape';

    // Create header info HTML
    const headerInfoHtml = options.headerInfo && options.headerInfo.length > 0 ? `
      <div class="header-info">
        ${options.headerInfo.map(info => `
          <div class="info-item">
            <span class="info-label">${escapeHtml(info.label)}:</span>
            <span class="info-value">${escapeHtml(info.value)}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    // Create table HTML
    const tableHtml = options.data.length > 0 ? `
      <table>
        <thead>
          <tr>
            ${options.columns.map(col => `
              <th style="text-align: ${col.align || 'right'}; ${col.width ? `width: ${col.width};` : ''}">${escapeHtml(col.header)}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${options.data.map((row, index) => `
            <tr>
              ${options.columns.map(col => {
                let value = row[col.key];
                if (col.type === 'currency' && value !== undefined && value !== null) {
                  value = formatCurrency(value);
                }
                return `<td style="text-align: ${col.align || 'right'};" class="${col.className || ''}">${escapeHtml(value) || '-'}</td>`;
              }).join('')}
            </tr>
          `).join('')}
          ${options.summaryRow ? `
            <tr class="summary-row">
              ${options.columns.map(col => {
                let value = options.summaryRow![col.key];
                if (col.type === 'currency' && value !== undefined && value !== null) {
                  value = formatCurrency(value);
                }
                return `<td style="text-align: ${col.align || 'right'};" class="${col.className || ''}">${escapeHtml(value) || ''}</td>`;
              }).join('')}
            </tr>
          ` : ''}
        </tbody>
      </table>
    ` : '<p class="no-data">لا توجد بيانات للعرض</p>';

    // Create signatures HTML
    const signaturesHtml = options.showSignatures ? `
      <div class="signatures">
        ${(options.signatureLabels || ['توقيع المحاسب', 'توقيع المدير العام']).map(label => `
          <div class="signature-box">
            <div class="signature-label">${escapeHtml(label)}</div>
            <div class="signature-line"></div>
            <div class="signature-date">التاريخ: ___/___/_____</div>
          </div>
        `).join('')}
      </div>
    ` : '';

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(options.title)}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: ${paperSize};
            margin: ${reportSettings.page_margin}mm;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            text-align: right;
            background: #fff;
            color: #1f2937;
            line-height: ${reportSettings.line_height};
            font-size: ${fontSize};
            padding: ${reportSettings.body_padding}px;
          }
          
          /* Company Header */
          .company-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid ${headerColor};
            padding-bottom: 8px;
            margin-bottom: ${reportSettings.header_margin_bottom}px;
          }
          
          .company-info {
            text-align: right;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 5px;
          }
          
          .company-address {
            font-size: 13px;
            color: #6b7280;
          }
          
          .company-vat {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 12px;
          }
          
          .company-vat span {
            margin-left: 30px;
          }
          
          .company-logo {
            max-height: 80px;
            max-width: 150px;
            object-fit: contain;
          }
          
          /* Report Title */
          .report-title {
            text-align: center;
            margin: ${reportSettings.title_margin}px 0;
          }
          
          .report-title h1 {
            font-size: 18px;
            font-weight: 700;
            color: ${headerColor};
            margin-bottom: 5px;
          }
          
          .report-title .subtitle {
            font-size: 12px;
            color: #6b7280;
          }
          
          /* Header Info */
          .header-info {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
            margin-bottom: 20px;
            padding: 10px;
            background: #f9fafb;
            border-radius: 8px;
          }
          
          .info-item {
            display: flex;
            gap: 8px;
          }
          
          .info-label {
            font-weight: 600;
            color: #374151;
          }
          
          .info-value {
            color: #1f2937;
          }
          
          /* Table */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          th {
            background: ${headerColor};
            color: white;
            padding: ${reportSettings.table_header_padding}px ${reportSettings.table_header_padding - 1}px;
            font-weight: 600;
            font-size: 11px;
            border: 1px solid ${headerColor};
          }
          
          td {
            padding: ${reportSettings.table_cell_padding}px ${reportSettings.table_cell_padding + 1}px;
            border: 1px solid #e5e7eb;
            font-size: ${fontSize};
          }
          
          tr:nth-child(even) {
            background: #f9fafb;
          }
          
          tr:hover {
            background: #f3f4f6;
          }
          
          .summary-row {
            background: #e0e7ff !important;
            font-weight: 700;
          }
          
          .summary-row td {
            border-top: 2px solid ${headerColor};
          }
          
          .text-success {
            color: #059669;
          }
          
          .text-danger {
            color: #dc2626;
          }
          
          .no-data {
            text-align: center;
            color: #6b7280;
            padding: 40px;
            font-size: 16px;
          }
          
          /* Signatures */
          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: ${reportSettings.signature_margin_top}px;
            padding-top: 10px;
            border-top: 2px solid #e5e7eb;
          }
          
          .signature-box {
            text-align: center;
            min-width: 150px;
            padding: 8px;
          }
          
          .signature-label {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 25px;
          }
          
          .signature-line {
            border-top: 1px solid #1f2937;
            margin-top: 25px;
            width: 100%;
          }
          
          .signature-date {
            font-size: 10px;
            color: #6b7280;
            margin-top: 5px;
          }
          
          /* Footer */
          .footer {
            margin-top: ${reportSettings.footer_margin_top}px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #9ca3af;
          }
          
          /* Print Actions */
          .print-actions {
            position: fixed;
            bottom: 20px;
            left: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
          }
          
          .print-btn {
            padding: 12px 28px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .print-btn-primary {
            background: ${headerColor};
            color: white;
          }
          
          .print-btn-primary:hover {
            opacity: 0.9;
            transform: translateY(-2px);
          }
          
          .print-btn-secondary {
            background: #f1f5f9;
            color: #475569;
          }
          
          .print-btn-secondary:hover {
            background: #e2e8f0;
          }
          
          @media print {
            .print-actions {
              display: none !important;
            }
            
            body {
              padding: 0;
            }
            
            th {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .summary-row {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <!-- Company Header -->
        <div class="company-header">
          <div class="company-info">
            <div class="company-name">${escapeHtml(companyName)}</div>
            ${reportSettings.show_company_address && companyAddress ? `<div class="company-address">${escapeHtml(companyAddress)}</div>` : ''}
            ${reportSettings.show_company_phone && companyPhone ? `<div class="company-address">هاتف: ${escapeHtml(companyPhone)}</div>` : ''}
            ${reportSettings.show_vat_number && vatNumber ? `
              <div class="company-vat">
                <span>الرقم الضريبي: ${escapeHtml(vatNumber)}</span>
                <span>Vat No: ${escapeHtml(vatNumber)}</span>
              </div>
            ` : ''}
          </div>
          ${reportSettings.show_logo && logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" class="company-logo" />` : ''}
        </div>
        
        <!-- Report Title -->
        <div class="report-title">
          <h1>${escapeHtml(options.title)}</h1>
          ${options.subtitle ? `<div class="subtitle">${escapeHtml(options.subtitle)}</div>` : ''}
          ${options.dateRange ? `
            <div class="subtitle">
              ${options.dateRange.from ? `من تاريخ: ${escapeHtml(options.dateRange.from)}` : ''}
              ${options.dateRange.to ? ` إلى تاريخ: ${escapeHtml(options.dateRange.to)}` : ''}
            </div>
          ` : ''}
        </div>
        
        ${headerInfoHtml}
        
        ${tableHtml}
        
        ${signaturesHtml}
        
        ${reportSettings.show_footer ? `
          <div class="footer">
            <div>${formattedDate} ${formattedTime}</div>
            ${reportSettings.show_page_numbers ? '<div>صفحة 1</div>' : ''}
          </div>
        ` : ''}
        
        <div class="print-actions">
          <button class="print-btn print-btn-primary" onclick="window.print()">
            🖨️ طباعة
          </button>
          <button class="print-btn print-btn-secondary" onclick="window.close()">
            ✕ إغلاق
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return { printReport, reportSettings };
}
