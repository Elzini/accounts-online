import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface EditReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
  title?: string;
  oldData: Record<string, any>;
  newData: Record<string, any>;
  fieldLabels?: Record<string, string>;
}

export function EditReviewDialog({ open, onOpenChange, onConfirm, isPending, title, oldData, newData, fieldLabels = {} }: EditReviewDialogProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Find changed fields
  const changes = Object.keys(newData).filter(key => {
    if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'company_id') return false;
    return String(oldData[key] ?? '') !== String(newData[key] ?? '');
  });

  const getLabel = (key: string) => fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title || (isAr ? 'مراجعة التعديلات' : 'Review Changes')}</DialogTitle>
        </DialogHeader>

        {changes.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            {isAr ? 'لم يتم إجراء أي تعديلات' : 'No changes were made'}
          </p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              {isAr ? `${changes.length} حقل تم تعديله` : `${changes.length} field(s) changed`}
            </p>
            {changes.map(key => (
              <div key={key} className="border rounded-lg p-3 space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">{getLabel(key)}</span>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <Badge variant="outline" className="bg-destructive/10 text-destructive max-w-[40%] truncate">
                    {String(oldData[key] ?? '-') || '-'}
                  </Badge>
                  <Arrow className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Badge variant="outline" className="bg-success/10 text-success max-w-[40%] truncate">
                    {String(newData[key] ?? '-') || '-'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={onConfirm} disabled={isPending || changes.length === 0} className="gap-1.5">
            <Save className="w-4 h-4" />
            {isAr ? 'تأكيد التعديل' : 'Confirm Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
