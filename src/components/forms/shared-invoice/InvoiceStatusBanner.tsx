/**
 * Shared Invoice Status Banner
 * Shows a prominent yellow banner for draft invoices.
 */
import { FileEdit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface InvoiceStatusBannerProps {
  isViewingExisting: boolean;
  isDraft: boolean;
  isApproved: boolean;
  onEdit: () => void;
  onApprove: () => void;
  labels?: {
    draftTitle?: string;
    draftSubtitle?: string;
    editBtn?: string;
    approveBtn?: string;
  };
}

export function InvoiceStatusBanner({
  isViewingExisting, isDraft, isApproved, onEdit, onApprove, labels,
}: InvoiceStatusBannerProps) {
  if (!isViewingExisting || !isDraft || isApproved) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b-2 border-amber-300 dark:border-amber-700 px-5 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
          <span className="text-lg">📋</span>
        </div>
        <div>
          <span className="text-xs font-bold text-amber-800 dark:text-amber-200 block">
            {labels?.draftTitle || 'هذه الفاتورة محفوظة كمسودة'}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            {labels?.draftSubtitle || 'يمكنك تعديلها أو اعتمادها محاسبياً'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8 rounded-lg bg-white dark:bg-card border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50 shadow-sm"
          onClick={() => { onEdit(); toast.info('تم تفعيل وضع التعديل'); }}
        >
          <FileEdit className="w-3.5 h-3.5" />
          {labels?.editBtn || 'تعديل'}
        </Button>
        <Button
          size="sm"
          className="gap-1.5 text-xs h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          onClick={onApprove}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {labels?.approveBtn || 'اعتماد ومحاسبة'}
        </Button>
      </div>
    </div>
  );
}
