/**
 * InvoicePurchasesView - Non-car company invoice-based purchases table
 */
import { ShoppingCart, Calendar, FileText, CheckCircle, Trash2, MoreHorizontal, Eye, ChevronDown, ChevronUp, BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchFilter } from '@/components/ui/search-filter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { InvoiceJournalEntry } from '../InvoiceJournalEntry';
import { ActivePage } from '@/types';
import { PurchasesTotalsFooter } from './PurchasesTotalsFooter';
import { getStatusBadge } from './statusBadge';

interface Props {
  setActivePage: (page: ActivePage) => void;
  hook: ReturnType<typeof import('./usePurchasesTable').usePurchasesTable>;
}

export function InvoicePurchasesView({ setActivePage, hook }: Props) {
  const {
    t, language, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    isRefreshing, isApprovingAll, deleteInvoiceId, setDeleteInvoiceId,
    expandedInvoiceId, setExpandedInvoiceId,
    filteredInvoices, purchaseInvoices, invoiceTotals, draftInvoices,
    taxRate, currency,
    formatCurrency, formatDate, getPaymentMethodInfo, isDraftInvoiceStatus,
    handleApproveInvoice, handleDeleteInvoice, handleRefresh, handleApproveAll,
  } = hook;

  const filterOptions = [
    { value: 'draft', label: language === 'ar' ? 'مسودة' : 'Draft' },
    { value: 'approved', label: language === 'ar' ? 'معتمدة' : 'Approved' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t.nav_purchases}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{language === 'ar' ? 'إدارة فواتير المشتريات' : 'Manage purchase invoices'}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="h-10 sm:h-11">
            <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isRefreshing ? 'animate-spin' : ''}`} />
            {t.btn_refresh}
          </Button>
          {draftInvoices.length > 0 && (
            <Button variant="outline" onClick={handleApproveAll} disabled={isApprovingAll}
              className="h-10 sm:h-11 border-success text-success hover:bg-success hover:text-success-foreground">
              <CheckCircle className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isApprovingAll ? 'animate-spin' : ''}`} />
              {isApprovingAll
                ? (language === 'ar' ? 'جاري الاعتماد...' : 'Approving...')
                : (language === 'ar' ? `اعتماد الكل (${draftInvoices.length})` : `Approve All (${draftInvoices.length})`)}
            </Button>
          )}
          <Button onClick={() => setActivePage('add-purchase')} className="gradient-primary hover:opacity-90 flex-1 sm:flex-initial h-10 sm:h-11">
            <ShoppingCart className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'فاتورة مشتريات جديدة' : 'New Purchase Invoice'}
          </Button>
        </div>
      </div>

      <SearchFilter
        searchPlaceholder={language === 'ar' ? 'البحث برقم الفاتورة أو رقم فاتورة المورد...' : 'Search by invoice number or supplier invoice...'}
        searchValue={searchQuery} onSearchChange={setSearchQuery}
        filterOptions={filterOptions} filterValue={statusFilter}
        onFilterChange={setStatusFilter} filterPlaceholder={t.filter_status}
      />

      <div className="bg-card rounded-xl md:rounded-2xl card-shadow overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</TableHead>
              <TableHead className="text-right font-bold">{language === 'ar' ? 'المورد' : 'Supplier'}</TableHead>
              <TableHead className="text-right font-bold">{t.th_base_amount}</TableHead>
              <TableHead className="text-right font-bold">{t.th_tax} ({taxRate}%)</TableHead>
              <TableHead className="text-right font-bold">{t.th_total_with_tax}</TableHead>
              <TableHead className="text-right font-bold">{t.th_payment_method}</TableHead>
              <TableHead className="text-right font-bold">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
              <TableHead className="text-right font-bold">{t.th_status}</TableHead>
              <TableHead className="text-center font-bold">{language === 'ar' ? 'القيد' : 'Entry'}</TableHead>
              <TableHead className="text-center font-bold">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((inv: any) => {
              const paymentInfo = getPaymentMethodInfo(inv.payment_method);
              const PaymentIcon = paymentInfo.icon;
              const isExpanded = expandedInvoiceId === inv.id;
              return (
                <>
                  <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {inv.invoice_number}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{inv.supplier?.name || inv.customer_name || '-'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(inv.subtotal || 0)} {currency}</TableCell>
                    <TableCell className="text-orange-600 font-medium">{formatCurrency(inv.vat_amount || 0)} {currency}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatCurrency(inv.total || 0)} {currency}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PaymentIcon className={`w-4 h-4 ${paymentInfo.color}`} />
                        <span className={paymentInfo.color}>{paymentInfo.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(inv.invoice_date || inv.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(inv.status, language)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant={isExpanded ? 'default' : 'outline'} size="sm" className="h-7 text-xs gap-1"
                        onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}>
                        <BookOpen className="w-3.5 h-3.5" />
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isDraftInvoiceStatus(inv.status) && (
                            <>
                              <DropdownMenuItem onClick={() => handleApproveInvoice(inv.id)}>
                                <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                                {language === 'ar' ? 'اعتماد الفاتورة' : 'Approve Invoice'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteInvoiceId(inv.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 ml-2" />
                                {language === 'ar' ? 'حذف' : 'Delete'}
                              </DropdownMenuItem>
                            </>
                          )}
                          {!isDraftInvoiceStatus(inv.status) && (
                            <DropdownMenuItem onClick={() => {
                              sessionStorage.setItem('viewPurchaseInvoiceId', inv.id);
                              setActivePage('add-purchase-invoice');
                            }}>
                              <Eye className="w-4 h-4 ml-2" />
                              {language === 'ar' ? 'عرض' : 'View'}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${inv.id}-journal`}>
                      <TableCell colSpan={10} className="p-2 bg-muted/20">
                        <InvoiceJournalEntry invoiceId={inv.id} invoiceNumber={inv.invoice_number} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>

        {filteredInvoices.length > 0 && (
          <PurchasesTotalsFooter
            baseAmount={invoiceTotals.subtotal}
            taxAmount={invoiceTotals.vat}
            totalWithTax={invoiceTotals.total}
            taxRate={taxRate} currency={currency}
            formatCurrency={formatCurrency} t={t}
          />
        )}

        {purchaseInvoices.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد فواتير مشتريات' : 'No purchase invoices'}</p>
            <Button onClick={() => setActivePage('add-purchase')} className="mt-4 gradient-primary">
              {language === 'ar' ? 'إضافة أول فاتورة مشتريات' : 'Add First Purchase Invoice'}
            </Button>
          </div>
        )}

        {purchaseInvoices.length > 0 && filteredInvoices.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">{t.no_search_results}</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' ? 'هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this invoice? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteInvoiceId && handleDeleteInvoice(deleteInvoiceId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
