/**
 * Sales Invoice CRUD Actions
 * Extracted from useSalesInvoiceData.ts for maintainability
 */
import { toast } from 'sonner';
import { supabase } from '@/hooks/modules/useMiscServices';
import { linkTransferToSale } from '@/hooks/useTransfers';
import { getServiceContainer } from '@/core/engine/serviceContainer';
import { SelectedCarItem, SelectedInventoryItem, InvoiceFormData } from './types';

interface ActionDeps {
  invoiceData: InvoiceFormData;
  selectedCars: SelectedCarItem[];
  selectedInventoryItems: SelectedInventoryItem[];
  calculations: any;
  displayTotals: any;
  selectedCustomer: any;
  taxRate: number;
  companyId: string | null;
  selectedFiscalYear: any;
  nextInvoiceNumber: string;
  isCarDealership: boolean;
  paidAmount: number;
  existingInvoices: any[];
  existingSales: any[];
  currentSaleId: string | null;
  accounts: any[];
  allCars: any[];
  addMultiCarSale: any;
  deleteSale: any;
  reverseSale: any;
  updateSaleWithItems: any;
  addInstallmentSale: any;
  approveSale: any;
  t: any;
  language: string;
  setExistingInvoices: (v: any[]) => void;
  setSavedSaleData: (v: any) => void;
  setIsViewingExisting: (v: boolean) => void;
  setCurrentSaleId: (v: string | null) => void;
  setCurrentSaleStatus: (v: 'draft' | 'approved') => void;
  setIsEditing: (v: boolean) => void;
  setDeleteDialogOpen: (v: boolean) => void;
  setReverseDialogOpen: (v: boolean) => void;
  setApproveDialogOpen: (v: boolean) => void;
  handleNewInvoice: () => void;
}

