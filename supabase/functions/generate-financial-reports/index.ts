import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinancialData {
  companyName: string;
  period: string;
  // Income Statement
  revenue: number;
  cogs: number;
  adminExpenses: number;
  operatingExpenses: number;
  // Balance Sheet
  fixedAssets: number;
  currentAssets: number;
  liabilities: number;
  capital: number;
  ownerDrawings: number;
  // Zakat
  prepaidRent: number;
  zakatRate: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: FinancialData = await req.json();
    
    // Calculate values
    const grossProfit = data.revenue - data.cogs;
    const totalExpenses = data.adminExpenses + data.operatingExpenses;
    const netProfit = grossProfit - totalExpenses;
    
    const totalAssets = data.fixedAssets + data.currentAssets;
    const totalEquity = data.capital + data.ownerDrawings + netProfit;
    
    // Zakat calculation
    const zakatSources = data.capital + data.ownerDrawings;
    const prepaidRentDeduction = (data.prepaidRent * 11) / 12;
    const zakatDeductions = data.fixedAssets + prepaidRentDeduction;
    const zakatBase = zakatSources - zakatDeductions;
    const zakatAmount = zakatBase * (data.zakatRate / 100);

    // Generate CSV content (Excel compatible)
    const csvContent = `شركة ${data.companyName}
القوائم المالية
الفترة: ${data.period}

=== قائمة الدخل ===
البند,المبلغ (ريال)
الإيرادات (المبيعات),${data.revenue.toFixed(2)}
(-) تكلفة المبيعات,${(-data.cogs).toFixed(2)}
إجمالي الربح/(الخسارة),${grossProfit.toFixed(2)}
(-) المصاريف الإدارية,${(-data.adminExpenses).toFixed(2)}
(-) مصاريف التشغيل,${(-data.operatingExpenses).toFixed(2)}
صافي الربح/(الخسارة),${netProfit.toFixed(2)}

=== قائمة المركز المالي ===
الأصول,
الأصول الثابتة,${data.fixedAssets.toFixed(2)}
الأصول المتداولة,${data.currentAssets.toFixed(2)}
إجمالي الأصول,${totalAssets.toFixed(2)}

حقوق الملكية,
رأس المال,${data.capital.toFixed(2)}
جاري المالك,${data.ownerDrawings.toFixed(2)}
صافي الربح/(الخسارة),${netProfit.toFixed(2)}
إجمالي حقوق الملكية,${totalEquity.toFixed(2)}

=== حساب الزكاة ===
مصادر الوعاء الزكوي,
رأس المال,${data.capital.toFixed(2)}
جاري المالك,${data.ownerDrawings.toFixed(2)}
إجمالي المصادر,${zakatSources.toFixed(2)}

الحسميات,
(-) الأصول الثابتة,${(-data.fixedAssets).toFixed(2)}
(-) 11/12 من الإيجار المدفوع مقدماً,${(-prepaidRentDeduction).toFixed(2)}
إجمالي الحسميات,${(-zakatDeductions).toFixed(2)}

الوعاء الزكوي,${zakatBase.toFixed(2)}
نسبة الزكاة,${data.zakatRate}%
مبلغ الزكاة المستحقة,${zakatAmount.toFixed(2)}
`;

    // Generate HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Arial', sans-serif; padding: 40px; direction: rtl; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .header h1 { color: #1a365d; margin: 0; }
    .header p { color: #666; margin: 5px 0; }
    .section { margin: 25px 0; }
    .section h2 { background: #1a365d; color: white; padding: 10px 15px; margin: 0; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 0; }
    th, td { padding: 10px 15px; text-align: right; border: 1px solid #ddd; }
    th { background: #f0f0f0; }
    .total { font-weight: bold; background: #e8f4f8; }
    .negative { color: #c53030; }
    .positive { color: #2f855a; }
    .zakat-result { background: #48bb78; color: white; font-size: 18px; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.companyName}</h1>
    <p>القوائم المالية</p>
    <p>الفترة: ${data.period}</p>
  </div>

  <div class="section">
    <h2>📋 قائمة الدخل</h2>
    <table>
      <tr><td>الإيرادات (المبيعات)</td><td>${data.revenue.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr><td>(-) تكلفة المبيعات (المشتريات)</td><td class="negative">(${data.cogs.toLocaleString('ar-SA', {minimumFractionDigits: 2})})</td></tr>
      <tr class="total"><td>إجمالي الربح/(الخسارة)</td><td class="${grossProfit >= 0 ? 'positive' : 'negative'}">${grossProfit.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr><td>(-) المصاريف العمومية والإدارية</td><td class="negative">(${data.adminExpenses.toLocaleString('ar-SA', {minimumFractionDigits: 2})})</td></tr>
      <tr><td>(-) مصاريف التشغيل</td><td class="negative">(${data.operatingExpenses.toLocaleString('ar-SA', {minimumFractionDigits: 2})})</td></tr>
      <tr class="total"><td>صافي الربح/(الخسارة)</td><td class="${netProfit >= 0 ? 'positive' : 'negative'}">${netProfit.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>📋 قائمة المركز المالي</h2>
    <table>
      <tr><th colspan="2">الأصول</th></tr>
      <tr><td>الأصول الثابتة</td><td>${data.fixedAssets.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr><td>الأصول المتداولة</td><td>${data.currentAssets.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr class="total"><td>إجمالي الأصول</td><td>${totalAssets.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr><th colspan="2">حقوق الملكية</th></tr>
      <tr><td>رأس المال</td><td>${data.capital.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr><td>جاري المالك</td><td>${data.ownerDrawings.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr><td>صافي الربح/(الخسارة)</td><td class="${netProfit >= 0 ? 'positive' : 'negative'}">${netProfit.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr class="total"><td>إجمالي حقوق الملكية</td><td>${totalEquity.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>🕌 حساب الزكاة</h2>
    <table>
      <tr><th colspan="2">مصادر الوعاء الزكوي</th></tr>
      <tr><td>رأس المال</td><td>${data.capital.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr><td>جاري المالك</td><td>${data.ownerDrawings.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr class="total"><td>إجمالي المصادر</td><td>${zakatSources.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr><th colspan="2">الحسميات</th></tr>
      <tr><td>(-) الأصول الثابتة</td><td class="negative">(${data.fixedAssets.toLocaleString('ar-SA', {minimumFractionDigits: 2})})</td></tr>
      <tr><td>(-) 11/12 من الإيجار المدفوع مقدماً</td><td class="negative">(${prepaidRentDeduction.toLocaleString('ar-SA', {minimumFractionDigits: 2})})</td></tr>
      <tr class="total"><td>إجمالي الحسميات</td><td class="negative">(${zakatDeductions.toLocaleString('ar-SA', {minimumFractionDigits: 2})})</td></tr>
      <tr class="total"><td>الوعاء الزكوي</td><td>${zakatBase.toLocaleString('ar-SA', {minimumFractionDigits: 2})}</td></tr>
      <tr><td>نسبة الزكاة</td><td>${data.zakatRate}%</td></tr>
      <tr class="zakat-result"><td>💰 مبلغ الزكاة المستحقة</td><td>${zakatAmount.toLocaleString('ar-SA', {minimumFractionDigits: 2})} ريال</td></tr>
    </table>
  </div>

  <div class="footer">
    <p>تم إنشاء هذا التقرير بواسطة نظام أشبال النمار المحاسبي</p>
    <p>تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA')}</p>
  </div>
</body>
</html>`;

    return new Response(JSON.stringify({ 
      success: true,
      csv: csvContent,
      html: htmlContent,
      summary: {
        netProfit,
        totalAssets,
        totalEquity,
        zakatBase,
        zakatAmount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
