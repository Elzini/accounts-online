/**
 * Purchase Invoice - Navigation helpers
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CarItem, PurchaseInventoryItem } from '@/components/forms/purchase-invoice/types';

interface NavigationDeps {
  navigationRecords: any[];
  isCarDealership: boolean;
  accounts: any[];
  t: Record<string, string>;
  createEmptyCar: () => CarItem;
  createEmptyInventoryItem: () => PurchaseInventoryItem;
  currentInvoiceIndex: number;
  setCurrentInvoiceIndex: (i: number) => void;
}

export function usePurchaseNavigation(deps: NavigationDeps) {
  const {
    navigationRecords, isCarDealership, accounts, t,
    createEmptyCar, createEmptyInventoryItem,
    currentInvoiceIndex, setCurrentInvoiceIndex,
  } = deps;

  const [isViewingExisting, setIsViewingExisting] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [currentInvoiceStatus, setCurrentInvoiceStatus] = useState<string>('draft');
  const [isEditing, setIsEditing] = useState(false);
  const [storedHeaderTotals, setStoredHeaderTotals] = useState<{
    subtotal: number; vat_amount: number; total: number;
  } | null>(null);
  const initialNavDone = useRef(false);

  // State setters for form data (will be connected from parent)
  const [invoiceDataSetter, setInvoiceDataSetter] = useState<any>(null);
  const [carsSetter, setCarsSetter] = useState<any>(null);
  const [inventoryItemsSetter, setInventoryItemsSetter] = useState<any>(null);
  const [discountSetter, setDiscountSetter] = useState<any>(null);

  const loadRecordData = useCallback((record: any, setCars: any, setInvoiceData: any, setPurchaseInventoryItems: any, setDiscount: any) => {
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

  const handleNewInvoice = useCallback((setCars: any, setInvoiceData: any, setDiscount: any, setSavedBatchData: any, setStoredHeaderTotalsExt: any) => {
    setInvoiceData({
      invoice_number: '', supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_account_id: accounts.find((a: any) => a.code === '1101')?.id || '',
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
    setStoredHeaderTotalsExt?.(null);
  }, [accounts, createEmptyCar]);

  return {
    isViewingExisting, setIsViewingExisting,
    currentBatchId, setCurrentBatchId,
    currentInvoiceStatus, setCurrentInvoiceStatus,
    isEditing, setIsEditing,
    storedHeaderTotals, setStoredHeaderTotals,
    initialNavDone,
    loadRecordData,
    handleNewInvoice,
  };
}
