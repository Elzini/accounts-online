/**
 * Purchase Returns - Confirm & Edit Dialogs
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2, Save, Pencil } from 'lucide-react';
import type { usePurchaseReturns } from '../hooks/usePurchaseReturns';

type Hook = ReturnType<typeof usePurchaseReturns>;

export function ReturnDialogs({ hook }: { hook: Hook }) {
  const { language, isCarDealership, foundCar, foundInvoice, confirmOpen, setConfirmOpen, totals, formatCurrency, saveMutation, editingReturn, setEditingReturn, editForm, setEditForm, updateMutation } = hook;

  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-violet-500" />
              {language === 'ar' ? 'تأكيد اعتماد المرتجع' : 'Confirm Return Approval'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{language === 'ar' ? 'هل أنت متأكد من اعتماد هذا المرتجع؟' : 'Are you sure?'}</p>
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 space-y-1">
                {foundCar && <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">{foundCar.name} {foundCar.model}</p>}
                {foundInvoice && <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">{language === 'ar' ? `فاتورة رقم ${foundInvoice.invoice_number} - ${foundInvoice.supplier_name}` : `Invoice #${foundInvoice.invoice_number}`}</p>}
                <p className="text-xs text-violet-600 dark:text-violet-400">{language === 'ar' ? `المبلغ: ${formatCurrency(totals.grandTotal)} ريال` : `Amount: ${formatCurrency(totals.grandTotal)}`}</p>
              </div>
              {isCarDealership && foundCar && <p className="text-destructive text-xs font-medium">⚠️ {language === 'ar' ? 'سيتم تحديث حالة السيارة إلى "مرتجعة" وحذف القيود المحاسبية' : 'Car status will change and journal entries deleted'}</p>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => saveMutation.mutate()} className="bg-violet-600 text-white hover:bg-violet-700">
              {saveMutation.isPending ? (language === 'ar' ? 'جاري الاعتماد...' : 'Approving...') : (language === 'ar' ? 'اعتماد' : 'Approve')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingReturn} onOpenChange={(open) => !open && setEditingReturn(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-violet-600" />
              {language === 'ar' ? `تعديل المرتجع ${editingReturn?.note_number || ''}` : `Edit Return ${editingReturn?.note_number || ''}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{language === 'ar' ? 'تاريخ المرتجع' : 'Return Date'}</Label>
              <Input type="date" className="h-9 text-sm" value={editForm.note_date} onChange={e => setEditForm(p => ({ ...p, note_date: e.target.value }))} dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</Label>
                <Input type="number" className="h-9 text-sm font-mono" value={editForm.total_amount || ''} onChange={e => {
                  const total = Number(e.target.value) || 0;
                  const netAmount = total / 1.15;
                  setEditForm(p => ({ ...p, total_amount: total, tax_amount: Math.round((total - netAmount) * 100) / 100 }));
                }} min={0} step="0.01" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === 'ar' ? 'مبلغ الضريبة' : 'Tax Amount'}</Label>
                <Input type="number" className="h-9 text-sm font-mono" value={editForm.tax_amount || ''} onChange={e => setEditForm(p => ({ ...p, tax_amount: Number(e.target.value) || 0 }))} min={0} step="0.01" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{language === 'ar' ? 'السبب / الملاحظات' : 'Reason / Notes'}</Label>
              <Input className="h-9 text-sm" value={editForm.reason} onChange={e => setEditForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingReturn(null)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
