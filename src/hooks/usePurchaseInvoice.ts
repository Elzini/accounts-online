/**
 * Custom hook - Purchase Invoice Logic
 * 
 * Thin orchestrator that composes focused sub-hooks:
 *   - usePurchaseNavigation: navigation & record loading
 *   - usePurchaseCrud: create, update, delete, reverse
 * 
 * Maintains backward-compatible return type for existing consumers.
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { calculatePurchaseInvoice } from './purchase-invoice/calculations';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSuppliers, useCars, usePurchaseBatches } from '@/hooks/useDatabase';
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
import { formatInvoiceCurrency } from '@/components/forms/shared-invoice';
import type { ParsedInvoiceData, BatchParsedResult } from '@/components/forms/PurchaseInvoiceAIImport';
import type { ActivePage } from '@/types';

import { usePurchaseNavigation } from './purchase-invoice/usePurchaseNavigation';
import { usePurchaseCrud } from './purchase-invoice/usePurchaseCrud';

export function usePurchaseInvoice() {
  const { data: suppliers = [] } = useSuppliers();
  const { data: taxSettings } = useTaxSettings();
  const { data: accounts = [] } = useAccounts();
  const { data: existingCars = [] } = useCars();
  const { data: purchaseBatches = [] } = usePurchaseBatches();
  const { company } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const { data: costCenters = [] } = useCostCenters();
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
    chassis_number: '', plate_number: '', name: '', model: '', color: '',
    purchase_price: '', quantity: 1, unit: t.inv_car_unit, car_condition: 'new',
  }), [t.inv_car_unit]);

  const createEmptyInventoryItem = useCallback((): PurchaseInventoryItem => ({
    id: crypto.randomUUID(),
    item_id: null, item_name: '', barcode: '',
    unit_name: t.inv_unit, unit_id: null, purchase_price: '', quantity: 1,
  }), [t.inv_unit]);

  // ===== State =====
  const [purchaseInventoryItems, setPurchaseInventoryItems] = useState<PurchaseInventoryItem[]>([]);
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '', supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_account_id: '', warehouse: 'main', notes: '', price_includes_tax: false,
    project_id: null as string | null, cost_center_id: null as string | null,
    payment_status: 'unpaid' as string, supplier_invoice_number: '',
  });
  const [cars, setCars] = useState<CarItem[]>([createEmptyCar()]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [savedBatchData, setSavedBatchData] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('amount');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [storedHeaderTotals, setStoredHeaderTotals] = useState<{
    subtotal: number; vat_amount: number; total: number;
  } | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // ===== Default payment account =====
  useEffect(() => {
    if (accounts.length > 0 && !invoiceData.payment_account_id) {
      const cashAccount = accounts.find(a => a.code === '1101');
      if (cashAccount) {
        setInvoiceData(prev => ({ ...prev, payment_account_id: cashAccount.id }));
      }
    }
  }, [accounts, invoiceData.payment_account_id]);

  // ===== Navigation (delegated) =====
  const nav = usePurchaseNavigation({
    setCars,
    setInvoiceData: (fn) => setInvoiceData(fn as any),
    setPurchaseInventoryItems,
    setDiscount,
    setStoredHeaderTotals,
    createEmptyCar,
    createEmptyInventoryItem,
  });

  // ===== Fiscal year filtered cars =====
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
      id: crypto.randomUUID(), item_id: item.id, item_name: item.name,
      barcode: item.barcode || '',
      unit_name: item.units_of_measure?.abbreviation || item.units_of_measure?.name || t.inv_unit,
      unit_id: item.unit_id, purchase_price: String(item.cost_price || ''), quantity: 1,
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
    if (nav.isViewingExisting && !nav.isEditing && storedHeaderTotals && storedHeaderTotals.total > 0) {
      return {
        subtotal: storedHeaderTotals.subtotal, totalVAT: storedHeaderTotals.vat_amount,
        finalTotal: storedHeaderTotals.total, discountAmount: calculations.discountAmount,
        subtotalAfterDiscount: storedHeaderTotals.subtotal - calculations.discountAmount,
      };
    }
    return {
      subtotal: calculations.subtotal, totalVAT: calculations.totalVAT,
      finalTotal: calculations.finalTotal, discountAmount: calculations.discountAmount,
      subtotalAfterDiscount: calculations.subtotalAfterDiscount,
    };
  }, [calculations, storedHeaderTotals, nav.isViewingExisting, nav.isEditing]);

  const formatCurrency = (value: number) => formatInvoiceCurrency(value, decimals);

  // ===== New invoice =====
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
    nav.setIsViewingExisting(false);
    nav.setCurrentBatchId(null);
    nav.setIsEditing(false);
    setStoredHeaderTotals(null);
  };

  // ===== CRUD (delegated) =====
  const crud = usePurchaseCrud({
    invoiceData, cars, purchaseInventoryItems, calculations, displayTotals,
    currentBatchId: nav.currentBatchId, currentInvoiceStatus: nav.currentInvoiceStatus,
    taxRate, discount, selectedSupplier, handleNewInvoice,
    setDeleteDialogOpen, setReverseDialogOpen,
    setIsEditing: nav.setIsEditing,
    setSavedBatchData, setInvoiceOpen,
  });

  // ===== Print =====
  const handlePrintExisting = () => {
    if (!nav.currentBatchId) return;
    const batch = purchaseBatches.find(b => b.id === nav.currentBatchId);
    if (!batch) return;
    setSavedBatchData({ batch: { id: batch.id }, supplier: selectedSupplier, cars });
    setInvoiceOpen(true);
  };

  // ===== Invoice preview data =====
  const invoicePreviewData = useMemo(() => {
    if (!savedBatchData) return null;
    return {
      invoiceNumber: savedBatchData.batch?.batch_number || invoiceData.invoice_number || String(nav.nextInvoiceNumber),
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
        quantity: car.quantity, unitPrice: car.baseAmount / car.quantity,
        taxRate: taxRate, taxAmount: car.vatAmount, total: car.total,
      })),
      subtotal: displayTotals.subtotal, taxAmount: displayTotals.totalVAT,
      total: displayTotals.finalTotal, taxSettings: taxSettings,
      companyLogoUrl: (company as any)?.invoice_logo_url || company?.logo_url,
    };
  }, [savedBatchData, invoiceData, selectedSupplier, calculations, displayTotals, taxSettings, company, taxRate, nav.nextInvoiceNumber]);

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
      nav.setIsViewingExisting(false); nav.setCurrentBatchId(null); nav.setIsEditing(false); setStoredHeaderTotals(null);
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
    discountType, setDiscountType,
    currentInvoiceIndex: nav.currentInvoiceIndex,
    isViewingExisting: nav.isViewingExisting,
    currentBatchId: nav.currentBatchId,
    currentInvoiceStatus: nav.currentInvoiceStatus,
    deleteDialogOpen, setDeleteDialogOpen,
    reverseDialogOpen, setReverseDialogOpen,
    isEditing: nav.isEditing, setIsEditing: nav.setIsEditing,
    aiImportOpen, setAiImportOpen, searchBarRef,
    // Computed
    isCarDealership, selectedSupplier, taxRate, calculations, displayTotals,
    navigationRecords: nav.navigationRecords,
    nextInvoiceNumber: nav.nextInvoiceNumber,
    invoicePreviewData, fiscalYearFilteredCars,
    locale, currency, language, t, decimals, companyId,
    // Handlers
    handleAddCar, handleRemoveCar, handleCarChange,
    handleAddInventoryItem, handleSelectExistingItem, handleRemoveInventoryItem, handleInventoryItemChange,
    handleFirstPurchase: nav.handleFirstPurchase,
    handlePreviousPurchase: nav.handlePreviousPurchase,
    handleNextPurchase: nav.handleNextPurchase,
    handleLastPurchase: nav.handleLastPurchase,
    handleNewInvoice,
    handleSubmit: crud.handleSubmit,
    handleDeletePurchase: crud.handleDeletePurchase,
    handleReversePurchase: crud.handleReversePurchase,
    handleUpdatePurchase: crud.handleUpdatePurchase,
    handlePrintExisting, handleAIImport, onBatchImport,
    loadRecordData: nav.loadRecordData, formatCurrency,
    // Mutations
    addPurchaseBatch: crud.addPurchaseBatch,
    updateCar: crud.updateCar,
    deleteCar: crud.deleteCar,
    queryClient,
  };
}
