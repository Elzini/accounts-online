import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Save, 
  Plus, 
  X, 
  Printer, 
  FileText, 
  Trash2,
  ChevronRight,
  ChevronLeft,
  Car,
  ArrowRight,
  RotateCcw,
  Package,
  FileSpreadsheet,
  MessageSquare,
  ChevronDown,
  CheckCircle,
  FileEdit,
  Search,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ActivePage } from '@/types';
import { toast } from 'sonner';
import { useSuppliers, useAddPurchaseBatch, useCars, useUpdateCar, useDeleteCar, usePurchaseBatches } from '@/hooks/useDatabase';
import { useTaxSettings, useAccounts } from '@/hooks/useAccounting';
import { PurchaseInvoiceDialog } from '@/components/invoices/PurchaseInvoiceDialog';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { PaymentAccountSelector } from './PaymentAccountSelector';
import { ProjectSelector } from './ProjectSelector';
import { InvoiceSearchBar } from './InvoiceSearchBar';
import { useItems, useUnits } from '@/hooks/useInventory';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PurchaseInvoiceAIImport, ParsedInvoiceData } from './PurchaseInvoiceAIImport';

interface PurchaseInvoiceFormProps {
  setActivePage: (page: ActivePage) => void;
}

interface PurchaseInventoryItem {
  id: string;
  item_id: string | null;
  item_name: string;
  barcode: string;
  unit_name: string;
  unit_id: string | null;
  purchase_price: string;
  quantity: number;
}

interface CarItem {
  id: string;
  chassis_number: string;
  plate_number: string;
  name: string;
  model: string;
  color: string;
  purchase_price: string;
  quantity: number;
  unit: string;
  car_condition: 'new' | 'used';
}

