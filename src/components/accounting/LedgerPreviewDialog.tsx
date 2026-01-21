import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { FileDown, Printer } from 'lucide-react';

interface LedgerEntry {
  id: string;
  date: string;
  entry_number: number;
  description: string;
  reference_type: string | null;
  debit: number;
  credit: number;
  balance: number;
}

interface LedgerData {
  account: {
    code: string;
    name: string;
    type: string;
  };
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  entries: LedgerEntry[];
}

interface LedgerPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ledger: LedgerData | null;
  entries: LedgerEntry[];
  dateRange: { from: Date | undefined; to: Date | undefined };
  exportType: 'print' | 'pdf' | 'excel';
  onConfirm: () => void;
  companyName?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getAccountTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    assets: 'أصول',
    liabilities: 'خصوم',
    equity: 'حقوق الملكية',
    revenue: 'إيرادات',
    expenses: 'مصروفات',
  };
  return types[type] || type;
};

const getReferenceTypeLabel = (type: string | null) => {
  switch (type) {
    case 'sale': return 'مبيعات';
    case 'purchase': return 'مشتريات';
    case 'expense': return 'مصروفات';
    case 'manual': return 'يدوي';
    default: return 'عام';
  }
};

export function LedgerPreviewDialog({
  open,
  onOpenChange,
  ledger,
  entries,
  dateRange,
  exportType,
  onConfirm,
  companyName = 'الشركة'
}: LedgerPreviewDialogProps) {
  if (!ledger) return null;

  const getExportTitle = () => {
    switch (exportType) {
      case 'print': return 'معاينة الطباعة';
      case 'pdf': return 'معاينة PDF';
      case 'excel': return 'معاينة Excel';
    }
  };

  const getExportButton = () => {
    switch (exportType) {
      case 'print':
        return (
          <Button onClick={onConfirm} className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
        );
      case 'pdf':
        return (
          <Button onClick={onConfirm} className="gap-2">
            <FileDown className="w-4 h-4" />
            تحميل PDF
          </Button>
        );
      case 'excel':
        return (
          <Button onClick={onConfirm} className="gap-2 bg-green-600 hover:bg-green-700">
            <FileDown className="w-4 h-4" />
            تحميل Excel
          </Button>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getExportTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] mt-4">
          <div className="space-y-4 p-4 bg-white dark:bg-gray-900 rounded-lg border">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h1 className="text-xl font-bold">{companyName}</h1>
              <h2 className="text-lg font-semibold mt-2">دفتر الأستاذ العام</h2>
              <p className="text-muted-foreground">
                الحساب: {ledger.account.code} - {ledger.account.name}
              </p>
              <p className="text-sm text-muted-foreground">
                النوع: {getAccountTypeLabel(ledger.account.type)}
              </p>
              <p className="text-sm text-muted-foreground">
                الفترة من {dateRange.from ? format(dateRange.from, 'yyyy/MM/dd') : '-'} إلى {dateRange.to ? format(dateRange.to, 'yyyy/MM/dd') : '-'}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded bg-muted/50 border">
                <p className="text-xs text-muted-foreground">رصيد أول المدة</p>
                <p className={cn(
                  "font-bold",
                  ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600"
                )}>{formatCurrency(ledger.openingBalance)}</p>
              </div>
              <div className="p-3 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                <p className="text-xs text-blue-600">إجمالي المدين</p>
                <p className="font-bold text-blue-700">{formatCurrency(ledger.totalDebit)}</p>
              </div>
              <div className="p-3 rounded bg-orange-50 dark:bg-orange-950/30 border border-orange-200">
                <p className="text-xs text-orange-600">إجمالي الدائن</p>
                <p className="font-bold text-orange-700">{formatCurrency(ledger.totalCredit)}</p>
              </div>
              <div className={cn(
                "p-3 rounded border",
                ledger.closingBalance >= 0 
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200" 
                  : "bg-red-50 dark:bg-red-950/30 border-red-200"
              )}>
                <p className={cn("text-xs", ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                  رصيد آخر المدة
                </p>
                <p className={cn("font-bold", ledger.closingBalance >= 0 ? "text-green-700" : "text-red-700")}>
                  {formatCurrency(ledger.closingBalance)}
                </p>
              </div>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">رقم القيد</TableHead>
                  <TableHead className="text-right">البيان</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-left">مدين</TableHead>
                  <TableHead className="text-left">دائن</TableHead>
                  <TableHead className="text-left">الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Opening Balance */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={4} className="font-medium">رصيد أول المدة</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className={cn(
                    "font-medium",
                    ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600"
                  )}>{formatCurrency(ledger.openingBalance)}</TableCell>
                </TableRow>

                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.date), 'yyyy/MM/dd')}</TableCell>
                    <TableCell className="font-mono">{entry.entry_number}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                    <TableCell>{getReferenceTypeLabel(entry.reference_type)}</TableCell>
                    <TableCell className="text-left font-mono">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </TableCell>
                    <TableCell className="text-left font-mono">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </TableCell>
                    <TableCell className={cn(
                      "text-left font-mono",
                      entry.balance >= 0 ? "text-green-600" : "text-red-600"
                    )}>{formatCurrency(entry.balance)}</TableCell>
                  </TableRow>
                ))}

                {/* Closing Balance */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={4} className="font-medium">رصيد آخر المدة</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className={cn(
                    "font-bold",
                    ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600"
                  )}>{formatCurrency(ledger.closingBalance)}</TableCell>
                </TableRow>

                {/* Totals */}
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell colSpan={4}>الإجمالي</TableCell>
                  <TableCell className="text-left">{formatCurrency(ledger.totalDebit)}</TableCell>
                  <TableCell className="text-left">{formatCurrency(ledger.totalCredit)}</TableCell>
                  <TableCell className={cn(
                    "text-left",
                    ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600"
                  )}>{formatCurrency(ledger.closingBalance)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Footer Info */}
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p>عدد الحركات: {entries.length}</p>
              <p>تاريخ التقرير: {format(new Date(), 'yyyy/MM/dd HH:mm')}</p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          {getExportButton()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
