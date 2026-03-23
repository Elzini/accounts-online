/**
 * Sales Invoice - Header Form Fields
 */
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PaymentAccountSelector } from '../PaymentAccountSelector';
import type { useSalesInvoiceData } from './useSalesInvoiceData';

type HookReturn = ReturnType<typeof useSalesInvoiceData>;

interface SalesHeaderFieldsProps {
  hook: HookReturn;
}

export function SalesHeaderFields({ hook }: SalesHeaderFieldsProps) {
  const { invoiceData, setInvoiceData, customers, nextInvoiceNumber, isApproved, selectedCustomer, formatCurrency, displayTotals, currency, t } = hook;

  return (
    <div className="p-4 border-b space-y-4 bg-card">
      {/* Section: Basic Info */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
        <span className="text-xs font-bold text-foreground tracking-wide">بيانات الفاتورة</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_customer} *</Label>
          <Select value={invoiceData.customer_id} onValueChange={(v) => setInvoiceData({ ...invoiceData, customer_id: v })}>
            <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none transition-colors">
              <SelectValue placeholder={t.inv_select_customer} />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_invoice_number}</Label>
          <Input
            value={invoiceData.invoice_number || nextInvoiceNumber}
            onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
            className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none font-mono"
            placeholder={String(nextInvoiceNumber)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_date}</Label>
          <Input type="date" value={invoiceData.sale_date} onChange={(e) => setInvoiceData({ ...invoiceData, sale_date: e.target.value })}
            className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none" dir="ltr" disabled={isApproved} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_warehouse}</Label>
          <Select value={invoiceData.warehouse} onValueChange={(v) => setInvoiceData({ ...invoiceData, warehouse: v })}>
            <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent><SelectItem value="main">{t.inv_main_warehouse}</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_cash_account}</Label>
          <PaymentAccountSelector value={invoiceData.payment_account_id} onChange={(v) => setInvoiceData({ ...invoiceData, payment_account_id: v })} type="receipt" className="h-9 border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none text-xs" hideLabel />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_payment_method}</Label>
          <Select defaultValue="cash">
            <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">{t.inv_deferred}</SelectItem>
              <SelectItem value="bank">{t.inv_bank_transfer}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Section: Additional Details */}
      <div className="flex items-center gap-2 mt-4 mb-1">
        <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
        <span className="text-xs font-bold text-foreground tracking-wide">تفاصيل إضافية</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_salesperson}</Label>
          <Input value={invoiceData.seller_name} onChange={(e) => setInvoiceData({ ...invoiceData, seller_name: e.target.value })}
            className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none" placeholder={t.inv_salesperson_name} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_commission}</Label>
          <Input type="number" value={invoiceData.commission} onChange={(e) => setInvoiceData({ ...invoiceData, commission: e.target.value })}
            className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none" placeholder="0" dir="ltr" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_other_expenses}</Label>
          <Input type="number" value={invoiceData.other_expenses} onChange={(e) => setInvoiceData({ ...invoiceData, other_expenses: e.target.value })}
            className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none" placeholder="0" dir="ltr" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">توقيت الإصدار</Label>
          <Input type="time" value={invoiceData.issue_time} onChange={(e) => setInvoiceData({ ...invoiceData, issue_time: e.target.value })}
            className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none font-mono" disabled={isApproved} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_notes}</Label>
          <Input value={invoiceData.notes} onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
            placeholder="أضف ملاحظات..." className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none" />
        </div>
      </div>

      {/* Tax & Options Row */}
      <div className="flex items-center gap-6 pt-3 border-t border-border/40">
        <div className="flex items-center gap-2">
          <Checkbox id="price_includes_tax" checked={invoiceData.price_includes_tax}
            onCheckedChange={(checked) => setInvoiceData({ ...invoiceData, price_includes_tax: !!checked })} disabled={isApproved} className="h-4 w-4" />
          <Label htmlFor="price_includes_tax" className="text-xs cursor-pointer text-muted-foreground">{t.inv_price_includes_tax}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="is_installment" checked={invoiceData.is_installment}
            onCheckedChange={(checked) => setInvoiceData({ ...invoiceData, is_installment: !!checked })} className="h-4 w-4" />
          <Label htmlFor="is_installment" className="text-xs cursor-pointer font-semibold text-primary">{t.inv_installment_sale}</Label>
        </div>
        {selectedCustomer && (
          <div className="flex items-center gap-2 mr-auto bg-muted/50 rounded-lg px-3 py-1.5">
            <Label className="text-[10px] text-muted-foreground">{t.inv_balance}</Label>
            <span className="text-xs font-bold text-success">{formatCurrency(0)} {currency}</span>
          </div>
        )}
      </div>

      {invoiceData.is_installment && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20 mt-2">
          <div className="flex items-center gap-1">
            <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_car_price}</Label>
            <span className="text-xs font-medium">{formatCurrency(displayTotals.finalTotal)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_down_payment}</Label>
            <Input type="number" value={invoiceData.down_payment} onChange={(e) => setInvoiceData({ ...invoiceData, down_payment: e.target.value })} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent w-20" placeholder="0" dir="ltr" />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_installments_count}</Label>
            <Select value={invoiceData.number_of_installments} onValueChange={(v) => setInvoiceData({ ...invoiceData, number_of_installments: v })}>
              <SelectTrigger className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent w-16 shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 6, 9, 12, 18, 24, 36, 48, 60].map(num => (
                  <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_first_installment_date}</Label>
            <Input type="date" value={invoiceData.first_installment_date} onChange={(e) => setInvoiceData({ ...invoiceData, first_installment_date: e.target.value })} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_last_installment_date}</Label>
            <Input type="date" value={invoiceData.last_payment_date || (() => { const months = parseInt(invoiceData.number_of_installments) || 12; const firstDate = invoiceData.first_installment_date ? new Date(invoiceData.first_installment_date) : new Date(); const lastDate = new Date(firstDate); lastDate.setMonth(lastDate.getMonth() + months - 1); return lastDate.toISOString().split('T')[0]; })()} onChange={(e) => setInvoiceData({ ...invoiceData, last_payment_date: e.target.value })} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_remaining}</Label>
            <span className="text-xs font-medium text-destructive">{formatCurrency(displayTotals.finalTotal - (parseFloat(invoiceData.down_payment) || 0))}</span>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_installment_value}</Label>
            <span className="text-xs font-medium text-primary">{formatCurrency((displayTotals.finalTotal - (parseFloat(invoiceData.down_payment) || 0)) / (parseInt(invoiceData.number_of_installments) || 12))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
