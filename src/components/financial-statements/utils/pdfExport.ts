// تصدير القوائم المالية إلى PDF - مطابق لتنسيق مداد
import { ComprehensiveFinancialData } from '../types';

// تنسيق الأرقام بالعربي
function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// إنشاء HTML للتصدير كـ PDF
export function generateFinancialStatementsPDF(data: ComprehensiveFinancialData): string {
  const companyName = data.companyName || 'الشركة';
  const companyType = data.companyType || 'شركة ذات مسئولية محدودة';
  const reportDate = data.reportDate || '31 ديسمبر 2025م';
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>القوائم المالية - ${companyName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', 'Arial', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
      position: relative;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    /* Header styling - matching Medad */
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .header-bar {
      background: linear-gradient(90deg, #1e3a5f, #2c5282);
      color: white;
      padding: 12px 20px;
      margin-bottom: 2px;
      font-weight: 700;
      font-size: 16pt;
    }
    
    .header-bar.sub {
      font-size: 12pt;
      font-weight: 400;
      background: linear-gradient(90deg, #3182ce, #4299e1);
    }
    
    .header-bar.title {
      font-size: 14pt;
      font-weight: 600;
    }
    
    .header-bar.date {
      font-size: 11pt;
      background: linear-gradient(90deg, #2b6cb0, #3182ce);
    }
    
    /* Cover page */
    .cover-page .header {
      margin-top: 150px;
    }
    
    /* Page title */
    .page-title {
      text-align: center;
      margin: 20px 0;
    }
    
    .page-title h2 {
      font-size: 14pt;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 5px;
    }
    
    .page-title .subtitle {
      font-size: 11pt;
      color: #666;
    }
    
    /* Table styling */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 11pt;
    }
    
    th, td {
      padding: 8px 12px;
      text-align: right;
      border-bottom: 1px solid #e2e8f0;
    }
    
    th {
      background: #f7fafc;
      font-weight: 600;
      color: #1e3a5f;
    }
    
    .amount {
      text-align: left;
      font-family: 'Courier New', monospace;
      font-weight: 600;
      direction: ltr;
    }
    
    .note-col {
      text-align: center;
      width: 60px;
      color: #666;
    }
    
    .section-header {
      font-weight: 700;
      background: #edf2f7;
      color: #1e3a5f;
    }
    
    .total-row {
      font-weight: 700;
      background: #e2e8f0;
      border-top: 2px solid #1e3a5f;
    }
    
    .sub-total {
      font-weight: 600;
      background: #f7fafc;
    }
    
    .indent {
      padding-right: 30px;
    }
    
    /* Footer */
    .footer {
      position: absolute;
      bottom: 20mm;
      left: 20mm;
      right: 20mm;
      text-align: center;
      font-size: 9pt;
      color: #666;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
    
    .footer .page-num {
      font-weight: 600;
    }
    
    .footer .note {
      font-size: 8pt;
      margin-top: 5px;
    }
    
    /* Index table */
    .index-table td:last-child {
      text-align: left;
      width: 50px;
    }
    
    /* Notes styling */
    .note-title {
      font-size: 12pt;
      font-weight: 700;
      color: #1e3a5f;
      margin: 20px 0 10px 0;
    }
    
    .note-content {
      font-size: 10pt;
      color: #4a5568;
      line-height: 1.8;
      margin-bottom: 15px;
    }
    
    /* Print styles */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 15mm; }
    }
  </style>
</head>
<body>

<!-- صفحة الغلاف -->
<div class="page cover-page">
  <div class="header">
    <div class="header-bar">${companyName}</div>
    <div class="header-bar sub">(${companyType})</div>
    <div class="header-bar title">القوائم المالية وتقرير المراجع المستقل</div>
    <div class="header-bar date">للفترة المنتهية في ${reportDate}</div>
  </div>
</div>

<!-- صفحة الفهرس -->
<div class="page">
  <div class="header">
    <div class="header-bar">${companyName}</div>
    <div class="header-bar sub">(${companyType})</div>
  </div>
  
  <div class="page-title">
    <h2>الفهرس</h2>
  </div>
  
  <table class="index-table">
    <tbody>
      <tr><td>تقرير المراجع المستقل</td><td>1-2</td></tr>
      <tr><td>قائمة المركز المالي</td><td>3</td></tr>
      <tr><td>قائمة الدخل الشامل</td><td>4</td></tr>
      <tr><td>قائمة التغيرات في حقوق الملكية</td><td>5</td></tr>
      <tr><td>قائمة التدفقات النقدية</td><td>6</td></tr>
      <tr><td>إيضاحات حول القوائم المالية</td><td>7-11</td></tr>
    </tbody>
  </table>
  
  <div class="footer">
    <div class="page-num">- 2 -</div>
  </div>
</div>

<!-- قائمة المركز المالي -->
<div class="page">
  <div class="header">
    <div class="header-bar">${companyName}</div>
    <div class="header-bar sub">(${companyType})</div>
    <div class="header-bar title">قائمة المركز المالي كما في ${reportDate}</div>
  </div>
  
  <p style="text-align: center; color: #666; font-size: 10pt; margin-bottom: 20px;">(المبالغ بالريال السعودي ما لم يذكر غير ذلك)</p>
  
  <table>
    <thead>
      <tr>
        <th style="width: 60%">البيان</th>
        <th class="note-col">إيضاح</th>
        <th class="amount">المبلغ</th>
      </tr>
    </thead>
    <tbody>
      <!-- الأصول -->
      <tr class="section-header"><td colspan="3">الأصول</td></tr>
      
      <!-- الأصول المتداولة -->
      <tr class="sub-total"><td colspan="3">الأصول المتداولة</td></tr>
      ${data.balanceSheet.currentAssets.map((item, idx) => `
        <tr>
          <td class="indent">${item.name}</td>
          <td class="note-col">${item.note || (idx + 4)}</td>
          <td class="amount">${formatNumber(item.amount)}</td>
        </tr>
      `).join('')}
      <tr class="sub-total">
        <td>مجموع الأصول المتداولة</td>
        <td></td>
        <td class="amount">${formatNumber(data.balanceSheet.totalCurrentAssets)}</td>
      </tr>
      
      <!-- الأصول غير المتداولة -->
      ${data.balanceSheet.nonCurrentAssets.length > 0 ? `
        <tr class="sub-total"><td colspan="3">الأصول غير المتداولة</td></tr>
        ${data.balanceSheet.nonCurrentAssets.map((item, idx) => `
          <tr>
            <td class="indent">${item.name}</td>
            <td class="note-col">${item.note || ''}</td>
            <td class="amount">${formatNumber(item.amount)}</td>
          </tr>
        `).join('')}
        <tr class="sub-total">
          <td>مجموع الأصول غير المتداولة</td>
          <td></td>
          <td class="amount">${formatNumber(data.balanceSheet.totalNonCurrentAssets)}</td>
        </tr>
      ` : ''}
      
      <tr class="total-row">
        <td>مجموع الأصول</td>
        <td></td>
        <td class="amount">${formatNumber(data.balanceSheet.totalAssets)}</td>
      </tr>
      
      <!-- حقوق الملكية والالتزامات -->
      <tr class="section-header"><td colspan="3">حقوق الملكية والالتزامات</td></tr>
      
      <!-- حقوق الملكية -->
      <tr class="sub-total"><td colspan="3">حقوق الملكية</td></tr>
      ${data.balanceSheet.equity.map((item, idx) => `
        <tr>
          <td class="indent">${item.name}</td>
          <td class="note-col">${item.note || ''}</td>
          <td class="amount">${formatNumber(item.amount)}</td>
        </tr>
      `).join('')}
      <tr class="sub-total">
        <td>مجموع حقوق الملكية</td>
        <td></td>
        <td class="amount">${formatNumber(data.balanceSheet.totalEquity)}</td>
      </tr>
      
      <!-- الالتزامات المتداولة -->
      <tr class="sub-total"><td colspan="3">الالتزامات المتداولة</td></tr>
      ${data.balanceSheet.currentLiabilities.map((item, idx) => `
        <tr>
          <td class="indent">${item.name}</td>
          <td class="note-col">${item.note || ''}</td>
          <td class="amount">${formatNumber(item.amount)}</td>
        </tr>
      `).join('')}
      <tr class="sub-total">
        <td>مجموع الالتزامات المتداولة</td>
        <td></td>
        <td class="amount">${formatNumber(data.balanceSheet.totalCurrentLiabilities)}</td>
      </tr>
      
      <tr class="sub-total">
        <td>مجموع الالتزامات</td>
        <td></td>
        <td class="amount">${formatNumber(data.balanceSheet.totalLiabilities)}</td>
      </tr>
      
      <tr class="total-row">
        <td>مجموع حقوق الملكية والالتزامات</td>
        <td></td>
        <td class="amount">${formatNumber(data.balanceSheet.totalLiabilitiesAndEquity)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <div class="note">الإيضاحات المرفقة حول القوائم المالية من إيضاح رقم (1) إلى إيضاح رقم (16) جزء لا يتجزأ منها وتقرأ معها.</div>
    <div class="page-num">- 3 -</div>
  </div>
</div>

<!-- قائمة الدخل الشامل -->
<div class="page">
  <div class="header">
    <div class="header-bar">${companyName}</div>
    <div class="header-bar sub">(${companyType})</div>
    <div class="header-bar title">قائمة الدخل الشامل للفترة المنتهية في ${reportDate}</div>
  </div>
  
  <p style="text-align: center; color: #666; font-size: 10pt; margin-bottom: 20px;">(المبالغ بالريال السعودي ما لم يذكر غير ذلك)</p>
  
  <table>
    <thead>
      <tr>
        <th style="width: 60%">البيان</th>
        <th class="note-col">إيضاح</th>
        <th class="amount">المبلغ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>الإيرادات</td>
        <td class="note-col"></td>
        <td class="amount">${formatNumber(data.incomeStatement.revenue)}</td>
      </tr>
      <tr>
        <td>تكلفة الإيرادات</td>
        <td class="note-col">14</td>
        <td class="amount">(${formatNumber(data.incomeStatement.costOfRevenue)})</td>
      </tr>
      <tr class="sub-total">
        <td>إجمالي الربح</td>
        <td></td>
        <td class="amount">${formatNumber(data.incomeStatement.grossProfit)}</td>
      </tr>
      <tr>
        <td>مصاريف عمومية وإدارية</td>
        <td class="note-col">15</td>
        <td class="amount">(${formatNumber(data.incomeStatement.generalAndAdminExpenses)})</td>
      </tr>
      <tr class="sub-total">
        <td>${data.incomeStatement.operatingProfit >= 0 ? 'الربح' : 'الخسارة'} من العمليات التشغيلية</td>
        <td></td>
        <td class="amount">${formatNumber(data.incomeStatement.operatingProfit)}</td>
      </tr>
      <tr>
        <td>${data.incomeStatement.profitBeforeZakat >= 0 ? 'الربح' : 'الخسارة'} قبل الزكاة</td>
        <td></td>
        <td class="amount">${formatNumber(data.incomeStatement.profitBeforeZakat)}</td>
      </tr>
      <tr>
        <td>الزكاة</td>
        <td class="note-col">11</td>
        <td class="amount">(${formatNumber(data.incomeStatement.zakat)})</td>
      </tr>
      <tr class="total-row">
        <td>${data.incomeStatement.netProfit >= 0 ? 'صافي الربح' : 'صافي الخسارة'} للفترة</td>
        <td></td>
        <td class="amount">${formatNumber(data.incomeStatement.netProfit)}</td>
      </tr>
      
      <tr class="section-header"><td colspan="3">الدخل الشامل الآخر</td></tr>
      <tr>
        <td class="indent">دخل شامل آخر لن يعاد تصنيفه إلى الدخل</td>
        <td></td>
        <td class="amount">${formatNumber(data.incomeStatement.otherComprehensiveIncome)}</td>
      </tr>
      <tr class="total-row">
        <td>إجمالي الدخل الشامل</td>
        <td></td>
        <td class="amount">${formatNumber(data.incomeStatement.totalComprehensiveIncome)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <div class="note">الإيضاحات المرفقة حول القوائم المالية من إيضاح رقم (1) إلى إيضاح رقم (16) جزء لا يتجزأ منها وتقرأ معها.</div>
    <div class="page-num">- 4 -</div>
  </div>
</div>

<!-- قائمة التدفقات النقدية -->
<div class="page">
  <div class="header">
    <div class="header-bar">${companyName}</div>
    <div class="header-bar sub">(${companyType})</div>
    <div class="header-bar title">قائمة التدفقات النقدية للفترة المنتهية في ${reportDate}</div>
  </div>
  
  <p style="text-align: center; color: #666; font-size: 10pt; margin-bottom: 20px;">(المبالغ بالريال السعودي ما لم يذكر غير ذلك)</p>
  
  <table>
    <tbody>
      <tr class="section-header"><td colspan="2">الأنشطة التشغيلية</td></tr>
      <tr>
        <td>${data.cashFlow.operatingActivities.profitBeforeZakat >= 0 ? 'الربح' : 'الخسارة'} قبل الزكاة</td>
        <td class="amount">${formatNumber(data.cashFlow.operatingActivities.profitBeforeZakat)}</td>
      </tr>
      ${data.cashFlow.operatingActivities.adjustmentsToReconcile.map(item => `
        <tr>
          <td class="indent">${item.name}</td>
          <td class="amount">${formatNumber(item.amount)}</td>
        </tr>
      `).join('')}
      <tr>
        <td>الزكاة المدفوعة</td>
        <td class="amount">(${formatNumber(data.cashFlow.operatingActivities.zakatPaid)})</td>
      </tr>
      <tr class="sub-total">
        <td>صافي النقد ${data.cashFlow.operatingActivities.netOperatingCashFlow >= 0 ? 'الناتج من' : 'المستخدم في'} الأنشطة التشغيلية</td>
        <td class="amount">${formatNumber(data.cashFlow.operatingActivities.netOperatingCashFlow)}</td>
      </tr>
      
      <tr class="section-header"><td colspan="2">الأنشطة الاستثمارية</td></tr>
      ${data.cashFlow.investingActivities.map(item => `
        <tr>
          <td class="indent">${item.name}</td>
          <td class="amount">${item.amount >= 0 ? formatNumber(item.amount) : '(' + formatNumber(Math.abs(item.amount)) + ')'}</td>
        </tr>
      `).join('')}
      <tr class="sub-total">
        <td>صافي النقد ${data.cashFlow.netInvestingCashFlow >= 0 ? 'الناتج من' : 'المستخدم في'} الأنشطة الاستثمارية</td>
        <td class="amount">${formatNumber(data.cashFlow.netInvestingCashFlow)}</td>
      </tr>
      
      <tr class="section-header"><td colspan="2">الأنشطة التمويلية</td></tr>
      ${data.cashFlow.financingActivities.map(item => `
        <tr>
          <td class="indent">${item.name}</td>
          <td class="amount">${formatNumber(item.amount)}</td>
        </tr>
      `).join('')}
      <tr class="sub-total">
        <td>صافي النقد ${data.cashFlow.netFinancingCashFlow >= 0 ? 'الناتج من' : 'المستخدم في'} الأنشطة التمويلية</td>
        <td class="amount">${formatNumber(data.cashFlow.netFinancingCashFlow)}</td>
      </tr>
      
      <tr class="total-row">
        <td>صافي التغير في النقد</td>
        <td class="amount">${formatNumber(data.cashFlow.netChangeInCash)}</td>
      </tr>
      <tr>
        <td>النقد في بداية الفترة</td>
        <td class="amount">${formatNumber(data.cashFlow.openingCashBalance)}</td>
      </tr>
      <tr class="total-row">
        <td>النقد في نهاية الفترة</td>
        <td class="amount">${formatNumber(data.cashFlow.closingCashBalance)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <div class="note">الإيضاحات المرفقة حول القوائم المالية من إيضاح رقم (1) إلى إيضاح رقم (16) جزء لا يتجزأ منها وتقرأ معها.</div>
    <div class="page-num">- 6 -</div>
  </div>
</div>

<!-- الإيضاحات -->
<div class="page">
  <div class="header">
    <div class="header-bar">${companyName}</div>
    <div class="header-bar sub">(${companyType})</div>
    <div class="header-bar title">إيضاحات حول القوائم المالية في ${reportDate}</div>
  </div>
  
  <p style="text-align: center; color: #666; font-size: 10pt; margin-bottom: 20px;">(المبالغ بالريال السعودي ما لم يذكر غير ذلك)</p>
  
  <!-- السياسات المحاسبية -->
  ${data.notes.accountingPolicies ? `
    <div class="note-title">3- السياسات المحاسبية الهامة</div>
    ${data.notes.accountingPolicies.policies.map((policy, idx) => `
      <div class="note-content">
        <strong>3-${idx + 1} ${policy.title}</strong><br/>
        ${policy.content}
      </div>
    `).join('')}
  ` : ''}
  
  <!-- مخصص الزكاة -->
  ${data.notes.zakat ? `
    <div class="note-title">11- مخصص الزكاة</div>
    <table>
      <thead>
        <tr><th colspan="2">أ- احتساب المخصص</th></tr>
      </thead>
      <tbody>
        <tr><td>الربح (الخسارة) قبل الزكاة</td><td class="amount">${formatNumber(data.notes.zakat.profitBeforeZakat)}</td></tr>
        <tr><td>صافي الربح المعدل</td><td class="amount">${formatNumber(data.notes.zakat.adjustedNetProfit)}</td></tr>
        <tr><td>الزكاة الشرعية طبقاً لصافي الربح المعدل</td><td class="amount">${formatNumber(data.notes.zakat.zakatOnAdjustedProfit)}</td></tr>
      </tbody>
    </table>
    
    <table>
      <thead><tr><th colspan="2">الوعاء الزكوي</th></tr></thead>
      <tbody>
        <tr><td>رأس المال</td><td class="amount">${formatNumber(data.notes.zakat.capital)}</td></tr>
        <tr><td>جاري الشركاء</td><td class="amount">${formatNumber(data.notes.zakat.partnersCurrentAccount)}</td></tr>
        <tr class="sub-total"><td>المجموع</td><td class="amount">${formatNumber(data.notes.zakat.zakatBaseSubtotal)}</td></tr>
        <tr><td>ينزل: العقارات والآلات والمعدات، صافي</td><td class="amount">(${formatNumber(data.notes.zakat.fixedAssetsNet)})</td></tr>
        <tr class="sub-total"><td>وعاء الزكاة</td><td class="amount">${formatNumber(data.notes.zakat.zakatBase)}</td></tr>
        <tr class="total-row"><td>إجمالي مخصص الزكاة</td><td class="amount">${formatNumber(data.notes.zakat.totalZakatProvision)}</td></tr>
      </tbody>
    </table>
  ` : ''}
  
  <div class="footer">
    <div class="page-num">- 7 -</div>
  </div>
</div>

</body>
</html>
`;
}

// فتح نافذة طباعة PDF
export function printFinancialStatementsPDF(data: ComprehensiveFinancialData) {
  const html = generateFinancialStatementsPDF(data);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // انتظار تحميل الخطوط ثم الطباعة
  setTimeout(() => {
    printWindow.print();
  }, 1000);
}
