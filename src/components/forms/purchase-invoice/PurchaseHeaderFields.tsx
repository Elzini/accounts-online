/**
 * Purchase Invoice - Header Form Fields
 * Mirrors SalesHeaderFields pattern for consistency.
 */
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PaymentAccountSelector } from '../PaymentAccountSelector';
import { ProjectSelector } from '../ProjectSelector';
import type { usePurchaseInvoice } from '@/hooks/usePurchaseInvoice';

type HookReturn = ReturnType<typeof usePurchaseInvoice>;

interface PurchaseHeaderFieldsProps {
  hook: HookReturn;
}

export function PurchaseHeaderFields({ hook }: PurchaseHeaderFieldsProps) {
  const {
    invoiceData, setInvoiceData, suppliers, accounts, costCenters,
    selectedSupplier, nextInvoiceNumber, formatCurrency, currency, language, t,
  } = hook;

  return (
    <div className="p-4 border-b space-y-4 bg-card">
      {/* Section: Basic Info */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-5 bg-primary rounded-full"></div>
        <span className="text-xs font-bold text-foreground tracking-wide">بيانات الفاتورة</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_supplier} *</Label>
          <Select value={invoiceData.supplier_id} onValueChange={(v) => setInvoiceData({ ...invoiceData, supplier_id: v })}>
            <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none transition-colors">
              <SelectValue placeholder={t.inv_select_supplier} />
            </SelectTrigger>
            <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_invoice_number}</Label>
          <Input
            value={invoiceData.invoice_number || nextInvoiceNumber}
            onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
            className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none font-mono"
            placeholder={String(nextInvoiceNumber)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_warehouse}</Label>
          <Select value={invoiceData.warehouse} onValueChange={(v) => setInvoiceData({ ...invoiceData, warehouse: v })}>
            <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent><SelectItem value="main">{t.inv_main_warehouse}</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_cash_account}</Label>
          <PaymentAccountSelector
            value={invoiceData.payment_account_id}
            onChange={(v) => setInvoiceData({ ...invoiceData, payment_account_id: v })}
            type="payment"
            className="h-9 border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none text-xs"
          />
        </div>
        <ProjectSelector
          value={invoiceData.project_id}
          onChange={(v) => setInvoiceData({ ...invoiceData, project_id: v })}
          className="h-9 border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none text-xs"
        />
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {language === 'ar' ? 'الحساب الدائن (طريقة السداد)' : 'Credit Account (Payment)'}
          </Label>
          <Select value={invoiceData.payment_account_id || 'supplier'} onValueChange={(v) => setInvoiceData({ ...invoiceData, payment_account_id: v === 'supplier' ? '' : v })}>
            <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supplier">{language === 'ar' ? '📋 آجل (على المورد)' : 'On Credit (Supplier)'}</SelectItem>
              {accounts.filter(a => a.code?.startsWith('110') || a.code?.startsWith('1102') || a.code?.startsWith('1103') || a.code?.startsWith('2108') || a.code?.startsWith('2107')).map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedSupplier && (
          <div className="flex items-center gap-2 self-end bg-muted/50 rounded-lg px-3 py-1.5">
            <Label className="text-[10px] text-muted-foreground">{t.inv_balance}</Label>
            <span className="text-xs font-bold text-success">{formatCurrency(0)} {currency}</span>
          </div>
        )}
      </div>

      {/* Section: Additional Details */}
      <div className="flex items-center gap-2 mt-4 mb-1">
        <div className="w-1 h-5 bg-accent rounded-full"></div>
        <span className="text-xs font-bold text-foreground tracking-wide">تفاصيل إضافية</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_purchase_date}</Label>
          <Input type="date" value={invoiceData.purchase_date} onChange={(e) => setInvoiceData({ ...invoiceData, purchase_date: e.target.value })} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-accent shadow-none" dir="ltr" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_due_date}</Label>
          <Input type="date" value={invoiceData.due_date} onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-accent shadow-none" dir="ltr" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_supplier_invoice}</Label>
          <Input value={invoiceData.supplier_invoice_number} onChange={(e) => setInvoiceData({ ...invoiceData, supplier_invoice_number: e.target.value })} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-accent shadow-none" placeholder={t.inv_reference} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">مركز التكلفة</Label>
          <Select value={invoiceData.cost_center_id || 'none'} onValueChange={(v) => setInvoiceData({ ...invoiceData, cost_center_id: v === 'none' ? null : v })}>
            <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-accent shadow-none transition-colors">
              <SelectValue placeholder="اختر مركز التكلفة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون</SelectItem>
              {costCenters.filter(cc => cc.is_active).map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">حالة الدفع</Label>
          <Select value={invoiceData.payment_status} onValueChange={(v) => setInvoiceData({ ...invoiceData, payment_status: v })}>
            <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-accent shadow-none transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">غير مدفوع</SelectItem>
              <SelectItem value="paid">مدفوع</SelectItem>
              <SelectItem value="partial">مدفوع جزئياً</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 self-end pb-1">
          <Checkbox id="purchase_price_includes_tax" checked={invoiceData.price_includes_tax} onCheckedChange={(checked) => setInvoiceData({ ...invoiceData, price_includes_tax: !!checked })} className="h-4 w-4" />
          <Label htmlFor="purchase_price_includes_tax" className="text-xs cursor-pointer text-muted-foreground">{t.inv_price_includes_tax}</Label>
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_notes}</Label>
          <Input value={invoiceData.notes} onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })} placeholder="أضف ملاحظات..." className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-accent shadow-none" />
        </div>
      </div>
    </div>
  );
}
