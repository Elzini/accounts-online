/**
 * Sales Invoice Form - Slim Orchestrator
 * Delegates to modular sub-components and hooks.
 */
import { InvoiceNavHeader, InvoiceStatusBanner } from './shared-invoice';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RotateCcw, CheckCircle } from 'lucide-react';
import { ActivePage } from '@/types';
import { InvoicePreviewDialog } from '@/components/invoices/InvoicePreviewDialog';
import { InvoiceSearchBar } from './InvoiceSearchBar';

import { useSalesInvoiceData } from './sales-invoice/useSalesInvoiceData';
import { SalesHeaderFields } from './sales-invoice/SalesHeaderFields';
import { SalesItemsTable } from './sales-invoice/SalesItemsTable';
import { SalesTotalsAndSummary } from './sales-invoice/SalesTotalsAndSummary';
import { SalesActionBar } from './sales-invoice/SalesActionBar';

interface SalesInvoiceFormProps {
  setActivePage: (page: ActivePage) => void;
}

export function SalesInvoiceForm({ setActivePage }: SalesInvoiceFormProps) {
  const hook = useSalesInvoiceData(setActivePage);
  const {
    isViewingExisting, currentSaleStatus, isApproved, isEditing, setIsEditing,
    currentInvoiceIndex, fiscalYearFilteredSales, searchBarRef, dir,
    invoiceOpen, invoicePreviewData, handleCloseInvoice,
    deleteDialogOpen, setDeleteDialogOpen, handleDeleteSale, deleteSale,
    reverseDialogOpen, setReverseDialogOpen, handleReverseSale, reverseSale,
    approveDialogOpen, setApproveDialogOpen, handleApproveSale, approveSale,
    handleFirstSale, handlePreviousSale, handleNextSale, handleLastSale,
    loadSaleData, customers, t,
  } = hook;

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4">
        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">

          <InvoiceNavHeader
            title={t.inv_sales_invoice}
            theme="sales"
            currentIndex={currentInvoiceIndex}
            totalRecords={fiscalYearFilteredSales.length}
            isViewingExisting={isViewingExisting}
            status={currentSaleStatus}
            statusLabels={{ approved: t.inv_status_approved, draft: t.inv_status_draft }}
            onFirst={handleFirstSale}
            onPrevious={handlePreviousSale}
            onNext={handleNextSale}
            onLast={handleLastSale}
          />

          <InvoiceStatusBanner
            isViewingExisting={isViewingExisting}
            isDraft={currentSaleStatus === 'draft'}
            isApproved={isApproved}
            onEdit={() => setIsEditing(true)}
            onApprove={() => setApproveDialogOpen(true)}
          />

          {/* Search Bar */}
          <div className="p-3 border-b bg-muted/30" ref={searchBarRef}>
            <InvoiceSearchBar
              mode="sales"
              sales={fiscalYearFilteredSales}
              customers={customers}
              onSelectResult={(result) => {
                if (result.type === 'invoice' || result.type === 'car') {
                  const sale = result.data;
                  const saleIndex = fiscalYearFilteredSales.findIndex(s => s.id === sale.id);
                  if (saleIndex >= 0) { hook.loadSaleData(fiscalYearFilteredSales[saleIndex]); }
                } else if (result.type === 'customer') {
                  const customerSales = result.data.sales;
                  if (customerSales && customerSales.length > 0) {
                    const saleIndex = fiscalYearFilteredSales.findIndex(s => s.id === customerSales[0].id);
                    if (saleIndex >= 0) { hook.loadSaleData(fiscalYearFilteredSales[saleIndex]); }
                  } else {
                    hook.setInvoiceData(prev => ({ ...prev, customer_id: result.id }));
                  }
                }
              }}
            />
          </div>

          <SalesHeaderFields hook={hook} />
          <SalesItemsTable hook={hook} />
          <SalesTotalsAndSummary hook={hook} />
          <SalesActionBar hook={hook} setActivePage={setActivePage} />
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      {invoicePreviewData && (
        <InvoicePreviewDialog open={invoiceOpen} onOpenChange={handleCloseInvoice} data={invoicePreviewData} />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.inv_delete_sale_confirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.inv_delete_sale_desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSale} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteSale.isPending ? t.inv_deleting : t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reverse Dialog */}
      <AlertDialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-warning" /> {t.inv_return_invoice}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t.inv_return_sale_confirm}</p>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>{t.inv_return_cars_to_inventory}</li>
                <li>{t.inv_delete_journal_entry}</li>
                <li>{t.inv_update_stats}</li>
              </ul>
              <p className="text-destructive font-medium">{t.inv_cannot_undo}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReverseSale} className="bg-warning text-warning-foreground hover:bg-warning/90">
              {reverseSale.isPending ? t.inv_returning : t.inv_return_invoice_btn}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" /> {t.inv_approve_confirm}
            </AlertDialogTitle>
            <AlertDialogDescription>{t.inv_approve_confirm_desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveSale} className="bg-success text-success-foreground hover:bg-success/90">
              {approveSale.isPending ? t.inv_approving : t.inv_approve_invoice}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
