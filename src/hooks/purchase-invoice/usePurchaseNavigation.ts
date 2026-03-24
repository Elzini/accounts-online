/**
 * Purchase Invoice - Navigation & Record Loading
 * Handles invoice navigation (first/prev/next/last) and record hydration.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { usePurchaseBatches } from '@/hooks/useDatabase';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { useLanguage } from '@/contexts/LanguageContext';
import { CarItem, PurchaseInventoryItem } from '@/components/forms/purchase-invoice/types';

interface NavigationState {
  currentInvoiceIndex: number;
  isViewingExisting: boolean;
  currentBatchId: string | null;
  currentInvoiceStatus: string;
  isEditing: boolean;
}

interface NavigationCallbacks {
  setCars: (cars: CarItem[]) => void;
  setInvoiceData: (fn: (prev: any) => any) => void;
  setPurchaseInventoryItems: (items: PurchaseInventoryItem[]) => void;
  setDiscount: (v: number) => void;
  setStoredHeaderTotals: (v: { subtotal: number; vat_amount: number; total: number } | null) => void;
  createEmptyCar: () => CarItem;
  createEmptyInventoryItem: () => PurchaseInventoryItem;
}

export function usePurchaseNavigation(callbacks: NavigationCallbacks) {
  const companyId = useCompanyId();
  const { selectedFiscalYear } = useFiscalYear();
  const { data: purchaseBatches = [] } = usePurchaseBatches();
  const isCarDealership = useIndustryFeatures().hasCarInventory;
  const { t } = useLanguage();

  const [currentInvoiceIndex, setCurrentInvoiceIndex] = useState(0);
  const [isViewingExisting, setIsViewingExisting] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [currentInvoiceStatus, setCurrentInvoiceStatus] = useState<string>('draft');
  const [isEditing, setIsEditing] = useState(false);
  const initialNavDone = useRef(false);

  // Fiscal year filtered batches (car dealership)
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

  // Purchase invoices (non-car)
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

  // Load record data into form
  const loadRecordData = useCallback((record: any) => {
    setIsViewingExisting(true);
    setCurrentBatchId(record.id);
    setCurrentInvoiceStatus(record.status || 'draft');
    setIsEditing(false);

    if (isCarDealership) {
      callbacks.setInvoiceData(() => ({
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
      }));
      const batchCars = record.cars || [];
      if (batchCars.length > 0) {
        callbacks.setCars(batchCars.map((car: any) => ({
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
        callbacks.setCars([callbacks.createEmptyCar()]);
      }
    } else {
      callbacks.setInvoiceData(() => ({
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
      }));
      const items = record.invoice_items || [];
      if (items.length > 0) {
        callbacks.setPurchaseInventoryItems(items.map((item: any) => ({
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
        callbacks.setPurchaseInventoryItems([callbacks.createEmptyInventoryItem()]);
      }
      if (record.discount_amount && record.discount_amount > 0) {
        callbacks.setDiscount(record.discount_amount);
      } else {
        callbacks.setDiscount(0);
      }
      callbacks.setStoredHeaderTotals({
        subtotal: record.subtotal || 0,
        vat_amount: record.vat_amount || 0,
        total: record.total || 0,
      });
    }
  }, [isCarDealership, currentInvoiceIndex, t, callbacks]);

  // Auto-navigate from session storage
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
  }, [navigationRecords, loadRecordData]);

  const handleFirstPurchase = () => { if (navigationRecords.length > 0) { setCurrentInvoiceIndex(0); loadRecordData(navigationRecords[0]); } };
  const handlePreviousPurchase = () => { if (currentInvoiceIndex > 0) { const i = currentInvoiceIndex - 1; setCurrentInvoiceIndex(i); loadRecordData(navigationRecords[i]); } };
  const handleNextPurchase = () => { if (currentInvoiceIndex < navigationRecords.length - 1) { const i = currentInvoiceIndex + 1; setCurrentInvoiceIndex(i); loadRecordData(navigationRecords[i]); } };
  const handleLastPurchase = () => { if (navigationRecords.length > 0) { const i = navigationRecords.length - 1; setCurrentInvoiceIndex(i); loadRecordData(navigationRecords[i]); } };

  return {
    currentInvoiceIndex, setCurrentInvoiceIndex,
    isViewingExisting, setIsViewingExisting,
    currentBatchId, setCurrentBatchId,
    currentInvoiceStatus, setCurrentInvoiceStatus,
    isEditing, setIsEditing,
    navigationRecords, nextInvoiceNumber,
    fiscalYearFilteredBatches, filteredPurchaseInvoices, purchaseInvoices,
    loadRecordData,
    handleFirstPurchase, handlePreviousPurchase, handleNextPurchase, handleLastPurchase,
  };
}
