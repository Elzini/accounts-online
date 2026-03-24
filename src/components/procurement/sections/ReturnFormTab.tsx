/**
 * Purchase Returns - Form Tab (search, items table, totals, actions)
 */
import { toast } from 'sonner';
import { calcStandardVAT } from '@/utils/vatCalculator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, Plus, Printer, Trash2, CheckCircle, Package, FileText } from 'lucide-react';
import type { usePurchaseReturns } from '../hooks/usePurchaseReturns';

type Hook = ReturnType<typeof usePurchaseReturns>;

export function ReturnFormTab({ hook }: { hook: Hook }) {
  const {
    language, isCarDealership, isSearching, searchQuery, setSearchQuery,
    form, setForm, items, setItems, foundCar, foundInvoice,
    returns, totals, hasValidReturn, supplierName,
    handleSearch, updateItem, resetForm, formatCurrency,
    saveMutation, setConfirmOpen,
  } = hook;

  return (
    <>
      {/* Search & Header Form */}
      <div className="p-4 border-b space-y-4 bg-card">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 bg-violet-500 rounded-full"></div>
          <span className="text-xs font-bold text-foreground tracking-wide">
            {isCarDealership ? (language === 'ar' ? 'بحث عن سيارة بالمخزون' : 'Search Car by Inventory #') : (language === 'ar' ? 'بحث عن فاتورة مشتريات' : 'Search Purchase Invoice')}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {isCarDealership ? (language === 'ar' ? 'رقم المخزون' : 'Inventory Number') : (language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number')}
            </Label>
            <div className="flex gap-2">
              <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-violet-500 shadow-none font-mono flex-1"
                placeholder={isCarDealership ? (language === 'ar' ? 'أدخل رقم المخزون' : 'Enter inventory #') : (language === 'ar' ? 'أدخل رقم الفاتورة' : 'Enter invoice #')}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                type={isCarDealership ? 'number' : 'text'} />
              <Button size="sm" className="h-9 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg gap-1.5" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {language === 'ar' ? 'بحث' : 'Search'}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'رقم الإشعار' : 'Note #'}</Label>
            <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-muted/30 shadow-none font-mono" value={`PR-${String(returns.length + 1).padStart(4, '0')}`} readOnly />
          </div>
        </div>

        {/* Return Info */}
        <div className="flex items-center gap-2 mt-4 mb-1">
          <div className="w-1 h-5 bg-fuchsia-500 rounded-full"></div>
          <span className="text-xs font-bold text-foreground tracking-wide">{language === 'ar' ? 'بيانات المرتجع' : 'Return Details'}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'تاريخ الإرجاع' : 'Return Date'}</Label>
            <Input type="date" className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-fuchsia-500 shadow-none" value={form.returnDate} onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'طريقة الدفع' : 'Payment'}</Label>
            <Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}>
              <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-fuchsia-500 shadow-none transition-colors"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{language === 'ar' ? 'نقدية' : 'Cash'}</SelectItem>
                <SelectItem value="credit">{language === 'ar' ? 'آجل' : 'Credit'}</SelectItem>
                <SelectItem value="bank">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'المورد' : 'Supplier'}</Label>
            <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-muted/30 shadow-none" value={supplierName} readOnly />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'م. التكلفة' : 'Cost Center'}</Label>
            <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-fuchsia-500 shadow-none" value={form.costCenter} onChange={e => setForm(p => ({ ...p, costCenter: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'المرجع' : 'Reference'}</Label>
            <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-fuchsia-500 shadow-none" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'المستودع' : 'Warehouse'}</Label>
            <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-muted/30 shadow-none" value={language === 'ar' ? '1 - الرئيسي' : '1 - Main'} readOnly />
          </div>
        </div>

        {/* Options Row */}
        <div className="flex items-center gap-6 pt-3 border-t border-border/40 flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox id="fullInvoicePR" checked={form.fullInvoice} onCheckedChange={(v) => {
              const isFullInvoice = !!v;
              setForm(p => ({ ...p, fullInvoice: isFullInvoice, partialAmount: 0 }));
              if (isFullInvoice) { setItems(prev => prev.map(item => { const total = item.quantity * item.cost; const vat = total * 0.15; return { ...item, returnedQty: item.quantity, total, vat, grandTotal: total + vat }; })); }
            }} className="h-4 w-4" />
            <Label htmlFor="fullInvoicePR" className="text-xs cursor-pointer text-muted-foreground font-semibold">{language === 'ar' ? 'كامل الفاتورة' : 'Full Invoice'}</Label>
          </div>
          {!form.fullInvoice && (foundInvoice || foundCar) && (
            <div className="flex items-center gap-2">
              <Label className="text-[10px] font-semibold text-muted-foreground">{language === 'ar' ? 'مبلغ الإرجاع (قبل الضريبة)' : 'Return Amount (excl. VAT)'}</Label>
              <Input type="number" className="h-7 text-xs border-0 border-b-2 border-fuchsia-400 rounded-none bg-transparent w-40 font-mono text-center"
                value={form.partialAmount || ''} placeholder={language === 'ar' ? 'أدخل المبلغ' : 'Enter amount'}
                onChange={e => {
                  const val = Number(e.target.value);
                  const maxAmount = foundInvoice ? foundInvoice.subtotal : (foundCar ? foundCar.purchase_price : 0);
                  const amount = Math.min(Math.max(0, val), maxAmount);
                  setForm(p => ({ ...p, partialAmount: amount }));
                  if (items.length === 1) { const { vatAmount, totalWithVAT } = calcStandardVAT(amount); setItems(prev => [{ ...prev[0], returnedQty: 1, cost: amount, total: amount, vat: vatAmount, grandTotal: totalWithVAT }]); }
                }}
                max={foundInvoice ? foundInvoice.subtotal : (foundCar ? foundCar.purchase_price : 0)} min={0} />
              <span className="text-[10px] text-muted-foreground">{language === 'ar' ? `من أصل ${formatCurrency(foundInvoice?.subtotal || foundCar?.purchase_price || 0)} ريال` : `of ${formatCurrency(foundInvoice?.subtotal || foundCar?.purchase_price || 0)}`}</span>
            </div>
          )}
          <div className="space-y-0 flex items-center gap-2 mr-auto">
            <Label className="text-[10px] text-muted-foreground">{language === 'ar' ? 'ملاحظات' : 'Notes'}:</Label>
            <Input className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent w-64" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder={language === 'ar' ? 'أضف ملاحظات...' : 'Add notes...'} />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-l from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border-b-2 border-violet-200 dark:border-violet-800">
              <TableHead className="text-center text-[11px] font-bold w-10 text-violet-700 dark:text-violet-400">
                <Checkbox checked={items.length > 0 && items.every(i => i.selected)} onCheckedChange={(v) => setItems(prev => prev.map(i => { const selected = !!v; return { ...i, selected, returnedQty: selected ? i.quantity : 0 }; }))} className="h-4 w-4" />
              </TableHead>
              <TableHead className="text-right text-[11px] font-bold w-8 text-violet-700 dark:text-violet-400">#</TableHead>
              <TableHead className="text-right text-[11px] font-bold min-w-[120px] text-violet-700 dark:text-violet-400">{language === 'ar' ? 'الصنف' : 'Item'}</TableHead>
              <TableHead className="text-right text-[11px] font-bold min-w-[160px] text-violet-700 dark:text-violet-400">{language === 'ar' ? 'البيان' : 'Description'}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-16 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-20 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'صادرة' : 'Issued'}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-20 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'مرتجعة' : 'Returned'}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-16 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-24 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'التكلفة' : 'Cost'}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-24 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-20 text-violet-700 dark:text-violet-400">VAT</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-24 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'الإجمالي' : 'Grand'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx} className={`hover:bg-violet-50/50 dark:hover:bg-violet-950/20 border-b transition-colors ${!item.selected ? 'opacity-40' : ''}`}>
                <TableCell className="text-center py-2">
                  <Checkbox checked={item.selected} onCheckedChange={(v) => {
                    setItems(prev => { const updated = [...prev]; const selected = !!v; updated[idx] = { ...updated[idx], selected, returnedQty: selected ? updated[idx].quantity : 0 }; if (selected) { const i = updated[idx]; i.total = i.returnedQty * i.cost; i.vat = i.total * 0.15; i.grandTotal = i.total + i.vat; } return updated; });
                  }} className="h-4 w-4" />
                </TableCell>
                <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="text-xs py-2 font-medium">{item.item_name}</TableCell>
                <TableCell className="text-xs py-2 text-muted-foreground">{item.description}</TableCell>
                <TableCell className="text-center text-xs py-2">{item.quantity}</TableCell>
                <TableCell className="text-center text-xs py-2">{item.quantity}</TableCell>
                <TableCell className="py-1">
                  <Input type="number" className="h-7 text-xs w-16 text-center border-0 border-b border-border rounded-none bg-transparent" value={item.returnedQty || ''} onChange={e => updateItem(idx, 'returnedQty', Math.min(Number(e.target.value), item.quantity))} max={item.quantity} min={0} />
                </TableCell>
                <TableCell className="text-center text-xs py-2">{item.unit}</TableCell>
                <TableCell className="py-1">
                  {!form.fullInvoice ? (
                    <Input type="number" className="h-7 text-xs w-20 text-center border-0 border-b border-border rounded-none bg-transparent font-mono" value={item.cost || ''}
                      onChange={e => { const maxCost = foundInvoice?.items?.[idx] ? (Number(foundInvoice.items[idx].unit_price) || 0) : (foundCar?.purchase_price || Infinity); updateItem(idx, 'cost', Math.min(Number(e.target.value), maxCost)); }} min={0} />
                  ) : (<span className="font-mono">{formatCurrency(item.cost)}</span>)}
                </TableCell>
                <TableCell className="text-center text-xs py-2 font-mono">{formatCurrency(item.total)}</TableCell>
                <TableCell className="text-center text-xs py-2 font-mono text-warning">{formatCurrency(item.vat)}</TableCell>
                <TableCell className="text-center text-xs py-2 font-mono font-bold">{formatCurrency(item.grandTotal)}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    {isCarDealership ? <Package className="w-8 h-8 text-muted-foreground/30" /> : <FileText className="w-8 h-8 text-muted-foreground/30" />}
                    <span className="text-sm">{isCarDealership ? (language === 'ar' ? 'أدخل رقم المخزون للبحث' : 'Enter inventory number') : (language === 'ar' ? 'أدخل رقم الفاتورة للبحث' : 'Enter invoice number')}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Totals */}
      <div className="p-4 border-t bg-card">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-3 text-center text-white shadow-lg md:col-span-2">
            <div className="text-2xl font-black">{formatCurrency(totals.grandTotal)}</div>
            <div className="text-[10px] font-medium mt-0.5 opacity-90">{language === 'ar' ? 'إجمالي المرتجع' : 'Total Return'}</div>
          </div>
          <div className="bg-muted/60 border-2 border-border rounded-xl p-3 text-center">
            <div className="text-lg font-black text-foreground">{formatCurrency(totals.total)}</div>
            <div className="text-[9px] text-muted-foreground font-semibold">{language === 'ar' ? 'المجموع' : 'Total'}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-warning">{formatCurrency(totals.vat)}</div>
            <div className="text-[9px] text-warning font-semibold">VAT 15%</div>
          </div>
          <div className="bg-muted/60 border-2 border-border rounded-xl p-3 text-center">
            <div className="text-lg font-black text-foreground">{totals.quantity}</div>
            <div className="text-[9px] text-muted-foreground font-semibold">{language === 'ar' ? 'الكمية' : 'Qty'}</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-t-2 border-violet-100 dark:border-violet-900 bg-gradient-to-b from-card to-muted/30">
        <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <Button size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-md"
            onClick={() => { if (!hasValidReturn) { toast.error(language === 'ar' ? (isCarDealership ? 'يرجى البحث عن سيارة وتحديد كمية الإرجاع' : 'يرجى البحث عن فاتورة وتحديد كمية الإرجاع') : 'Please search and set return quantity'); return; } setConfirmOpen(true); }}
            disabled={saveMutation.isPending || !hasValidReturn}>
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {language === 'ar' ? 'اعتماد المرتجع' : 'Approve Return'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" onClick={resetForm}>
            <Plus className="w-3.5 h-3.5 text-violet-600" /> {language === 'ar' ? 'سند جديد' : 'New'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" disabled>
            <Printer className="w-3.5 h-3.5 text-muted-foreground" /> {language === 'ar' ? 'طباعة' : 'Print'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 shadow-sm" disabled={!foundCar && !foundInvoice}>
            <Trash2 className="w-3.5 h-3.5" /> {language === 'ar' ? 'حذف' : 'Delete'}
          </Button>
        </div>
      </div>
    </>
  );
}
