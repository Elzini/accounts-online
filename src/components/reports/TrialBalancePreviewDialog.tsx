import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TrialBalanceData {
  companyName: string;
  vatNumber: string;
  period: { from: string; to: string };
  fixedAssets: { [key: string]: number };
  currentAssets: { [key: string]: number };
  liabilities: { [key: string]: number };
  equity: { [key: string]: number };
  revenue: { [key: string]: number };
  expenses: { [key: string]: number };
  purchases: number;
}

interface TrialBalancePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: TrialBalanceData;
  calculations: {
    totalRevenue: number;
    costOfSales: number;
    grossProfit: number;
    totalExpenses: number;
    netIncome: number;
    totalFixedAssets: number;
    totalCurrentAssets: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    adjustedEquity: number;
    totalLiabilitiesAndEquity: number;
    capitalForZakat: number;
    zakatBase: number;
    zakatDue: number;
    prepaidRentLongTerm: number;
  };
}

export function TrialBalancePreviewDialog({ 
  open, 
  onOpenChange, 
  data, 
  calculations 
}: TrialBalancePreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تحليل ميزان المراجعة - ${data.companyName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4 portrait; margin: 15mm; }
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
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            text-align: center;
          }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .section {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            margin-bottom: 15px;
            overflow: hidden;
          }
          .section-header {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            padding: 12px 16px;
            font-weight: bold;
            font-size: 16px;
          }
          .section-content { padding: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 12px; text-align: right; border-bottom: 1px solid #e5e7eb; }
          th { background: #f3f4f6; font-weight: 600; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .bg-primary { background: #eff6ff; }
          .text-green { color: #16a34a; }
          .text-red { color: #dc2626; }
          .text-primary { color: #2563eb; }
          .total-row { background: #f0f9ff; font-weight: bold; }
          .sub-header { font-weight: 600; background: #fafafa; }
          .indent { padding-right: 24px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .footer {
            margin-top: 20px;
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
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
          }
          .print-btn-primary {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
          }
          .print-btn-secondary {
            background: #f1f5f9;
            color: #475569;
          }
          @media print {
            .print-actions { display: none !important; }
            body { padding: 0; }
            .header, .section-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.companyName || 'الشركة'}</h1>
          <p>تحليل ميزان المراجعة - للفترة من ${data.period.from || '-'} إلى ${data.period.to || '-'}</p>
          <p style="margin-top: 5px; font-size: 12px;">تاريخ التقرير: ${currentDate}</p>
        </div>

        <!-- قائمة الدخل -->
        <div class="section">
          <div class="section-header">📊 قائمة الدخل</div>
          <div class="section-content">
            <table>
              <thead>
                <tr><th>البند</th><th class="text-left">المبلغ (ر.س)</th></tr>
              </thead>
              <tbody>
                <tr><td>إيرادات المبيعات</td><td class="text-left">${formatCurrency(calculations.totalRevenue)}</td></tr>
                <tr><td class="text-red">(-) تكلفة المبيعات (المشتريات)</td><td class="text-left text-red">(${formatCurrency(calculations.costOfSales)})</td></tr>
                <tr class="total-row"><td>مجمل الربح / (الخسارة)</td><td class="text-left">${formatCurrency(calculations.grossProfit)}</td></tr>
                <tr class="sub-header"><td colspan="2">المصاريف التشغيلية:</td></tr>
                ${Object.entries(data.expenses).map(([name, amount]) => `
                  <tr><td class="indent">- ${name}</td><td class="text-left">${formatCurrency(amount)}</td></tr>
                `).join('')}
                <tr><td class="text-red">إجمالي المصاريف التشغيلية</td><td class="text-left text-red">(${formatCurrency(calculations.totalExpenses)})</td></tr>
                <tr class="total-row bg-primary">
                  <td class="font-bold">صافي الربح / (الخسارة)</td>
                  <td class="text-left font-bold ${calculations.netIncome >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(calculations.netIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- قائمة المركز المالي -->
        <div class="section">
          <div class="section-header">🏦 قائمة المركز المالي (الميزانية العمومية)</div>
          <div class="section-content">
            <div class="grid-2">
              <!-- الأصول -->
              <div>
                <table>
                  <thead><tr><th colspan="2">الأصول</th></tr></thead>
                  <tbody>
                    <tr class="sub-header"><td colspan="2">الأصول الثابتة:</td></tr>
                    ${Object.entries(data.fixedAssets).map(([name, amount]) => `
                      <tr><td class="indent">- ${name}</td><td class="text-left">${formatCurrency(amount)}</td></tr>
                    `).join('')}
                    <tr class="total-row"><td>إجمالي الأصول الثابتة</td><td class="text-left">${formatCurrency(calculations.totalFixedAssets)}</td></tr>
                    <tr class="sub-header"><td colspan="2">الأصول المتداولة:</td></tr>
                    ${Object.entries(data.currentAssets).map(([name, amount]) => `
                      <tr><td class="indent">- ${name}</td><td class="text-left">${formatCurrency(amount)}</td></tr>
                    `).join('')}
                    <tr class="total-row"><td>إجمالي الأصول المتداولة</td><td class="text-left">${formatCurrency(calculations.totalCurrentAssets)}</td></tr>
                    <tr class="total-row bg-primary"><td class="font-bold">إجمالي الأصول</td><td class="text-left font-bold">${formatCurrency(calculations.totalAssets)}</td></tr>
                  </tbody>
                </table>
              </div>
              <!-- الخصوم وحقوق الملكية -->
              <div>
                <table>
                  <thead><tr><th colspan="2">الخصوم وحقوق الملكية</th></tr></thead>
                  <tbody>
                    <tr class="sub-header"><td colspan="2">الخصوم المتداولة:</td></tr>
                    ${Object.entries(data.liabilities).map(([name, amount]) => `
                      <tr><td class="indent">- ${name}</td><td class="text-left">${formatCurrency(amount)}</td></tr>
                    `).join('')}
                    <tr class="total-row"><td>إجمالي الخصوم المتداولة</td><td class="text-left">${formatCurrency(calculations.totalLiabilities)}</td></tr>
                    <tr class="sub-header"><td colspan="2">حقوق الملكية:</td></tr>
                    ${Object.entries(data.equity).map(([name, amount]) => `
                      <tr><td class="indent">- ${name}</td><td class="text-left">${formatCurrency(amount)}</td></tr>
                    `).join('')}
                    <tr><td class="indent">- صافي الربح / (الخسارة)</td><td class="text-left ${calculations.netIncome >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(calculations.netIncome)}</td></tr>
                    <tr class="total-row"><td>إجمالي حقوق الملكية</td><td class="text-left">${formatCurrency(calculations.adjustedEquity)}</td></tr>
                    <tr class="total-row bg-primary"><td class="font-bold">إجمالي الخصوم وحقوق الملكية</td><td class="text-left font-bold">${formatCurrency(calculations.totalLiabilitiesAndEquity)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- حساب الزكاة -->
        <div class="section">
          <div class="section-header">🕌 حساب الزكاة الشرعية</div>
          <div class="section-content">
            <table style="max-width: 500px;">
              <tbody>
                <tr class="sub-header"><td colspan="2">الوعاء الزكوي:</td></tr>
                <tr><td>(+) رأس المال المستثمر</td><td class="text-left">${formatCurrency(calculations.capitalForZakat)}</td></tr>
                <tr><td>(+/-) صافي الربح / الخسارة</td><td class="text-left ${calculations.netIncome >= 0 ? '' : 'text-red'}">${formatCurrency(calculations.netIncome)}</td></tr>
                <tr class="total-row"><td>إجمالي مصادر التمويل</td><td class="text-left">${formatCurrency(calculations.capitalForZakat + calculations.netIncome)}</td></tr>
                <tr class="sub-header"><td colspan="2">الحسميات:</td></tr>
                <tr><td class="text-red">(-) الأصول الثابتة</td><td class="text-left text-red">(${formatCurrency(calculations.totalFixedAssets)})</td></tr>
                ${calculations.prepaidRentLongTerm > 0 ? `
                  <tr><td class="text-red">(-) الإيجار المدفوع مقدماً (طويل الأجل)</td><td class="text-left text-red">(${formatCurrency(calculations.prepaidRentLongTerm)})</td></tr>
                ` : ''}
                <tr class="total-row"><td>الوعاء الزكوي المعدل</td><td class="text-left ${calculations.zakatBase >= 0 ? '' : 'text-red'}">${formatCurrency(calculations.zakatBase)}</td></tr>
                <tr><td>نسبة الزكاة</td><td class="text-left">2.5%</td></tr>
                <tr class="total-row bg-primary"><td class="font-bold">الزكاة المستحقة</td><td class="text-left font-bold text-primary">${formatCurrency(calculations.zakatDue)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="footer">
          تم إنشاء هذا التقرير بواسطة نظام إدارة معرض السيارات
        </div>

        <div class="print-actions">
          <button class="print-btn print-btn-primary" onclick="window.print()">🖨️ طباعة</button>
          <button class="print-btn print-btn-secondary" onclick="window.close()">✕ إغلاق</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
      }

      pdf.save(`تحليل_ميزان_المراجعة_${data.period.to || new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>معاينة التقرير</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 ml-2" />
                طباعة
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-4 h-4 ml-2" />
                تصدير PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden bg-gray-50 p-4">
          <div ref={printRef} className="bg-white p-6 rounded-lg" dir="rtl" style={{ fontFamily: 'Segoe UI, Tahoma, Arial, sans-serif' }}>
            {/* Header */}
            <div className="bg-gradient-to-l from-blue-600 to-blue-500 text-white p-5 rounded-lg mb-6 text-center">
              <h1 className="text-2xl font-bold mb-1">{data.companyName || 'الشركة'}</h1>
              <p className="text-sm opacity-90">تحليل ميزان المراجعة - للفترة من {data.period.from || '-'} إلى {data.period.to || '-'}</p>
              <p className="text-xs opacity-80 mt-1">تاريخ التقرير: {currentDate}</p>
            </div>

            {/* قائمة الدخل */}
            <div className="border rounded-lg mb-4 overflow-hidden">
              <div className="bg-gradient-to-l from-blue-600 to-blue-500 text-white px-4 py-3 font-bold">
                📊 قائمة الدخل
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-100">
                      <th className="py-2 px-3 text-right">البند</th>
                      <th className="py-2 px-3 text-left">المبلغ (ر.س)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-3">إيرادات المبيعات</td>
                      <td className="py-2 px-3 text-left">{formatCurrency(calculations.totalRevenue)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-3 text-red-600">(-) تكلفة المبيعات (المشتريات)</td>
                      <td className="py-2 px-3 text-left text-red-600">({formatCurrency(calculations.costOfSales)})</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <td className="py-2 px-3 font-semibold">مجمل الربح / (الخسارة)</td>
                      <td className="py-2 px-3 text-left font-semibold">{formatCurrency(calculations.grossProfit)}</td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-2 px-3 font-semibold" colSpan={2}>المصاريف التشغيلية:</td>
                    </tr>
                    {Object.entries(data.expenses).map(([name, amount]) => (
                      <tr key={name} className="border-b">
                        <td className="py-1 px-3 pr-6">- {name}</td>
                        <td className="py-1 px-3 text-left">{formatCurrency(amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-b">
                      <td className="py-2 px-3 text-red-600">إجمالي المصاريف التشغيلية</td>
                      <td className="py-2 px-3 text-left text-red-600">({formatCurrency(calculations.totalExpenses)})</td>
                    </tr>
                    <tr className="bg-blue-100">
                      <td className="py-3 px-3 font-bold">صافي الربح / (الخسارة)</td>
                      <td className={`py-3 px-3 text-left font-bold ${calculations.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(calculations.netIncome)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* قائمة المركز المالي */}
            <div className="border rounded-lg mb-4 overflow-hidden">
              <div className="bg-gradient-to-l from-blue-600 to-blue-500 text-white px-4 py-3 font-bold">
                🏦 قائمة المركز المالي
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* الأصول */}
                  <div>
                    <h3 className="font-bold mb-2 text-blue-600">الأصول</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="bg-gray-50"><td className="py-2 font-semibold" colSpan={2}>الأصول الثابتة:</td></tr>
                        {Object.entries(data.fixedAssets).map(([name, amount]) => (
                          <tr key={name} className="border-b">
                            <td className="py-1 pr-4">- {name}</td>
                            <td className="py-1 text-left">{formatCurrency(amount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50 border-b">
                          <td className="py-2">إجمالي الأصول الثابتة</td>
                          <td className="py-2 text-left font-medium">{formatCurrency(calculations.totalFixedAssets)}</td>
                        </tr>
                        <tr className="bg-gray-50"><td className="py-2 font-semibold" colSpan={2}>الأصول المتداولة:</td></tr>
                        {Object.entries(data.currentAssets).map(([name, amount]) => (
                          <tr key={name} className="border-b">
                            <td className="py-1 pr-4">- {name}</td>
                            <td className="py-1 text-left">{formatCurrency(amount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50 border-b">
                          <td className="py-2">إجمالي الأصول المتداولة</td>
                          <td className="py-2 text-left font-medium">{formatCurrency(calculations.totalCurrentAssets)}</td>
                        </tr>
                        <tr className="bg-blue-100">
                          <td className="py-2 font-bold">إجمالي الأصول</td>
                          <td className="py-2 text-left font-bold">{formatCurrency(calculations.totalAssets)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* الخصوم وحقوق الملكية */}
                  <div>
                    <h3 className="font-bold mb-2 text-blue-600">الخصوم وحقوق الملكية</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="bg-gray-50"><td className="py-2 font-semibold" colSpan={2}>الخصوم المتداولة:</td></tr>
                        {Object.entries(data.liabilities).map(([name, amount]) => (
                          <tr key={name} className="border-b">
                            <td className="py-1 pr-4">- {name}</td>
                            <td className="py-1 text-left">{formatCurrency(amount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50 border-b">
                          <td className="py-2">إجمالي الخصوم المتداولة</td>
                          <td className="py-2 text-left font-medium">{formatCurrency(calculations.totalLiabilities)}</td>
                        </tr>
                        <tr className="bg-gray-50"><td className="py-2 font-semibold" colSpan={2}>حقوق الملكية:</td></tr>
                        {Object.entries(data.equity).map(([name, amount]) => (
                          <tr key={name} className="border-b">
                            <td className="py-1 pr-4">- {name}</td>
                            <td className="py-1 text-left">{formatCurrency(amount)}</td>
                          </tr>
                        ))}
                        <tr className="border-b">
                          <td className="py-1 pr-4">- صافي الربح / (الخسارة)</td>
                          <td className={`py-1 text-left ${calculations.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculations.netIncome)}
                          </td>
                        </tr>
                        <tr className="bg-blue-50 border-b">
                          <td className="py-2">إجمالي حقوق الملكية</td>
                          <td className="py-2 text-left font-medium">{formatCurrency(calculations.adjustedEquity)}</td>
                        </tr>
                        <tr className="bg-blue-100">
                          <td className="py-2 font-bold">إجمالي الخصوم وحقوق الملكية</td>
                          <td className="py-2 text-left font-bold">{formatCurrency(calculations.totalLiabilitiesAndEquity)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* حساب الزكاة */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gradient-to-l from-blue-600 to-blue-500 text-white px-4 py-3 font-bold">
                🕌 حساب الزكاة الشرعية
              </div>
              <div className="p-4">
                <table className="w-full text-sm max-w-xl">
                  <tbody>
                    <tr className="bg-gray-50"><td className="py-2 font-semibold" colSpan={2}>الوعاء الزكوي:</td></tr>
                    <tr className="border-b">
                      <td className="py-1 px-3">(+) رأس المال المستثمر</td>
                      <td className="py-1 text-left">{formatCurrency(calculations.capitalForZakat)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1 px-3">(+/-) صافي الربح / الخسارة</td>
                      <td className={`py-1 text-left ${calculations.netIncome >= 0 ? '' : 'text-red-600'}`}>
                        {formatCurrency(calculations.netIncome)}
                      </td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <td className="py-2 px-3">إجمالي مصادر التمويل</td>
                      <td className="py-2 text-left font-medium">{formatCurrency(calculations.capitalForZakat + calculations.netIncome)}</td>
                    </tr>
                    <tr className="bg-gray-50"><td className="py-2 font-semibold" colSpan={2}>الحسميات:</td></tr>
                    <tr className="border-b">
                      <td className="py-1 px-3 text-red-600">(-) الأصول الثابتة</td>
                      <td className="py-1 text-left text-red-600">({formatCurrency(calculations.totalFixedAssets)})</td>
                    </tr>
                    {calculations.prepaidRentLongTerm > 0 && (
                      <tr className="border-b">
                        <td className="py-1 px-3 text-red-600">(-) الإيجار المدفوع مقدماً (طويل الأجل)</td>
                        <td className="py-1 text-left text-red-600">({formatCurrency(calculations.prepaidRentLongTerm)})</td>
                      </tr>
                    )}
                    <tr className="border-b bg-blue-50">
                      <td className="py-2 px-3 font-semibold">الوعاء الزكوي المعدل</td>
                      <td className={`py-2 text-left font-bold ${calculations.zakatBase >= 0 ? '' : 'text-red-600'}`}>
                        {formatCurrency(calculations.zakatBase)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-3">نسبة الزكاة</td>
                      <td className="py-2 text-left">2.5%</td>
                    </tr>
                    <tr className="bg-blue-100">
                      <td className="py-3 px-3 font-bold text-lg">الزكاة المستحقة</td>
                      <td className="py-3 text-left font-bold text-lg text-blue-600">{formatCurrency(calculations.zakatDue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-gray-400 text-xs border-t pt-4">
              تم إنشاء هذا التقرير بواسطة نظام إدارة معرض السيارات
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
