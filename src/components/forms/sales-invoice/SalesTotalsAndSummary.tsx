/**
 * Sales Invoice - Totals Cards & Summary Info
 */
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { useSalesInvoiceData } from './useSalesInvoiceData';

type HookReturn = ReturnType<typeof useSalesInvoiceData>;

interface SalesTotalsAndSummaryProps {
  hook: HookReturn;
}

export function SalesTotalsAndSummary({ hook }: SalesTotalsAndSummaryProps) {
  const {
    invoiceData, accounts, nextInvoiceNumber, isViewingExisting, currentSaleStatus, currentInvoiceIndex,
    displayTotals, discount, setDiscount, discountType, setDiscountType, paidAmount, setPaidAmount,
    formatCurrency, taxRate, currency, t,
  } = hook;

  return (
    <>
      {/* Summary Info */}
      <div className="p-4 border-t bg-gradient-to-b from-muted/40 to-muted/10">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
            <Label className="text-[9px] text-muted-foreground block mb-1">{t.inv_cash_account}</Label>
            <div className="text-[11px] font-semibold truncate">{accounts.find(a => a.id === invoiceData.payment_account_id)?.name || '-'}</div>
          </div>
          <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
            <Label className="text-[9px] text-muted-foreground block mb-1">{t.inv_invoice_number}</Label>
            <div className="text-[11px] font-bold font-mono">{invoiceData.invoice_number || nextInvoiceNumber}</div>
          </div>
          <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
            <Label className="text-[9px] text-muted-foreground block mb-1">{t.inv_status_label || 'الحالة'}</Label>
            <div className={`text-[11px] font-bold rounded-full px-2 py-0.5 inline-block ${
              isViewingExisting && currentSaleStatus === 'approved'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : isViewingExisting
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {isViewingExisting ? (currentSaleStatus === 'approved' ? (t.inv_status_approved || 'معتمدة') : (t.inv_status_draft || 'مسودة')) : (t.inv_new || 'جديدة')}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
            <Label className="text-[9px] text-muted-foreground block mb-1">توقيت الإصدار</Label>
            <div className="text-[11px] font-mono font-semibold">{invoiceData.sale_date} {invoiceData.issue_time}</div>
          </div>
          <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
            <Label className="text-[9px] text-muted-foreground block mb-1">{t.inv_voucher_number || 'رقم السند'}</Label>
            <div className="text-[11px] font-bold">{isViewingExisting ? (invoiceData.invoice_number || currentInvoiceIndex + 1) : '-'}</div>
          </div>
          <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
            <Label className="text-[9px] text-muted-foreground block mb-1">{t.inv_salesperson || 'البائع'}</Label>
            <div className="text-[11px] font-semibold truncate">{invoiceData.seller_name || '-'}</div>
          </div>
        </div>
      </div>

      {/* Totals Section */}
      <div className="p-4 border-t bg-card">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-center text-white shadow-lg">
            <div className="text-3xl font-black">{formatCurrency(displayTotals.finalTotal)}</div>
            <div className="text-[11px] font-medium mt-1 opacity-90">{t.inv_net}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(displayTotals.subtotal)}</div>
            <div className="text-[10px] text-blue-600 dark:text-blue-500 font-semibold mt-1">{t.inv_total}</div>
          </div>
          <div className="bg-muted/60 border-2 border-border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="h-8 text-lg font-black text-center w-20 border-0 border-b-2 border-border rounded-none bg-transparent" dir="ltr" />
              <Select value={discountType} onValueChange={(v: 'percentage' | 'amount') => setDiscountType(v)}>
                <SelectTrigger className="h-7 text-xs w-14 border-0 shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">{currency}</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold mt-1">{t.inv_discount}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{formatCurrency(displayTotals.totalVAT)}</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold mt-1">{t.inv_tax_label} {taxRate}%</div>
          </div>
          <div className={`border-2 rounded-xl p-4 text-center ${displayTotals.profit >= 0 ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800'}`}>
            <div className={`text-2xl font-black ${displayTotals.profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{formatCurrency(displayTotals.profit)}</div>
            <div className={`text-[10px] font-semibold mt-1 ${displayTotals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>{t.inv_profit}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-border/40">
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_paid_amount}</Label>
            <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none" placeholder="0" dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_terms}</Label>
            <Input placeholder={t.inv_terms_placeholder} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none" />
          </div>
        </div>
      </div>
    </>
  );
}
