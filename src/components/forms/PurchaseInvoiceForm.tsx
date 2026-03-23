import { useState, useMemo, useRef } from 'react';
import { 
  Save, Plus, X, Printer, FileText, Trash2,
  Car, ArrowRight, RotateCcw, Package,
  FileSpreadsheet, MessageSquare, ChevronDown,
  CheckCircle, FileEdit, Search, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActivePage } from '@/types';
import { toast } from 'sonner';
import { PurchaseInvoiceDialog } from '@/components/invoices/PurchaseInvoiceDialog';
import { PaymentAccountSelector } from './PaymentAccountSelector';
import { ProjectSelector } from './ProjectSelector';
import { InvoiceSearchBar } from './InvoiceSearchBar';
import { PurchaseInvoiceAIImport } from './PurchaseInvoiceAIImport';
import {
  InvoiceNavHeader, InvoiceTotalsSection, InvoiceActionBar,
  InvoiceDeleteDialog, InvoiceReverseDialog,
} from './shared-invoice';
import { usePurchaseInvoice } from '@/hooks/usePurchaseInvoice';

interface PurchaseInvoiceFormProps {
  setActivePage: (page: ActivePage) => void;
}

export function PurchaseInvoiceForm({ setActivePage }: PurchaseInvoiceFormProps) {
  const inv = usePurchaseInvoice();
  const {
    suppliers, accounts, taxSettings, costCenters, inventoryItems, company,
    invoiceData, setInvoiceData, cars, purchaseInventoryItems,
    invoiceOpen, setInvoiceOpen, savedBatchData, discount, setDiscount,
    discountType, setDiscountType, isViewingExisting,
    deleteDialogOpen, setDeleteDialogOpen,
    reverseDialogOpen, setReverseDialogOpen, isEditing, setIsEditing,
    aiImportOpen, setAiImportOpen, searchBarRef,
    isCarDealership, selectedSupplier, taxRate, calculations, displayTotals,
    navigationRecords, nextInvoiceNumber, invoicePreviewData, fiscalYearFilteredCars,
    locale, currency, language, t, companyId, currentInvoiceIndex,
    handleAddCar, handleRemoveCar, handleCarChange,
    handleAddInventoryItem, handleSelectExistingItem, handleRemoveInventoryItem, handleInventoryItemChange,
    handleFirstPurchase, handlePreviousPurchase, handleNextPurchase, handleLastPurchase,
    handleNewInvoice, handleSubmit, handleDeletePurchase, handleReversePurchase,
    handleUpdatePurchase, handlePrintExisting, handleAIImport, onBatchImport,
    loadRecordData, formatCurrency,
    addPurchaseBatch, updateCar,
  } = inv;

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

          {/* Invoice Header Form */}
          <div className="p-4 border-b space-y-4 bg-card">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-bold text-foreground tracking-wide">بيانات الفاتورة</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_supplier} *</Label>
                <Select value={invoiceData.supplier_id} onValueChange={(v) => setInvoiceData({ ...invoiceData, supplier_id: v })}>
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none transition-colors"><SelectValue placeholder={t.inv_select_supplier} /></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_invoice_number}</Label>
                <Input value={invoiceData.invoice_number || nextInvoiceNumber} onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none font-mono" placeholder={String(nextInvoiceNumber)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_warehouse}</Label>
                <Select value={invoiceData.warehouse} onValueChange={(v) => setInvoiceData({ ...invoiceData, warehouse: v })}>
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none transition-colors"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="main">{t.inv_main_warehouse}</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_cash_account}</Label>
                <PaymentAccountSelector value={invoiceData.payment_account_id} onChange={(v) => setInvoiceData({ ...invoiceData, payment_account_id: v })} type="payment" className="h-9 border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none text-xs" />
              </div>
              <ProjectSelector value={invoiceData.project_id} onChange={(v) => setInvoiceData({ ...invoiceData, project_id: v })} className="h-9 border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none text-xs" />
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {language === 'ar' ? 'الحساب الدائن (طريقة السداد)' : 'Credit Account (Payment)'}
                </Label>
                <Select value={invoiceData.payment_account_id || 'supplier'} onValueChange={(v) => setInvoiceData({ ...invoiceData, payment_account_id: v === 'supplier' ? '' : v })}>
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none transition-colors"><SelectValue /></SelectTrigger>
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

            {/* Dates & Details */}
            <div className="flex items-center gap-2 mt-4 mb-1">
              <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
              <span className="text-xs font-bold text-foreground tracking-wide">تفاصيل إضافية</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_purchase_date}</Label>
                <Input type="date" value={invoiceData.purchase_date} onChange={(e) => setInvoiceData({ ...invoiceData, purchase_date: e.target.value })} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-indigo-500 shadow-none" dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_due_date}</Label>
                <Input type="date" value={invoiceData.due_date} onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-indigo-500 shadow-none" dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_supplier_invoice}</Label>
                <Input value={invoiceData.supplier_invoice_number} onChange={(e) => setInvoiceData({ ...invoiceData, supplier_invoice_number: e.target.value })} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-indigo-500 shadow-none" placeholder={t.inv_reference} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">مركز التكلفة</Label>
                <Select value={invoiceData.cost_center_id || 'none'} onValueChange={(v) => setInvoiceData({ ...invoiceData, cost_center_id: v === 'none' ? null : v })}>
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-indigo-500 shadow-none transition-colors"><SelectValue placeholder="اختر مركز التكلفة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    {costCenters.filter(cc => cc.is_active).map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">حالة الدفع</Label>
                <Select value={invoiceData.payment_status} onValueChange={(v) => setInvoiceData({ ...invoiceData, payment_status: v })}>
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-indigo-500 shadow-none transition-colors"><SelectValue /></SelectTrigger>
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
                <Input value={invoiceData.notes} onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })} placeholder="أضف ملاحظات..." className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-indigo-500 shadow-none" />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            {isCarDealership ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b-2 border-blue-200 dark:border-blue-800">
                      <TableHead className="text-right text-[11px] font-bold w-8 text-blue-700 dark:text-blue-400">#</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[150px] text-blue-700 dark:text-blue-400">{t.inv_description}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[80px] text-blue-700 dark:text-blue-400">{t.inv_model}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[60px] text-blue-700 dark:text-blue-400">{t.inv_color}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[100px] text-blue-700 dark:text-blue-400">{t.inv_chassis_number}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[80px] text-blue-700 dark:text-blue-400">رقم اللوحة</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-blue-700 dark:text-blue-400">الحالة</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-blue-700 dark:text-blue-400">{t.inv_quantity}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-blue-700 dark:text-blue-400">{t.inv_price}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-blue-700 dark:text-blue-400">{t.inv_subtotal}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-28 text-blue-700 dark:text-blue-400">شامل الضريبة</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cars.map((car, index) => {
                      const calcItem = calculations.items[index];
                      return (
                        <TableRow key={car.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border-b transition-colors">
                          <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="py-2"><Input value={car.name} onChange={(e) => handleCarChange(car.id, 'name', e.target.value)} placeholder={t.inv_car_name} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" /></TableCell>
                          <TableCell className="py-2"><Input value={car.model} onChange={(e) => handleCarChange(car.id, 'model', e.target.value)} placeholder={t.inv_model} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" /></TableCell>
                          <TableCell className="py-2"><Input value={car.color} onChange={(e) => handleCarChange(car.id, 'color', e.target.value)} placeholder={t.inv_color} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" /></TableCell>
                          <TableCell className="py-2"><Input value={car.chassis_number} onChange={(e) => handleCarChange(car.id, 'chassis_number', e.target.value)} placeholder={t.inv_chassis_number} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                          <TableCell className="py-2"><Input value={car.plate_number} onChange={(e) => handleCarChange(car.id, 'plate_number', e.target.value)} placeholder="رقم اللوحة" className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                          <TableCell className="py-2">
                            <Select value={car.car_condition} onValueChange={(v) => handleCarChange(car.id, 'car_condition', v)}>
                              <SelectTrigger className="h-7 text-[10px] border-0 border-b border-border rounded-none bg-transparent shadow-none w-20"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="new">جديدة</SelectItem><SelectItem value="used">مستعملة</SelectItem></SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center text-xs py-2">{car.quantity}</TableCell>
                          <TableCell className="py-2"><Input type="number" value={car.purchase_price} onChange={(e) => handleCarChange(car.id, 'purchase_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                          <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.baseAmount || 0)}</TableCell>
                          <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.total || 0)}</TableCell>
                          <TableCell className="py-2">
                            {cars.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCar(car.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full"><X className="w-3 h-3" /></Button>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {Array.from({ length: Math.max(0, 3 - cars.length) }).map((_, i) => (
                      <TableRow key={`empty-${i}`} className="border-b border-dashed">
                        <TableCell className="text-center text-xs py-2 text-muted-foreground/40 font-mono">{cars.length + i + 1}</TableCell>
                        <TableCell className="py-2" colSpan={11}></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-3 border-t bg-muted/20">
                  <Button type="button" variant="outline" size="sm" onClick={handleAddCar} className="gap-1.5 text-xs h-9 rounded-lg"><Plus className="w-3.5 h-3.5" />{t.inv_add_car}</Button>
                </div>
              </>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b-2 border-blue-200 dark:border-blue-800">
                      <TableHead className="text-right text-[11px] font-bold w-8 text-blue-700 dark:text-blue-400">#</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[180px] text-blue-700 dark:text-blue-400">{t.inv_item}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[80px] text-blue-700 dark:text-blue-400">{t.inv_barcode}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-blue-700 dark:text-blue-400">{t.inv_quantity}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-blue-700 dark:text-blue-400">{t.inv_unit}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-blue-700 dark:text-blue-400">{t.inv_purchase_price}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-blue-700 dark:text-blue-400">{t.inv_subtotal}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-28 text-blue-700 dark:text-blue-400">شامل الضريبة</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.inventoryItems.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border-b transition-colors">
                        <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="py-2"><Input value={purchaseInventoryItems[index]?.item_name || ''} onChange={(e) => handleInventoryItemChange(item.id, 'item_name', e.target.value)} placeholder={t.inv_item_name_placeholder || 'اسم الصنف / الخدمة'} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" /></TableCell>
                        <TableCell className="py-2"><Input value={purchaseInventoryItems[index]?.barcode || ''} onChange={(e) => handleInventoryItemChange(item.id, 'barcode', e.target.value)} placeholder={t.inv_barcode} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                        <TableCell className="py-2"><Input type="number" min={1} value={purchaseInventoryItems[index]?.quantity || 1} onChange={(e) => handleInventoryItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} className="h-7 text-xs text-center border-0 border-b border-border rounded-none bg-transparent w-16" /></TableCell>
                        <TableCell className="text-center text-xs py-2">{item.unit_name}</TableCell>
                        <TableCell className="py-2"><Input type="number" value={purchaseInventoryItems[index]?.purchase_price || ''} onChange={(e) => handleInventoryItemChange(item.id, 'purchase_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                        <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(item.baseAmount)}</TableCell>
                        <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(item.total)}</TableCell>
                        <TableCell className="py-2">
                          {purchaseInventoryItems.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInventoryItem(item.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full"><X className="w-3 h-3" /></Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {Array.from({ length: Math.max(0, 3 - purchaseInventoryItems.length) }).map((_, i) => (
                      <TableRow key={`empty-${i}`} className="border-b border-dashed">
                        <TableCell className="text-center text-xs py-2 text-muted-foreground/40 font-mono">{purchaseInventoryItems.length + i + 1}</TableCell>
                        <TableCell className="py-2" colSpan={8}></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-3 border-t flex gap-2 bg-muted/20">
                  <Button type="button" variant="outline" size="sm" onClick={handleAddInventoryItem} className="gap-1.5 text-xs h-9 rounded-lg"><Plus className="w-3.5 h-3.5" />{t.inv_add_item || 'إضافة صنف'}</Button>
                  {(inventoryItems || []).length > 0 && (
                    <Select onValueChange={handleSelectExistingItem}>
                      <SelectTrigger className="h-9 text-xs w-[250px] rounded-lg"><SelectValue placeholder={t.inv_select_inventory_item || 'اختر من المخزون...'} /></SelectTrigger>
                      <SelectContent>
                        {(inventoryItems || []).map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            <div className="flex items-center gap-2"><Package className="w-3 h-3" />{item.name} {item.barcode ? `(${item.barcode})` : ''}</div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Invoice Summary */}
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
                <div className={`text-[11px] font-bold rounded-full px-2 py-0.5 inline-block ${isViewingExisting ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                  {isViewingExisting ? (t.inv_status_approved || 'معتمدة') : (t.inv_new || 'جديدة')}
                </div>
              </div>
              <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
                <Label className="text-[9px] text-muted-foreground block mb-1">توقيت الإصدار</Label>
                <div className="text-[11px] font-mono font-semibold" dir="ltr">{new Date().toLocaleString(locale)}</div>
              </div>
              <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
                <Label className="text-[9px] text-muted-foreground block mb-1">{t.inv_voucher_number || 'رقم السند'}</Label>
                <div className="text-[11px] font-bold">{isViewingExisting ? (invoiceData.invoice_number || currentInvoiceIndex + 1) : '-'}</div>
              </div>
              <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
                <Label className="text-[9px] text-muted-foreground block mb-1">{t.inv_supplier || 'المورد'}</Label>
                <div className="text-[11px] font-semibold truncate">{selectedSupplier?.name || '-'}</div>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="p-4 border-t bg-card">
            <div className="mb-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 text-center text-white shadow-lg max-w-xs mx-auto">
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
                <Input placeholder={t.inv_terms_placeholder || 'أضف شروط وأحكام...'} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none" />
              </div>
            </div>
          </div>

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
        <PurchaseInvoiceDialog
          open={invoiceOpen}
          onOpenChange={handleCloseInvoice}
          invoiceData={invoicePreviewData}
        />
      )}
      <InvoiceDeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeletePurchase} />
      <InvoiceReverseDialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen} onConfirm={handleReversePurchase} />

      {/* AI Import */}
      {aiImportOpen && (
        <PurchaseInvoiceAIImport
          open={aiImportOpen}
          onOpenChange={setAiImportOpen}
          onImport={handleAIImport}
          onBatchImport={onBatchImport}
          companyId={companyId || undefined}
        />
      )}
    </>
  );
}
