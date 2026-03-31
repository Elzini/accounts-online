/**
 * Sales Invoice - Data & State Hook
 * Manages all state, data fetching, calculations, and actions.
 * Calculations delegated to useSalesInvoiceCalculations.ts
 * CRUD actions delegated to useSalesInvoiceActions.ts
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useQuery } from '@tanstack/react-query';
import { useCustomers, useCars, useAddMultiCarSale, useSales, useDeleteSale, useReverseSale, useUpdateSale, useSalesWithItems, useUpdateSaleWithItems, useApproveSale } from '@/hooks/useDatabase';
import { fetchWarehouseCarInventory } from '@/services/carDealership/warehouseInventory';
import { useTaxSettings, useAccounts } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useImportedInvoiceData } from '@/hooks/useImportedInvoiceData';
import { getPendingTransferForCar } from '@/hooks/useTransfers';
import { CarTransfer } from '@/services/transfers';
import { useAddInstallmentSale } from '@/hooks/useInstallments';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useItems, useUnits } from '@/hooks/useInventory';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNumberFormat } from '@/hooks/useNumberFormat';
import { useAuth } from '@/contexts/AuthContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { SelectedCarItem, SelectedInventoryItem, InvoiceFormData, StoredHeaderTotals } from './types';
import { ActivePage } from '@/types';
import { useSalesInvoiceCalculations, useDisplayTotals } from './useSalesInvoiceCalculations';
import { createSalesInvoiceActions } from './useSalesInvoiceActions';

const defaultInvoiceData: InvoiceFormData = {
  invoice_number: '', customer_id: '', sale_date: new Date().toISOString().split('T')[0],
  issue_time: new Date().toTimeString().slice(0, 5), payment_account_id: '', warehouse: 'main',
  seller_name: '', notes: '', price_includes_tax: true, commission: '', other_expenses: '',
  is_installment: false, down_payment: '', number_of_installments: '12', last_payment_date: '',
  first_installment_date: new Date().toISOString().split('T')[0],
};

export function useSalesInvoiceData(setActivePage: (page: ActivePage) => void) {
  // === External hooks ===
  const { data: customers = [] } = useCustomers();
  const { data: allCars = [] } = useCars();
  const { data: taxSettings } = useTaxSettings();
  const { data: accounts = [] } = useAccounts();
  const { data: existingSales = [] } = useSales();
  const { data: salesWithItems = [] } = useSalesWithItems();
  const { data: savedTemplates = [] } = useImportedInvoiceData();
  const { company } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const addMultiCarSale = useAddMultiCarSale();
  const deleteSale = useDeleteSale();
  const reverseSale = useReverseSale();
  const updateSale = useUpdateSale();
  const updateSaleWithItems = useUpdateSaleWithItems();
  const addInstallmentSale = useAddInstallmentSale();
  const approveSale = useApproveSale();
  const companyId = useCompanyId();
  const { t, language } = useLanguage();
  const { decimals } = useNumberFormat();
  const { permissions } = useAuth();
  const { data: inventoryItems = [] } = useItems();
  const { data: units = [] } = useUnits();
  const isCarDealership = useIndustryFeatures().hasCarInventory;

  // === Local state ===
  const [existingInvoices, setExistingInvoices] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData>(defaultInvoiceData);
  const [selectedCars, setSelectedCars] = useState<SelectedCarItem[]>([]);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<SelectedInventoryItem[]>([]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [savedSaleData, setSavedSaleData] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('amount');
  const [paidAmount, setPaidAmount] = useState(0);
  const [currentInvoiceIndex, setCurrentInvoiceIndex] = useState(0);
  const [isViewingExisting, setIsViewingExisting] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [currentSaleStatus, setCurrentSaleStatus] = useState<'draft' | 'approved'>('draft');
  const [isEditing, setIsEditing] = useState(false);
  const [storedHeaderTotals, setStoredHeaderTotals] = useState<StoredHeaderTotals | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const isApproved = isViewingExisting && currentSaleStatus === 'approved';
  const isReadOnly = isViewingExisting && !isEditing && !isApproved;
  const selectedCustomer = customers.find(c => c.id === invoiceData.customer_id);
  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_sales ? (taxSettings?.tax_rate || 15) : 0;
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const currency = t.inv_sar;
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  // === Warehouse data for location enrichment ===
  const { data: warehouseEntries = [] } = useQuery({
    queryKey: ['warehouse-car-inventory', companyId],
    queryFn: () => fetchWarehouseCarInventory(companyId!),
    enabled: !!companyId && isCarDealership,
    staleTime: 1000 * 60 * 2,
  });

  // === Derived data ===
  const availableCars = useMemo(() => {
    const filtered = allCars.filter(car => car.status === 'available' || car.status === 'transferred');
    // Build warehouse location map from active entries
    const warehouseMap = new Map<string, string>();
    const activeWarehouseEntries = warehouseEntries.filter(e => !e.exit_date);
    activeWarehouseEntries.forEach(e => {
      const loc = e.location?.trim() || 'المستودع';
      warehouseMap.set(e.chassis_number.trim().toUpperCase(), loc);
    });
    // Enrich existing cars with warehouse location
    const mainCarChassisSet = new Set(allCars.map(c => c.chassis_number?.trim().toUpperCase()));
    const enrichedCars = filtered.map(car => ({
      ...car,
      warehouse_location: warehouseMap.get(car.chassis_number?.trim().toUpperCase()) || null,
    }));
    // Add warehouse-only cars (not in main cars table) as synthetic entries
    const warehouseOnlyCars = activeWarehouseEntries
      .filter(e => !mainCarChassisSet.has(e.chassis_number.trim().toUpperCase()))
      .map(e => ({
        id: `wh-${e.id}`,
        name: e.car_type || 'سيارة',
        model: e.car_color || '',
        chassis_number: e.chassis_number,
        plate_number: null,
        status: 'available' as const,
        purchase_price: e.price || 0,
        purchase_date: e.entry_date,
        car_condition: 'new' as const,
        inventory_number: 0,
        company_id: e.company_id,
        created_at: e.created_at,
        updated_at: e.updated_at,
        color: e.car_color,
        supplier_id: null,
        batch_id: null,
        fiscal_year_id: null,
        payment_account_id: null,
        warehouse_location: e.location?.trim() || 'المستودع',
        _isWarehouseOnly: true,
      }));
    return [...enrichedCars, ...warehouseOnlyCars] as any[];
  }, [allCars, warehouseEntries]);

  useEffect(() => {
    if (!isCarDealership && companyId) {
      const fetchInvoices = async () => {
        const { data } = await supabase.from('invoices').select('*, invoice_items(*)').eq('company_id', companyId).eq('invoice_type', 'sales').order('created_at', { ascending: true });
        setExistingInvoices(data || []);
      };
      fetchInvoices();
    }
  }, [isCarDealership, companyId, existingSales]);

  const fiscalYearFilteredSales = useMemo(() => {
    const sourceData = isCarDealership ? existingSales : existingInvoices;
    if (!selectedFiscalYear) return sourceData;
    const fyStart = new Date(selectedFiscalYear.start_date); fyStart.setHours(0, 0, 0, 0);
    const fyEnd = new Date(selectedFiscalYear.end_date); fyEnd.setHours(23, 59, 59, 999);
    return sourceData.filter((item: any) => {
      const itemDate = new Date(isCarDealership ? item.sale_date : item.invoice_date);
      return itemDate >= fyStart && itemDate <= fyEnd;
    });
  }, [existingSales, existingInvoices, selectedFiscalYear, isCarDealership]);

  const nextInvoiceNumber = useMemo(() => {
    const year = new Date().getFullYear();
    const sourceData = isCarDealership ? existingSales : existingInvoices;
    return `INV-${year}-${String(sourceData.length + 1).padStart(3, '0')}`;
  }, [existingSales, existingInvoices, isCarDealership]);

  useEffect(() => {
    if (accounts.length > 0 && !invoiceData.payment_account_id) {
      const cashAccount = accounts.find(a => a.code === '1101');
      if (cashAccount) setInvoiceData(prev => ({ ...prev, payment_account_id: cashAccount.id }));
    }
  }, [accounts, invoiceData.payment_account_id]);

  const availableInventoryItems = useMemo(() =>
    (inventoryItems || []).filter((item: any) => item.is_active && !selectedInventoryItems.some(si => si.item_id === item.id)),
    [inventoryItems, selectedInventoryItems]
  );

  const remainingCars = useMemo(() => availableCars.filter(car => !selectedCars.some(sc => sc.car_id === car.id)), [availableCars, selectedCars]);

  // === Item handlers ===
  const handleAddInventoryItem = (itemId: string) => {
    const item = (inventoryItems || []).find((i: any) => i.id === itemId) as any;
    if (!item) return;
    setSelectedInventoryItems([...selectedInventoryItems, {
      id: crypto.randomUUID(), item_id: item.id, item_name: item.name,
      barcode: item.barcode || '', unit_name: item.units_of_measure?.abbreviation || item.units_of_measure?.name || t.inv_unit,
      unit_id: item.unit_id, sale_price: String(item.sale_price_1 || 0),
      cost_price: Number(item.cost_price || 0), quantity: 1, available_quantity: Number(item.current_quantity || 0),
    }]);
  };

  const handleAddManualItem = () => {
    setSelectedInventoryItems([...selectedInventoryItems, {
      id: crypto.randomUUID(), item_id: '', item_name: '', barcode: '',
      unit_name: t.inv_unit || 'وحدة', unit_id: null, sale_price: '',
      cost_price: 0, quantity: 1, available_quantity: 0,
    }]);
  };

  const handleRemoveInventoryItem = (id: string) => {
    if (selectedInventoryItems.length === 1) { toast.error(t.inv_toast_min_one_item); return; }
    setSelectedInventoryItems(selectedInventoryItems.filter(i => i.id !== id));
  };

  const handleInventoryItemChange = (id: string, field: keyof SelectedInventoryItem, value: string | number) => {
    setSelectedInventoryItems(selectedInventoryItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAddCar = async (carId: string) => {
    const car = availableCars.find(c => c.id === carId);
    if (!car) return;
    let pendingTransfer: CarTransfer | null = null;
    try { pendingTransfer = await getPendingTransferForCar(carId); } catch (error) { console.error('Error checking pending transfer:', error); }
    setSelectedCars([...selectedCars, {
      id: crypto.randomUUID(), car_id: car.id, sale_price: '',
      purchase_price: Number(car.purchase_price), car_name: car.name,
      model: car.model || '', color: car.color || '', chassis_number: car.chassis_number,
      plate_number: (car as any).plate_number || '', quantity: 1,
      car_condition: (car as any).car_condition === 'used' ? 'used' : 'new', pendingTransfer,
    }]);
  };

  const handleRemoveCar = (id: string) => {
    if (selectedCars.length === 1) { toast.error(t.inv_toast_min_one_car); return; }
    setSelectedCars(selectedCars.filter(car => car.id !== id));
  };

  const handleCarChange = (id: string, field: keyof SelectedCarItem, value: string | number) => {
    setSelectedCars(selectedCars.map(car => car.id === id ? { ...car, [field]: value } : car));
  };

  // === Calculations (delegated) ===
  const calculations = useSalesInvoiceCalculations({
    selectedCars, selectedInventoryItems, invoiceData, taxRate, discount, discountType, isCarDealership,
  });

  const displayTotals = useDisplayTotals(calculations, storedHeaderTotals, isViewingExisting, isEditing);

  const formatCurrency = (value: number) => {
    const v = decimals === 0 ? Math.round(value) : value;
    return decimals === 0 ? String(v) : v.toFixed(decimals);
  };

  // === Navigation ===
  const handleNewInvoice = () => {
    setInvoiceData({ ...defaultInvoiceData, payment_account_id: accounts.find(a => a.code === '1101')?.id || '' });
    setSelectedCars([]); setSelectedInventoryItems([]); setDiscount(0); setPaidAmount(0);
    setSavedSaleData(null); setIsViewingExisting(false); setCurrentSaleId(null);
    setCurrentSaleStatus('draft'); setIsEditing(false); setStoredHeaderTotals(null);
  };

  const loadSaleData = async (sale: any) => {
    setIsViewingExisting(true);
    setCurrentSaleId(sale.id);
    setCurrentSaleStatus((sale.status === 'approved' || sale.status === 'issued') ? 'approved' : 'draft');
    setIsEditing(false);

    const isInvoiceRecord = !!sale.invoice_number;
    setInvoiceData({
      invoice_number: isInvoiceRecord ? (sale.invoice_number || '') : (sale.sale_number || ''),
      customer_id: sale.customer_id || '',
      sale_date: isInvoiceRecord ? (sale.invoice_date?.split('T')[0] || '') : (sale.sale_date || ''),
      issue_time: isInvoiceRecord && sale.invoice_date?.includes('T') ? sale.invoice_date.split('T')[1]?.slice(0, 5) || new Date(sale.created_at).toTimeString().slice(0, 5) : new Date(sale.created_at).toTimeString().slice(0, 5),
      payment_account_id: sale.payment_account_id || '', warehouse: 'main',
      seller_name: sale.seller_name || '', notes: sale.notes || '',
      price_includes_tax: true, commission: String(sale.commission || ''), other_expenses: String(sale.other_expenses || ''),
      is_installment: false, down_payment: '', number_of_installments: '12', last_payment_date: '',
      first_installment_date: new Date().toISOString().split('T')[0],
    });

    if (isInvoiceRecord) {
      setStoredHeaderTotals({ subtotal: sale.subtotal || 0, vat_amount: sale.vat_amount || 0, total: sale.total || 0, vat_rate: sale.vat_rate || 0, discount_amount: sale.discount_amount || 0 });
    } else {
      setStoredHeaderTotals(sale.sale_price ? { subtotal: Number(sale.sale_price) || 0, vat_amount: Number(sale.vat_amount) || 0, total: Number(sale.total_with_vat || sale.sale_price) || 0, vat_rate: Number(sale.vat_rate) || 0, discount_amount: Number(sale.discount_amount) || 0 } : null);
    }

    if (isInvoiceRecord && sale.invoice_items && sale.invoice_items.length > 0) {
      const loadedItems: SelectedInventoryItem[] = sale.invoice_items.map((item: any) => ({
        id: crypto.randomUUID(), item_id: item.inventory_item_id || '', item_name: item.item_description || '',
        barcode: item.item_code || '', unit_name: item.unit || 'وحدة', unit_id: null,
        sale_price: String(item.unit_price || 0), cost_price: 0, quantity: item.quantity || 1, available_quantity: 0,
      }));
      setSelectedInventoryItems(loadedItems); setSelectedCars([]);
      if (sale.discount_amount) { setDiscount(sale.discount_amount); setDiscountType('amount'); }
      if (sale.amount_paid) { setPaidAmount(sale.amount_paid); }
    } else if (sale.sale_items && sale.sale_items.length > 0) {
      const loadedCars: SelectedCarItem[] = [];
      for (const item of sale.sale_items) {
        const car = allCars.find(c => c.id === item.car_id);
        if (car) loadedCars.push({ id: crypto.randomUUID(), car_id: car.id, sale_price: String(item.sale_price || 0), purchase_price: Number(car.purchase_price), car_name: car.name, model: car.model || '', color: car.color || '', chassis_number: car.chassis_number, plate_number: (car as any).plate_number || '', quantity: 1, car_condition: (car as any).car_condition === 'used' ? 'used' : 'new', pendingTransfer: null });
      }
      if (loadedCars.length > 0) setSelectedCars(loadedCars);
    } else {
      const car = allCars.find(c => c.id === sale.car_id);
      if (car) setSelectedCars([{ id: crypto.randomUUID(), car_id: car.id, sale_price: String(sale.sale_price), purchase_price: Number(car.purchase_price), car_name: car.name, model: car.model || '', color: car.color || '', chassis_number: car.chassis_number, plate_number: (car as any).plate_number || '', quantity: 1, car_condition: (car as any).car_condition === 'used' ? 'used' : 'new', pendingTransfer: null }]);
    }
  };

  const handleFirstSale = () => { if (fiscalYearFilteredSales.length > 0) { setCurrentInvoiceIndex(0); loadSaleData(fiscalYearFilteredSales[0]); } };
  const handlePreviousSale = () => { if (currentInvoiceIndex > 0) { const i = currentInvoiceIndex - 1; setCurrentInvoiceIndex(i); loadSaleData(fiscalYearFilteredSales[i]); } };
  const handleNextSale = () => { if (currentInvoiceIndex < fiscalYearFilteredSales.length - 1) { const i = currentInvoiceIndex + 1; setCurrentInvoiceIndex(i); loadSaleData(fiscalYearFilteredSales[i]); } };
  const handleLastSale = () => { if (fiscalYearFilteredSales.length > 0) { const i = fiscalYearFilteredSales.length - 1; setCurrentInvoiceIndex(i); loadSaleData(fiscalYearFilteredSales[i]); } };

  // === CRUD actions (delegated) ===
  const actions = createSalesInvoiceActions({
    invoiceData, selectedCars, selectedInventoryItems, calculations, displayTotals,
    selectedCustomer, taxRate, companyId, selectedFiscalYear, nextInvoiceNumber,
    isCarDealership, paidAmount, existingInvoices, existingSales, currentSaleId, accounts, allCars,
    addMultiCarSale, deleteSale, reverseSale, updateSaleWithItems, addInstallmentSale, approveSale,
    t, language,
    setExistingInvoices, setSavedSaleData, setIsViewingExisting, setCurrentSaleId, setCurrentSaleStatus,
    setIsEditing, setDeleteDialogOpen, setReverseDialogOpen, setApproveDialogOpen, handleNewInvoice,
  });

  const handlePrintExisting = () => {
    if (!currentSaleId) return;
    const sale = salesWithItems.find(s => s.id === currentSaleId) || existingSales.find(s => s.id === currentSaleId) || existingInvoices.find(s => s.id === currentSaleId);
    if (!sale) return;
    setSavedSaleData({ ...sale, customer: selectedCustomer, cars: selectedCars, inventoryItems: selectedInventoryItems });
    setInvoiceOpen(true);
  };

  const handleCloseInvoice = (open: boolean) => { setInvoiceOpen(open); if (!open) setActivePage('sales'); };

  // === Invoice preview data ===
  const invoicePreviewData = useMemo(() => {
    if (!savedSaleData) return null;
    return {
      invoiceNumber: savedSaleData.sale_number || invoiceData.invoice_number || String(nextInvoiceNumber),
      invoiceDate: `${invoiceData.sale_date}T${invoiceData.issue_time || '00:00'}:00`,
      invoiceType: 'sale' as const,
      sellerName: taxSettings?.company_name_ar || company?.name || '',
      sellerTaxNumber: taxSettings?.tax_number || '',
      sellerAddress: taxSettings?.national_address || company?.address || '',
      buyerName: selectedCustomer?.name || '', buyerPhone: selectedCustomer?.phone || '',
      buyerAddress: selectedCustomer?.address || '', buyerTaxNumber: selectedCustomer?.registration_number || '',
      items: isCarDealership
        ? calculations.items.map(car => ({ description: `${car.car_name} ${car.model || ''} - ${car.chassis_number}${car.plate_number ? ` - لوحة: ${car.plate_number}` : ''}`, quantity: car.quantity, unitPrice: car.baseAmount / car.quantity, taxRate, taxAmount: car.vatAmount, total: car.total }))
        : (calculations.inventoryItems.length > 0
          ? calculations.inventoryItems.map(item => ({ description: item.item_name || '', quantity: item.quantity, unitPrice: item.baseAmount / item.quantity, taxRate, taxAmount: item.vatAmount, total: item.total }))
          : (savedSaleData?.invoice_items || []).map((item: any) => ({ description: item.item_description || '', quantity: Number(item.quantity) || 1, unitPrice: Number(item.unit_price) || 0, taxRate: Number(item.vat_rate) || taxRate, taxAmount: Number(item.vat_amount) || 0, total: Number(item.total) || 0 }))),
      subtotal: displayTotals.subtotal || Number(savedSaleData?.subtotal) || 0,
      taxAmount: displayTotals.totalVAT || Number(savedSaleData?.vat_amount) || 0,
      total: displayTotals.finalTotal || Number(savedSaleData?.total) || 0,
      taxSettings, companyLogoUrl: (company as any)?.invoice_logo_url || company?.logo_url,
      salesmanName: invoiceData.seller_name || savedSaleData?.seller_name || '', branchName: '',
      paymentMethod: (() => { const acc = accounts.find(a => a.id === invoiceData.payment_account_id); if (!acc) return 'cash'; if (acc.code === '1201') return 'credit'; if (acc.code.startsWith('1102') || acc.code === '1103') return 'bank'; return 'cash'; })(),
    };
  }, [savedSaleData, invoiceData, selectedCustomer, calculations, taxSettings, company, taxRate, nextInvoiceNumber, accounts]);

  return {
    customers, accounts, taxSettings, company, isCarDealership, t, language, dir, decimals, permissions, currency, locale,
    taxRate, nextInvoiceNumber, savedTemplates,
    invoiceData, setInvoiceData, selectedCars, selectedInventoryItems,
    invoiceOpen, setInvoiceOpen, savedSaleData, discount, setDiscount, discountType, setDiscountType,
    paidAmount, setPaidAmount, currentInvoiceIndex, isViewingExisting, currentSaleId,
    deleteDialogOpen, setDeleteDialogOpen, reverseDialogOpen, setReverseDialogOpen,
    approveDialogOpen, setApproveDialogOpen, currentSaleStatus, isEditing, setIsEditing,
    isApproved, isReadOnly, selectedCustomer, searchBarRef,
    fiscalYearFilteredSales, remainingCars, availableInventoryItems,
    calculations, displayTotals, invoicePreviewData,
    formatCurrency, handleAddCar, handleRemoveCar, handleCarChange,
    handleAddInventoryItem, handleAddManualItem, handleRemoveInventoryItem, handleInventoryItemChange,
    handleSubmit: actions.handleSubmit, handleUpdateSale: actions.handleUpdateSale,
    handleDeleteSale: actions.handleDeleteSale, handleReverseSale: actions.handleReverseSale,
    handleApproveSale: actions.handleApproveSale,
    handleNewInvoice, handlePrintExisting, handleCloseInvoice,
    handleFirstSale, handlePreviousSale, handleNextSale, handleLastSale, loadSaleData,
    addMultiCarSale, deleteSale, reverseSale, updateSale, approveSale,
  };
}
