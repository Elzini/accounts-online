import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';
import { Custody } from '@/services/custody';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CustodySummary {
  custodyAmount: number;
  totalSpent: number;
  remaining: number;
  returnedAmount: number;
  carriedBalance: number;
  isOverspent: boolean;
}

interface CustodyPrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custody: Custody;
  summary: CustodySummary;
}

export function CustodyPrintPreviewDialog({
  open,
  onOpenChange,
  custody,
  summary,
}: CustodyPrintPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const transactions = custody.transactions || [];
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `تصفية_العهدة_${custody.custody_number}`,
  });

  const handleExportPdf = async () => {
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

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`تصفية_العهدة_${custody.custody_number}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0" dir="rtl">
        <DialogHeader className="sticky top-0 bg-background z-10 p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>معاينة تقرير تصفية العهدة</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                <Printer className="h-4 w-4 ml-1" />
                طباعة
              </Button>
              <Button variant="default" size="sm" onClick={handleExportPdf}>
                <Download className="h-4 w-4 ml-1" />
                تصدير PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-muted/30">
          {/* Print Content */}
          <div
            ref={printRef}
            dir="rtl"
            className="bg-white rounded-lg shadow-sm overflow-hidden"
            style={{
              fontFamily: 'Cairo, Arial, sans-serif',
              minHeight: '100%',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    تصفية العهدة - {custody.custody_name}
                  </h1>
                  <div className="text-blue-100 text-sm">
                    رقم العهدة: {custody.custody_number} | تاريخ الصرف:{' '}
                    {new Date(custody.custody_date).toLocaleDateString('ar-SA')}
                  </div>
                </div>
                <div className="text-left text-sm text-blue-100">
                  <div>تاريخ التقرير: {currentDate}</div>
                  {custody.employee?.name && (
                    <div>المستلم: {custody.employee.name}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
              <div className="bg-white rounded-lg border border-blue-200 p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">مبلغ العهدة</div>
                <div className="text-xl font-bold text-blue-600">
                  {formatNumber(summary.custodyAmount)} ر.س
                </div>
              </div>
              <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">إجمالي المصروفات</div>
                <div className="text-xl font-bold text-red-600">
                  {formatNumber(summary.totalSpent)} ر.س
                </div>
              </div>
              <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">المبلغ المردود</div>
                <div className="text-xl font-bold text-green-600">
                  {formatNumber(summary.returnedAmount)} ر.س
                </div>
              </div>
              <div className="bg-white rounded-lg border border-orange-200 p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">الرصيد المرحل</div>
                <div className="text-xl font-bold text-orange-600">
                  {summary.carriedBalance > 0 ? formatNumber(summary.carriedBalance) : '-'} ر.س
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="p-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="p-3 text-right font-semibold border border-blue-700">التاريخ</th>
                    <th className="p-3 text-right font-semibold border border-blue-700">التحليل</th>
                    <th className="p-3 text-right font-semibold border border-blue-700">البيان</th>
                    <th className="p-3 text-right font-semibold border border-blue-700 w-32">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground border">
                        لا توجد مصروفات مسجلة
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, index) => (
                      <tr
                        key={tx.id}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="p-3 border border-gray-200">
                          {new Date(tx.transaction_date).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {tx.analysis_category || '-'}
                        </td>
                        <td className="p-3 border border-gray-200">{tx.description}</td>
                        <td className="p-3 border border-gray-200 font-medium">
                          {formatNumber(tx.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  {/* Total Row */}
                  <tr className="bg-gray-100">
                    <td
                      colSpan={3}
                      className="p-3 text-left font-bold border border-gray-300"
                    >
                      الإجمالي
                    </td>
                    <td className="p-3 font-bold border border-gray-300 text-blue-600">
                      {formatNumber(summary.totalSpent)}
                    </td>
                  </tr>
                  {/* Returned Amount Row */}
                  <tr className="bg-green-50">
                    <td
                      colSpan={3}
                      className="p-3 text-left font-bold border border-green-200"
                    >
                      المبلغ المردود
                    </td>
                    <td className="p-3 font-bold border border-green-200 text-green-600">
                      {formatNumber(summary.returnedAmount)}
                    </td>
                  </tr>
                  {/* Carried Balance Row */}
                  <tr className="bg-orange-50">
                    <td
                      colSpan={3}
                      className="p-3 text-left font-bold border border-orange-200"
                    >
                      الرصيد المرحل
                    </td>
                    <td className="p-3 font-bold border border-orange-200 text-orange-600">
                      {summary.carriedBalance > 0 ? formatNumber(summary.carriedBalance) : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes Section */}
            {custody.notes && (
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-lg p-4 border-r-4 border-blue-500">
                  <div className="font-bold mb-2 text-gray-700">ملاحظات:</div>
                  <div className="text-gray-600">{custody.notes}</div>
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-3 gap-8 pt-8 border-t">
                <div className="text-center">
                  <div className="border-b border-gray-300 pb-12 mb-2"></div>
                  <div className="text-sm text-muted-foreground">توقيع المستلم</div>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-300 pb-12 mb-2"></div>
                  <div className="text-sm text-muted-foreground">توقيع المحاسب</div>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-300 pb-12 mb-2"></div>
                  <div className="text-sm text-muted-foreground">توقيع المدير</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 px-6 py-4 text-center text-xs text-muted-foreground border-t">
              <div className="flex justify-between items-center">
                <span>تم إنشاء هذا التقرير آلياً</span>
                <span>
                  {custody.status === 'settled' ? (
                    <span className="text-green-600 font-medium">
                      ✓ تمت التصفية بتاريخ{' '}
                      {custody.settlement_date
                        ? new Date(custody.settlement_date).toLocaleDateString('ar-SA')
                        : currentDate}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">⏳ العهدة نشطة - لم تتم التصفية</span>
                  )}
                </span>
                <span>{new Date().toLocaleString('ar-SA')}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