export function PurchaseInvoiceForm({ setActivePage }: PurchaseInvoiceFormProps) {
  const { data: suppliers = [] } = useSuppliers();
  const { data: taxSettings } = useTaxSettings();
  const { data: accounts = [] } = useAccounts();
  const { data: existingCars = [] } = useCars();
  const { data: purchaseBatches = [] } = usePurchaseBatches();
  const { company } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const addPurchaseBatch = useAddPurchaseBatch();
  const updateCar = useUpdateCar();
  const deleteCar = useDeleteCar();
  const companyId = useCompanyId();
  const { t, language } = useLanguage();

  // Inventory hooks
  const { data: inventoryItems = [] } = useItems();
  const { data: units = [] } = useUnits();
  const isCarDealership = company?.company_type === 'car_dealership';
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const currency = t.inv_sar;

  const createEmptyCar = (): CarItem => ({
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
  });

  // Inventory items state for non-car companies
  const [purchaseInventoryItems, setPurchaseInventoryItems] = useState<PurchaseInventoryItem[]>([]);

  const createEmptyInventoryItem = (): PurchaseInventoryItem => ({
    id: crypto.randomUUID(),
    item_id: null,
    item_name: '',
    barcode: '',
    unit_name: t.inv_unit,
    unit_id: null,
    purchase_price: '',
    quantity: 1,
  });

  const handleAddInventoryItem = () => {
    setPurchaseInventoryItems([...purchaseInventoryItems, createEmptyInventoryItem()]);
  };

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
    if (purchaseInventoryItems.length === 1) {
      toast.error(t.inv_toast_min_one_item);
      return;
    }
    setPurchaseInventoryItems(purchaseInventoryItems.filter(i => i.id !== id));
  };

  const handleInventoryItemChange = (id: string, field: keyof PurchaseInventoryItem, value: string | number) => {
    setPurchaseInventoryItems(purchaseInventoryItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Filter purchase batches by fiscal year and sort
  const fiscalYearFilteredBatches = useMemo(() => {
    let filtered = purchaseBatches;
    
    if (selectedFiscalYear) {
      const fyStart = new Date(selectedFiscalYear.start_date);
      fyStart.setHours(0, 0, 0, 0);
      const fyEnd = new Date(selectedFiscalYear.end_date);
      fyEnd.setHours(23, 59, 59, 999);
      
      filtered = purchaseBatches.filter(batch => {
        const purchaseDate = new Date(batch.purchase_date);
        return purchaseDate >= fyStart && purchaseDate <= fyEnd;
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
      const purchaseDate = new Date(car.purchase_date);
      return purchaseDate >= fyStart && purchaseDate <= fyEnd;
    });
  }, [existingCars, selectedFiscalYear]);

  const nextInvoiceNumber = useMemo(() => {
    return purchaseBatches.length + 1;
  }, [purchaseBatches]);

  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_account_id: '',
    warehouse: 'main',
    notes: '',
    price_includes_tax: true,
    project_id: null as string | null,
  });

  useEffect(() => {
    if (accounts.length > 0 && !invoiceData.payment_account_id) {
      const cashAccount = accounts.find(a => a.code === '1101');
      if (cashAccount) {
        setInvoiceData(prev => ({ ...prev, payment_account_id: cashAccount.id }));
      }
    }
  }, [accounts, invoiceData.payment_account_id]);

  const [cars, setCars] = useState<CarItem[]>([createEmptyCar()]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [savedBatchData, setSavedBatchData] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('amount');
  const [currentInvoiceIndex, setCurrentInvoiceIndex] = useState(0);
  const [isViewingExisting, setIsViewingExisting] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [aiImportOpen, setAiImportOpen] = useState(false);

  const selectedSupplier = suppliers.find(s => s.id === invoiceData.supplier_id);
  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_purchases ? (taxSettings?.tax_rate || 15) : 0;

  const handleAddCar = () => {
    setCars([...cars, createEmptyCar()]);
  };

  const handleRemoveCar = (id: string) => {
    if (cars.length === 1) {
      toast.error(t.inv_toast_min_one_car);
      return;
    }
    setCars(cars.filter(car => car.id !== id));
  };

  const handleCarChange = (id: string, field: keyof CarItem, value: string | number) => {
    setCars(cars.map(car => 
      car.id === id ? { ...car, [field]: value } : car
    ));
  };

  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalVAT = 0;

    const calcItem = (price: number, quantity: number, itemTaxRate?: number) => {
      const effectiveTaxRate = itemTaxRate ?? taxRate;
      let baseAmount: number, vatAmount: number, total: number;
      if (invoiceData.price_includes_tax && effectiveTaxRate > 0) {
        total = price * quantity;
        baseAmount = total / (1 + effectiveTaxRate / 100);
        vatAmount = total - baseAmount;
      } else {
        baseAmount = price * quantity;
        vatAmount = baseAmount * (effectiveTaxRate / 100);
        total = baseAmount + vatAmount;
      }
      subtotal += baseAmount;
      totalVAT += vatAmount;
      return { baseAmount, vatAmount, total };
    };

    // Car items - used cars have 0% tax
    const itemsWithCalc = cars.map(car => {
      const price = parseFloat(car.purchase_price) || 0;
      const effectiveTaxRate = car.car_condition === 'used' ? 0 : taxRate;
      const result = calcItem(price, car.quantity || 1, effectiveTaxRate);
      return { ...car, ...result };
    });

    const inventoryItemsWithCalc = purchaseInventoryItems.map(item => {
      const price = parseFloat(item.purchase_price) || 0;
      const result = calcItem(price, item.quantity || 1);
      return { ...item, ...result };
    });

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discount / 100);
    } else {
      discountAmount = discount;
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const finalTotal = subtotalAfterDiscount + totalVAT;

    return {
      items: itemsWithCalc,
      inventoryItems: inventoryItemsWithCalc,
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      totalVAT,
      finalTotal,
      roundedTotal: Math.round(finalTotal),
    };
  }, [cars, purchaseInventoryItems, invoiceData.price_includes_tax, taxRate, discount, discountType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async () => {
    if (!invoiceData.supplier_id) {
      toast.error(t.inv_toast_select_supplier);
      return;
    }

    if (isCarDealership) {
      const invalidCar = cars.find(car => 
        !car.chassis_number || !car.name || !car.purchase_price
      );
      if (invalidCar) {
        toast.error(t.inv_toast_fill_fields);
        return;
      }

      const chassisNumbers = cars.map(car => car.chassis_number);
      const duplicates = chassisNumbers.filter((item, index) => chassisNumbers.indexOf(item) !== index);
      if (duplicates.length > 0) {
        toast.error(t.inv_toast_duplicate_chassis);
        return;
      }

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
          batch: {
            supplier_id: invoiceData.supplier_id,
            purchase_date: invoiceData.purchase_date,
            notes: invoiceData.notes || null,
            payment_account_id: invoiceData.payment_account_id || undefined,
          },
          cars: carsWithPrices,
        });
        
        setSavedBatchData({
          ...result,
          supplier: selectedSupplier,
          cars: cars,
        });
        
        toast.success(t.inv_toast_purchase_success);
        setInvoiceOpen(true);
      } catch (error: any) {
        if (error.message?.includes('duplicate')) {
          toast.error(t.inv_toast_duplicate_exists);
        } else {
          console.error('Purchase batch error:', error);
          toast.error(t.inv_toast_purchase_error);
        }
      }
    } else {
      if (purchaseInventoryItems.length === 0) {
        toast.error(t.inv_toast_add_item);
        return;
      }
      const emptyNameItem = purchaseInventoryItems.find(i => !i.item_name?.trim());
      if (emptyNameItem) {
        toast.error('الرجاء إدخال اسم الصنف لجميع العناصر');
        return;
      }
      const invalidItem = purchaseInventoryItems.find(i => !i.purchase_price || parseFloat(i.purchase_price) <= 0);
      if (invalidItem) {
        toast.error(t.inv_toast_enter_item_price);
        return;
      }

      try {
        if (!companyId) throw new Error(t.inv_toast_company_not_found);
        const invoiceNumber = `PUR-${Date.now()}`;

        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            company_id: companyId,
            invoice_number: invoiceData.invoice_number || invoiceNumber,
            invoice_type: 'purchase',
            supplier_id: invoiceData.supplier_id,
            customer_name: selectedSupplier?.name || '',
            invoice_date: invoiceData.purchase_date,
            due_date: invoiceData.due_date,
            subtotal: calculations.subtotal,
            taxable_amount: calculations.subtotalAfterDiscount,
            vat_rate: taxRate,
            vat_amount: calculations.totalVAT,
            total: calculations.finalTotal,
            discount_amount: calculations.discountAmount,
            amount_paid: 0,
            payment_status: 'unpaid',
            status: 'active',
            fiscal_year_id: selectedFiscalYear?.id || null,
            notes: invoiceData.notes || null,
            project_id: invoiceData.project_id || null,
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        const invoiceItems = purchaseInventoryItems.map((item, index) => ({
          invoice_id: invoice.id,
          item_description: item.item_name,
          item_code: item.barcode || '',
          quantity: item.quantity,
          unit: item.unit_name,
          unit_price: calculations.inventoryItems[index].baseAmount / item.quantity,
          taxable_amount: calculations.inventoryItems[index].baseAmount,
          vat_rate: taxRate,
          vat_amount: calculations.inventoryItems[index].vatAmount,
          total: calculations.inventoryItems[index].total,
          inventory_item_id: item.item_id,
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);
        if (itemsError) throw itemsError;

        setSavedBatchData({ batch: { id: invoice.id }, supplier: selectedSupplier, inventoryItems: purchaseInventoryItems });
        toast.success(t.inv_toast_purchase_inv_success);
        setInvoiceOpen(true);
      } catch (error: any) {
        console.error('Purchase invoice error:', error);
        toast.error(t.inv_toast_purchase_inv_error);
      }
    }
  };

  const handleNewInvoice = () => {
    setInvoiceData({
      invoice_number: '',
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_account_id: accounts.find(a => a.code === '1101')?.id || '',
      warehouse: 'main',
      notes: '',
      price_includes_tax: true,
      project_id: null,
    });
    setCars([createEmptyCar()]);
    setDiscount(0);
    setSavedBatchData(null);
    setIsViewingExisting(false);
    setCurrentBatchId(null);
    setIsEditing(false);
  };

  const handleCloseInvoice = (open: boolean) => {
    setInvoiceOpen(open);
    if (!open) {
      setActivePage('purchases');
    }
  };

  const handleFirstPurchase = () => {
    if (fiscalYearFilteredBatches.length > 0) {
      setCurrentInvoiceIndex(0);
      loadBatchData(fiscalYearFilteredBatches[0]);
    }
  };

  const handlePreviousPurchase = () => {
    if (currentInvoiceIndex > 0) {
      const newIndex = currentInvoiceIndex - 1;
      setCurrentInvoiceIndex(newIndex);
      loadBatchData(fiscalYearFilteredBatches[newIndex]);
    }
  };

  const handleNextPurchase = () => {
    if (currentInvoiceIndex < fiscalYearFilteredBatches.length - 1) {
      const newIndex = currentInvoiceIndex + 1;
      setCurrentInvoiceIndex(newIndex);
      loadBatchData(fiscalYearFilteredBatches[newIndex]);
    }
  };

  const handleLastPurchase = () => {
    if (fiscalYearFilteredBatches.length > 0) {
      const lastIndex = fiscalYearFilteredBatches.length - 1;
      setCurrentInvoiceIndex(lastIndex);
      loadBatchData(fiscalYearFilteredBatches[lastIndex]);
    }
  };

  const loadBatchData = (batch: any) => {
    setIsViewingExisting(true);
    setCurrentBatchId(batch.id);
    setIsEditing(false);
    
    setInvoiceData({
      invoice_number: String(currentInvoiceIndex + 1),
      supplier_id: batch.supplier_id || '',
      purchase_date: batch.purchase_date,
      due_date: batch.purchase_date,
      payment_account_id: batch.payment_account_id || '',
      warehouse: 'main',
      notes: batch.notes || '',
      price_includes_tax: false,
      project_id: null,
    });

    const batchCars = batch.cars || [];
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
  };

  const handleDeletePurchase = async () => {
    if (!currentBatchId) return;
    
    const batch = purchaseBatches.find(b => b.id === currentBatchId);
    if (!batch) return;
    
    const batchCars = batch.cars || [];
    const hasSoldCars = batchCars.some((car: any) => car.status === 'sold');
    
    if (hasSoldCars) {
      toast.error(t.inv_toast_cannot_delete_sold);
      return;
    }
    
    try {
      for (const car of batchCars) {
        await deleteCar.mutateAsync(car.id);
      }
      toast.success(t.inv_toast_purchase_delete_success);
      setDeleteDialogOpen(false);
      handleNewInvoice();
    } catch (error) {
      toast.error(t.inv_toast_delete_error);
    }
  };

  const handleReversePurchase = async () => {
    if (!currentBatchId) return;
    
    const batch = purchaseBatches.find(b => b.id === currentBatchId);
    if (!batch) return;
    
    const batchCars = batch.cars || [];
    const hasSoldCars = batchCars.some((car: any) => car.status === 'sold');
    
    if (hasSoldCars) {
      toast.error(t.inv_toast_cannot_reverse_sold);
      return;
    }
    
    try {
      for (const car of batchCars) {
        await deleteCar.mutateAsync(car.id);
      }
      toast.success(t.inv_toast_purchase_reverse_success);
      setReverseDialogOpen(false);
      handleNewInvoice();
    } catch (error) {
      toast.error(t.inv_toast_reverse_error);
    }
  };

  const handleUpdatePurchase = async () => {
    if (!currentBatchId) return;

    const batch = purchaseBatches.find(b => b.id === currentBatchId);
    if (!batch) return;
    
    const batchCars = batch.cars || [];

    if (cars.length === 0 || !cars[0].chassis_number || !cars[0].name) {
      toast.error(t.inv_toast_fill_fields);
      return;
    }

    try {
      for (let i = 0; i < cars.length && i < batchCars.length; i++) {
        const carData = cars[i];
        const existingCar = batchCars[i];
        
        await updateCar.mutateAsync({
          id: existingCar.id,
          car: {
            name: carData.name,
            model: carData.model || null,
            chassis_number: carData.chassis_number,
            plate_number: carData.plate_number || null,
            color: carData.color || null,
            purchase_price: parseFloat(carData.purchase_price),
            purchase_date: invoiceData.purchase_date,
            payment_account_id: invoiceData.payment_account_id || null,
            supplier_id: invoiceData.supplier_id || null,
            car_condition: carData.car_condition || 'new',
          }
        });
      }
      toast.success(t.inv_toast_purchase_update_success);
    } catch (error) {
      toast.error(t.inv_toast_purchase_update_error);
    }
  };

  const handlePrintExisting = () => {
    if (!currentBatchId) return;
    
    const batch = purchaseBatches.find(b => b.id === currentBatchId);
    if (!batch) return;

    setSavedBatchData({
      batch: { id: batch.id },
      supplier: selectedSupplier,
      cars: cars,
    });
    setInvoiceOpen(true);
  };

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
      subtotal: calculations.subtotal,
      taxAmount: calculations.totalVAT,
      total: calculations.finalTotal,
      taxSettings: taxSettings,
      companyLogoUrl: (company as any)?.invoice_logo_url || company?.logo_url,
    };
  }, [savedBatchData, invoiceData, selectedSupplier, calculations, taxSettings, company, taxRate, nextInvoiceNumber]);

  const handleAIImport = async (data: ParsedInvoiceData) => {
    try {
      // Check if supplier exists, if not create one
      let supplierId = '';
      const existingSupplier = suppliers.find(s => 
        s.name === data.supplier_name || 
        (data.supplier_tax_number && (s as any).id_number === data.supplier_tax_number)
      );

      if (existingSupplier) {
        supplierId = existingSupplier.id;
      } else if (companyId) {
        // Create new supplier
        const { data: newSupplier, error } = await supabase
          .from('suppliers')
          .insert({
            name: data.supplier_name,
            id_number: data.supplier_tax_number || null,
            phone: data.supplier_phone || null,
            address: data.supplier_address || null,
            company_id: companyId,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating supplier:', error);
          toast.error('فشل إنشاء المورد');
        } else if (newSupplier) {
          supplierId = newSupplier.id;
          toast.success(`تم إنشاء المورد: ${data.supplier_name}`);
        }
      }

      // Fill invoice data
      setInvoiceData(prev => ({
        ...prev,
        supplier_id: supplierId,
        invoice_number: data.invoice_number || prev.invoice_number,
        purchase_date: data.invoice_date || prev.purchase_date,
        due_date: data.due_date || prev.due_date,
        notes: data.notes || prev.notes,
        price_includes_tax: data.price_includes_tax ?? prev.price_includes_tax,
      }));

      // Fill items
      if (data.items && data.items.length > 0) {
        if (isCarDealership) {
          const carItems: CarItem[] = data.items.map(item => ({
            id: crypto.randomUUID(),
            chassis_number: '',
            plate_number: '',
            name: item.description,
            model: '',
            color: '',
            purchase_price: String(item.unit_price),
            quantity: item.quantity,
            unit: t.inv_car_unit,
            car_condition: 'new' as const,
          }));
          setCars(carItems);
        } else {
          const invItems: PurchaseInventoryItem[] = data.items.map(item => ({
            id: crypto.randomUUID(),
            item_id: null,
            item_name: item.description,
            barcode: '',
            unit_name: t.inv_unit,
            unit_id: null,
            purchase_price: String(item.unit_price),
            quantity: item.quantity,
          }));
          setPurchaseInventoryItems(invItems);
        }
      }

      // Set discount if any
      if (data.discount && data.discount > 0) {
        setDiscount(data.discount);
        setDiscountType('amount');
      }

      // Reset navigation state
      setIsViewingExisting(false);
      setCurrentBatchId(null);
      setIsEditing(false);

      toast.success('تم تعبئة بيانات الفاتورة بنجاح');
    } catch (error) {
      console.error('Error processing AI import:', error);
      toast.error('حدث خطأ أثناء معالجة البيانات');
    }
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4">
        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">
          
          {/* ===== Modern Header with Blue Gradient ===== */}
          <div className="bg-gradient-to-l from-blue-600 via-blue-500 to-indigo-500 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Navigation Controls */}
              <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-lg p-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={handleLastPurchase} disabled={fiscalYearFilteredBatches.length === 0}>
                  <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -mr-2.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={handleNextPurchase} disabled={currentInvoiceIndex >= fiscalYearFilteredBatches.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 text-xs bg-white/20 rounded-md min-w-[70px] text-center font-mono font-bold">
                  {fiscalYearFilteredBatches.length > 0 ? currentInvoiceIndex + 1 : 0} / {fiscalYearFilteredBatches.length}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={handlePreviousPurchase} disabled={currentInvoiceIndex <= 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={handleFirstPurchase} disabled={fiscalYearFilteredBatches.length === 0}>
                  <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2.5" />
                </Button>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 opacity-80" />
                  <h1 className="text-lg font-bold tracking-wide">{t.inv_purchase_invoice}</h1>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Search Bar ===== */}
          <div className="p-3 border-b bg-muted/30" ref={searchBarRef}>
            <InvoiceSearchBar
              mode="purchases"
              purchases={fiscalYearFilteredCars}
              suppliers={suppliers}
              onSelectResult={(result) => {
                if (result.type === 'invoice' || result.type === 'car') {
                  const car = result.data;
                  const batchIndex = fiscalYearFilteredBatches.findIndex(b => 
                    b.cars?.some((c: any) => c.id === car.id)
                  );
                  if (batchIndex >= 0) {
                    setCurrentInvoiceIndex(batchIndex);
                    loadBatchData(fiscalYearFilteredBatches[batchIndex]);
                  }
                } else if (result.type === 'supplier') {
                  const supplierBatches = fiscalYearFilteredBatches.filter(b => 
                    b.supplier_id === result.id
                  );
                  if (supplierBatches.length > 0) {
                    const batchIndex = fiscalYearFilteredBatches.findIndex(b => b.id === supplierBatches[0].id);
                    if (batchIndex >= 0) {
                      setCurrentInvoiceIndex(batchIndex);
                      loadBatchData(fiscalYearFilteredBatches[batchIndex]);
                    }
                  } else {
                    setInvoiceData(prev => ({ ...prev, supplier_id: result.id }));
                  }
                }
              }}
            />
          </div>

          {/* ===== Invoice Header Form - Modern Sections ===== */}
          <div className="p-4 border-b space-y-4 bg-card">
            {/* Section: Basic Info */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-bold text-foreground tracking-wide">بيانات الفاتورة</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_supplier} *</Label>
                <Select value={invoiceData.supplier_id} onValueChange={(v) => setInvoiceData({ ...invoiceData, supplier_id: v })}>
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none transition-colors">
                    <SelectValue placeholder={t.inv_select_supplier} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_invoice_number}</Label>
                <Input
                  value={invoiceData.invoice_number || nextInvoiceNumber}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
                  className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none font-mono"
                  placeholder={String(nextInvoiceNumber)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_warehouse}</Label>
                <Select value={invoiceData.warehouse} onValueChange={(v) => setInvoiceData({ ...invoiceData, warehouse: v })}>
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">{t.inv_main_warehouse}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_cash_account}</Label>
                <PaymentAccountSelector
                  value={invoiceData.payment_account_id}
                  onChange={(v) => setInvoiceData({ ...invoiceData, payment_account_id: v })}
                  type="payment"
                  className="h-9 border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none text-xs"
                />
              </div>
              <ProjectSelector
                value={invoiceData.project_id}
                onChange={(v) => setInvoiceData({ ...invoiceData, project_id: v })}
                className="h-9 border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none text-xs"
              />
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_payment_method}</Label>
                <Select defaultValue="cash">
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t.inv_deferred}</SelectItem>
                    <SelectItem value="bank">{t.inv_bank_transfer}</SelectItem>
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

            {/* Section: Dates & Details */}
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
                <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-indigo-500 shadow-none" placeholder={t.inv_reference} />
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

          {/* ===== Items Table - Modern Design ===== */}
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
                              <SelectContent>
                                <SelectItem value="new">جديدة</SelectItem>
                                <SelectItem value="used">مستعملة</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center text-xs py-2">{car.quantity}</TableCell>
                          <TableCell className="py-2"><Input type="number" value={car.purchase_price} onChange={(e) => handleCarChange(car.id, 'purchase_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                          <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.baseAmount || 0)}</TableCell>
                          <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.total || 0)}</TableCell>
                          <TableCell className="py-2">
                            {cars.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCar(car.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full"><X className="w-3 h-3" /></Button>
                            )}
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
                  <Button type="button" variant="outline" size="sm" onClick={handleAddCar} className="gap-1.5 text-xs h-9 rounded-lg">
                    <Plus className="w-3.5 h-3.5" />
                    {t.inv_add_car}
                  </Button>
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
                        <TableCell className="py-2">
                          <Input 
                            value={purchaseInventoryItems[index]?.item_name || ''} 
                            onChange={(e) => handleInventoryItemChange(item.id, 'item_name', e.target.value)} 
                            placeholder={t.inv_item_name_placeholder || 'اسم الصنف / الخدمة'} 
                            className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" 
                          />
                        </TableCell>
                        <TableCell className="py-2"><Input value={purchaseInventoryItems[index]?.barcode || ''} onChange={(e) => handleInventoryItemChange(item.id, 'barcode', e.target.value)} placeholder={t.inv_barcode} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                        <TableCell className="py-2"><Input type="number" min={1} value={purchaseInventoryItems[index]?.quantity || 1} onChange={(e) => handleInventoryItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} className="h-7 text-xs text-center border-0 border-b border-border rounded-none bg-transparent w-16" /></TableCell>
                        <TableCell className="text-center text-xs py-2">{item.unit_name}</TableCell>
                        <TableCell className="py-2"><Input type="number" value={purchaseInventoryItems[index]?.purchase_price || ''} onChange={(e) => handleInventoryItemChange(item.id, 'purchase_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                        <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(item.baseAmount)}</TableCell>
                        <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(item.total)}</TableCell>
                        <TableCell className="py-2">
                          {purchaseInventoryItems.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInventoryItem(item.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full"><X className="w-3 h-3" /></Button>
                          )}
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
                  <Button type="button" variant="outline" size="sm" onClick={handleAddInventoryItem} className="gap-1.5 text-xs h-9 rounded-lg">
                    <Plus className="w-3.5 h-3.5" />
                    {t.inv_add_item || 'إضافة صنف'}
                  </Button>
                  {(inventoryItems || []).length > 0 && (
                    <Select onValueChange={handleSelectExistingItem}>
                      <SelectTrigger className="h-9 text-xs w-[250px] rounded-lg">
                        <SelectValue placeholder={t.inv_select_inventory_item || 'اختر من المخزون...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(inventoryItems || []).map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3" />
                              {item.name} {item.barcode ? `(${item.barcode})` : ''}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ===== Invoice Summary Info ===== */}
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
                <div className={`text-[11px] font-bold rounded-full px-2 py-0.5 inline-block ${
                  isViewingExisting 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
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

          {/* ===== Totals Section - Modern Cards ===== */}
          <div className="p-4 border-t bg-card">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* الإجمالي الصافي */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 text-center text-white shadow-lg">
                <div className="text-3xl font-black">{formatCurrency(calculations.finalTotal)}</div>
                <div className="text-[11px] font-medium mt-1 opacity-90">{t.inv_net}</div>
              </div>
              {/* المجموع */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(calculations.subtotal)}</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-500 font-semibold mt-1">{t.inv_total}</div>
              </div>
              {/* الخصم */}
              <div className="bg-muted/60 border-2 border-border rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="h-8 text-lg font-black text-center w-20 border-0 border-b-2 border-border rounded-none bg-transparent" dir="ltr" />
                  <Select value={discountType} onValueChange={(v: 'percentage' | 'amount') => setDiscountType(v)}>
                    <SelectTrigger className="h-7 text-xs w-14 border-0 shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">{currency}</SelectItem>
                      <SelectItem value="percentage">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold mt-1">{t.inv_discount}</div>
              </div>
              {/* الضريبة */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{formatCurrency(calculations.totalVAT)}</div>
                <div className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold mt-1">{t.inv_tax_label} {taxRate}%</div>
              </div>
              {/* الإجمالي بعد التقريب */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{formatCurrency(calculations.roundedTotal)}</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-500 font-semibold mt-1">{t.inv_rounded_net}</div>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-4 pt-3 border-t border-border/40">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_terms || 'شروط البيع والدفع'}</Label>
                <Input placeholder={t.inv_terms_placeholder || 'أضف شروط وأحكام...'} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none" />
              </div>
            </div>
          </div>

          {/* ===== Modern Action Bar ===== */}
          <div className="border-t-2 border-blue-100 dark:border-blue-900 bg-gradient-to-b from-card to-muted/30">
            {/* Quick Menu Row */}
            <div className="px-4 py-2 flex items-center gap-2 border-b border-border/50 overflow-x-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-8 rounded-lg hover:bg-muted">
                    عمليات الضرائب <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setActivePage('vat-return-report')}>
                    <FileText className="w-3.5 h-3.5 ml-2" /> إنشاء إقرار ضريبي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActivePage('tax-settings')}>
                    <FileSpreadsheet className="w-3.5 h-3.5 ml-2" /> إعدادات الضريبة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-8 rounded-lg hover:bg-muted">
                    تقارير <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setActivePage('purchases-report')}>
                    <FileText className="w-3.5 h-3.5 ml-2" /> تقرير المشتريات
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActivePage('account-statement')}>
                    <FileText className="w-3.5 h-3.5 ml-2" /> كشف حساب
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-8 rounded-lg hover:bg-muted">
                    {t.inv_operations || 'عمليات'} <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setActivePage('medad-import')}>
                    <FileSpreadsheet className="w-3.5 h-3.5 ml-2" /> {t.inv_import_data || 'استيراد بيانات'}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!isViewingExisting} onClick={() => setReverseDialogOpen(true)} className="text-amber-600">
                    <RotateCcw className="w-3.5 h-3.5 ml-2" /> {t.inv_return}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('سيتم إضافة خاصية إرسال SMS قريباً')}>
                    <MessageSquare className="w-3.5 h-3.5 ml-2" /> إرسال SMS
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-8 rounded-lg hover:bg-muted">
                    عرض <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handlePrintExisting} disabled={!isViewingExisting}>
                    <Printer className="w-3.5 h-3.5 ml-2" /> معاينة قبل الطباعة
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActivePage('journal-entries')} disabled={!isViewingExisting}>
                    <FileText className="w-3.5 h-3.5 ml-2" /> عرض القيد المحاسبي
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Primary Action Buttons */}
            <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
              {isViewingExisting && isEditing ? (
                <Button onClick={handleUpdatePurchase} size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md" variant="outline" disabled={updateCar.isPending}>
                  <Save className="w-3.5 h-3.5" />
                  {updateCar.isPending ? t.inv_saving : t.inv_save_changes}
                </Button>
              ) : !isViewingExisting ? (
                <Button onClick={handleSubmit} size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md" disabled={addPurchaseBatch.isPending}>
                  <Plus className="w-3.5 h-3.5" />
                  {addPurchaseBatch.isPending ? t.inv_saving : 'إضافة'}
                </Button>
              ) : null}

              <Button variant="outline" onClick={handleNewInvoice} size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> جديد
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className={`gap-1.5 text-xs h-9 rounded-lg shadow-sm ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400' : ''}`}
                disabled={!isViewingExisting}
                onClick={() => { setIsEditing(!isEditing); if (!isEditing) toast.info('تم تفعيل وضع التعديل'); }}
              >
                <FileEdit className="w-3.5 h-3.5" />
                {isEditing ? 'إلغاء التعديل' : 'تعديل'}
              </Button>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" disabled={!isViewingExisting} onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" /> حذف
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-xs h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 shadow-sm" 
                disabled={!isViewingExisting}
                onClick={() => setActivePage('journal-entries')}
              >
                <CheckCircle className="w-3.5 h-3.5" /> محاسبة
              </Button>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" onClick={() => { searchBarRef.current?.scrollIntoView({ behavior: 'smooth' }); const input = searchBarRef.current?.querySelector('input'); if (input) setTimeout(() => input.focus(), 300); }}>
                <Search className="w-3.5 h-3.5 text-muted-foreground" /> بحث
              </Button>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm" disabled={!isViewingExisting} onClick={handlePrintExisting}>
                <Printer className="w-3.5 h-3.5 text-blue-600" /> طباعة
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm">
                    مزيد.. <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setActivePage('medad-import')}>
                    <FileSpreadsheet className="w-3.5 h-3.5 ml-2" /> {t.inv_import_data || 'استيراد بيانات'}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!isViewingExisting} onClick={() => setReverseDialogOpen(true)} className="text-amber-600">
                    <RotateCcw className="w-3.5 h-3.5 ml-2" /> {t.inv_return}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={() => setActivePage('purchases')} size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 shadow-sm">
                <X className="w-3.5 h-3.5" /> إغلاق
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      {invoicePreviewData && (
        <PurchaseInvoiceDialog
          open={invoiceOpen}
          onOpenChange={handleCloseInvoice}
          data={invoicePreviewData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.inv_delete_purchase_confirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.inv_delete_purchase_desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePurchase}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCar.isPending ? t.inv_deleting : t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reverse Confirmation Dialog */}
      <AlertDialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-warning" />
              {t.inv_return_purchase_invoice}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t.inv_return_purchase_confirm}</p>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>{t.inv_delete_car_from_inventory}</li>
                <li>{t.inv_delete_journal_entry}</li>
                <li>{t.inv_update_stats}</li>
              </ul>
              <p className="text-destructive font-medium">{t.inv_cannot_undo}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReversePurchase}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {deleteCar.isPending ? t.inv_returning : t.inv_return_invoice_btn}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}