/**
 * Custom hook - Purchase Invoice Logic
 * Extracted from PurchaseInvoiceForm.tsx to reduce component size.
 * Contains all state, calculations, navigation, and CRUD handlers.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { calculatePurchaseInvoice } from './purchase-invoice/calculations';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSuppliers, useAddPurchaseBatch, useCars, useUpdateCar, useDeleteCar, usePurchaseBatches } from '@/hooks/useDatabase';
import { useTaxSettings, useAccounts } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useItems, useUnits } from '@/hooks/useInventory';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNumberFormat } from '@/hooks/useNumberFormat';
import { useCostCenters } from '@/hooks/useCostCenters';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { CarItem, PurchaseInventoryItem } from '@/components/forms/purchase-invoice/types';
import { handleBatchImport } from '@/components/forms/purchase-invoice/batchImport';
import { getNextInvoiceNumber } from '@/utils/invoiceNumberGenerator';
import { formatInvoiceCurrency } from '@/components/forms/shared-invoice';
import type { ParsedInvoiceData, BatchParsedResult } from '@/components/forms/PurchaseInvoiceAIImport';
import type { ActivePage } from '@/types';

export function usePurchaseInvoice() {
  const { data: suppliers = [] } = useSuppliers();
  const { data: taxSettings } = useTaxSettings();
  const { data: accounts = [] } = useAccounts();
  const { data: existingCars = [] } = useCars();
  const { data: purchaseBatches = [] } = usePurchaseBatches();
  const { company } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const { data: costCenters = [] } = useCostCenters();
  const addPurchaseBatch = useAddPurchaseBatch();
  const updateCar = useUpdateCar();
  const deleteCar = useDeleteCar();
  const companyId = useCompanyId();
  const { t, language } = useLanguage();
  const { decimals } = useNumberFormat();
  const queryClient = useQueryClient();
  const { data: inventoryItems = [] } = useItems();
  const { data: units = [] } = useUnits();
  const isCarDealership = useIndustryFeatures().hasCarInventory;
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const currency = t.inv_sar;

  // ===== Helpers =====
  const createEmptyCar = useCallback((): CarItem => ({
    id: crypto.randomUUID(),
    chassis_number: '',
    plate_number: '',
    name: '',
    model: '',
    color: '',
    purchase_price: '',
    quantity: 1,
    unit: t.inv_car_unit,
    car_condition: 'new',
  }), [t.inv_car_unit]);

  const createEmptyInventoryItem = useCallback((): PurchaseInventoryItem => ({
    id: crypto.randomUUID(),
    item_id: null,
    item_name: '',
    barcode: '',
    unit_name: t.inv_unit,
    unit_id: null,
    purchase_price: '',
    quantity: 1,
  }), [t.inv_unit]);

  // ===== State =====
  const [purchaseInventoryItems, setPurchaseInventoryItems] = useState<PurchaseInventoryItem[]>([]);
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_account_id: '',
    warehouse: 'main',
    notes: '',
    price_includes_tax: false,
    project_id: null as string | null,
    cost_center_id: null as string | null,
    payment_status: 'unpaid' as string,
    supplier_invoice_number: '',
  });
  const [cars, setCars] = useState<CarItem[]>([createEmptyCar()]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [savedBatchData, setSavedBatchData] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('amount');
  const [currentInvoiceIndex, setCurrentInvoiceIndex] = useState(0);
  const [isViewingExisting, setIsViewingExisting] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [currentInvoiceStatus, setCurrentInvoiceStatus] = useState<string>('draft');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [storedHeaderTotals, setStoredHeaderTotals] = useState<{
    subtotal: number; vat_amount: number; total: number;
  } | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const initialNavDone = useRef(false);

  // ===== Default payment account =====
  useEffect(() => {
    if (accounts.length > 0 && !invoiceData.payment_account_id) {
      const cashAccount = accounts.find(a => a.code === '1101');
      if (cashAccount) {
        setInvoiceData(prev => ({ ...prev, payment_account_id: cashAccount.id }));
      }
    }
  }, [accounts, invoiceData.payment_account_id]);

  // ===== Fiscal year filtered data =====
  const fiscalYearFilteredBatches = useMemo(() => {
    let filtered = purchaseBatches;
    if (selectedFiscalYear) {
      const fyStart = new Date(selectedFiscalYear.start_date);
      fyStart.setHours(0, 0, 0, 0);
      const fyEnd = new Date(selectedFiscalYear.end_date);
      fyEnd.setHours(23, 59, 59, 999);
      filtered = purchaseBatches.filter(batch => {
        const d = new Date(batch.purchase_date);
        return d >= fyStart && d <= fyEnd;
      });
    }
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.purchase_date).getTime();
      const dateB = new Date(b.purchase_date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [purchaseBatches, selectedFiscalYear]);

  const fiscalYearFilteredCars = useMemo(() => {
    if (!selectedFiscalYear) return existingCars;
    const fyStart = new Date(selectedFiscalYear.start_date);
    fyStart.setHours(0, 0, 0, 0);
    const fyEnd = new Date(selectedFiscalYear.end_date);
    fyEnd.setHours(23, 59, 59, 999);
    return existingCars.filter(car => {
      const d = new Date(car.purchase_date);
      return d >= fyStart && d <= fyEnd;
    });
  }, [existingCars, selectedFiscalYear]);

  const { data: purchaseInvoices = [] } = useQuery({
    queryKey: ['purchase-invoices-nav', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('invoices')
        .select('*, invoice_items(*), supplier:suppliers!invoices_supplier_id_fkey(name, id_number)')
        .eq('company_id', companyId!)
        .eq('invoice_type', 'purchase')
        .order('invoice_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && !isCarDealership,
    staleTime: 5 * 60 * 1000,
  });

  const filteredPurchaseInvoices = useMemo(() => {
    if (isCarDealership) return [];
    let filtered = purchaseInvoices;
    if (selectedFiscalYear) {
      const fyStart = new Date(selectedFiscalYear.start_date);
      fyStart.setHours(0, 0, 0, 0);
      const fyEnd = new Date(selectedFiscalYear.end_date);
      fyEnd.setHours(23, 59, 59, 999);
      filtered = purchaseInvoices.filter((inv: any) => {
        const d = new Date(inv.invoice_date);
        return d >= fyStart && d <= fyEnd;
      });
    }
    return filtered;
  }, [purchaseInvoices, selectedFiscalYear, isCarDealership]);

  const navigationRecords = useMemo(() => {
    return isCarDealership ? fiscalYearFilteredBatches : filteredPurchaseInvoices;
  }, [isCarDealership, fiscalYearFilteredBatches, filteredPurchaseInvoices]);

  const nextInvoiceNumber = useMemo(() => {
    if (isCarDealership) return purchaseBatches.length + 1;
    const maxInvoiceNumber = filteredPurchaseInvoices.reduce((max: number, inv: any) => {
      const parsed = parseInt(String(inv.invoice_number || ''), 10);
      return Number.isNaN(parsed) ? max : Math.max(max, parsed);
    }, 0);
    return maxInvoiceNumber + 1;
  }, [isCarDealership, purchaseBatches, filteredPurchaseInvoices]);

  // ===== Navigate to specific invoice from session =====
  useEffect(() => {
    if (initialNavDone.current) return;
    const targetId = sessionStorage.getItem('viewPurchaseInvoiceId');
    if (targetId && navigationRecords.length > 0) {
      sessionStorage.removeItem('viewPurchaseInvoiceId');
      initialNavDone.current = true;
      const idx = navigationRecords.findIndex((r: any) => r.id === targetId);
      if (idx >= 0) {
        setCurrentInvoiceIndex(idx);
        loadRecordData(navigationRecords[idx]);
      }
    }
  }, [navigationRecords]);

  const selectedSupplier = suppliers.find(s => s.id === invoiceData.supplier_id);
  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_purchases ? (taxSettings?.tax_rate || 15) : 0;

  // ===== Item handlers =====
  const handleAddCar = () => setCars([...cars, createEmptyCar()]);
  const handleRemoveCar = (id: string) => {
    if (cars.length === 1) { toast.error(t.inv_toast_min_one_car); return; }
    setCars(cars.filter(car => car.id !== id));
  };
  const handleCarChange = (id: string, field: keyof CarItem, value: string | number) => {
    setCars(cars.map(car => car.id === id ? { ...car, [field]: value } : car));
  };

  const handleAddInventoryItem = () => setPurchaseInventoryItems([...purchaseInventoryItems, createEmptyInventoryItem()]);
  const handleSelectExistingItem = (itemId: string) => {
    const item = (inventoryItems || []).find((i: any) => i.id === itemId) as any;
    if (!item) return;
    setPurchaseInventoryItems([...purchaseInventoryItems, {
      id: crypto.randomUUID(),
      item_id: item.id,
      item_name: item.name,
      barcode: item.barcode || '',
      unit_name: item.units_of_measure?.abbreviation || item.units_of_measure?.name || t.inv_unit,
      unit_id: item.unit_id,
      purchase_price: String(item.cost_price || ''),
      quantity: 1,
    }]);
  };
  const handleRemoveInventoryItem = (id: string) => {
    if (purchaseInventoryItems.length === 1) { toast.error(t.inv_toast_min_one_item); return; }
    setPurchaseInventoryItems(purchaseInventoryItems.filter(i => i.id !== id));
  };
  const handleInventoryItemChange = (id: string, field: keyof PurchaseInventoryItem, value: string | number) => {
    setPurchaseInventoryItems(purchaseInventoryItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // ===== Calculations =====
  const calculations = useMemo(() => {
    return calculatePurchaseInvoice(cars, purchaseInventoryItems, invoiceData.price_includes_tax, taxRate, discount, discountType);
  }, [cars, purchaseInventoryItems, invoiceData.price_includes_tax, taxRate, discount, discountType]);

  const displayTotals = useMemo(() => {
    if (isViewingExisting && !isEditing && storedHeaderTotals && storedHeaderTotals.total > 0) {
      return {
        subtotal: storedHeaderTotals.subtotal,
        totalVAT: storedHeaderTotals.vat_amount,
        finalTotal: storedHeaderTotals.total,
        discountAmount: calculations.discountAmount,
        subtotalAfterDiscount: storedHeaderTotals.subtotal - calculations.discountAmount,
      };
    }
    return {
      subtotal: calculations.subtotal,
      totalVAT: calculations.totalVAT,
      finalTotal: calculations.finalTotal,
      discountAmount: calculations.discountAmount,
      subtotalAfterDiscount: calculations.subtotalAfterDiscount,
    };
  }, [calculations, storedHeaderTotals, isViewingExisting, isEditing]);

  const formatCurrency = (value: number) => formatInvoiceCurrency(value, decimals);

  // ===== Navigation =====
  const loadRecordData = useCallback((record: any) => {
    setIsViewingExisting(true);
    setCurrentBatchId(record.id);
    setCurrentInvoiceStatus(record.status || 'draft');
    setIsEditing(false);

    if (isCarDealership) {
      setInvoiceData({
        invoice_number: String(currentInvoiceIndex + 1),
        supplier_id: record.supplier_id || '',
        purchase_date: record.purchase_date,
        due_date: record.purchase_date,
        payment_account_id: record.payment_account_id || '',
        warehouse: 'main',
        notes: record.notes || '',
        price_includes_tax: false,
        project_id: null,
        cost_center_id: null,
        payment_status: 'unpaid',
        supplier_invoice_number: '',
      });
      const batchCars = record.cars || [];
      if (batchCars.length > 0) {
        setCars(batchCars.map((car: any) => ({
          id: crypto.randomUUID(),
          chassis_number: car.chassis_number,
          plate_number: car.plate_number || '',
          name: car.name,
          model: car.model || '',
          color: car.color || '',
          purchase_price: String(car.purchase_price),
          quantity: 1,
          unit: t.inv_car_unit,
          car_condition: ((car.car_condition || 'new') as 'new' | 'used'),
        })));
      } else {
        setCars([createEmptyCar()]);
      }
    } else {
      setInvoiceData({
        invoice_number: String(record.invoice_number || ''),
        supplier_id: record.supplier_id || '',
        purchase_date: record.invoice_date || '',
        due_date: record.due_date || record.invoice_date || '',
        payment_account_id: record.payment_account_id || '',
        warehouse: 'main',
        notes: record.notes || '',
        price_includes_tax: false,
        project_id: record.project_id || null,
        cost_center_id: null,
        payment_status: record.payment_status || 'unpaid',
        supplier_invoice_number: record.supplier_invoice_number || '',
      });
      const items = record.invoice_items || [];
      if (items.length > 0) {
        setPurchaseInventoryItems(items.map((item: any) => ({
          id: crypto.randomUUID(),
          item_id: item.inventory_item_id || null,
          item_name: item.item_description || '',
          barcode: item.item_code || '',
          unit_name: item.unit || t.inv_unit,
          unit_id: null,
          purchase_price: String(item.unit_price || ''),
          quantity: item.quantity || 1,
        })));
      } else {
        setPurchaseInventoryItems([createEmptyInventoryItem()]);
      }
      if (record.discount_amount && record.discount_amount > 0) {
        setDiscount(record.discount_amount);
        setDiscountType('amount');
      } else {
        setDiscount(0);
      }
      setStoredHeaderTotals({
        subtotal: record.subtotal || 0,
        vat_amount: record.vat_amount || 0,
        total: record.total || 0,
      });
    }
  }, [isCarDealership, currentInvoiceIndex, t, createEmptyCar, createEmptyInventoryItem]);

  const handleFirstPurchase = () => { if (navigationRecords.length > 0) { setCurrentInvoiceIndex(0); loadRecordData(navigationRecords[0]); } };
  const handlePreviousPurchase = () => { if (currentInvoiceIndex > 0) { const i = currentInvoiceIndex - 1; setCurrentInvoiceIndex(i); loadRecordData(navigationRecords[i]); } };
  const handleNextPurchase = () => { if (currentInvoiceIndex < navigationRecords.length - 1) { const i = currentInvoiceIndex + 1; setCurrentInvoiceIndex(i); loadRecordData(navigationRecords[i]); } };
  const handleLastPurchase = () => { if (navigationRecords.length > 0) { const i = navigationRecords.length - 1; setCurrentInvoiceIndex(i); loadRecordData(navigationRecords[i]); } };

  const handleNewInvoice = () => {
    setInvoiceData({
      invoice_number: '', supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_account_id: accounts.find(a => a.code === '1101')?.id || '',
      warehouse: 'main', notes: '', price_includes_tax: false,
      project_id: null, cost_center_id: null, payment_status: 'unpaid',
      supplier_invoice_number: '',
    });
    setCars([createEmptyCar()]);
    setDiscount(0);
    setSavedBatchData(null);
    setIsViewingExisting(false);
    setCurrentBatchId(null);
    setIsEditing(false);
    setStoredHeaderTotals(null);
  };

  // ===== Submit (create) =====
  const handleSubmit = async () => {
    if (!invoiceData.supplier_id) { toast.error(t.inv_toast_select_supplier); return; }

    if (isCarDealership) {
      const invalidCar = cars.find(car => !car.chassis_number || !car.name || !car.purchase_price);
      if (invalidCar) { toast.error(t.inv_toast_fill_fields); return; }
      const chassisNumbers = cars.map(car => car.chassis_number);
      const duplicates = chassisNumbers.filter((item, index) => chassisNumbers.indexOf(item) !== index);
      if (duplicates.length > 0) { toast.error(t.inv_toast_duplicate_chassis); return; }

      try {
        const carsWithPrices = calculations.items.map((car, index) => ({
          chassis_number: cars[index].chassis_number,
          plate_number: cars[index].plate_number || null,
          name: cars[index].name,
          model: cars[index].model || null,
          color: cars[index].color || null,
          purchase_price: car.baseAmount / (cars[index].quantity || 1),
          fiscal_year_id: selectedFiscalYear?.id ?? null,
          car_condition: cars[index].car_condition || 'new',
        }));
        const result = await addPurchaseBatch.mutateAsync({
          batch: { supplier_id: invoiceData.supplier_id, purchase_date: invoiceData.purchase_date, notes: invoiceData.notes || null, payment_account_id: invoiceData.payment_account_id || undefined },
          cars: carsWithPrices,
        });
        setSavedBatchData({ ...result, supplier: selectedSupplier, cars });
        toast.success(t.inv_toast_purchase_success);
        setInvoiceOpen(true);
      } catch (error: any) {
        if (error.message?.includes('duplicate')) toast.error(t.inv_toast_duplicate_exists);
        else { console.error('Purchase batch error:', error); toast.error(t.inv_toast_purchase_error); }
      }
    } else {
      if (purchaseInventoryItems.length === 0) { toast.error(t.inv_toast_add_item); return; }
      const emptyNameItem = purchaseInventoryItems.find(i => !i.item_name?.trim());
      if (emptyNameItem) { toast.error('الرجاء إدخال اسم الصنف لجميع العناصر'); return; }
      const invalidItem = purchaseInventoryItems.find(i => !i.purchase_price || parseFloat(i.purchase_price) <= 0);
      if (invalidItem) { toast.error(t.inv_toast_enter_item_price); return; }

      try {
        if (!companyId) throw new Error(t.inv_toast_company_not_found);
        const invoiceNumber = await getNextInvoiceNumber(companyId, 'purchase');
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
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
          })
          .select().single();
        if (invoiceError) throw invoiceError;

        const invoiceItems = purchaseInventoryItems.map((item, index) => ({
          invoice_id: invoice.id, item_description: item.item_name,
          item_code: item.barcode || '', quantity: item.quantity, unit: item.unit_name,
          unit_price: calculations.inventoryItems[index].baseAmount / item.quantity,
          taxable_amount: calculations.inventoryItems[index].baseAmount,
          vat_rate: taxRate, vat_amount: calculations.inventoryItems[index].vatAmount,
          total: calculations.inventoryItems[index].total, inventory_item_id: item.item_id,
        }));
        const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);
        if (itemsError) throw itemsError;

        setSavedBatchData({ batch: { id: invoice.id }, supplier: selectedSupplier, inventoryItems: purchaseInventoryItems });
        queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
        queryClient.invalidateQueries({ queryKey: ['purchase-invoices-nav', companyId] });
        queryClient.invalidateQueries({ queryKey: ['company-purchases-report', companyId] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['purchases-report'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        queryClient.invalidateQueries({ queryKey: ['advanced-analytics'] });
        queryClient.invalidateQueries({ queryKey: ['monthly-chart-data'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-recent-invoices'] });
        toast.success(t.inv_toast_purchase_inv_success);
        setInvoiceOpen(true);
      } catch (error: any) {
        console.error('Purchase invoice error:', error);
        toast.error(t.inv_toast_purchase_inv_error);
      }
    }
  };

  // ===== Delete / Reverse =====
  const handleDeletePurchase = async () => {
    if (!currentBatchId) return;
    const batch = purchaseBatches.find(b => b.id === currentBatchId);
    if (!batch) return;
    const batchCars = batch.cars || [];
    if (batchCars.some((car: any) => car.status === 'sold')) { toast.error(t.inv_toast_cannot_delete_sold); return; }
    try {
      for (const car of batchCars) await deleteCar.mutateAsync(car.id);
      toast.success(t.inv_toast_purchase_delete_success);
      setDeleteDialogOpen(false);
      handleNewInvoice();
    } catch { toast.error(t.inv_toast_delete_error); }
  };

  const handleReversePurchase = async () => {
    if (!currentBatchId) return;
    const batch = purchaseBatches.find(b => b.id === currentBatchId);
    if (!batch) return;
    const batchCars = batch.cars || [];
    if (batchCars.some((car: any) => car.status === 'sold')) { toast.error(t.inv_toast_cannot_reverse_sold); return; }
    try {
      for (const car of batchCars) await deleteCar.mutateAsync(car.id);
      toast.success(t.inv_toast_purchase_reverse_success);
      setReverseDialogOpen(false);
      handleNewInvoice();
    } catch { toast.error(t.inv_toast_reverse_error); }
  };

  // ===== Update =====
  const handleUpdatePurchase = async () => {
    if (!currentBatchId) return;

    if (isCarDealership) {
      const batch = purchaseBatches.find(b => b.id === currentBatchId);
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
        setIsEditing(false);
        toast.success(t.inv_toast_purchase_update_success);
      } catch { toast.error(t.inv_toast_purchase_update_error); }
      return;
    }

    // Non-car: update invoice
    if (!companyId) { toast.error(t.inv_toast_company_not_found); return; }
    if (!invoiceData.supplier_id) { toast.error(t.inv_toast_select_supplier); return; }
    if (purchaseInventoryItems.length === 0) { toast.error(t.inv_toast_add_item); return; }
    const emptyNameItem = purchaseInventoryItems.find(i => !i.item_name?.trim());
    if (emptyNameItem) { toast.error('الرجاء إدخال اسم الصنف لجميع العناصر'); return; }
    const invalidItem = purchaseInventoryItems.find(i => !i.purchase_price || parseFloat(i.purchase_price) <= 0);
    if (invalidItem) { toast.error(t.inv_toast_enter_item_price); return; }

    const isProtected = ['issued', 'approved', 'posted'].includes(currentInvoiceStatus);
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
      const { error: invoiceUpdateError } = await supabase.from('invoices').update(updatePayload).eq('id', currentBatchId).eq('company_id', companyId);
      if (invoiceUpdateError) throw invoiceUpdateError;

      if (!isProtected) {
        await supabase.from('invoice_items').delete().eq('invoice_id', currentBatchId);
        const invoiceItems = purchaseInventoryItems.map((item, index) => ({
          invoice_id: currentBatchId,
          item_description: item.item_name, item_code: item.barcode || '',
          quantity: item.quantity, unit: item.unit_name,
          unit_price: calculations.inventoryItems[index].baseAmount / item.quantity,
          taxable_amount: calculations.inventoryItems[index].baseAmount,
          vat_rate: taxRate, vat_amount: calculations.inventoryItems[index].vatAmount,
          total: calculations.inventoryItems[index].total, inventory_item_id: item.item_id,
        }));
        await supabase.from('invoice_items').insert(invoiceItems);
      }

      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices-nav', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company-purchases-report', companyId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', companyId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchases-report'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-invoices'] });
      setSavedBatchData({ batch: { id: currentBatchId }, supplier: selectedSupplier, inventoryItems: purchaseInventoryItems });
      setIsEditing(false);
      toast.success(t.inv_toast_purchase_update_success);
    } catch (error) {
      console.error('Purchase invoice update error:', error);
      toast.error(t.inv_toast_purchase_update_error);
    }
  };

  // ===== Print =====
  const handlePrintExisting = () => {
    if (!currentBatchId) return;
    const batch = purchaseBatches.find(b => b.id === currentBatchId);
    if (!batch) return;
    setSavedBatchData({ batch: { id: batch.id }, supplier: selectedSupplier, cars });
    setInvoiceOpen(true);
  };

  // ===== Invoice preview data =====
  const invoicePreviewData = useMemo(() => {
    if (!savedBatchData) return null;
    return {
      invoiceNumber: savedBatchData.batch?.batch_number || invoiceData.invoice_number || String(nextInvoiceNumber),
      invoiceDate: invoiceData.purchase_date,
      supplierName: selectedSupplier?.name || '',
      supplierTaxNumber: selectedSupplier?.registration_number || '',
      supplierAddress: selectedSupplier?.address || '',
      supplierPhone: selectedSupplier?.phone || '',
      companyName: taxSettings?.company_name_ar || company?.name || '',
      companyTaxNumber: taxSettings?.tax_number || '',
      companyAddress: taxSettings?.national_address || company?.address || '',
      items: calculations.items.map(car => ({
        description: `${car.name} ${car.model || ''} - ${car.chassis_number}${cars.find(c => c.id === car.id)?.plate_number ? ` - لوحة: ${cars.find(c => c.id === car.id)?.plate_number}` : ''}`,
        quantity: car.quantity,
        unitPrice: car.baseAmount / car.quantity,
        taxRate: taxRate,
        taxAmount: car.vatAmount,
        total: car.total,
      })),
      subtotal: displayTotals.subtotal,
      taxAmount: displayTotals.totalVAT,
      total: displayTotals.finalTotal,
      taxSettings: taxSettings,
      companyLogoUrl: (company as any)?.invoice_logo_url || company?.logo_url,
    };
  }, [savedBatchData, invoiceData, selectedSupplier, calculations, displayTotals, taxSettings, company, taxRate, nextInvoiceNumber]);

  // ===== AI Import =====
  const handleAIImport = async (data: ParsedInvoiceData) => {
    try {
      let supplierId = '';
      const existingSupplier = suppliers.find(s =>
        s.name === data.supplier_name ||
        (data.supplier_tax_number && (s as any).id_number === data.supplier_tax_number)
      );
      if (existingSupplier) {
        supplierId = existingSupplier.id;
      } else if (companyId) {
        const { data: newSupplier, error } = await supabase.from('suppliers')
          .insert({ name: data.supplier_name, id_number: data.supplier_tax_number || null, phone: data.supplier_phone || null, address: data.supplier_address || null, company_id: companyId })
          .select().single();
        if (error) { console.error('Error creating supplier:', error); toast.error('فشل إنشاء المورد'); }
        else if (newSupplier) { supplierId = newSupplier.id; queryClient.invalidateQueries({ queryKey: ['suppliers'] }); toast.success(`تم إنشاء المورد: ${data.supplier_name}`); }
      }
      setInvoiceData(prev => ({
        ...prev, supplier_id: supplierId,
        invoice_number: data.invoice_number || prev.invoice_number,
        purchase_date: data.invoice_date || prev.purchase_date,
        due_date: data.due_date || prev.due_date,
        notes: data.notes || prev.notes,
        price_includes_tax: data.price_includes_tax ?? false,
      }));
      if (data.items && data.items.length > 0) {
        if (isCarDealership) {
          setCars(data.items.map(item => ({
            id: crypto.randomUUID(), chassis_number: '', plate_number: '',
            name: item.description, model: '', color: '',
            purchase_price: String(item.unit_price), quantity: item.quantity,
            unit: t.inv_car_unit, car_condition: 'new' as const,
          })));
        } else {
          setPurchaseInventoryItems(data.items.map(item => ({
            id: crypto.randomUUID(), item_id: null, item_name: item.description,
            barcode: '', unit_name: t.inv_unit, unit_id: null,
            purchase_price: String(item.unit_price), quantity: item.quantity,
          })));
        }
      }
      if (data.discount && data.discount > 0) { setDiscount(data.discount); setDiscountType('amount'); }
      setIsViewingExisting(false); setCurrentBatchId(null); setIsEditing(false); setStoredHeaderTotals(null);
      toast.success('تم تعبئة بيانات الفاتورة بنجاح');
    } catch { toast.error('حدث خطأ أثناء معالجة البيانات'); }
  };

  const onBatchImport = async (results: BatchParsedResult[], costCenterId?: string | null) => {
    await handleBatchImport({
      results, costCenterId, companyId: companyId!,
      suppliers, taxSettings, selectedFiscalYear,
      invoiceProjectId: invoiceData.project_id, queryClient,
    });
  };

  return {
    // Data sources
    suppliers, accounts, taxSettings, costCenters, inventoryItems, company,
    selectedFiscalYear, purchaseBatches, existingCars,
    // State
    invoiceData, setInvoiceData, cars, setCars, purchaseInventoryItems,
    invoiceOpen, setInvoiceOpen, savedBatchData, discount, setDiscount,
    discountType, setDiscountType, currentInvoiceIndex, isViewingExisting,
    currentBatchId, currentInvoiceStatus, deleteDialogOpen, setDeleteDialogOpen,
    reverseDialogOpen, setReverseDialogOpen, isEditing, setIsEditing,
    aiImportOpen, setAiImportOpen, searchBarRef,
    // Computed
    isCarDealership, selectedSupplier, taxRate, calculations, displayTotals,
    navigationRecords, nextInvoiceNumber, invoicePreviewData, fiscalYearFilteredCars,
    locale, currency, language, t, decimals, companyId,
    // Handlers
    handleAddCar, handleRemoveCar, handleCarChange,
    handleAddInventoryItem, handleSelectExistingItem, handleRemoveInventoryItem, handleInventoryItemChange,
    handleFirstPurchase, handlePreviousPurchase, handleNextPurchase, handleLastPurchase,
    handleNewInvoice, handleSubmit, handleDeletePurchase, handleReversePurchase,
    handleUpdatePurchase, handlePrintExisting, handleAIImport, onBatchImport,
    loadRecordData, formatCurrency,
    // Mutations
    addPurchaseBatch, updateCar, deleteCar, queryClient,
  };
}
