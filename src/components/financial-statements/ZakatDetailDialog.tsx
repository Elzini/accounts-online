import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator, Plus, Minus, Equal, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ZakatData {
  profitBeforeZakat: number;
  adjustedNetProfit: number;
  zakatOnAdjustedProfit: number;
  capital: number;
  reserves?: number;
  retainedEarnings?: number;
  partnersCurrentAccount: number;
  partnersCurrentFullBalance?: number;
  partnersHawlMonths?: number;
  employeeBenefitsLiabilities: number;
  longTermLoans?: number;
  zakatBaseSubtotal: number;
  fixedAssetsNet: number;
  intangibleAssetsNet: number;
  accumulatedLosses?: number;
  prepaidRentLongTerm?: number;
  deferredExpenses?: number;
  other: number;
  totalDeductions: number;
  zakatBase: number;
  zakatRate?: number;
  zakatOnBase: number;
  totalZakatProvision: number;
  openingBalance: number;
  provisionForYear: number;
  paidDuringYear: number;
  closingBalance: number;
  zakatStatus: string;
}

interface ZakatDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ZakatData | null;
  currencySymbol?: string;
}

export function ZakatDetailDialog({ open, onOpenChange, data, currencySymbol = 'ر.س' }: ZakatDetailDialogProps) {
  if (!data) return null;

  const fmt = (v: number) => {
    const rounded = Math.round(v * 100) / 100;
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rounded);
  };

  const sources = [
    { label: 'رأس المال', value: data.capital },
    { label: 'الاحتياطيات', value: data.reserves ?? 0 },
    { label: 'الأرباح المبقاة', value: data.retainedEarnings ?? 0 },
    { label: 'صافي الربح المعدل', value: data.adjustedNetProfit },
    { label: `صافي جاري الشركاء${data.partnersHawlMonths !== undefined && data.partnersHawlMonths < 12 ? ` (حَوْل: ${data.partnersHawlMonths} شهر من 12)` : ''}`, value: data.partnersCurrentAccount },
    { label: 'مخصص مكافأة نهاية الخدمة', value: data.employeeBenefitsLiabilities },
    { label: 'القروض طويلة الأجل', value: data.longTermLoans ?? 0 },
  ];

  const deductions = [
    { label: 'صافي الأصول الثابتة', value: data.fixedAssetsNet },
    { label: 'الاستثمارات طويلة الأجل', value: data.intangibleAssetsNet },
    { label: 'الخسائر المرحلة', value: data.accumulatedLosses ?? 0 },
    { label: 'الإيجار المدفوع مقدماً (طويل الأجل)', value: data.prepaidRentLongTerm ?? 0 },
    { label: 'المصروفات المؤجلة', value: data.deferredExpenses ?? 0 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5 text-primary" />
            تفاصيل حساب مخصص الزكاة
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* النتيجة */}
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">مخصص الزكاة</p>
              <p className="text-3xl font-bold text-primary">{fmt(data.totalZakatProvision)} {currencySymbol}</p>
              <Badge variant="outline" className="mt-2 text-xs">{data.zakatStatus}</Badge>
            </div>

            {/* صافي الربح المعدل */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                صافي الربح المعدل
              </h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>الربح قبل الزكاة</span>
                  <span className="font-mono">{fmt(data.profitBeforeZakat)} {currencySymbol}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span>صافي الربح المعدل</span>
                  <span className={`font-mono ${data.adjustedNetProfit < 0 ? 'text-destructive' : 'text-success'}`}>
                    {fmt(data.adjustedNetProfit)} {currencySymbol}
                  </span>
                </div>
              </div>
            </div>

            {/* مصادر الوعاء */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-success" />
                مصادر الوعاء الزكوي (الإضافات)
              </h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-success/10">
                    <TableHead className="text-right text-xs">البند</TableHead>
                    <TableHead className="text-left text-xs w-40">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{s.label}</TableCell>
                      <TableCell className="text-left font-mono text-sm">
                        {fmt(s.value)} {currencySymbol}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-success/10 font-bold">
                    <TableCell>إجمالي مصادر الوعاء</TableCell>
                    <TableCell className="text-left font-mono">
                      {fmt(data.zakatBaseSubtotal)} {currencySymbol}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* الحسميات */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Minus className="w-4 h-4 text-destructive" />
                الحسميات (ما يُخصم من الوعاء)
              </h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-destructive/10">
                    <TableHead className="text-right text-xs">البند</TableHead>
                    <TableHead className="text-left text-xs w-40">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{d.label}</TableCell>
                      <TableCell className="text-left font-mono text-sm text-destructive">
                        ({fmt(d.value)}) {currencySymbol}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-destructive/10 font-bold">
                    <TableCell>إجمالي الحسميات</TableCell>
                    <TableCell className="text-left font-mono text-destructive">
                      ({fmt(data.totalDeductions)}) {currencySymbol}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* الوعاء الزكوي */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Equal className="w-4 h-4 text-primary" />
                احتساب الزكاة
              </h4>
              <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>مصادر الوعاء</span>
                  <span className="font-mono">{fmt(data.zakatBaseSubtotal)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between text-sm text-destructive">
                  <span>الحسميات</span>
                  <span className="font-mono">({fmt(data.totalDeductions)}) {currencySymbol}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span>الوعاء الزكوي</span>
                  <span className="font-mono text-primary">{fmt(data.zakatBase)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>نسبة الزكاة</span>
                  <span className="font-mono">{(data.zakatRate ?? 2.5775).toFixed(4)}%</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>مخصص الزكاة المستحقة</span>
                  <span className="font-mono text-primary">{fmt(data.totalZakatProvision)} {currencySymbol}</span>
                </div>
              </div>
            </div>

            {/* حركة المخصص */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">حركة مخصص الزكاة</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>رصيد أول السنة</span>
                  <span className="font-mono">{fmt(data.openingBalance)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>المخصص المكون خلال السنة</span>
                  <span className="font-mono">{fmt(data.provisionForYear)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between text-sm text-destructive">
                  <span>المسدد خلال السنة</span>
                  <span className="font-mono">({fmt(data.paidDuringYear)}) {currencySymbol}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span>الرصيد الختامي</span>
                  <span className="font-mono">{fmt(data.closingBalance)} {currencySymbol}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
