/**
 * Purchase Invoice - CRUD Operations sub-hook
 * Extracted from usePurchaseInvoice.ts
 */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/hooks/modules/useMiscServices';
import { getNextInvoiceNumber } from '@/utils/invoiceNumberGenerator';
import type { CarItem, PurchaseInventoryItem } from '@/components/forms/purchase-invoice/types';
import type { PurchaseCalcResult } from './usePurchaseInvoiceCalc';

interface CrudDeps {
  companyId: string | null;
  isCarDealership: boolean;
  taxRate: number;
  t: Record<string, any>;
  selectedFiscalYear: any;
  selectedSupplier: any;
  addPurchaseBatch: any;
  updateCar: any;
  deleteCar: any;
  purchaseBatches: any[];
}

export function usePurchaseInvoiceCrud(deps: CrudDeps) {
  const queryClient = useQueryClient();
  const { companyId, isCarDealership, taxRate, t, selectedFiscalYear, selectedSupplier, addPurchaseBatch, updateCar, deleteCar, purchaseBatches } = deps;

  const invalidateAll = useCallback(() => {
    const keys = [
      'purchase-invoices', ['purchase-invoices-nav', companyId], ['company-purchases-report', companyId],
      ['invoices', companyId], 'invoices', 'purchases-report', 'journal-entries',
      'stats', 'advanced-analytics', 'monthly-chart-data', 'dashboard-recent-invoices',
    ];
    keys.forEach(k => queryClient.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] }));
  }, [queryClient, companyId]);

  const handleSubmitCar = useCallback(async (
    cars: CarItem[], calculations: PurchaseCalcResult, invoiceData: any,
    onSuccess: (data: any) => void,
  ) => {
    const invalidCar = cars.find(car => !car.chassis_number || !car.name || !car.purchase_price);
    if (invalidCar) { toast.error(t.inv_toast_fill_fields); return; }
    const chassisNumbers = cars.map(car => car.chassis_number);
    const duplicates = chassisNumbers.filter((item, index) => chassisNumbers.indexOf(item) !== index);
    if (duplicates.length > 0) { toast.error(t.inv_toast_duplicate_chassis); return; }
    try {
      const carsWithPrices = calculations.items.map((car, index) => ({
        chassis_number: cars[index].chassis_number, plate_number: cars[index].plate_number || null,
        name: cars[index].name, model: cars[index].model || null, color: cars[index].color || null,
        purchase_price: car.baseAmount / (cars[index].quantity || 1),
        fiscal_year_id: selectedFiscalYear?.id ?? null, car_condition: cars[index].car_condition || 'new',
      }));
      const result = await addPurchaseBatch.mutateAsync({
        batch: { supplier_id: invoiceData.supplier_id, purchase_date: invoiceData.purchase_date, notes: invoiceData.notes || null, payment_account_id: invoiceData.payment_account_id || undefined },
        cars: carsWithPrices,
      });
      onSuccess({ ...result, supplier: selectedSupplier, cars });
      toast.success(t.inv_toast_purchase_success);
    } catch (error: any) {
      if (error.message?.includes('duplicate')) toast.error(t.inv_toast_duplicate_exists);
      else { console.error('Purchase batch error:', error); toast.error(t.inv_toast_purchase_error); }
    }
  }, [addPurchaseBatch, selectedFiscalYear, selectedSupplier, t]);

  const handleSubmitInvoice = useCallback(async (
    items: PurchaseInventoryItem[], calculations: PurchaseCalcResult, invoiceData: any,
    onSuccess: (data: any) => void,
  ) => {
    if (items.length === 0) { toast.error(t.inv_toast_add_item); return; }
    const emptyName = items.find(i => !i.item_name?.trim());
    if (emptyName) { toast.error('الرجاء إدخال اسم الصنف لجميع العناصر'); return; }
    const invalidItem = items.find(i => !i.purchase_price || parseFloat(i.purchase_price) <= 0);
    if (invalidItem) { toast.error(t.inv_toast_enter_item_price); return; }
    if (!companyId) { toast.error(t.inv_toast_company_not_found); return; }
    try {
      const invoiceNumber = await getNextInvoiceNumber(companyId, 'purchase');
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices').insert({
          company_id: companyId, invoice_number: invoiceData.invoice_number || invoiceNumber,
          invoice_type: 'purchase', supplier_id: invoiceData.supplier_id,
          customer_name: selectedSupplier?.name || '', invoice_date: invoiceData.purchase_date,
          due_date: invoiceData.due_date, subtotal: calculations.subtotal,
          taxable_amount: calculations.subtotalAfterDiscount, vat_rate: taxRate,
          vat_amount: calculations.totalVAT, total: calculations.finalTotal,
          discount_amount: calculations.discountAmount,
          amount_paid: invoiceData.payment_status === 'paid' ? calculations.finalTotal : 0,
          payment_status: invoiceData.payment_status || 'unpaid', status: 'draft',
          fiscal_year_id: selectedFiscalYear?.id || null, notes: invoiceData.notes || null,
          project_id: invoiceData.project_id || null,
          supplier_invoice_number: invoiceData.supplier_invoice_number || null,
          payment_account_id: invoiceData.payment_account_id || null,
        }).select().single();
      if (invoiceError) throw invoiceError;
      const invoiceItems = items.map((item, index) => ({
        invoice_id: invoice.id, item_description: item.item_name,
        item_code: item.barcode || '', quantity: item.quantity, unit: item.unit_name,
        unit_price: calculations.inventoryItems[index].baseAmount / item.quantity,
        taxable_amount: calculations.inventoryItems[index].baseAmount,
        vat_rate: taxRate, vat_amount: calculations.inventoryItems[index].vatAmount,
        total: calculations.inventoryItems[index].total, inventory_item_id: item.item_id || null,
      }));
      const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);
      if (itemsError) {
        await supabase.from('invoices').delete().eq('id', invoice.id);
        throw itemsError;
      }
      invalidateAll();
      onSuccess({ batch: { id: invoice.id }, supplier: selectedSupplier, inventoryItems: items });
      toast.success(t.inv_toast_purchase_inv_success);
    } catch (error: any) {
      console.error('Purchase invoice error:', error);
      toast.error(t.inv_toast_purchase_inv_error);
    }
  }, [companyId, taxRate, selectedFiscalYear, selectedSupplier, t, invalidateAll]);

  const handleDeleteBatch = useCallback(async (
    batchId: string, onSuccess: () => void,
  ) => {
    const batch = purchaseBatches.find(b => b.id === batchId);
    if (!batch) return;
    const batchCars = batch.cars || [];
    if (batchCars.some((car: any) => car.status === 'sold')) { toast.error(t.inv_toast_cannot_delete_sold); return; }
    try {
      for (const car of batchCars) await deleteCar.mutateAsync(car.id);
      toast.success(t.inv_toast_purchase_delete_success);
      onSuccess();
    } catch { toast.error(t.inv_toast_delete_error); }
  }, [purchaseBatches, deleteCar, t]);

  const handleReverseBatch = useCallback(async (
    batchId: string, onSuccess: () => void,
  ) => {
    const batch = purchaseBatches.find(b => b.id === batchId);
    if (!batch) return;
    const batchCars = batch.cars || [];
    if (batchCars.some((car: any) => car.status === 'sold')) { toast.error(t.inv_toast_cannot_reverse_sold); return; }
    try {
      for (const car of batchCars) await deleteCar.mutateAsync(car.id);
      toast.success(t.inv_toast_purchase_reverse_success);
      onSuccess();
    } catch { toast.error(t.inv_toast_reverse_error); }
  }, [purchaseBatches, deleteCar, t]);

  const handleUpdateCar = useCallback(async (
    batchId: string, cars: CarItem[], invoiceData: any, onSuccess: () => void,
  ) => {
    const batch = purchaseBatches.find(b => b.id === batchId);
    if (!batch) return;
    const batchCars = batch.cars || [];
    if (cars.length === 0 || !cars[0].chassis_number || !cars[0].name) { toast.error(t.inv_toast_fill_fields); return; }
    try {
      for (let i = 0; i < cars.length && i < batchCars.length; i++) {
        await updateCar.mutateAsync({
          id: batchCars[i].id,
          car: {
            name: cars[i].name, model: cars[i].model || null,
            chassis_number: cars[i].chassis_number, plate_number: cars[i].plate_number || null,
            color: cars[i].color || null, purchase_price: parseFloat(cars[i].purchase_price),
            purchase_date: invoiceData.purchase_date,
            payment_account_id: invoiceData.payment_account_id || null,
            supplier_id: invoiceData.supplier_id || null,
            car_condition: cars[i].car_condition || 'new',
          }
        });
      }
      queryClient.invalidateQueries({ queryKey: ['purchase-batches', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company-purchases-report', companyId] });
      onSuccess();
      toast.success(t.inv_toast_purchase_update_success);
    } catch { toast.error(t.inv_toast_purchase_update_error); }
  }, [purchaseBatches, updateCar, queryClient, companyId, t]);

  const handleUpdateInvoice = useCallback(async (
    invoiceId: string, items: PurchaseInventoryItem[], calculations: PurchaseCalcResult,
    invoiceData: any, currentStatus: string, onSuccess: () => void,
  ) => {
    if (!companyId) { toast.error(t.inv_toast_company_not_found); return; }
    if (!invoiceData.supplier_id) { toast.error(t.inv_toast_select_supplier); return; }
    if (items.length === 0) { toast.error(t.inv_toast_add_item); return; }
    const emptyName = items.find(i => !i.item_name?.trim());
    if (emptyName) { toast.error('الرجاء إدخال اسم الصنف لجميع العناصر'); return; }
    const invalidItem = items.find(i => !i.purchase_price || parseFloat(i.purchase_price) <= 0);
    if (invalidItem) { toast.error(t.inv_toast_enter_item_price); return; }
    const isProtected = ['issued', 'approved', 'posted'].includes(currentStatus);
    try {
      const updatePayload: Record<string, any> = {
        invoice_number: invoiceData.invoice_number || null,
        supplier_id: invoiceData.supplier_id,
        customer_name: selectedSupplier?.name || '',
        invoice_date: invoiceData.purchase_date,
        due_date: invoiceData.due_date,
        notes: invoiceData.notes || null,
        project_id: invoiceData.project_id || null,
        payment_status: invoiceData.payment_status || 'unpaid',
        amount_paid: invoiceData.payment_status === 'paid' ? calculations.finalTotal : 0,
        supplier_invoice_number: invoiceData.supplier_invoice_number || null,
        payment_account_id: invoiceData.payment_account_id || null,
      };
      if (!isProtected) {
        updatePayload.subtotal = calculations.subtotal;
        updatePayload.taxable_amount = calculations.subtotalAfterDiscount;
        updatePayload.vat_rate = taxRate;
        updatePayload.vat_amount = calculations.totalVAT;
        updatePayload.total = calculations.finalTotal;
        updatePayload.discount_amount = calculations.discountAmount;
      }
      const { error } = await supabase.from('invoices').update(updatePayload).eq('id', invoiceId).eq('company_id', companyId);
      if (error) throw error;
      if (!isProtected) {
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
        const invoiceItems = items.map((item, index) => ({
          invoice_id: invoiceId, item_description: item.item_name, item_code: item.barcode || '',
          quantity: item.quantity, unit: item.unit_name,
          unit_price: calculations.inventoryItems[index].baseAmount / item.quantity,
          taxable_amount: calculations.inventoryItems[index].baseAmount,
          vat_rate: taxRate, vat_amount: calculations.inventoryItems[index].vatAmount,
          total: calculations.inventoryItems[index].total, inventory_item_id: item.item_id,
        }));
        await supabase.from('invoice_items').insert(invoiceItems);
      }
      invalidateAll();
      onSuccess();
      toast.success(t.inv_toast_purchase_update_success);
    } catch (error) {
      console.error('Purchase invoice update error:', error);
      toast.error(t.inv_toast_purchase_update_error);
    }
  }, [companyId, taxRate, selectedSupplier, t, invalidateAll]);

  return {
    handleSubmitCar, handleSubmitInvoice,
    handleDeleteBatch, handleReverseBatch,
    handleUpdateCar, handleUpdateInvoice,
  };
}