export function createSalesInvoiceActions(deps: ActionDeps) {
  const {
    invoiceData, selectedCars, selectedInventoryItems, calculations, selectedCustomer,
    taxRate, companyId, selectedFiscalYear, nextInvoiceNumber, isCarDealership, paidAmount,
    existingInvoices, currentSaleId,
    addMultiCarSale, deleteSale, reverseSale, updateSaleWithItems, addInstallmentSale, approveSale,
    t, language,
    setExistingInvoices, setSavedSaleData, setIsViewingExisting, setCurrentSaleId, setCurrentSaleStatus,
    setIsEditing, setDeleteDialogOpen, setReverseDialogOpen, setApproveDialogOpen, handleNewInvoice,
  } = deps;

  const handleSubmit = async () => {
    if (!invoiceData.customer_id) { toast.error(t.inv_toast_select_customer); return; }

    if (isCarDealership) {
      if (selectedCars.length === 0) { toast.error(t.inv_toast_add_car); return; }
      const invalidCar = selectedCars.find(car => !car.sale_price || parseFloat(car.sale_price) <= 0);
      if (invalidCar) { toast.error(t.inv_toast_enter_price); return; }

      try {
        const carsWithPrices = selectedCars.map((car, index) => ({ car_id: car.car_id, sale_price: calculations.items[index].total, purchase_price: car.purchase_price }));
        const sale = await addMultiCarSale.mutateAsync({
          customer_id: invoiceData.customer_id, seller_name: invoiceData.seller_name || undefined,
          commission: parseFloat(invoiceData.commission) || 0, other_expenses: parseFloat(invoiceData.other_expenses) || 0,
          sale_date: invoiceData.sale_date, payment_account_id: invoiceData.payment_account_id || undefined, cars: carsWithPrices,
        });

        for (const car of selectedCars) {
          if (car.pendingTransfer) {
            try { await linkTransferToSale(car.pendingTransfer.id, sale.id, parseFloat(car.sale_price), car.pendingTransfer.agreed_commission, car.pendingTransfer.commission_percentage); } catch (error) { console.error('Error linking transfer to sale:', error); }
          }
        }

        if (invoiceData.is_installment && companyId) {
          const downPayment = parseFloat(invoiceData.down_payment) || 0;
          const numberOfInstallments = parseInt(invoiceData.number_of_installments) || 12;
          const remainingAmount = calculations.finalTotal - downPayment;
          try {
            await addInstallmentSale.mutateAsync({ company_id: companyId, sale_id: sale.id, total_amount: calculations.finalTotal, down_payment: downPayment, remaining_amount: remainingAmount, number_of_installments: numberOfInstallments, installment_amount: remainingAmount / numberOfInstallments, start_date: invoiceData.sale_date, status: 'active', notes: invoiceData.notes || null });
            toast.success(t.inv_toast_installment_success);
          } catch (error) { toast.error(t.inv_toast_installment_error); }
        }

        setSavedSaleData({ ...sale, customer: selectedCustomer, cars: selectedCars });
        toast.success(t.inv_draft_saved);
        setIsViewingExisting(true); setCurrentSaleId(sale.id); setCurrentSaleStatus('draft');
      } catch (error: any) { console.error('Sale error:', error); toast.error(t.inv_toast_sale_error); }
    } else {
      if (selectedInventoryItems.length === 0) { toast.error(t.inv_toast_add_item); return; }
      const emptyNameItem = selectedInventoryItems.find(i => !i.item_name?.trim());
      if (emptyNameItem) { toast.error('الرجاء إدخال اسم الصنف لجميع العناصر'); return; }
      const invalidItem = selectedInventoryItems.find(i => !i.sale_price || parseFloat(i.sale_price) <= 0);
      if (invalidItem) { toast.error(t.inv_toast_enter_item_price); return; }

      try {
        if (!companyId) throw new Error(t.inv_toast_company_not_found);
        const finalInvoiceNumber = invoiceData.invoice_number || nextInvoiceNumber;

        const { data: existing } = await supabase.from('invoices').select('id').eq('company_id', companyId).eq('invoice_number', finalInvoiceNumber).eq('invoice_type', 'sales').maybeSingle();
        if (existing) { toast.error(language === 'ar' ? 'رقم الفاتورة موجود مسبقاً، الرجاء استخدام رقم آخر' : 'Invoice number already exists'); return; }

        const { data: invoice, error: invoiceError } = await supabase.from('invoices').insert({
          company_id: companyId, invoice_number: finalInvoiceNumber, invoice_type: 'sales',
          customer_id: invoiceData.customer_id, customer_name: selectedCustomer?.name || '',
          invoice_date: `${invoiceData.sale_date}T${invoiceData.issue_time || '00:00'}:00`,
          subtotal: calculations.subtotal, taxable_amount: calculations.subtotalAfterDiscount,
          vat_rate: taxRate, vat_amount: calculations.totalVAT, total: calculations.finalTotal,
          discount_amount: calculations.discountAmount, amount_paid: paidAmount,
          payment_status: paidAmount >= calculations.finalTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
          status: 'draft', fiscal_year_id: selectedFiscalYear?.id || null, notes: invoiceData.notes || null,
        }).select().single();
        if (invoiceError) throw invoiceError;

        const invoiceItems = selectedInventoryItems.map((item, index) => ({
          invoice_id: invoice.id, item_description: item.item_name, item_code: item.barcode || '',
          quantity: item.quantity, unit: item.unit_name, unit_price: calculations.inventoryItems[index].baseAmount / item.quantity,
          taxable_amount: calculations.inventoryItems[index].baseAmount, vat_rate: taxRate,
          vat_amount: calculations.inventoryItems[index].vatAmount, total: calculations.inventoryItems[index].total,
          inventory_item_id: item.item_id || null,
        }));
        const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);
        if (itemsError) {
          await supabase.from('invoices').delete().eq('id', invoice.id);
          throw itemsError;
        }

        setSavedSaleData({ id: invoice.id, customer: selectedCustomer, inventoryItems: selectedInventoryItems });
        toast.success('✅ تم حفظ الفاتورة كمسودة - يمكنك تعديلها أو اعتمادها محاسبياً');
        setIsViewingExisting(true); setCurrentSaleId(invoice.id); setCurrentSaleStatus('draft');

        const { data: updatedInvoices } = await supabase.from('invoices').select('*, invoice_items(*)').eq('company_id', companyId).eq('invoice_type', 'sales').order('created_at', { ascending: true });
        setExistingInvoices(updatedInvoices || []);
      } catch (error: any) { console.error('Invoice error:', error); toast.error(t.inv_toast_invoice_error); }
    }
  };

  const handleUpdateSale = async () => {
    if (!currentSaleId || !invoiceData.customer_id) { toast.error(t.inv_toast_select_customer); return; }
    const isInvoiceRecord = existingInvoices.some(inv => inv.id === currentSaleId);

    if (isInvoiceRecord) {
      if (selectedInventoryItems.length === 0) { toast.error(t.inv_toast_add_item); return; }
      try {
        const { error: invoiceError } = await supabase.from('invoices').update({
          customer_id: invoiceData.customer_id, customer_name: selectedCustomer?.name || '',
          invoice_date: `${invoiceData.sale_date}T${invoiceData.issue_time || '00:00'}:00`,
          subtotal: calculations.subtotal, taxable_amount: calculations.subtotalAfterDiscount,
          vat_rate: taxRate, vat_amount: calculations.totalVAT, total: calculations.finalTotal,
          discount_amount: calculations.discountAmount, amount_paid: paidAmount,
          payment_status: paidAmount >= calculations.finalTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
          notes: invoiceData.notes || null,
        }).eq('id', currentSaleId);
        if (invoiceError) throw invoiceError;

        await supabase.from('invoice_items').delete().eq('invoice_id', currentSaleId);
        const invoiceItems = selectedInventoryItems.map((item, index) => ({
          invoice_id: currentSaleId, item_description: item.item_name, item_code: item.barcode || '',
          quantity: item.quantity, unit: item.unit_name, unit_price: calculations.inventoryItems[index].baseAmount / item.quantity,
          taxable_amount: calculations.inventoryItems[index].baseAmount, vat_rate: taxRate,
          vat_amount: calculations.inventoryItems[index].vatAmount, total: calculations.inventoryItems[index].total,
          inventory_item_id: item.item_id || null,
        }));
        const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);
        if (itemsError) throw itemsError;

        const { data: updatedInvoices } = await supabase.from('invoices').select('*, invoice_items(*)').eq('company_id', companyId).eq('invoice_type', 'sales').order('created_at', { ascending: true });
        setExistingInvoices(updatedInvoices || []);
        toast.success(t.inv_toast_update_success); setIsEditing(false);
      } catch (error) { console.error('Update invoice error:', error); toast.error(t.inv_toast_update_error); }
    } else {
      if (selectedCars.length === 0) { toast.error(t.inv_toast_add_car); return; }
      const invalidCar = selectedCars.find(car => !car.sale_price || parseFloat(car.sale_price) <= 0);
      if (invalidCar) { toast.error(t.inv_toast_enter_price); return; }
      try {
        const items = selectedCars.map((car, index) => ({ car_id: car.car_id, sale_price: calculations.items[index].total, purchase_price: car.purchase_price }));
        await updateSaleWithItems.mutateAsync({
          saleId: currentSaleId, saleData: { sale_price: calculations.finalTotal, seller_name: invoiceData.seller_name || null, commission: parseFloat(invoiceData.commission) || 0, other_expenses: parseFloat(invoiceData.other_expenses) || 0, sale_date: invoiceData.sale_date, profit: calculations.profit, payment_account_id: invoiceData.payment_account_id || null }, items,
        });
        toast.success(t.inv_toast_update_success);
      } catch (error) { console.error('Update sale error:', error); toast.error(t.inv_toast_update_error); }
    }
  };

  const handleDeleteSale = async () => {
    if (!currentSaleId) return;
    try {
      const isInvoiceRecord = existingInvoices.some(inv => inv.id === currentSaleId);
      if (isInvoiceRecord) {
        const currentInvoice = existingInvoices.find(inv => inv.id === currentSaleId);
        if (currentInvoice?.status && currentInvoice.status !== 'draft') { toast.error(t.inv_cannot_edit_approved); return; }
        await supabase.from('invoice_items').delete().eq('invoice_id', currentSaleId);
        const { error: deleteInvoiceError } = await supabase.from('invoices').delete().eq('id', currentSaleId);
        if (deleteInvoiceError) throw deleteInvoiceError;
        const { data: updatedInvoices } = await supabase.from('invoices').select('*, invoice_items(*)').eq('company_id', companyId).eq('invoice_type', 'sales').order('created_at', { ascending: true });
        setExistingInvoices(updatedInvoices || []);
      } else {
        const sale = deps.existingSales.find(s => s.id === currentSaleId);
        if (!sale) return;
        await deleteSale.mutateAsync({ saleId: currentSaleId, carId: sale.car_id });
      }
      toast.success(t.inv_toast_delete_success);
      setDeleteDialogOpen(false);
      handleNewInvoice();
    } catch (error) { console.error('Delete sale error:', error); toast.error(t.inv_toast_delete_error); }
  };

  const handleReverseSale = async () => {
    if (!currentSaleId) return;
    try { await reverseSale.mutateAsync(currentSaleId); toast.success(t.inv_toast_reverse_success); setReverseDialogOpen(false); handleNewInvoice(); }
    catch (error) { toast.error(t.inv_toast_reverse_error); }
  };

  const handleApproveSale = async () => {
    if (!currentSaleId) return;
    try {
      const isInvoiceRecord = existingInvoices.some(inv => inv.id === currentSaleId);
      if (isInvoiceRecord) {
        const { invoicePosting } = getServiceContainer(companyId || '');
        await invoicePosting.postInvoice(currentSaleId);
        const { data: updatedInvoices } = await supabase.from('invoices').select('*, invoice_items(*)').eq('company_id', companyId).eq('invoice_type', 'sales').order('created_at', { ascending: true });
        setExistingInvoices(updatedInvoices || []);
      } else { await approveSale.mutateAsync(currentSaleId); }
      setCurrentSaleStatus('approved'); setIsEditing(false); toast.success(t.inv_approved_success); setApproveDialogOpen(false);
    } catch (error) { console.error('Approve sale error:', error); toast.error(t.inv_approved_error); }
  };

  return { handleSubmit, handleUpdateSale, handleDeleteSale, handleReverseSale, handleApproveSale };
}
