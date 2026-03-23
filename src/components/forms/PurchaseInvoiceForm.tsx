/**
 * Purchase Invoice Form - Slim Orchestrator
 * Delegates to modular sub-components and hooks.
 * Mirrors SalesInvoiceForm architecture for consistency.
 */
import { Sparkles, FileText, FileSpreadsheet, RotateCcw, MessageSquare, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';
import { toast } from 'sonner';
import { PurchaseInvoiceDialog } from '@/components/invoices/PurchaseInvoiceDialog';
import { PurchaseInvoiceAIImport } from './PurchaseInvoiceAIImport';
import {
  InvoiceNavHeader, InvoiceActionBar,
  InvoiceDeleteDialog, InvoiceReverseDialog,
} from './shared-invoice';
import { InvoiceSearchBar } from './InvoiceSearchBar';
import { usePurchaseInvoice } from '@/hooks/usePurchaseInvoice';
import { PurchaseHeaderFields } from './purchase-invoice/PurchaseHeaderFields';
import { PurchaseItemsTable } from './purchase-invoice/PurchaseItemsTable';
import { PurchaseTotalsAndSummary } from './purchase-invoice/PurchaseTotalsAndSummary';

interface PurchaseInvoiceFormProps {
  setActivePage: (page: ActivePage) => void;
}

export function PurchaseInvoiceForm({ setActivePage }: PurchaseInvoiceFormProps) {
  const hook = usePurchaseInvoice();
  const {
    invoiceData, setInvoiceData, suppliers,
    invoiceOpen, setInvoiceOpen, isViewingExisting,
    deleteDialogOpen, setDeleteDialogOpen, reverseDialogOpen, setReverseDialogOpen,
    isEditing, setIsEditing, aiImportOpen, setAiImportOpen, searchBarRef,
    navigationRecords, invoicePreviewData, fiscalYearFilteredCars, currentInvoiceIndex,
    handleFirstPurchase, handlePreviousPurchase, handleNextPurchase, handleLastPurchase,
    handleNewInvoice, handleSubmit, handleDeletePurchase, handleReversePurchase,
    handleUpdatePurchase, handlePrintExisting, handleAIImport, onBatchImport,
    loadRecordData, t,
    addPurchaseBatch, updateCar,
  } = hook;

  const handleCloseInvoice = (open: boolean) => {
    setInvoiceOpen(open);
    if (!open) setActivePage('purchases');
  };

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4">
        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">

          <InvoiceNavHeader
            title={t.inv_purchase_invoice}
            theme="purchase"
            currentIndex={currentInvoiceIndex}
            totalRecords={navigationRecords.length}
            isViewingExisting={isViewingExisting}
            onFirst={handleFirstPurchase}
            onPrevious={handlePreviousPurchase}
            onNext={handleNextPurchase}
            onLast={handleLastPurchase}
            extraActions={
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1.5 text-xs" onClick={() => setAiImportOpen(true)}>
                <Sparkles className="w-4 h-4" />
                استيراد ذكي (PDF)
              </Button>
            }
          />

          {/* Search Bar */}
          <div className="p-3 border-b bg-muted/30" ref={searchBarRef}>
            <InvoiceSearchBar
              mode="purchases"
              purchases={fiscalYearFilteredCars}
              suppliers={suppliers}
              onSelectResult={(result) => {
                if (result.type === 'invoice' || result.type === 'car') {
                  const car = result.data;
                  const batchIndex = navigationRecords.findIndex((b: any) => b.cars?.some((c: any) => c.id === car.id));
                  if (batchIndex >= 0) loadRecordData(navigationRecords[batchIndex]);
                } else if (result.type === 'supplier') {
                  const supplierRecords = navigationRecords.filter((b: any) => b.supplier_id === result.id);
                  if (supplierRecords.length > 0) {
                    const idx = navigationRecords.findIndex((b: any) => b.id === supplierRecords[0].id);
                    if (idx >= 0) loadRecordData(navigationRecords[idx]);
                  } else {
                    setInvoiceData(prev => ({ ...prev, supplier_id: result.id }));
                  }
                }
              }}
            />
          </div>

          <PurchaseHeaderFields hook={hook} />
          <PurchaseItemsTable hook={hook} />
          <PurchaseTotalsAndSummary hook={hook} />

          {/* Action Bar */}
          <InvoiceActionBar
            theme="purchase" isViewingExisting={isViewingExisting} isEditing={isEditing}
            isApproved={false} isPending={addPurchaseBatch.isPending}
            setActivePage={setActivePage} searchBarRef={searchBarRef}
            onSubmit={handleSubmit} onNewInvoice={handleNewInvoice}
            onToggleEdit={() => { setIsEditing(!isEditing); if (!isEditing) toast.info('تم تفعيل وضع التعديل'); }}
            onDelete={() => setDeleteDialogOpen(true)} onApprove={() => setActivePage('journal-entries')}
            onPrint={handlePrintExisting} onUpdate={handleUpdatePurchase}
            onClose={() => setActivePage('purchases')} closePage="purchases"
            updatePending={updateCar.isPending}
            quickMenus={[
              { label: 'عمليات الضرائب', items: [
                { label: 'إنشاء إقرار ضريبي', icon: <FileText className="w-3.5 h-3.5 ml-2" />, onClick: () => setActivePage('vat-return-report') },
                { label: 'إعدادات الضريبة', icon: <FileSpreadsheet className="w-3.5 h-3.5 ml-2" />, onClick: () => setActivePage('tax-settings') },
              ]},
              { label: 'تقارير', items: [
                { label: 'تقرير المشتريات', icon: <FileText className="w-3.5 h-3.5 ml-2" />, onClick: () => setActivePage('purchases-report') },
                { label: 'كشف حساب', icon: <FileText className="w-3.5 h-3.5 ml-2" />, onClick: () => setActivePage('account-statement') },
              ]},
              { label: t.inv_operations || 'عمليات', items: [
                { label: t.inv_import_data || 'استيراد بيانات', icon: <FileSpreadsheet className="w-3.5 h-3.5 ml-2" />, onClick: () => setActivePage('medad-import') },
                { label: t.inv_return, icon: <RotateCcw className="w-3.5 h-3.5 ml-2" />, onClick: () => setReverseDialogOpen(true), disabled: !isViewingExisting, className: 'text-amber-600' },
                { label: 'إرسال SMS', icon: <MessageSquare className="w-3.5 h-3.5 ml-2" />, onClick: () => toast.info('سيتم إضافة خاصية إرسال SMS قريباً') },
              ]},
              { label: 'عرض', items: [
                { label: 'معاينة قبل الطباعة', icon: <Printer className="w-3.5 h-3.5 ml-2" />, onClick: handlePrintExisting, disabled: !isViewingExisting },
                { label: 'عرض القيد المحاسبي', icon: <FileText className="w-3.5 h-3.5 ml-2" />, onClick: () => setActivePage('journal-entries'), disabled: !isViewingExisting },
              ]},
            ]}
            moreItems={[
              { label: t.inv_import_data || 'استيراد بيانات', icon: <FileSpreadsheet className="w-3.5 h-3.5 ml-2" />, onClick: () => setActivePage('medad-import') },
              { label: t.inv_return, icon: <RotateCcw className="w-3.5 h-3.5 ml-2" />, onClick: () => setReverseDialogOpen(true), disabled: !isViewingExisting, className: 'text-amber-600' },
            ]}
            labels={{
              add: 'إضافة', saving: t.inv_saving, new: 'جديد', edit: 'تعديل',
              cancelEdit: 'إلغاء التعديل', delete: 'حذف', accounting: 'محاسبة',
              search: 'بحث', print: 'طباعة', more: 'مزيد..', close: 'إغلاق',
              saveChanges: t.inv_save_changes, approved: 'معتمدة',
            }}
          />
        </div>
      </div>

      {/* Dialogs */}
      {invoicePreviewData && (
        <PurchaseInvoiceDialog open={invoiceOpen} onOpenChange={handleCloseInvoice} data={invoicePreviewData} />
      )}
      <InvoiceDeleteDialog
        open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeletePurchase}
        isPending={false} dir="rtl"
        labels={{ title: 'حذف الفاتورة', description: 'هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.', cancel: 'إلغاء', delete: 'حذف', deleting: 'جاري الحذف...' }}
      />
      <InvoiceReverseDialog
        open={reverseDialogOpen} onOpenChange={setReverseDialogOpen} onConfirm={handleReversePurchase}
        isPending={false} dir="rtl"
        labels={{ title: 'عكس الفاتورة', description: 'سيتم عكس جميع القيود المحاسبية المرتبطة بهذه الفاتورة.', bulletPoints: ['عكس قيد الشراء', 'عكس قيد الضريبة', 'تحديث أرصدة الحسابات'], warning: 'هذا الإجراء لا يمكن التراجع عنه.', cancel: 'إلغاء', confirm: 'عكس', confirming: 'جاري العكس...' }}
      />

      {/* AI Import */}
      {aiImportOpen && (
        <PurchaseInvoiceAIImport open={aiImportOpen} onOpenChange={setAiImportOpen} onImport={handleAIImport} onBatchImport={onBatchImport} />
      )}
    </>
  );
}
