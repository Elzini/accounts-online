/**
 * Purchase Invoice - CRUD Operations
 * Handles create, update, delete, and reverse operations.
 */

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useSuppliers, useAddPurchaseBatch, useUpdateCar, useDeleteCar, usePurchaseBatches } from '@/hooks/useDatabase';
import { useTaxSettings, useAccounts } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { CarItem, PurchaseInventoryItem } from '@/components/forms/purchase-invoice/types';
import { getNextInvoiceNumber } from '@/utils/invoiceNumberGenerator';

const PURCHASE_QUERY_KEYS = [
  'purchase-invoices', 'purchase-invoices-nav', 'company-purchases-report',
  'invoices', 'purchases-report', 'journal-entries', 'stats',
  'advanced-analytics', 'monthly-chart-data', 'dashboard-recent-invoices',
];

interface CrudDeps {
  invoiceData: any;
  cars: CarItem[];
  purchaseInventoryItems: PurchaseInventoryItem[];
  calculations: any;
  displayTotals: any;
  currentBatchId: string | null;
  currentInvoiceStatus: string;
  taxRate: number;
  discount: number;
  selectedSupplier: any;
  handleNewInvoice: () => void;
  setDeleteDialogOpen: (v: boolean) => void;
  setReverseDialogOpen: (v: boolean) => void;
  setIsEditing: (v: boolean) => void;
  setSavedBatchData: (v: any) => void;
  setInvoiceOpen: (v: boolean) => void;
}

