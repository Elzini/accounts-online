/**
 * Sales Returns Page - Slim Orchestrator
 * Decomposed from 807 lines → hook + 2 sub-components + orchestrator
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Trash2, RotateCcw, Printer, Loader2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSalesReturns } from './hooks/useSalesReturns';
import { ReturnItemsTable } from './sections/ReturnItemsTable';
import { ReturnsListTab } from './sections/ReturnsListTab';

export function SalesReturnsPage() {
  const h = useSalesReturns();

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4" dir="rtl">
        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-l from-rose-600 via-red-500 to-orange-500 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 opacity-80" />
                  <h1 className="text-lg font-bold tracking-wide">{h.language === 'ar' ? 'مرتجع مبيعات / إشعار دائن' : 'Sales Returns / Credit Note'}</h1>
                </div>
                {(h.foundSale || h.foundInvoice) && (
                  <span className="text-[11px] px-3 py-1 rounded-full font-bold shadow-sm bg-white text-rose-700">
                    {h.language === 'ar' ? `فاتورة #${h.foundSale?.sale_number || h.foundInvoice?.invoice_number}` : `Invoice #${h.foundSale?.sale_number || h.foundInvoice?.invoice_number}`}
                  </span>
                )}
              </div>
              <Tabs value={h.activeTab} onValueChange={h.setActiveTab} className="w-auto">
                <TabsList className="bg-white/15 backdrop-blur-sm h-8">
                  <TabsTrigger value="form" className="text-[11px] text-white data-[state=active]:bg-white data-[state=active]:text-rose-700 h-7 px-3">{h.language === 'ar' ? 'بيانات أساسية' : 'Basic Data'}</TabsTrigger>
                  <TabsTrigger value="list" className="text-[11px] text-white data-[state=active]:bg-white data-[state=active]:text-rose-700 h-7 px-3">{h.language === 'ar' ? 'السجلات' : 'Records'} ({h.returns.length})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Found invoice banner */}
          {(h.foundSale || h.foundInvoice) && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border-b-2 border-rose-200 dark:border-rose-800 px-5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-800 flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5 text-rose-600" /></div>
                <div>
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-200 block">{h.language === 'ar' ? `فاتورة بيع رقم ${h.foundSale?.sale_number || h.foundInvoice?.invoice_number} - العميل: ${h.foundSale?.customer?.name || h.foundInvoice?.customer_name || '-'}` : `Sale Invoice #${h.foundSale?.sale_number || h.foundInvoice?.invoice_number}`}</span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400">{h.language === 'ar' ? `المبلغ: ${h.formatCurrency(h.foundSale?.sale_price || h.foundInvoice?.total || 0)} ريال` : `Amount: ${h.formatCurrency(h.foundSale?.sale_price || h.foundInvoice?.total || 0)}`}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-100" onClick={h.resetForm}><X className="w-4 h-4" /></Button>
            </div>
          )}

          {h.activeTab === 'form' && (
            <>
              {/* Search & Form */}
              <div className="p-4 border-b space-y-4 bg-card">
                <div className="flex items-center gap-2 mb-1"><div className="w-1 h-5 bg-rose-500 rounded-full"></div><span className="text-xs font-bold text-foreground tracking-wide">{h.language === 'ar' ? 'بحث عن فاتورة البيع' : 'Search Sale Invoice'}</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h.language === 'ar' ? 'اختر من الفواتير' : 'Select Invoice'}</Label>
                    <Select value="" onValueChange={(val) => { const sel = h.availableInvoices.find(i => i.id === val); if (sel) { h.setInvoiceSearch(String(sel.number)); setTimeout(() => { document.getElementById('search-invoice-btn')?.click(); }, 100); } }}>
                      <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-rose-500 shadow-none transition-colors"><SelectValue placeholder={h.language === 'ar' ? 'اختر فاتورة...' : 'Select invoice...'} /></SelectTrigger>
                      <SelectContent className="max-h-60">{h.availableInvoices.map(inv => (<SelectItem key={inv.id} value={inv.id}>#{inv.number} - {inv.customerName || (h.language === 'ar' ? 'بدون عميل' : 'No customer')} - {Number(inv.total).toLocaleString()}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h.language === 'ar' ? 'أو أدخل رقم الفاتورة' : 'Or Enter Invoice #'}</Label>
                    <div className="flex gap-2">
                      <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-rose-500 shadow-none font-mono flex-1" placeholder={h.language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'} value={h.invoiceSearch} onChange={e => h.setInvoiceSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && h.searchInvoice()} />
                      <Button id="search-invoice-btn" size="sm" className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg gap-1.5" onClick={h.searchInvoice} disabled={h.isSearching}>
                        {h.isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}{h.language === 'ar' ? 'بحث' : 'Search'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 mb-1"><div className="w-1 h-5 bg-orange-500 rounded-full"></div><span className="text-xs font-bold text-foreground tracking-wide">{h.language === 'ar' ? 'بيانات المرتجع' : 'Return Details'}</span></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
                  <div className="space-y-1"><Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h.language === 'ar' ? 'رقم الإشعار' : 'Note #'}</Label><Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-muted/30 shadow-none font-mono" value={`SR-${String(h.returns.length + 1).padStart(4, '0')}`} readOnly /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h.language === 'ar' ? 'تاريخ الإرجاع' : 'Return Date'}</Label><Input type="date" className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-orange-500 shadow-none" value={h.form.returnDate} onChange={e => h.setForm(p => ({ ...p, returnDate: e.target.value }))} dir="ltr" /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h.language === 'ar' ? 'طريقة الدفع' : 'Payment'}</Label><Select value={h.form.paymentMethod} onValueChange={v => h.setForm(p => ({ ...p, paymentMethod: v }))}><SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-orange-500 shadow-none transition-colors"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">{h.language === 'ar' ? 'نقدية' : 'Cash'}</SelectItem><SelectItem value="credit">{h.language === 'ar' ? 'آجل' : 'Credit'}</SelectItem><SelectItem value="bank">{h.language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1"><Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h.language === 'ar' ? 'العميل' : 'Customer'}</Label><Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-muted/30 shadow-none" value={h.foundSale?.customer?.name || h.foundInvoice?.customer_name || ''} readOnly /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h.language === 'ar' ? 'المندوب' : 'Salesman'}</Label><Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-orange-500 shadow-none" value={h.form.salesman} onChange={e => h.setForm(p => ({ ...p, salesman: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h.language === 'ar' ? 'المرجع' : 'Reference'}</Label><Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-orange-500 shadow-none" value={h.form.reference} onChange={e => h.setForm(p => ({ ...p, reference: e.target.value }))} /></div>
                </div>

                <div className="flex items-center gap-6 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <Checkbox id="fullInvoice" checked={h.form.fullInvoice} onCheckedChange={(v) => h.setForm(p => ({ ...p, fullInvoice: !!v }))} className="h-4 w-4" />
                    <Label htmlFor="fullInvoice" className="text-xs cursor-pointer text-muted-foreground font-semibold">{h.language === 'ar' ? 'كامل الفاتورة' : 'Full Invoice'}</Label>
                  </div>
                  <div className="space-y-0 flex items-center gap-2 mr-auto">
                    <Label className="text-[10px] text-muted-foreground">{h.language === 'ar' ? 'ملاحظات' : 'Notes'}:</Label>
                    <Input className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent w-64" value={h.form.notes} onChange={e => h.setForm(p => ({ ...p, notes: e.target.value }))} placeholder={h.language === 'ar' ? 'أضف ملاحظات...' : 'Add notes...'} />
                  </div>
                </div>
              </div>

              <ReturnItemsTable items={h.items} language={h.language} formatCurrency={h.formatCurrency} updateItem={h.updateItem} />

              {/* Totals */}
              <div className="p-4 border-t bg-card">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-xl p-3 text-center text-white shadow-lg md:col-span-2">
                    <div className="text-2xl font-black">{h.formatCurrency(h.totals.grandTotal)}</div>
                    <div className="text-[10px] font-medium mt-0.5 opacity-90">{h.language === 'ar' ? 'إجمالي المرتجع' : 'Total Return'}</div>
                  </div>
                  <div className="bg-muted/60 border-2 border-border rounded-xl p-3 text-center"><div className="text-lg font-black text-foreground">{h.formatCurrency(h.totals.total)}</div><div className="text-[9px] text-muted-foreground font-semibold">{h.language === 'ar' ? 'المجموع' : 'Total'}</div></div>
                  <div className="bg-muted/60 border-2 border-border rounded-xl p-3 text-center"><div className="text-lg font-black text-foreground">{h.formatCurrency(h.totals.discount)}</div><div className="text-[9px] text-muted-foreground font-semibold">{h.language === 'ar' ? 'الخصم' : 'Discount'}</div></div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center"><div className="text-lg font-black text-warning">{h.formatCurrency(h.totals.vat)}</div><div className="text-[9px] text-warning font-semibold">VAT 15%</div></div>
                  <div className="bg-muted/60 border-2 border-border rounded-xl p-3 text-center"><div className="text-lg font-black text-foreground">{h.totals.quantity}</div><div className="text-[9px] text-muted-foreground font-semibold">{h.language === 'ar' ? 'الكمية' : 'Qty'}</div></div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="border-t-2 border-rose-100 dark:border-rose-900 bg-gradient-to-b from-card to-muted/30">
                <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
                  <Button size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-md" onClick={() => { if (!h.hasValidReturn) { toast.error(h.language === 'ar' ? 'يرجى البحث عن فاتورة وتحديد بنود للإرجاع' : 'Please search for an invoice and select items to return'); return; } h.setConfirmOpen(true); }} disabled={h.saveMutation.isPending || !h.hasValidReturn}>
                    {h.saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}{h.language === 'ar' ? 'اعتماد المرتجع' : 'Approve Return'}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" onClick={h.resetForm}><Plus className="w-3.5 h-3.5 text-rose-600" /> {h.language === 'ar' ? 'سند جديد' : 'New'}</Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" disabled><Printer className="w-3.5 h-3.5 text-muted-foreground" /> {h.language === 'ar' ? 'طباعة' : 'Print'}</Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 shadow-sm" disabled={!h.foundSale && !h.foundInvoice}><Trash2 className="w-3.5 h-3.5" /> {h.language === 'ar' ? 'حذف' : 'Delete'}</Button>
                </div>
              </div>
            </>
          )}

          {h.activeTab === 'list' && (
            <ReturnsListTab filtered={h.filtered} searchList={h.searchList} setSearchList={h.setSearchList} language={h.language} onDelete={(id) => h.deleteMutation.mutate(id)} />
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={h.confirmOpen} onOpenChange={h.setConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-rose-500" />{h.language === 'ar' ? 'تأكيد اعتماد المرتجع' : 'Confirm Return Approval'}</AlertDialogTitle>
            <AlertDialogDescription>{h.language === 'ar' ? `سيتم إنشاء إشعار دائن بقيمة ${h.formatCurrency(h.totals.grandTotal)} ريال${h.form.fullInvoice ? ' وسيتم حذف الفاتورة الأصلية' : ''}` : `A credit note for ${h.formatCurrency(h.totals.grandTotal)} will be created${h.form.fullInvoice ? ' and the original invoice will be deleted' : ''}`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{h.language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => h.saveMutation.mutate()} className="bg-rose-600 hover:bg-rose-700">{h.language === 'ar' ? 'تأكيد الاعتماد' : 'Confirm'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
