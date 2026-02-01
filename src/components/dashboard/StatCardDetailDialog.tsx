import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Car, ShoppingCart, DollarSign, TrendingUp, Calculator, Minus, Plus, Equal, Printer, FileSpreadsheet } from 'lucide-react';
import { useExcelExport } from '@/hooks/useExcelExport';
import { usePdfExport } from '@/hooks/usePdfExport';

interface BreakdownItem {
  label: string;
  value: number;
  type?: 'add' | 'subtract' | 'total';
  description?: string;
}

interface CarDetailItem {
  id: string;
  name: string;
  model?: string;
  chassisNumber?: string;
  purchasePrice: number;
  salePrice?: number;
  profit?: number;
  saleDate?: string;
  status?: string;
}

interface StatDetailData {
  title: string;
  value: string | number;
  subtitle?: string;
  breakdown: BreakdownItem[];
  formula?: string;
  notes?: string[];
  // New: detailed car list
  cars?: CarDetailItem[];
  showCarsTable?: boolean;
}

interface StatCardDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: StatDetailData | null;
}

export function StatCardDetailDialog({ open, onOpenChange, data }: StatCardDetailDialogProps) {
  const { exportToExcel } = useExcelExport();
  const { exportToPdf } = usePdfExport();

  if (!data) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
  };

  const formatCurrencyForExport = (value: number) => {
    return `${new Intl.NumberFormat('ar-SA').format(value)} ريال`;
  };

  const handleExportExcel = () => {
    if (!data.cars || data.cars.length === 0) return;
    
    const totalPurchase = data.cars.reduce((sum, c) => sum + c.purchasePrice, 0);
    const totalSale = data.cars.reduce((sum, c) => sum + (c.salePrice || 0), 0);
    const totalProfit = data.cars.reduce((sum, c) => sum + (c.profit || 0), 0);

    exportToExcel({
      title: `تقرير ${data.title}`,
      fileName: `تقرير_${data.title.replace(/\s/g, '_')}_${new Date().toLocaleDateString('ar-SA')}`,
      columns: [
        { header: 'السيارة', key: 'name' },
        { header: 'الموديل', key: 'model' },
        { header: 'رقم الهيكل', key: 'chassisNumber' },
        { header: 'سعر الشراء', key: 'purchasePrice' },
        { header: 'سعر البيع', key: 'salePrice' },
        { header: 'الربح', key: 'profit' },
        { header: 'تاريخ البيع', key: 'saleDate' },
      ],
      data: data.cars.map(car => ({
        name: car.name,
        model: car.model || '-',
        chassisNumber: car.chassisNumber || '-',
        purchasePrice: formatCurrencyForExport(car.purchasePrice),
        salePrice: car.salePrice !== undefined ? formatCurrencyForExport(car.salePrice) : '-',
        profit: car.profit !== undefined ? formatCurrencyForExport(car.profit) : '-',
        saleDate: car.saleDate ? formatDate(car.saleDate) : '-',
      })),
      summaryData: [
        { label: 'عدد السيارات', value: data.cars.length },
        { label: 'إجمالي الشراء', value: formatCurrencyForExport(totalPurchase) },
        { label: 'إجمالي البيع', value: formatCurrencyForExport(totalSale) },
        { label: 'إجمالي الربح', value: formatCurrencyForExport(totalProfit) },
      ],
    });
  };

  const handlePrintPdf = () => {
    const totalPurchase = data.cars?.reduce((sum, c) => sum + c.purchasePrice, 0) || 0;
    const totalSale = data.cars?.reduce((sum, c) => sum + (c.salePrice || 0), 0) || 0;
    const totalProfit = data.cars?.reduce((sum, c) => sum + (c.profit || 0), 0) || 0;

    // Build breakdown section HTML
    const breakdownHtml = data.breakdown.length > 0 ? `
      <div class="breakdown-section">
        <h3>📊 تفاصيل الحساب</h3>
        <div class="breakdown-items">
          ${data.breakdown.map(item => `
            <div class="breakdown-row ${item.type || ''}">
              <span class="breakdown-icon">
                ${item.type === 'add' ? '+' : item.type === 'subtract' ? '−' : item.type === 'total' ? '=' : ''}
              </span>
              <span class="breakdown-label">${item.label}</span>
              <span class="breakdown-value ${item.type || ''}">${formatCurrencyForExport(item.value)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Build cars table HTML
    const carsTableHtml = data.cars && data.cars.length > 0 ? `
      <div class="cars-section">
        <h3>🚗 بيان السيارات (${data.cars.length} سيارة)</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>السيارة</th>
              <th>الموديل</th>
              <th>رقم الهيكل</th>
              <th>سعر الشراء</th>
              <th>سعر البيع</th>
              <th>الربح</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${data.cars.map((car, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${car.name}</td>
                <td>${car.model || '-'}</td>
                <td style="font-family: monospace; font-size: 11px;">${car.chassisNumber || '-'}</td>
                <td>${formatCurrencyForExport(car.purchasePrice)}</td>
                <td>${car.salePrice !== undefined ? formatCurrencyForExport(car.salePrice) : '-'}</td>
                <td class="${(car.profit || 0) >= 0 ? 'profit-positive' : 'profit-negative'}">
                  ${car.profit !== undefined ? formatCurrencyForExport(car.profit) : '-'}
                </td>
                <td>${car.saleDate ? formatDate(car.saleDate) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="cars-summary">
          <span>إجمالي الشراء: <strong>${formatCurrencyForExport(totalPurchase)}</strong></span>
          <span>إجمالي البيع: <strong>${formatCurrencyForExport(totalSale)}</strong></span>
          <span style="color: ${totalProfit >= 0 ? '#16a34a' : '#dc2626'}">إجمالي الربح: <strong>${formatCurrencyForExport(totalProfit)}</strong></span>
        </div>
      </div>
    ` : '';

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير ${data.title}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
            direction: rtl; 
            padding: 20px;
            color: #1f2937;
          }
          .header { 
            background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px;
            text-align: center;
          }
          .header h1 { margin: 0 0 5px 0; font-size: 24px; }
          .header .value { font-size: 32px; font-weight: bold; margin: 10px 0; }
          .header p { margin: 0; opacity: 0.9; font-size: 14px; }
          
          /* Breakdown Section */
          .breakdown-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .breakdown-section h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #1e40af;
          }
          .breakdown-items {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .breakdown-row {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .breakdown-row.total {
            background: #1e40af;
            color: white;
            font-weight: bold;
          }
          .breakdown-icon {
            width: 24px;
            font-size: 18px;
            font-weight: bold;
          }
          .breakdown-row.add .breakdown-icon { color: #16a34a; }
          .breakdown-row.subtract .breakdown-icon { color: #dc2626; }
          .breakdown-row.total .breakdown-icon { color: white; }
          .breakdown-label {
            flex: 1;
            font-size: 14px;
          }
          .breakdown-value {
            font-family: monospace;
            font-size: 14px;
            font-weight: 600;
          }
          .breakdown-value.add { color: #16a34a; }
          .breakdown-value.subtract { color: #dc2626; }
          .breakdown-row.total .breakdown-value { color: white; }
          
          /* Cars Section */
          .cars-section {
            margin-top: 20px;
          }
          .cars-section h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #1e40af;
          }
          table { width: 100%; border-collapse: collapse; }
          th { 
            background: #3b82f6; 
            color: white; 
            padding: 12px 8px; 
            text-align: right; 
            font-size: 13px;
          }
          td { 
            padding: 10px 8px; 
            border-bottom: 1px solid #e2e8f0; 
            font-size: 12px;
          }
          tr:nth-child(even) { background: #f8fafc; }
          .profit-positive { color: #16a34a; font-weight: bold; }
          .profit-negative { color: #dc2626; font-weight: bold; }
          .cars-summary {
            display: flex;
            gap: 30px;
            justify-content: center;
            margin-top: 15px;
            padding: 12px;
            background: #f1f5f9;
            border-radius: 6px;
            font-size: 14px;
          }
          .footer { 
            margin-top: 20px; 
            text-align: center; 
            font-size: 11px; 
            color: #94a3b8;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير ${data.title}</h1>
          <div class="value">${data.value}</div>
          ${data.subtitle ? `<p>${data.subtitle}</p>` : ''}
          <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        
        ${breakdownHtml}
        ${carsTableHtml}
        
        <div class="footer">
          تم إنشاء هذا التقرير بواسطة نظام إدارة معرض السيارات
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const hasExportableData = (data.showCarsTable && data.cars && data.cars.length > 0) || data.breakdown.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              تفاصيل: {data.title}
            </div>
            {hasExportableData && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrintPdf}>
                  <Printer className="w-4 h-4 ml-1" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileSpreadsheet className="w-4 h-4 ml-1" />
                  Excel
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Current Value */}
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">القيمة الحالية</p>
              <p className="text-3xl font-bold text-primary">{data.value}</p>
              {data.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{data.subtitle}</p>
              )}
            </div>

            {/* Breakdown */}
            {data.breakdown.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  تفاصيل الحساب
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  {data.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {item.type === 'add' && (
                          <Plus className="w-4 h-4 text-success shrink-0" />
                        )}
                        {item.type === 'subtract' && (
                          <Minus className="w-4 h-4 text-destructive shrink-0" />
                        )}
                        {item.type === 'total' && (
                          <Equal className="w-4 h-4 text-primary shrink-0" />
                        )}
                        {!item.type && <div className="w-4" />}
                        <span className={`text-sm truncate ${item.type === 'total' ? 'font-bold' : ''}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className={`text-sm font-mono shrink-0 ${
                        item.type === 'add' ? 'text-success' : 
                        item.type === 'subtract' ? 'text-destructive' : 
                        item.type === 'total' ? 'font-bold text-primary' : ''
                      }`}>
                        {typeof item.value === 'number' && item.value !== Math.floor(item.value) 
                          ? formatCurrency(item.value) 
                          : formatNumber(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cars Detail Table */}
            {data.showCarsTable && data.cars && data.cars.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  بيان السيارات ({data.cars.length} سيارة)
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-right text-xs">السيارة</TableHead>
                        <TableHead className="text-right text-xs">سعر الشراء</TableHead>
                        <TableHead className="text-right text-xs">سعر البيع</TableHead>
                        <TableHead className="text-right text-xs">الربح</TableHead>
                        <TableHead className="text-right text-xs">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.cars.map((car) => (
                        <TableRow key={car.id}>
                          <TableCell className="text-xs">
                            <div>
                              <p className="font-medium">{car.name}</p>
                              <p className="text-muted-foreground text-[10px]">{car.model}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {formatCurrency(car.purchasePrice)}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {car.salePrice !== undefined ? formatCurrency(car.salePrice) : '-'}
                          </TableCell>
                          <TableCell className={`text-xs font-mono font-bold ${
                            (car.profit || 0) >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {car.profit !== undefined ? formatCurrency(car.profit) : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {car.saleDate ? formatDate(car.saleDate) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Summary row */}
                <div className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
                  <span className="font-semibold text-sm">الإجمالي</span>
                  <div className="flex gap-6 text-sm">
                    <span>
                      الشراء: <span className="font-mono font-bold">
                        {formatCurrency(data.cars.reduce((sum, c) => sum + c.purchasePrice, 0))}
                      </span>
                    </span>
                    {data.cars[0]?.salePrice !== undefined && (
                      <span>
                        البيع: <span className="font-mono font-bold">
                          {formatCurrency(data.cars.reduce((sum, c) => sum + (c.salePrice || 0), 0))}
                        </span>
                      </span>
                    )}
                    {data.cars[0]?.profit !== undefined && (
                      <span>
                        الربح: <span className={`font-mono font-bold ${
                          data.cars.reduce((sum, c) => sum + (c.profit || 0), 0) >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {formatCurrency(data.cars.reduce((sum, c) => sum + (c.profit || 0), 0))}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Formula */}
            {data.formula && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  معادلة الحساب
                </h4>
                <div className="bg-accent/50 rounded-lg p-3">
                  <code className="text-sm text-foreground/80 whitespace-pre-wrap font-mono">
                    {data.formula}
                  </code>
                </div>
              </div>
            )}

            {/* Notes */}
            {data.notes && data.notes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">ملاحظات</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {data.notes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export type { StatDetailData, BreakdownItem, CarDetailItem };
