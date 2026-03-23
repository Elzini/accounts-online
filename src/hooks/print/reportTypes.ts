/**
 * Report Types & Defaults - Extracted from useUnifiedPrintReport.ts
 */

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
  page_margin: number;
  body_padding: number;
  line_height: number;
  table_header_padding: number;
  table_cell_padding: number;
  header_margin_bottom: number;
  title_margin: number;
  signature_margin_top: number;
  footer_margin_top: number;
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

export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  const textStr = String(text);
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  };
  return textStr.replace(/[&<>"']/g, (m) => map[m]);
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
