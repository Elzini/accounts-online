interface TableColumn {
  header: string;
  key: string;
}

interface PrintReportOptions {
  title: string;
  subtitle?: string;
  columns: TableColumn[];
  data: Record<string, any>[];
  summaryCards?: { label: string; value: string; color?: string; group?: string }[];
  columnGroups?: { label: string; colSpan: number }[];
}

// HTML escaping function to prevent XSS attacks
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

export function usePrintReport() {
  const printReport = ({
    title,
    subtitle,
    columns,
    data,
    summaryCards,
    columnGroups,
  }: PrintReportOptions) => {
    const currentDate = new Date().toLocaleDateString('ar-SA');

    // Create summary cards HTML with escaped values, grouped by 'group'
    const summaryCardsHtml = summaryCards && summaryCards.length > 0
      ? (() => {
          const groups: Record<string, typeof summaryCards> = {};
          summaryCards.forEach(card => {
            const g = card.group || '';
            if (!groups[g]) groups[g] = [];
            groups[g].push(card);
          });
          return Object.entries(groups).map(([groupLabel, cards]) => `
            ${groupLabel ? `<div class="summary-group-label">${escapeHtml(groupLabel)}</div>` : ''}
            <div class="summary-cards">
              ${cards.map(card => `
                <div class="summary-card" style="${card.color ? `border-right: 4px solid ${card.color}; background: ${card.color}11;` : ''}">
                  <div class="card-label">${escapeHtml(card.label)}</div>
                  <div class="card-value" style="${card.color ? `color: ${card.color};` : ''}">${escapeHtml(card.value)}</div>
                </div>
              `).join('')}
            </div>
          `).join('');
        })()
      : '';

    // Build thead with optional column groups
    const theadHtml = columnGroups && columnGroups.length > 0
      ? `
        <thead>
          <tr>
            <th rowspan="2" style="text-align:center;vertical-align:middle">${escapeHtml(columns[0].header)}</th>
            <th rowspan="2" style="text-align:center;vertical-align:middle">${escapeHtml(columns[1].header)}</th>
            ${columnGroups.map((g, i) => {
              const colors = ['#16a34a', '#3b82f6', '#d97706', '#8b5cf6'];
              return `<th colspan="${g.colSpan}" style="text-align:center;background:${colors[i % colors.length]}">${escapeHtml(g.label)}</th>`;
            }).join('')}
          </tr>
          <tr>
            ${columns.slice(2).map(col => `<th style="text-align:center">${escapeHtml(col.header)}</th>`).join('')}
          </tr>
        </thead>
      `
      : `
        <thead>
          <tr>
            ${columns.map(col => `<th>${escapeHtml(col.header)}</th>`).join('')}
          </tr>
        </thead>
      `;

    // Create table HTML with escaped values
    const tableHtml = data.length > 0
      ? `
        <table>
          ${theadHtml}
          <tbody>
            ${data.map(row => `
              <tr>
                ${columns.map(col => `<td style="text-align:center">${escapeHtml(row[col.key]) || '-'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '<p class="no-data">لا توجد بيانات للعرض</p>';

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير');
      return;
    }

    // Escape title and subtitle for safe HTML rendering
    const safeTitle = escapeHtml(title);
    const safeSubtitle = subtitle ? escapeHtml(subtitle) : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${safeTitle}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            text-align: right;
            background: #fff;
            color: #1f2937;
            line-height: 1.6;
            padding: 20px;
          }
          
          .header {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            padding: 25px 30px;
            border-radius: 12px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .header-content h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
          }
          
          .header-content .subtitle {
            font-size: 14px;
            opacity: 0.9;
          }
          
          .header-date {
            font-size: 13px;
            opacity: 0.85;
            text-align: left;
          }
          
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
          }
          
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 18px;
            text-align: center;
          }
          
          .card-label {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 8px;
          }
          
          .card-value {
            font-size: 22px;
            font-weight: 700;
            color: #1e293b;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          th {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            padding: 14px 16px;
            font-weight: 600;
            font-size: 14px;
            text-align: right;
          }
          
          td {
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
          }
          
          tr:nth-child(even) {
            background: #f9fafb;
          }
          
          tr:hover {
            background: #f0f9ff;
          }
          
          .no-data {
            text-align: center;
            color: #6b7280;
            padding: 40px;
            font-size: 16px;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
          }
          
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
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .print-btn-primary {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
          }
          
          .print-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
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
            
            .header {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            th {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .summary-card {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            <h1>${safeTitle}</h1>
            ${safeSubtitle ? `<div class="subtitle">${safeSubtitle}</div>` : ''}
          </div>
          <div class="header-date">
            تاريخ التقرير: ${currentDate}
          </div>
        </div>
        
        ${summaryCardsHtml}
        
        ${tableHtml}
        
        <div class="footer">
          تم إنشاء هذا التقرير بواسطة نظام إدارة معرض السيارات
        </div>
        
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

  return { printReport };
}