export function usePurchaseCrud(deps: CrudDeps) {
  const companyId = useCompanyId();
  const { data: purchaseBatches = [] } = usePurchaseBatches();
  const { selectedFiscalYear } = useFiscalYear();
  const addPurchaseBatch = useAddPurchaseBatch();
  const updateCar = useUpdateCar();
  const deleteCar = useDeleteCar();
  const isCarDealership = useIndustryFeatures().hasCarInventory;
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    PURCHASE_QUERY_KEYS.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
      queryClient.invalidateQueries({ queryKey: [key, companyId] });
    });
  };

  // ===== Submit (create) =====
  const handleSubmit = async () => {
    if (!deps.invoiceData.supplier_id) { toast.error(t.inv_toast_select_supplier); return; }

    if (isCarDealership) {
      const invalidCar = deps.cars.find(car => !car.chassis_number || !car.name || !car.purchase_price);
      if (invalidCar) { toast.error(t.inv_toast_fill_fields); return; }
      const chassisNumbers = deps.cars.map(car => car.chassis_number);
      const duplicates = chassisNumbers.filter((item, index) => chassisNumbers.indexOf(item) !== index);
      if (duplicates.length > 0) { toast.error(t.inv_toast_duplicate_chassis); return; }

      try {
        const carsWithPrices = deps.calculations.items.map((car: any, index: number) => ({
          chassis_number: deps.cars[index].chassis_number,
          plate_number: deps.cars[index].plate_number || null,
          name: deps.cars[index].name,
          model: deps.cars[index].model || null,
          color: deps.cars[index].color || null,
          purchase_price: car.baseAmount / (deps.cars[index].quantity || 1),
          fiscal_year_id: selectedFiscalYear?.id ?? null,
          car_condition: deps.cars[index].car_condition || 'new',
        }));
        const result = await addPurchaseBatch.mutateAsync({
          batch: { supplier_id: deps.invoiceData.supplier_id, purchase_date: deps.invoiceData.purchase_date, notes: deps.invoiceData.notes || null, payment_account_id: deps.invoiceData.payment_account_id || undefined },
          cars: carsWithPrices,
        });
        deps.setSavedBatchData({ ...result, supplier: deps.selectedSupplier, cars: deps.cars });
        toast.success(t.inv_toast_purchase_success);
        deps.setInvoiceOpen(true);
      } catch (error: any) {
        if (error.message?.includes('duplicate')) toast.error(t.inv_toast_duplicate_exists);
        else { console.error('Purchase batch error:', error); toast.error(t.inv_toast_purchase_error); }
      }
    } else {
      if (deps.purchaseInventoryItems.length === 0) { toast.error(t.inv_toast_add_item); return; }
      const emptyNameItem = deps.purchaseInventoryItems.find(i => !i.item_name?.trim());
      if (emptyNameItem) { toast.error('الرجاء إدخال اسم الصنف لجميع العناصر'); return; }
      const invalidItem = deps.purchaseInventoryItems.find(i => !i.purchase_price || parseFloat(i.purchase_price) <= 0);
      if (invalidItem) { toast.error(t.inv_toast_enter_item_price); return; }

      try {
        if (!companyId) throw new Error(t.inv_toast_company_not_found);
        const invoiceNumber = await getNextInvoiceNumber(companyId, 'purchase');
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            company_id: companyId, invoice_number: deps.invoiceData.invoice_number || invoiceNumber,
            invoice_type: 'purchase', supplier_id: deps.invoiceData.supplier_id,
            customer_name: deps.selectedSupplier?.name || '', invoice_date: deps.invoiceData.purchase_date,
            due_date: deps.invoiceData.due_date, subtotal: deps.calculations.subtotal,
            taxable_amount: deps.calculations.subtotalAfterDiscount, vat_rate: deps.taxRate,
            vat_amount: deps.calculations.totalVAT, total: deps.calculations.finalTotal,
            discount_amount: deps.calculations.discountAmount,
            amount_paid: deps.invoiceData.payment_status === 'paid' ? deps.calculations.finalTotal : 0,
            payment_status: deps.invoiceData.payment_status || 'unpaid', status: 'draft',
            fiscal_year_id: selectedFiscalYear?.id || null, notes: deps.invoiceData.notes || null,
            project_id: deps.invoiceData.project_id || null,
            supplier_invoice_number: deps.invoiceData.supplier_invoice_number || null,
            payment_account_id: deps.invoiceData.payment_account_id || null,
          })
          .select().single();
        if (invoiceError) throw invoiceError;

        const invoiceItems = deps.purchaseInventoryItems.map((item, index) => ({
          invoice_id: invoice.id, item_description: item.item_name,
          item_code: item.barcode || '', quantity: item.quantity, unit: item.unit_name,
          unit_price: deps.calculations.inventoryItems[index].baseAmount / item.quantity,
          taxable_amount: deps.calculations.inventoryItems[index].baseAmount,
          vat_rate: deps.taxRate, vat_amount: deps.calculations.inventoryItems[index].vatAmount,
          total: deps.calculations.inventoryItems[index].total, inventory_item_id: item.item_id || null,
        }));
        const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);
        if (itemsError) {
          await supabase.from('invoices').delete().eq('id', invoice.id);
          throw itemsError;
        }

        deps.setSavedBatchData({ batch: { id: invoice.id }, supplier: deps.selectedSupplier, inventoryItems: deps.purchaseInventoryItems });
        invalidateAll();
        toast.success(t.inv_toast_purchase_inv_success);
        deps.setInvoiceOpen(true);
      } catch (error: any) {
        console.error('Purchase invoice error:', error);
        toast.error(t.inv_toast_purchase_inv_error);
      }
    }
  };

  // ===== Delete =====
  const handleDeletePurchase = async () => {
    if (!deps.currentBatchId) return;
    const batch = purchaseBatches.find(b => b.id === deps.currentBatchId);
    if (!batch) return;
    const batchCars = batch.cars || [];
    if (batchCars.some((car: any) => car.status === 'sold')) { toast.error(t.inv_toast_cannot_delete_sold); return; }
    try {
      for (const car of batchCars) await deleteCar.mutateAsync(car.id);
      toast.success(t.inv_toast_purchase_delete_success);
      deps.setDeleteDialogOpen(false);
      deps.handleNewInvoice();
    } catch { toast.error(t.inv_toast_delete_error); }
  };

  // ===== Reverse =====
  const handleReversePurchase = async () => {
    if (!deps.currentBatchId) return;
    const batch = purchaseBatches.find(b => b.id === deps.currentBatchId);
    if (!batch) return;
    const batchCars = batch.cars || [];
    if (batchCars.some((car: any) => car.status === 'sold')) { toast.error(t.inv_toast_cannot_reverse_sold); return; }
    try {
      for (const car of batchCars) await deleteCar.mutateAsync(car.id);
      toast.success(t.inv_toast_purchase_reverse_success);
      deps.setReverseDialogOpen(false);
      deps.handleNewInvoice();
    } catch { toast.error(t.inv_toast_reverse_error); }
  };

  // ===== Update =====
  const handleUpdatePurchase = async () => {
    if (!deps.currentBatchId) return;

    if (isCarDealership) {
      const batch = purchaseBatches.find(b => b.id === deps.currentBatchId);
      if (!batch) return;
      const batchCars = batch.cars || [];
      if (deps.cars.length === 0 || !deps.cars[0].chassis_number || !deps.cars[0].name) { toast.error(t.inv_toast_fill_fields); return; }
      try {
        for (let i = 0; i < deps.cars.length && i < batchCars.length; i++) {
          await updateCar.mutateAsync({
            id: batchCars[i].id,
            car: {
              name: deps.cars[i].name, model: deps.cars[i].model || null,
              chassis_number: deps.cars[i].chassis_number, plate_number: deps.cars[i].plate_number || null,
              color: deps.cars[i].color || null, purchase_price: parseFloat(deps.cars[i].purchase_price),
              purchase_date: deps.invoiceData.purchase_date,
              payment_account_id: deps.invoiceData.payment_account_id || null,
              supplier_id: deps.invoiceData.supplier_id || null,
              car_condition: deps.cars[i].car_condition || 'new',
            }
          });
        }
        invalidateAll();
        deps.setIsEditing(false);
        toast.success(t.inv_toast_purchase_update_success);
      } catch { toast.error(t.inv_toast_purchase_update_error); }
      return;
    }

    // Non-car: update invoice
    if (!companyId) { toast.error(t.inv_toast_company_not_found); return; }
    if (!deps.invoiceData.supplier_id) { toast.error(t.inv_toast_select_supplier); return; }
    if (deps.purchaseInventoryItems.length === 0) { toast.error(t.inv_toast_add_item); return; }
    const emptyNameItem = deps.purchaseInventoryItems.find(i => !i.item_name?.trim());
    if (emptyNameItem) { toast.error('الرجاء إدخال اسم الصنف لجميع العناصر'); return; }
    const invalidItem = deps.purchaseInventoryItems.find(i => !i.purchase_price || parseFloat(i.purchase_price) <= 0);
    if (invalidItem) { toast.error(t.inv_toast_enter_item_price); return; }

    const isProtected = ['issued', 'approved', 'posted'].includes(deps.currentInvoiceStatus);
    try {
      const updatePayload: Record<string, any> = {
        invoice_number: deps.invoiceData.invoice_number || null,
        supplier_id: deps.invoiceData.supplier_id,
        customer_name: deps.selectedSupplier?.name || '',
        invoice_date: deps.invoiceData.purchase_date,
        due_date: deps.invoiceData.due_date,
        notes: deps.invoiceData.notes || null,
        project_id: deps.invoiceData.project_id || null,
        payment_status: deps.invoiceData.payment_status || 'unpaid',
        amount_paid: deps.invoiceData.payment_status === 'paid' ? deps.calculations.finalTotal : 0,
        supplier_invoice_number: deps.invoiceData.supplier_invoice_number || null,
        payment_account_id: deps.invoiceData.payment_account_id || null,
      };
      if (!isProtected) {
        updatePayload.subtotal = deps.calculations.subtotal;
        updatePayload.taxable_amount = deps.calculations.subtotalAfterDiscount;
        updatePayload.vat_rate = deps.taxRate;
        updatePayload.vat_amount = deps.calculations.totalVAT;
        updatePayload.total = deps.calculations.finalTotal;
        updatePayload.discount_amount = deps.calculations.discountAmount;
      }
      const { error: invoiceUpdateError } = await supabase.from('invoices').update(updatePayload).eq('id', deps.currentBatchId).eq('company_id', companyId);
      if (invoiceUpdateError) throw invoiceUpdateError;

      if (!isProtected) {
        await supabase.from('invoice_items').delete().eq('invoice_id', deps.currentBatchId);
        const invoiceItems = deps.purchaseInventoryItems.map((item, index) => ({
          invoice_id: deps.currentBatchId,
          item_description: item.item_name, item_code: item.barcode || '',
          quantity: item.quantity, unit: item.unit_name,
          unit_price: deps.calculations.inventoryItems[index].baseAmount / item.quantity,
          taxable_amount: deps.calculations.inventoryItems[index].baseAmount,
          vat_rate: deps.taxRate, vat_amount: deps.calculations.inventoryItems[index].vatAmount,
          total: deps.calculations.inventoryItems[index].total, inventory_item_id: item.item_id || null,
        }));
        await supabase.from('invoice_items').insert(invoiceItems);
      }

      invalidateAll();
      deps.setSavedBatchData({ batch: { id: deps.currentBatchId }, supplier: deps.selectedSupplier, inventoryItems: deps.purchaseInventoryItems });
      deps.setIsEditing(false);
      toast.success(t.inv_toast_purchase_update_success);
    } catch (error) {
      console.error('Purchase invoice update error:', error);
      toast.error(t.inv_toast_purchase_update_error);
    }
  };

  return {
    handleSubmit, handleDeletePurchase, handleReversePurchase, handleUpdatePurchase,
    addPurchaseBatch, updateCar, deleteCar, queryClient,
  };
}
