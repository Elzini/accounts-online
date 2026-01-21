import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Eye,
  Users,
  Car,
  ShoppingCart,
  FileText,
  Building,
  Receipt,
  Wallet,
  ArrowRightLeft,
  Calculator,
  ClipboardList
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BackupData } from '@/services/backups';

interface BackupPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupData: BackupData | null;
  backupName?: string;
  backupDate?: string;
  onConfirmRestore: () => void;
  isRestoring?: boolean;
}

interface DataSection {
  key: keyof BackupData;
  label: string;
  icon: React.ReactNode;
}

const dataSections: DataSection[] = [
  { key: 'customers', label: 'العملاء', icon: <Users className="w-4 h-4" /> },
  { key: 'suppliers', label: 'الموردين', icon: <Building className="w-4 h-4" /> },
  { key: 'cars', label: 'السيارات', icon: <Car className="w-4 h-4" /> },
  { key: 'sales', label: 'المبيعات', icon: <ShoppingCart className="w-4 h-4" /> },
  { key: 'sale_items', label: 'عناصر المبيعات', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'purchase_batches', label: 'دفعات الشراء', icon: <Receipt className="w-4 h-4" /> },
  { key: 'journal_entries', label: 'القيود المحاسبية', icon: <FileText className="w-4 h-4" /> },
  { key: 'journal_entry_lines', label: 'بنود القيود', icon: <Calculator className="w-4 h-4" /> },
  { key: 'account_categories', label: 'فئات الحسابات', icon: <Wallet className="w-4 h-4" /> },
  { key: 'expenses', label: 'المصروفات', icon: <Wallet className="w-4 h-4" /> },
  { key: 'quotations', label: 'عروض الأسعار', icon: <FileText className="w-4 h-4" /> },
  { key: 'installments', label: 'الأقساط', icon: <Calculator className="w-4 h-4" /> },
  { key: 'vouchers', label: 'السندات', icon: <Receipt className="w-4 h-4" /> },
  { key: 'car_transfers', label: 'تحويلات السيارات', icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: 'partner_dealerships', label: 'الوكالات الشريكة', icon: <Building className="w-4 h-4" /> },
];

export function BackupPreviewDialog({
  open,
  onOpenChange,
  backupData,
  backupName,
  backupDate,
  onConfirmRestore,
  isRestoring = false
}: BackupPreviewDialogProps) {
  if (!backupData) return null;

  const totalRecords = dataSections.reduce((sum, section) => {
    return sum + (backupData[section.key]?.length || 0);
  }, 0);

  const nonEmptySections = dataSections.filter(
    section => (backupData[section.key]?.length || 0) > 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            معاينة النسخة الاحتياطية
          </DialogTitle>
          <DialogDescription>
            مراجعة محتويات النسخة الاحتياطية قبل الاستعادة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Backup Info */}
          {(backupName || backupDate) && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              {backupName && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">اسم النسخة:</span>
                  <span className="font-medium">{backupName}</span>
                </div>
              )}
              {backupDate && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="font-medium">
                    {format(new Date(backupDate), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">إجمالي السجلات:</span>
                <Badge variant="secondary" className="text-lg px-3">
                  {totalRecords.toLocaleString('ar-SA')}
                </Badge>
              </div>
            </div>
          )}

          {/* Data Sections */}
          <ScrollArea className="h-[300px] rounded-lg border p-4">
            <div className="grid gap-3">
              {nonEmptySections.length > 0 ? (
                nonEmptySections.map((section) => {
                  const count = backupData[section.key]?.length || 0;
                  return (
                    <div
                      key={section.key}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                          {section.icon}
                        </div>
                        <span className="font-medium">{section.label}</span>
                      </div>
                      <Badge variant="outline" className="text-base">
                        {count.toLocaleString('ar-SA')}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات في هذه النسخة الاحتياطية
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Warning */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
            <strong>تحذير:</strong> عند الاستعادة سيتم حذف جميع البيانات الحالية واستبدالها
            ببيانات هذه النسخة الاحتياطية. هذا الإجراء لا يمكن التراجع عنه!
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmRestore}
            disabled={isRestoring || totalRecords === 0}
          >
            {isRestoring ? 'جاري الاستعادة...' : 'تأكيد الاستعادة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
