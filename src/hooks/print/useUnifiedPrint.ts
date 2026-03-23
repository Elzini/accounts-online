/**
 * useUnifiedPrint - Core print report logic
 * Extracted from the original useUnifiedPrintReport.ts
 */
import { useAppSettings } from '@/hooks/useSettings';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useReportSettings } from './useReportSettings';
import { defaultReportSettings, escapeHtml, formatCurrency, type UnifiedReportOptions } from './reportTypes';

export function useUnifiedPrintReport() {
  const { data: appSettings } = useAppSettings();
  const { data: reportSettings = defaultReportSettings } = useReportSettings();
  const { companyId } = useCompany();

  const printReport = async (options: UnifiedReportOptions) => {
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
          ${options.data.map((row) => `
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: ${paperSize}; margin: ${reportSettings.page_margin}mm; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; background: #fff; color: #1f2937; line-height: ${reportSettings.line_height}; font-size: ${fontSize}; padding: ${reportSettings.body_padding}px; }
          .company-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${headerColor}; padding-bottom: 8px; margin-bottom: ${reportSettings.header_margin_bottom}px; }
          .company-info { text-align: right; }
          .company-name { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 5px; }
          .company-address { font-size: 13px; color: #6b7280; }
          .company-vat { display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; }
          .company-vat span { margin-left: 30px; }
          .company-logo { max-height: 80px; max-width: 150px; object-fit: contain; }
          .report-title { text-align: center; margin: ${reportSettings.title_margin}px 0; }
          .report-title h1 { font-size: 18px; font-weight: 700; color: ${headerColor}; margin-bottom: 5px; }
          .report-title .subtitle { font-size: 12px; color: #6b7280; }
          .header-info { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-bottom: 20px; padding: 10px; background: #f9fafb; border-radius: 8px; }
          .info-item { display: flex; gap: 8px; }
          .info-label { font-weight: 600; color: #374151; }
          .info-value { color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: ${headerColor}; color: white; padding: ${reportSettings.table_header_padding}px ${reportSettings.table_header_padding - 1}px; font-weight: 600; font-size: 11px; border: 1px solid ${headerColor}; }
          td { padding: ${reportSettings.table_cell_padding}px ${reportSettings.table_cell_padding + 1}px; border: 1px solid #e5e7eb; font-size: ${fontSize}; }
          tr:nth-child(even) { background: #f9fafb; }
          tr:hover { background: #f3f4f6; }
          .summary-row { background: #e0e7ff !important; font-weight: 700; }
          .summary-row td { border-top: 2px solid ${headerColor}; }
          .text-success { color: #059669; }
          .text-danger { color: #dc2626; }
          .no-data { text-align: center; color: #6b7280; padding: 40px; font-size: 16px; }
          .signatures { display: flex; justify-content: space-around; margin-top: ${reportSettings.signature_margin_top}px; padding-top: 10px; border-top: 2px solid #e5e7eb; }
          .signature-box { text-align: center; min-width: 150px; padding: 8px; }
          .signature-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 25px; }
          .signature-line { border-top: 1px solid #1f2937; margin-top: 25px; width: 100%; }
          .signature-date { font-size: 10px; color: #6b7280; margin-top: 5px; }
          .footer { margin-top: ${reportSettings.footer_margin_top}px; padding-top: 8px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
          .print-actions { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 10px; z-index: 1000; }
          .print-btn { padding: 10px 22px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
          .print-btn-primary { background: ${headerColor}; color: white; }
          .print-btn-primary:hover { opacity: 0.9; transform: translateY(-2px); }
          .print-btn-secondary { background: #f1f5f9; color: #475569; }
          .print-btn-secondary:hover { background: #e2e8f0; }
          .print-btn-settings { background: #fef3c7; color: #92400e; }
          .print-btn-settings:hover { background: #fde68a; }
          .settings-panel { position: fixed; top: 0; left: 0; width: 320px; height: 100vh; background: #fff; border-right: 2px solid #e5e7eb; box-shadow: 4px 0 20px rgba(0,0,0,0.15); z-index: 2000; overflow-y: auto; padding: 16px; direction: rtl; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; display: none; }
          .settings-panel.open { display: block; }
          .settings-panel h3 { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${headerColor}; }
          .setting-group { margin-bottom: 14px; }
          .setting-group label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; }
          .setting-group label span { font-weight: 400; color: #6b7280; font-size: 11px; }
          .setting-group input[type="range"] { width: 100%; cursor: pointer; accent-color: ${headerColor}; }
          .settings-close-btn { position: absolute; top: 12px; left: 12px; background: #f3f4f6; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
          .settings-close-btn:hover { background: #e5e7eb; }
          .settings-section-title { font-size: 13px; font-weight: 700; color: ${headerColor}; margin: 12px 0 8px; }
          @media print { .print-actions { display: none !important; } .settings-panel { display: none !important; } body { padding: 0; } th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .summary-row { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="settings-panel" id="settingsPanel">
          <button class="settings-close-btn" onclick="toggleSettings()">✕</button>
          <h3>⚙️ تعديل تنسيق التقرير</h3>
          <div class="settings-section-title">📄 الصفحة</div>
          <div class="setting-group"><label>هوامش الصفحة <span id="marginVal">${reportSettings.page_margin}mm</span></label><input type="range" min="2" max="25" value="${reportSettings.page_margin}" oninput="updateSetting('pageMargin', this.value)"></div>
          <div class="setting-group"><label>تباعد المحتوى <span id="paddingVal">${reportSettings.body_padding}px</span></label><input type="range" min="0" max="30" value="${reportSettings.body_padding}" oninput="updateSetting('bodyPadding', this.value)"></div>
          <div class="setting-group"><label>ارتفاع السطر <span id="lineHeightVal">${reportSettings.line_height}</span></label><input type="range" min="10" max="25" value="${Math.round(reportSettings.line_height * 10)}" oninput="updateSetting('lineHeight', this.value)"></div>
          <div class="settings-section-title">🔤 الخطوط</div>
          <div class="setting-group"><label>حجم خط الجدول <span id="fontSizeVal">${fontSize}</span></label><input type="range" min="8" max="18" value="${parseInt(fontSize)}" oninput="updateSetting('fontSize', this.value)"></div>
          <div class="settings-section-title">📊 الجدول</div>
          <div class="setting-group"><label>حشو رأس الجدول <span id="thPaddingVal">${reportSettings.table_header_padding}px</span></label><input type="range" min="1" max="15" value="${reportSettings.table_header_padding}" oninput="updateSetting('thPadding', this.value)"></div>
          <div class="setting-group"><label>حشو خلايا الجدول <span id="tdPaddingVal">${reportSettings.table_cell_padding}px</span></label><input type="range" min="1" max="15" value="${reportSettings.table_cell_padding}" oninput="updateSetting('tdPadding', this.value)"></div>
          <div class="settings-section-title">📐 المسافات</div>
          <div class="setting-group"><label>مسافة بعد الهيدر <span id="headerMarginVal">${reportSettings.header_margin_bottom}px</span></label><input type="range" min="0" max="40" value="${reportSettings.header_margin_bottom}" oninput="updateSetting('headerMargin', this.value)"></div>
          <div class="setting-group"><label>مسافة العنوان <span id="titleMarginVal">${reportSettings.title_margin}px</span></label><input type="range" min="0" max="40" value="${reportSettings.title_margin}" oninput="updateSetting('titleMargin', this.value)"></div>
          <div class="setting-group"><label>مسافة التوقيعات <span id="sigMarginVal">${reportSettings.signature_margin_top}px</span></label><input type="range" min="5" max="60" value="${reportSettings.signature_margin_top}" oninput="updateSetting('sigMargin', this.value)"></div>
          <div class="setting-group"><label>مسافة التذييل <span id="footerMarginVal">${reportSettings.footer_margin_top}px</span></label><input type="range" min="0" max="40" value="${reportSettings.footer_margin_top}" oninput="updateSetting('footerMargin', this.value)"></div>
        </div>

        <div class="company-header">
          <div class="company-info">
            <div class="company-name">${escapeHtml(companyName)}</div>
            ${reportSettings.show_company_address && companyAddress ? `<div class="company-address">${escapeHtml(companyAddress)}</div>` : ''}
            ${reportSettings.show_company_phone && companyPhone ? `<div class="company-address">هاتف: ${escapeHtml(companyPhone)}</div>` : ''}
            ${reportSettings.show_vat_number && vatNumber ? `<div class="company-vat"><span>الرقم الضريبي: ${escapeHtml(vatNumber)}</span><span>Vat No: ${escapeHtml(vatNumber)}</span></div>` : ''}
          </div>
          ${reportSettings.show_logo && logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" class="company-logo" />` : ''}
        </div>
        
        <div class="report-title">
          <h1>${escapeHtml(options.title)}</h1>
          ${options.subtitle ? `<div class="subtitle">${escapeHtml(options.subtitle)}</div>` : ''}
          ${options.dateRange ? `<div class="subtitle">${options.dateRange.from ? `من تاريخ: ${escapeHtml(options.dateRange.from)}` : ''} ${options.dateRange.to ? ` إلى تاريخ: ${escapeHtml(options.dateRange.to)}` : ''}</div>` : ''}
        </div>
        
        ${headerInfoHtml}
        ${tableHtml}
        ${signaturesHtml}
        
        ${reportSettings.show_footer ? `<div class="footer"><div>${formattedDate} ${formattedTime}</div>${reportSettings.show_page_numbers ? '<div>صفحة 1</div>' : ''}</div>` : ''}
        
        <div class="print-actions">
          <button class="print-btn print-btn-primary" onclick="window.print()">🖨️ طباعة</button>
          <button class="print-btn print-btn-settings" onclick="toggleSettings()">⚙️ تعديل التنسيق</button>
          <button class="print-btn print-btn-secondary" onclick="window.close()">✕ إغلاق</button>
        </div>

        <script>
          function toggleSettings() { document.getElementById('settingsPanel').classList.toggle('open'); }
          function updateSetting(type, value) {
            var v = Number(value);
            switch(type) {
              case 'pageMargin': document.getElementById('marginVal').textContent = v + 'mm'; var style = document.querySelector('style'); style.textContent = style.textContent.replace(/@page\\s*\\{[^}]*\\}/, '@page { size: ${paperSize}; margin: ' + v + 'mm; }'); break;
              case 'bodyPadding': document.getElementById('paddingVal').textContent = v + 'px'; document.body.style.padding = v + 'px'; break;
              case 'lineHeight': var lh = (v / 10).toFixed(1); document.getElementById('lineHeightVal').textContent = lh; document.body.style.lineHeight = lh; break;
              case 'fontSize': document.getElementById('fontSizeVal').textContent = v + 'px'; document.body.style.fontSize = v + 'px'; document.querySelectorAll('td').forEach(function(td) { td.style.fontSize = v + 'px'; }); break;
              case 'thPadding': document.getElementById('thPaddingVal').textContent = v + 'px'; document.querySelectorAll('th').forEach(function(th) { th.style.padding = v + 'px ' + (v-1) + 'px'; }); break;
              case 'tdPadding': document.getElementById('tdPaddingVal').textContent = v + 'px'; document.querySelectorAll('td').forEach(function(td) { td.style.padding = v + 'px ' + (v+1) + 'px'; }); break;
              case 'headerMargin': document.getElementById('headerMarginVal').textContent = v + 'px'; document.querySelector('.company-header').style.marginBottom = v + 'px'; break;
              case 'titleMargin': document.getElementById('titleMarginVal').textContent = v + 'px'; var rt = document.querySelector('.report-title'); if(rt) rt.style.margin = v + 'px 0'; break;
              case 'sigMargin': document.getElementById('sigMarginVal').textContent = v + 'px'; var sig = document.querySelector('.signatures'); if(sig) sig.style.marginTop = v + 'px'; break;
              case 'footerMargin': document.getElementById('footerMarginVal').textContent = v + 'px'; var ft = document.querySelector('.footer'); if(ft) ft.style.marginTop = v + 'px'; break;
            }
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return { printReport, reportSettings };
}
