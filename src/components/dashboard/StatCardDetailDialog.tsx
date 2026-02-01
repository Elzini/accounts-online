import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Car, ShoppingCart, DollarSign, TrendingUp, Calculator, Minus, Plus, Equal } from 'lucide-react';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5 text-primary" />
            تفاصيل: {data.title}
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
