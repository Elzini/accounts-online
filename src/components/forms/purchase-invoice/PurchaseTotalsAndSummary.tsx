/**
 * Purchase Invoice - Totals and Summary Section
 * Mirrors SalesTotalsAndSummary pattern.
 */
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { InvoiceTotalsSection } from '../shared-invoice';
import type { usePurchaseInvoice } from '@/hooks/usePurchaseInvoice';

type HookReturn = ReturnType<typeof usePurchaseInvoice>;

interface PurchaseTotalsAndSummaryProps {
  hook: HookReturn;
}

export function PurchaseTotalsAndSummary({ hook }: PurchaseTotalsAndSummaryProps) {
  const {
    invoiceData, accounts, isViewingExisting, currentInvoiceIndex,
    selectedSupplier, nextInvoiceNumber, displayTotals, taxRate,
    discount, setDiscount, discountType, setDiscountType,
    formatCurrency, currency, locale, t,
  } = hook;

  return (
    <>
      {/* Info Cards */}
      <div className="p-4 border-t bg-gradient-to-b from-muted/40 to-muted/10">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <InfoCard label={t.inv_cash_account} value={accounts.find(a => a.id === invoiceData.payment_account_id)?.name || '-'} />
          <InfoCard label={t.inv_invoice_number} value={invoiceData.invoice_number || nextInvoiceNumber} mono />
          <InfoCard label={t.inv_status_label || 'الحالة'}>
            <div className={`text-[11px] font-bold rounded-full px-2 py-0.5 inline-block ${isViewingExisting ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
              {isViewingExisting ? (t.inv_status_approved || 'معتمدة') : (t.inv_new || 'جديدة')}
            </div>
          </InfoCard>
          <InfoCard label="توقيت الإصدار" value={new Date().toLocaleString(locale)} mono dir="ltr" />
          <InfoCard label={t.inv_voucher_number || 'رقم السند'} value={isViewingExisting ? (invoiceData.invoice_number || currentInvoiceIndex + 1) : '-'} />
          <InfoCard label={t.inv_supplier || 'المورد'} value={selectedSupplier?.name || '-'} />
        </div>
      </div>

      {/* Totals */}
      <div className="p-4 border-t bg-card">
        <div className="mb-3">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-4 text-center text-primary-foreground shadow-lg max-w-xs mx-auto">
            <div className="text-3xl font-black">{formatCurrency(displayTotals.finalTotal)}</div>
            <div className="text-[11px] font-medium mt-1 opacity-90">{t.inv_net}</div>
          </div>
        </div>
        <InvoiceTotalsSection
          subtotal={displayTotals.subtotal} discountAmount={displayTotals.discountAmount}
          totalVAT={displayTotals.totalVAT} finalTotal={displayTotals.finalTotal}
          taxRate={taxRate} currency={currency} discount={discount} discountType={discountType}
          onDiscountChange={setDiscount} onDiscountTypeChange={setDiscountType} formatCurrency={formatCurrency}
          labels={{ subtotal: t.inv_total, discount: t.inv_discount, tax: t.inv_tax_label, roundedNet: t.inv_rounded_net }}
        />
        <div className="mt-4 pt-3 border-t border-border/40">
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_terms || 'شروط البيع والدفع'}</Label>
            <Input placeholder={t.inv_terms_placeholder || 'أضف شروط وأحكام...'} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none" />
          </div>
        </div>
      </div>
    </>
  );
}

function InfoCard({ label, value, mono, dir, children }: { label: string; value?: string | number; mono?: boolean; dir?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
      <Label className="text-[9px] text-muted-foreground block mb-1">{label}</Label>
      {children || (
        <div className={`text-[11px] font-semibold truncate ${mono ? 'font-mono' : ''}`} dir={dir}>{String(value)}</div>
      )}
    </div>
  );
}
