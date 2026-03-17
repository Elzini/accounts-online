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
  FileSpreadsheet,
  ChevronDown,
  MessageSquare,
  RotateCcw,
  Package,
  CheckCircle,
  FileEdit,
  Search
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
import { useCustomers, useCars, useAddMultiCarSale, useSales, useDeleteSale, useReverseSale, useUpdateSale, useSalesWithItems, useUpdateSaleWithItems, useApproveSale } from '@/hooks/useDatabase';
import { useTaxSettings, useAccounts } from '@/hooks/useAccounting';
import { InvoicePreviewDialog } from '@/components/invoices/InvoicePreviewDialog';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { PaymentAccountSelector } from './PaymentAccountSelector';
import { useImportedInvoiceData } from '@/hooks/useImportedInvoiceData';
import { getPendingTransferForCar, linkTransferToSale } from '@/hooks/useTransfers';
import { CarTransfer } from '@/services/transfers';
import { useAddInstallmentSale } from '@/hooks/useInstallments';
import { useCompanyId } from '@/hooks/useCompanyId';
import { InvoiceSearchBar } from './InvoiceSearchBar';
import { useItems, useUnits } from '@/hooks/useInventory';
import { supabase } from '@/integrations/supabase/client';
import { approveInvoiceWithJournal } from '@/services/invoiceJournal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNumberFormat } from '@/hooks/useNumberFormat';
import { useAuth } from '@/contexts/AuthContext';

interface SalesInvoiceFormProps {
  setActivePage: (page: ActivePage) => void;
}

interface SelectedCarItem {
  id: string;
  car_id: string;
  sale_price: string;
  purchase_price: number;
  car_name: string;
  model: string;
  color: string;
  chassis_number: string;
  plate_number: string;
  quantity: number;
  car_condition: 'new' | 'used';
  pendingTransfer?: CarTransfer | null;
}

interface SelectedInventoryItem {
  id: string;
  item_id: string;
  item_name: string;
  barcode: string;
  unit_name: string;
  unit_id: string | null;
  sale_price: string;
  cost_price: number;
  quantity: number;
  available_quantity: number;
}

export function SalesInvoiceForm({ setActivePage }: SalesInvoiceFormProps) {
  const { data: customers = [] } = useCustomers();
  const { data: allCars = [] } = useCars();
  const { data: taxSettings } = useTaxSettings();
  const { data: accounts = [] } = useAccounts();
  const { data: existingSales = [] } = useSales();
  const { data: salesWithItems = [] } = useSalesWithItems();
  const { data: savedTemplates = [] } = useImportedInvoiceData();
  const [existingInvoices, setExistingInvoices] = useState<any[]>([]);
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
  // Draft/approved status tracking (moved after isViewingExisting state below)
  // Inventory hooks
  const { data: inventoryItems = [] } = useItems();
  const { data: units = [] } = useUnits();
  const isCarDealership = company?.company_type === 'car_dealership';

  // Available cars for sale
  const availableCars = useMemo(() => 
    allCars.filter(car => car.status === 'available' || car.status === 'transferred'),
    [allCars]
  );

  // Fetch invoices for non-car companies
  useEffect(() => {
    if (!isCarDealership && companyId) {
      const fetchInvoices = async () => {
        const { data } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('company_id', companyId)
          .eq('invoice_type', 'sales')
          .order('created_at', { ascending: true });
        setExistingInvoices(data || []);
      };
      fetchInvoices();
    }
  }, [isCarDealership, companyId, existingSales]);

  // Filter sales/invoices by fiscal year
  const fiscalYearFilteredSales = useMemo(() => {
    const sourceData = isCarDealership ? existingSales : existingInvoices;
    if (!selectedFiscalYear) return sourceData;
    
    const fyStart = new Date(selectedFiscalYear.start_date);
    fyStart.setHours(0, 0, 0, 0);
    const fyEnd = new Date(selectedFiscalYear.end_date);
    fyEnd.setHours(23, 59, 59, 999);
    
    return sourceData.filter((item: any) => {
      const itemDate = new Date(isCarDealership ? item.sale_date : item.invoice_date);
      return itemDate >= fyStart && itemDate <= fyEnd;
    });
  }, [existingSales, existingInvoices, selectedFiscalYear, isCarDealership]);

  // Generate next invoice number
  const nextInvoiceNumber = useMemo(() => {
    const year = new Date().getFullYear();
    const sourceData = isCarDealership ? existingSales : existingInvoices;
    const nextNum = sourceData.length + 1;
    return `INV-${year}-${String(nextNum).padStart(3, '0')}`;
  }, [existingSales, existingInvoices, isCarDealership]);

  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    customer_id: '',
    sale_date: new Date().toISOString().split('T')[0],
    issue_time: new Date().toTimeString().slice(0, 5),
    payment_account_id: '',
    warehouse: 'main',
    seller_name: '',
    notes: '',
    price_includes_tax: true,
    commission: '',
    other_expenses: '',
    is_installment: false,
    down_payment: '',
    number_of_installments: '12',
    last_payment_date: '',
    first_installment_date: new Date().toISOString().split('T')[0],
  });

  // Set default payment account
  useEffect(() => {
    if (accounts.length > 0 && !invoiceData.payment_account_id) {
      const cashAccount = accounts.find(a => a.code === '1101');
      if (cashAccount) {
        setInvoiceData(prev => ({ ...prev, payment_account_id: cashAccount.id }));
      }
    }
  }, [accounts, invoiceData.payment_account_id]);

  const [selectedCars, setSelectedCars] = useState<SelectedCarItem[]>([]);
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
  // Store header totals from DB for existing invoices (frozen financial snapshot)
  const [storedHeaderTotals, setStoredHeaderTotals] = useState<{
    subtotal: number; vat_amount: number; total: number; vat_rate: number; discount_amount: number;
  } | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const isApproved = isViewingExisting && currentSaleStatus === 'approved';
  const isReadOnly = isViewingExisting && !isEditing && !isApproved;

  // Inventory items state (for non-car companies)
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<SelectedInventoryItem[]>([]);

  const selectedCustomer = customers.find(c => c.id === invoiceData.customer_id);
  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_sales ? (taxSettings?.tax_rate || 15) : 0;
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const currency = t.inv_sar;

  // Available inventory items for selection
  const availableInventoryItems = useMemo(() => 
    (inventoryItems || []).filter((item: any) => item.is_active && !selectedInventoryItems.some(si => si.item_id === item.id)),
    [inventoryItems, selectedInventoryItems]
  );

  // Cars that are still available for selection
  const remainingCars = useMemo(() => 
    availableCars.filter(car => !selectedCars.some(sc => sc.car_id === car.id)),
    [availableCars, selectedCars]
  );

  // Add inventory item to invoice (from dropdown)
  const handleAddInventoryItem = (itemId: string) => {
    const item = (inventoryItems || []).find((i: any) => i.id === itemId) as any;
    if (!item) return;

    setSelectedInventoryItems([...selectedInventoryItems, {
      id: crypto.randomUUID(),
      item_id: item.id,
      item_name: item.name,
      barcode: item.barcode || '',
      unit_name: item.units_of_measure?.abbreviation || item.units_of_measure?.name || t.inv_unit,
      unit_id: item.unit_id,
      sale_price: String(item.sale_price_1 || 0),
      cost_price: Number(item.cost_price || 0),
      quantity: 1,
      available_quantity: Number(item.current_quantity || 0),
    }]);
  };

  // Add empty manual item row
  const handleAddManualItem = () => {
    setSelectedInventoryItems([...selectedInventoryItems, {
      id: crypto.randomUUID(),
      item_id: '',
      item_name: '',
      barcode: '',
      unit_name: t.inv_unit || 'وحدة',
      unit_id: null,
      sale_price: '',
      cost_price: 0,
      quantity: 1,
      available_quantity: 0,
    }]);
  };

  const handleRemoveInventoryItem = (id: string) => {
    if (selectedInventoryItems.length === 1) {
      toast.error(t.inv_toast_min_one_item);
      return;
    }
    setSelectedInventoryItems(selectedInventoryItems.filter(i => i.id !== id));
  };

  const handleInventoryItemChange = (id: string, field: keyof SelectedInventoryItem, value: string | number) => {
    setSelectedInventoryItems(selectedInventoryItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleAddCar = async (carId: string) => {
    const car = availableCars.find(c => c.id === carId);
    if (!car) return;

    let pendingTransfer: CarTransfer | null = null;
    try {
      pendingTransfer = await getPendingTransferForCar(carId);
    } catch (error) {
      console.error('Error checking pending transfer:', error);
    }

    setSelectedCars([...selectedCars, {
      id: crypto.randomUUID(),
      car_id: car.id,
      sale_price: '',
      purchase_price: Number(car.purchase_price),
      car_name: car.name,
      model: car.model || '',
      color: car.color || '',
      chassis_number: car.chassis_number,
      plate_number: (car as any).plate_number || '',
      quantity: 1,
      car_condition: (car as any).car_condition === 'used' ? 'used' : 'new',
      pendingTransfer,
    }]);
  };

  const handleRemoveCar = (id: string) => {
    if (selectedCars.length === 1) {
      toast.error(t.inv_toast_min_one_car);
      return;
    }
    setSelectedCars(selectedCars.filter(car => car.id !== id));
  };

  const handleCarChange = (id: string, field: keyof SelectedCarItem, value: string | number) => {
    setSelectedCars(selectedCars.map(car => 
      car.id === id ? { ...car, [field]: value } : car
    ));
  };

  // Calculate totals - supports both cars and inventory items
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalVAT = 0;
    const commission = parseFloat(invoiceData.commission) || 0;
    const otherExpenses = parseFloat(invoiceData.other_expenses) || 0;

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

    // Car items - apply different tax logic based on car condition
    const itemsWithCalc = selectedCars.map(car => {
      const price = parseFloat(car.sale_price) || 0;
      
      if (car.car_condition === 'used' && taxRate > 0) {
        // Used car: VAT on profit margin only (margin × 15% added to sale price)
        const quantity = car.quantity || 1;
        const baseAmount = price * quantity;
        const profitMargin = Math.max(0, baseAmount - (car.purchase_price * quantity));
        const vatAmount = profitMargin * taxRate / (100 + taxRate);
        const total = baseAmount + vatAmount;
        subtotal += baseAmount;
        totalVAT += vatAmount;
        return { ...car, baseAmount, vatAmount, total };
      } else {
        // New car: normal VAT on full price
        const result = calcItem(price, car.quantity || 1);
        return { ...car, ...result };
      }
    });

    // Inventory items
    const inventoryItemsWithCalc = selectedInventoryItems.map(item => {
      const price = parseFloat(item.sale_price) || 0;
      const result = calcItem(price, item.quantity || 1);
      return { ...item, ...result };
    });

    // Calculate discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discount / 100);
    } else {
      discountAmount = discount;
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const finalTotal = subtotalAfterDiscount + totalVAT;
    const totalPurchasePrice = isCarDealership
      ? selectedCars.reduce((sum, car) => sum + car.purchase_price, 0)
      : selectedInventoryItems.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);
    const profit = subtotalAfterDiscount - totalPurchasePrice - commission - otherExpenses;
    const totalQuantity = isCarDealership ? selectedCars.length : selectedInventoryItems.reduce((sum, i) => sum + i.quantity, 0);

    return {
      items: itemsWithCalc,
      inventoryItems: inventoryItemsWithCalc,
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      totalVAT,
      finalTotal,
      roundedTotal: finalTotal,
      totalPurchasePrice,
      profit,
      quantity: totalQuantity,
    };
  }, [selectedCars, selectedInventoryItems, invoiceData.price_includes_tax, invoiceData.commission, invoiceData.other_expenses, taxRate, discount, discountType, isCarDealership]);

  // Use stored header totals for display when viewing existing invoices (frozen financial snapshot)
  const displayTotals = useMemo(() => {
    if (isViewingExisting && !isEditing && storedHeaderTotals && storedHeaderTotals.total > 0) {
      return {
        subtotal: storedHeaderTotals.subtotal,
        totalVAT: storedHeaderTotals.vat_amount,
        finalTotal: storedHeaderTotals.total,
        discountAmount: storedHeaderTotals.discount_amount,
        subtotalAfterDiscount: storedHeaderTotals.subtotal - storedHeaderTotals.discount_amount,
        roundedTotal: storedHeaderTotals.total,
        totalPurchasePrice: calculations.totalPurchasePrice,
        profit: calculations.profit,
        quantity: calculations.quantity,
      };
    }
    return calculations;
  }, [calculations, storedHeaderTotals, isViewingExisting, isEditing]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(decimals === 0 ? Math.round(value) : value);
  };

  const handleSubmit = async () => {
    if (!invoiceData.customer_id) {
      toast.error(t.inv_toast_select_customer);
      return;
    }

    if (isCarDealership) {
      if (selectedCars.length === 0) {
        toast.error(t.inv_toast_add_car);
        return;
      }
      const invalidCar = selectedCars.find(car => !car.sale_price || parseFloat(car.sale_price) <= 0);
      if (invalidCar) {
        toast.error(t.inv_toast_enter_price);
        return;
      }

      try {
        const carsWithPrices = selectedCars.map((car, index) => ({
          car_id: car.car_id,
          sale_price: calculations.items[index].total,
          purchase_price: car.purchase_price,
        }));

        const sale = await addMultiCarSale.mutateAsync({
          customer_id: invoiceData.customer_id,
          seller_name: invoiceData.seller_name || undefined,
          commission: parseFloat(invoiceData.commission) || 0,
          other_expenses: parseFloat(invoiceData.other_expenses) || 0,
          sale_date: invoiceData.sale_date,
          payment_account_id: invoiceData.payment_account_id || undefined,
          cars: carsWithPrices,
        });

        for (const car of selectedCars) {
          if (car.pendingTransfer) {
            try {
              await linkTransferToSale(car.pendingTransfer.id, sale.id, parseFloat(car.sale_price), car.pendingTransfer.agreed_commission, car.pendingTransfer.commission_percentage);
            } catch (error) { console.error('Error linking transfer to sale:', error); }
          }
        }

        if (invoiceData.is_installment && companyId) {
          const downPayment = parseFloat(invoiceData.down_payment) || 0;
          const numberOfInstallments = parseInt(invoiceData.number_of_installments) || 12;
          const remainingAmount = calculations.finalTotal - downPayment;
          const installmentAmount = remainingAmount / numberOfInstallments;
          try {
            await addInstallmentSale.mutateAsync({ company_id: companyId, sale_id: sale.id, total_amount: calculations.finalTotal, down_payment: downPayment, remaining_amount: remainingAmount, number_of_installments: numberOfInstallments, installment_amount: installmentAmount, start_date: invoiceData.sale_date, status: 'active', notes: invoiceData.notes || null });
            toast.success(t.inv_toast_installment_success);
          } catch (error) { toast.error(t.inv_toast_installment_error); }
        }

        setSavedSaleData({ ...sale, customer: selectedCustomer, cars: selectedCars });
        toast.success(t.inv_draft_saved);
        // Load the saved draft for viewing/approving
        setIsViewingExisting(true);
        setCurrentSaleId(sale.id);
        setCurrentSaleStatus('draft');
      } catch (error: any) {
        console.error('Sale error:', error);
        toast.error(t.inv_toast_sale_error);
      }
    } else {
      if (selectedInventoryItems.length === 0) {
        toast.error(t.inv_toast_add_item);
        return;
      }
      const emptyNameItem = selectedInventoryItems.find(i => !i.item_name?.trim());
      if (emptyNameItem) {
        toast.error('الرجاء إدخال اسم الصنف لجميع العناصر');
        return;
      }
      const invalidItem = selectedInventoryItems.find(i => !i.sale_price || parseFloat(i.sale_price) <= 0);
      if (invalidItem) {
        toast.error(t.inv_toast_enter_item_price);
        return;
      }

      try {
        if (!companyId) throw new Error(t.inv_toast_company_not_found);
        const finalInvoiceNumber = invoiceData.invoice_number || nextInvoiceNumber;

        // Check for duplicate invoice number
        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('company_id', companyId)
          .eq('invoice_number', finalInvoiceNumber)
          .eq('invoice_type', 'sales')
          .maybeSingle();

        if (existing) {
          toast.error(language === 'ar' ? 'رقم الفاتورة موجود مسبقاً، الرجاء استخدام رقم آخر' : 'Invoice number already exists');
          return;
        }

        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            company_id: companyId,
            invoice_number: finalInvoiceNumber,
            invoice_type: 'sales',
            customer_id: invoiceData.customer_id,
            customer_name: selectedCustomer?.name || '',
            invoice_date: `${invoiceData.sale_date}T${invoiceData.issue_time || '00:00'}:00`,
            subtotal: calculations.subtotal,
            taxable_amount: calculations.subtotalAfterDiscount,
            vat_rate: taxRate,
            vat_amount: calculations.totalVAT,
            total: calculations.finalTotal,
            discount_amount: calculations.discountAmount,
            amount_paid: paidAmount,
            payment_status: paidAmount >= calculations.finalTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
            status: 'draft',
            fiscal_year_id: selectedFiscalYear?.id || null,
            notes: invoiceData.notes || null,
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        const invoiceItems = selectedInventoryItems.map((item, index) => ({
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

        setSavedSaleData({ id: invoice.id, customer: selectedCustomer, inventoryItems: selectedInventoryItems });
        toast.success('✅ تم حفظ الفاتورة كمسودة - يمكنك تعديلها أو اعتمادها محاسبياً');
        // Enter viewing mode for the saved draft
        setIsViewingExisting(true);
        setCurrentSaleId(invoice.id);
        setCurrentSaleStatus('draft');
        // Refresh invoices list
        const { data: updatedInvoices } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('company_id', companyId)
          .eq('invoice_type', 'sales')
          .order('created_at', { ascending: true });
        setExistingInvoices(updatedInvoices || []);
      } catch (error: any) {
        console.error('Invoice error:', error);
        toast.error(t.inv_toast_invoice_error);
      }
    }
  };

  const handleNewInvoice = () => {
    setInvoiceData({
      invoice_number: '',
      customer_id: '',
      sale_date: new Date().toISOString().split('T')[0],
      issue_time: new Date().toTimeString().slice(0, 5),
      payment_account_id: accounts.find(a => a.code === '1101')?.id || '',
      warehouse: 'main',
      seller_name: '',
      notes: '',
      price_includes_tax: true,
      commission: '',
      other_expenses: '',
      is_installment: false,
      down_payment: '',
      number_of_installments: '12',
      last_payment_date: '',
      first_installment_date: new Date().toISOString().split('T')[0],
    });
    setSelectedCars([]);
    setSelectedInventoryItems([]);
    setDiscount(0);
    setPaidAmount(0);
    setSavedSaleData(null);
    setIsViewingExisting(false);
    setCurrentSaleId(null);
    setCurrentSaleStatus('draft');
    setIsEditing(false);
    setStoredHeaderTotals(null);
  };

  const handleCloseInvoice = (open: boolean) => {
    setInvoiceOpen(open);
    if (!open) {
      setActivePage('sales');
    }
  };

  // Navigation functions
  const handleFirstSale = () => {
    if (fiscalYearFilteredSales.length > 0) {
      setCurrentInvoiceIndex(0);
      loadSaleData(fiscalYearFilteredSales[0]);
    }
  };

  const handlePreviousSale = () => {
    if (currentInvoiceIndex > 0) {
      const newIndex = currentInvoiceIndex - 1;
      setCurrentInvoiceIndex(newIndex);
      loadSaleData(fiscalYearFilteredSales[newIndex]);
    }
  };

  const handleNextSale = () => {
    if (currentInvoiceIndex < fiscalYearFilteredSales.length - 1) {
      const newIndex = currentInvoiceIndex + 1;
      setCurrentInvoiceIndex(newIndex);
      loadSaleData(fiscalYearFilteredSales[newIndex]);
    }
  };

  const handleLastSale = () => {
    if (fiscalYearFilteredSales.length > 0) {
      const lastIndex = fiscalYearFilteredSales.length - 1;
      setCurrentInvoiceIndex(lastIndex);
      loadSaleData(fiscalYearFilteredSales[lastIndex]);
    }
  };

  const loadSaleData = async (sale: any) => {
    setIsViewingExisting(true);
    setCurrentSaleId(sale.id);
    setCurrentSaleStatus((sale.status === 'approved' || sale.status === 'issued') ? 'approved' : 'draft');
    setIsEditing(false);

    // Check if this is an invoice record (from invoices table) vs a sale record
    const isInvoiceRecord = !!sale.invoice_number;
    
    setInvoiceData({
      invoice_number: isInvoiceRecord ? (sale.invoice_number || '') : (sale.sale_number || ''),
      customer_id: sale.customer_id || '',
      sale_date: isInvoiceRecord ? (sale.invoice_date?.split('T')[0] || '') : (sale.sale_date || ''),
      issue_time: isInvoiceRecord && sale.invoice_date?.includes('T') ? sale.invoice_date.split('T')[1]?.slice(0, 5) || new Date(sale.created_at).toTimeString().slice(0, 5) : new Date(sale.created_at).toTimeString().slice(0, 5),
      payment_account_id: sale.payment_account_id || '',
      warehouse: 'main',
      seller_name: sale.seller_name || '',
      notes: sale.notes || '',
      price_includes_tax: true,
      commission: String(sale.commission || ''),
      other_expenses: String(sale.other_expenses || ''),
      is_installment: false,
      down_payment: '',
      number_of_installments: '12',
      last_payment_date: '',
      first_installment_date: new Date().toISOString().split('T')[0],
    });

    // Store header totals from the database record (frozen financial snapshot)
    if (isInvoiceRecord) {
      setStoredHeaderTotals({
        subtotal: sale.subtotal || 0,
        vat_amount: sale.vat_amount || 0,
        total: sale.total || 0,
        vat_rate: sale.vat_rate || 0,
        discount_amount: sale.discount_amount || 0,
      });
    } else {
      // Car sales: use sale-level values if available
      setStoredHeaderTotals(sale.sale_price ? {
        subtotal: Number(sale.sale_price) || 0,
        vat_amount: Number(sale.vat_amount) || 0,
        total: Number(sale.total_with_vat || sale.sale_price) || 0,
        vat_rate: Number(sale.vat_rate) || 0,
        discount_amount: Number(sale.discount_amount) || 0,
      } : null);
    }

    // Load invoice items for non-car companies
    if (isInvoiceRecord && sale.invoice_items && sale.invoice_items.length > 0) {
      const loadedItems: SelectedInventoryItem[] = sale.invoice_items.map((item: any) => ({
        id: crypto.randomUUID(),
        item_id: item.inventory_item_id || '',
        item_name: item.item_description || '',
        barcode: item.item_code || '',
        unit_name: item.unit || 'وحدة',
        unit_id: null,
        sale_price: String(item.unit_price || 0),
        cost_price: 0,
        quantity: item.quantity || 1,
        available_quantity: 0,
      }));
      setSelectedInventoryItems(loadedItems);
      setSelectedCars([]);
      if (sale.discount_amount) {
        setDiscount(sale.discount_amount);
        setDiscountType('amount');
      }
      if (sale.amount_paid) {
        setPaidAmount(sale.amount_paid);
      }
    } else if (sale.sale_items && sale.sale_items.length > 0) {
      const loadedCars: SelectedCarItem[] = [];
      
      for (const item of sale.sale_items) {
        const car = allCars.find(c => c.id === item.car_id);
        if (car) {
          loadedCars.push({
            id: crypto.randomUUID(),
            car_id: car.id,
            sale_price: String(item.sale_price || 0),
            purchase_price: Number(car.purchase_price),
            car_name: car.name,
            model: car.model || '',
            color: car.color || '',
            chassis_number: car.chassis_number,
            plate_number: (car as any).plate_number || '',
            quantity: 1,
            car_condition: (car as any).car_condition === 'used' ? 'used' : 'new',
            pendingTransfer: null,
          });
        }
      }
      
      if (loadedCars.length > 0) {
        setSelectedCars(loadedCars);
      }
    } else {
      const car = allCars.find(c => c.id === sale.car_id);
      if (car) {
        setSelectedCars([{
          id: crypto.randomUUID(),
          car_id: car.id,
          sale_price: String(sale.sale_price),
          purchase_price: Number(car.purchase_price),
          car_name: car.name,
          model: car.model || '',
          color: car.color || '',
          chassis_number: car.chassis_number,
          plate_number: (car as any).plate_number || '',
          quantity: 1,
          car_condition: (car as any).car_condition === 'used' ? 'used' : 'new',
          pendingTransfer: null,
        }]);
      }
    }
  };

  const handleDeleteSale = async () => {
    if (!currentSaleId) return;
    const sale = existingSales.find(s => s.id === currentSaleId);
    if (!sale) return;
    
    try {
      await deleteSale.mutateAsync({ saleId: currentSaleId, carId: sale.car_id });
      toast.success(t.inv_toast_delete_success);
      setDeleteDialogOpen(false);
      handleNewInvoice();
    } catch (error) {
      toast.error(t.inv_toast_delete_error);
    }
  };

  const handleReverseSale = async () => {
    if (!currentSaleId) return;
    
    try {
      await reverseSale.mutateAsync(currentSaleId);
      toast.success(t.inv_toast_reverse_success);
      setReverseDialogOpen(false);
      handleNewInvoice();
    } catch (error) {
      toast.error(t.inv_toast_reverse_error);
    }
  };

  const handleUpdateSale = async () => {
    if (!currentSaleId || !invoiceData.customer_id) {
      toast.error(t.inv_toast_select_customer);
      return;
    }

    // Check if this is an invoice record (non-car company)
    const isInvoiceRecord = existingInvoices.some(inv => inv.id === currentSaleId);

    if (isInvoiceRecord) {
      // Update invoice in invoices table
      if (selectedInventoryItems.length === 0) {
        toast.error(t.inv_toast_add_item);
        return;
      }
      try {
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({
            customer_id: invoiceData.customer_id,
            customer_name: selectedCustomer?.name || '',
            invoice_date: `${invoiceData.sale_date}T${invoiceData.issue_time || '00:00'}:00`,
            subtotal: calculations.subtotal,
            taxable_amount: calculations.subtotalAfterDiscount,
            vat_rate: taxRate,
            vat_amount: calculations.totalVAT,
            total: calculations.finalTotal,
            discount_amount: calculations.discountAmount,
            amount_paid: paidAmount,
            payment_status: paidAmount >= calculations.finalTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
            notes: invoiceData.notes || null,
          })
          .eq('id', currentSaleId);
        if (invoiceError) throw invoiceError;

        // Delete old items and insert new ones
        await supabase.from('invoice_items').delete().eq('invoice_id', currentSaleId);
        const invoiceItems = selectedInventoryItems.map((item, index) => ({
          invoice_id: currentSaleId,
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

        // Refresh invoices list
        const { data: updatedInvoices } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('company_id', companyId)
          .eq('invoice_type', 'sales')
          .order('created_at', { ascending: true });
        setExistingInvoices(updatedInvoices || []);

        toast.success(t.inv_toast_update_success);
        setIsEditing(false);
      } catch (error) {
        console.error('Update invoice error:', error);
        toast.error(t.inv_toast_update_error);
      }
    } else {
      // Update sale (car dealership)
      if (selectedCars.length === 0) {
        toast.error(t.inv_toast_add_car);
        return;
      }

      const invalidCar = selectedCars.find(car => !car.sale_price || parseFloat(car.sale_price) <= 0);
      if (invalidCar) {
        toast.error(t.inv_toast_enter_price);
        return;
      }

      try {
        const items = selectedCars.map((car, index) => ({
          car_id: car.car_id,
          sale_price: calculations.items[index].total,
          purchase_price: car.purchase_price,
        }));

        await updateSaleWithItems.mutateAsync({
          saleId: currentSaleId,
          saleData: {
            sale_price: calculations.finalTotal,
            seller_name: invoiceData.seller_name || null,
            commission: parseFloat(invoiceData.commission) || 0,
            other_expenses: parseFloat(invoiceData.other_expenses) || 0,
            sale_date: invoiceData.sale_date,
            profit: calculations.profit,
            payment_account_id: invoiceData.payment_account_id || null,
          },
          items,
        });
        toast.success(t.inv_toast_update_success);
      } catch (error) {
        console.error('Update sale error:', error);
        toast.error(t.inv_toast_update_error);
      }
    }
  };

  const handleApproveSale = async () => {
    if (!currentSaleId) return;
    try {
      // Check if this is an invoice (non-car) or a sale (car)
      const isInvoiceRecord = existingInvoices.some(inv => inv.id === currentSaleId);
      if (isInvoiceRecord) {
        // Approve invoice and auto-create journal entry
        await approveInvoiceWithJournal(currentSaleId);
        // Refresh invoices list
        const { data: updatedInvoices } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('company_id', companyId)
          .eq('invoice_type', 'sales')
          .order('created_at', { ascending: true });
        setExistingInvoices(updatedInvoices || []);
      } else {
        await approveSale.mutateAsync(currentSaleId);
      }
      setCurrentSaleStatus('approved');
      setIsEditing(false);
      toast.success(t.inv_approved_success);
      setApproveDialogOpen(false);
    } catch (error) {
      console.error('Approve sale error:', error);
      toast.error(t.inv_approved_error);
    }
  };

  const handlePrintExisting = () => {
    if (!currentSaleId) return;
    const sale = salesWithItems.find(s => s.id === currentSaleId) 
      || existingSales.find(s => s.id === currentSaleId)
      || existingInvoices.find(s => s.id === currentSaleId);
    if (!sale) return;

    setSavedSaleData({
      ...sale,
      customer: selectedCustomer,
      cars: selectedCars,
      inventoryItems: selectedInventoryItems,
    });
    setInvoiceOpen(true);
  };

  const invoicePreviewData = useMemo(() => {
    if (!savedSaleData) return null;

    return {
      invoiceNumber: savedSaleData.sale_number || invoiceData.invoice_number || String(nextInvoiceNumber),
      invoiceDate: `${invoiceData.sale_date}T${invoiceData.issue_time || '00:00'}:00`,
      invoiceType: 'sale' as const,
      sellerName: taxSettings?.company_name_ar || company?.name || '',
      sellerTaxNumber: taxSettings?.tax_number || '',
      sellerAddress: taxSettings?.national_address || company?.address || '',
      buyerName: selectedCustomer?.name || '',
      buyerPhone: selectedCustomer?.phone || '',
      buyerAddress: selectedCustomer?.address || '',
      buyerTaxNumber: selectedCustomer?.registration_number || '',
      items: isCarDealership
        ? calculations.items.map(car => ({
            description: `${car.car_name} ${car.model || ''} - ${car.chassis_number}${car.plate_number ? ` - لوحة: ${car.plate_number}` : ''}`,
            quantity: car.quantity,
            unitPrice: car.baseAmount / car.quantity,
            taxRate: taxRate,
            taxAmount: car.vatAmount,
            total: car.total,
          }))
        : (calculations.inventoryItems.length > 0
          ? calculations.inventoryItems.map(item => ({
              description: item.item_name || '',
              quantity: item.quantity,
              unitPrice: item.baseAmount / item.quantity,
              taxRate: taxRate,
              taxAmount: item.vatAmount,
              total: item.total,
            }))
          : (savedSaleData?.invoice_items || []).map((item: any) => ({
              description: item.item_description || '',
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unit_price) || 0,
              taxRate: Number(item.vat_rate) || taxRate,
              taxAmount: Number(item.vat_amount) || 0,
              total: Number(item.total) || 0,
            }))),
      subtotal: displayTotals.subtotal || Number(savedSaleData?.subtotal) || 0,
      taxAmount: displayTotals.totalVAT || Number(savedSaleData?.vat_amount) || 0,
      total: displayTotals.finalTotal || Number(savedSaleData?.total) || 0,
      taxSettings: taxSettings,
      companyLogoUrl: (company as any)?.invoice_logo_url || company?.logo_url,
      salesmanName: invoiceData.seller_name || savedSaleData?.seller_name || '',
      branchName: '',
      paymentMethod: (() => {
        const acc = accounts.find(a => a.id === invoiceData.payment_account_id);
        if (!acc) return 'cash';
        if (acc.code === '1201') return 'credit';
        if (acc.code.startsWith('1102') || acc.code === '1103') return 'bank';
        return 'cash';
      })(),
    };
  }, [savedSaleData, invoiceData, selectedCustomer, calculations, taxSettings, company, taxRate, nextInvoiceNumber, accounts]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4">
        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">
          
          {/* ===== Modern Header with Gradient ===== */}
          <div className="bg-gradient-to-l from-emerald-600 via-emerald-500 to-teal-500 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Navigation Controls */}
              <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-lg p-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={handleLastSale} disabled={fiscalYearFilteredSales.length === 0}>
                  <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -mr-2.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={handleNextSale} disabled={currentInvoiceIndex >= fiscalYearFilteredSales.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 text-xs bg-white/20 rounded-md min-w-[70px] text-center font-mono font-bold">
                  {fiscalYearFilteredSales.length > 0 ? currentInvoiceIndex + 1 : 0} / {fiscalYearFilteredSales.length}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={handlePreviousSale} disabled={currentInvoiceIndex <= 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={handleFirstSale} disabled={fiscalYearFilteredSales.length === 0}>
                  <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2.5" />
                </Button>
              </div>

              {/* Title & Status */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 opacity-80" />
                  <h1 className="text-lg font-bold tracking-wide">{t.inv_sales_invoice}</h1>
                </div>
                {isViewingExisting && (
                  <span className={`text-[11px] px-3 py-1 rounded-full font-bold shadow-sm ${
                    currentSaleStatus === 'approved' 
                      ? 'bg-white text-emerald-700' 
                      : 'bg-yellow-400 text-yellow-900 animate-pulse'
                  }`}>
                    {currentSaleStatus === 'approved' ? '✓ ' + t.inv_status_approved : '⏳ ' + t.inv_status_draft}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ===== Draft Status Banner ===== */}
          {isViewingExisting && currentSaleStatus === 'draft' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-b-2 border-amber-300 dark:border-amber-700 px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                  <span className="text-lg">📋</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-200 block">
                    هذه الفاتورة محفوظة كمسودة
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    يمكنك تعديلها أو اعتمادها محاسبياً
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 text-xs h-8 rounded-lg bg-white dark:bg-card border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50 shadow-sm"
                  onClick={() => { setIsEditing(true); toast.info('تم تفعيل وضع التعديل'); }}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  تعديل
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 text-xs h-8 rounded-lg bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 shadow-sm"
                  onClick={() => setApproveDialogOpen(true)}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  اعتماد محاسبة
                </Button>
              </div>
            </div>
          )}

          {/* ===== Search Bar ===== */}
          <div className="p-3 border-b bg-muted/30" ref={searchBarRef}>
            <InvoiceSearchBar
              mode="sales"
              sales={fiscalYearFilteredSales}
              customers={customers}
              onSelectResult={(result) => {
                if (result.type === 'invoice' || result.type === 'car') {
                  const sale = result.data;
                  const saleIndex = fiscalYearFilteredSales.findIndex(s => s.id === sale.id);
                  if (saleIndex >= 0) {
                    setCurrentInvoiceIndex(saleIndex);
                    loadSaleData(fiscalYearFilteredSales[saleIndex]);
                  }
                } else if (result.type === 'customer') {
                  const customerSales = result.data.sales;
                  if (customerSales && customerSales.length > 0) {
                    const saleIndex = fiscalYearFilteredSales.findIndex(s => s.id === customerSales[0].id);
                    if (saleIndex >= 0) {
                      setCurrentInvoiceIndex(saleIndex);
                      loadSaleData(fiscalYearFilteredSales[saleIndex]);
                    }
                  } else {
                    setInvoiceData(prev => ({ ...prev, customer_id: result.id }));
                  }
                }
              }}
            />
          </div>

          {/* ===== Invoice Header Form - Modern Sections ===== */}
          <div className="p-4 border-b space-y-4 bg-card">
            {/* Section: Basic Info */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
              <span className="text-xs font-bold text-foreground tracking-wide">بيانات الفاتورة</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_customer} *</Label>
                <Select value={invoiceData.customer_id} onValueChange={(v) => setInvoiceData({ ...invoiceData, customer_id: v })}>
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none transition-colors">
                    <SelectValue placeholder={t.inv_select_customer} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_invoice_number}</Label>
                <Input
                  value={invoiceData.invoice_number || nextInvoiceNumber}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
                  className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none font-mono"
                  placeholder={String(nextInvoiceNumber)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_date}</Label>
                <Input
                  type="date"
                  value={invoiceData.sale_date}
                  onChange={(e) => setInvoiceData({ ...invoiceData, sale_date: e.target.value })}
                  className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none"
                  dir="ltr"
                  disabled={isApproved}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_warehouse}</Label>
                <Select value={invoiceData.warehouse} onValueChange={(v) => setInvoiceData({ ...invoiceData, warehouse: v })}>
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none transition-colors">
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
                  type="receipt"
                  className="h-9 border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none text-xs"
                  hideLabel
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_payment_method}</Label>
                <Select defaultValue="cash">
                  <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t.inv_deferred}</SelectItem>
                    <SelectItem value="bank">{t.inv_bank_transfer}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section: Additional Details */}
            <div className="flex items-center gap-2 mt-4 mb-1">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-bold text-foreground tracking-wide">تفاصيل إضافية</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_salesperson}</Label>
                <Input
                  value={invoiceData.seller_name}
                  onChange={(e) => setInvoiceData({ ...invoiceData, seller_name: e.target.value })}
                  className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none"
                  placeholder={t.inv_salesperson_name}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_commission}</Label>
                <Input
                  type="number"
                  value={invoiceData.commission}
                  onChange={(e) => setInvoiceData({ ...invoiceData, commission: e.target.value })}
                  className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none"
                  placeholder="0"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_cost_center}</Label>
                <Input
                  type="number"
                  value={invoiceData.other_expenses}
                  onChange={(e) => setInvoiceData({ ...invoiceData, other_expenses: e.target.value })}
                  className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none"
                  placeholder="0"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">توقيت الإصدار</Label>
                <Input
                  type="time"
                  value={invoiceData.issue_time}
                  onChange={(e) => setInvoiceData({ ...invoiceData, issue_time: e.target.value })}
                  className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none font-mono"
                  disabled={isApproved}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_notes}</Label>
                <Input
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                  placeholder="أضف ملاحظات..."
                  className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-blue-500 shadow-none"
                />
              </div>
            </div>

            {/* Tax & Options Row */}
            <div className="flex items-center gap-6 pt-3 border-t border-border/40">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="price_includes_tax"
                  checked={invoiceData.price_includes_tax}
                  onCheckedChange={(checked) => setInvoiceData({ ...invoiceData, price_includes_tax: !!checked })}
                  disabled={isApproved}
                  className="h-4 w-4"
                />
                <Label htmlFor="price_includes_tax" className="text-xs cursor-pointer text-muted-foreground">
                  {t.inv_price_includes_tax}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="is_installment"
                  checked={invoiceData.is_installment}
                  onCheckedChange={(checked) => setInvoiceData({ ...invoiceData, is_installment: !!checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_installment" className="text-xs cursor-pointer font-semibold text-primary">
                  {t.inv_installment_sale}
                </Label>
              </div>
              {selectedCustomer && (
                <div className="flex items-center gap-2 mr-auto bg-muted/50 rounded-lg px-3 py-1.5">
                  <Label className="text-[10px] text-muted-foreground">{t.inv_balance}</Label>
                  <span className="text-xs font-bold text-success">{formatCurrency(0)} {currency}</span>
                </div>
              )}
            </div>

            {invoiceData.is_installment && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20 mt-2">
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_car_price}</Label>
                  <span className="text-xs font-medium">{formatCurrency(calculations.finalTotal)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_down_payment}</Label>
                  <Input type="number" value={invoiceData.down_payment} onChange={(e) => setInvoiceData({ ...invoiceData, down_payment: e.target.value })} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent w-20" placeholder="0" dir="ltr" />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_installments_count}</Label>
                  <Select value={invoiceData.number_of_installments} onValueChange={(v) => setInvoiceData({ ...invoiceData, number_of_installments: v })}>
                    <SelectTrigger className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent w-16 shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 6, 9, 12, 18, 24, 36, 48, 60].map(num => (
                        <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_first_installment_date}</Label>
                  <Input type="date" value={invoiceData.first_installment_date} onChange={(e) => setInvoiceData({ ...invoiceData, first_installment_date: e.target.value })} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_last_installment_date}</Label>
                  <Input type="date" value={invoiceData.last_payment_date || (() => { const months = parseInt(invoiceData.number_of_installments) || 12; const firstDate = invoiceData.first_installment_date ? new Date(invoiceData.first_installment_date) : new Date(); const lastDate = new Date(firstDate); lastDate.setMonth(lastDate.getMonth() + months - 1); return lastDate.toISOString().split('T')[0]; })()} onChange={(e) => setInvoiceData({ ...invoiceData, last_payment_date: e.target.value })} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_remaining}</Label>
                  <span className="text-xs font-medium text-destructive">{formatCurrency(calculations.finalTotal - (parseFloat(invoiceData.down_payment) || 0))}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] whitespace-nowrap text-muted-foreground">{t.inv_installment_value}</Label>
                  <span className="text-xs font-medium text-primary">{formatCurrency((calculations.finalTotal - (parseFloat(invoiceData.down_payment) || 0)) / (parseInt(invoiceData.number_of_installments) || 12))}</span>
                </div>
              </div>
            )}
          </div>

          {/* ===== Items Table - Modern Design ===== */}
          <div className="overflow-x-auto">
            {isCarDealership ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b-2 border-emerald-200 dark:border-emerald-800">
                      <TableHead className="text-right text-[11px] font-bold w-8 text-emerald-700 dark:text-emerald-400">#</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[180px] text-emerald-700 dark:text-emerald-400">{t.inv_description}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-emerald-700 dark:text-emerald-400">الحالة</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-emerald-700 dark:text-emerald-400">{t.inv_quantity}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-emerald-700 dark:text-emerald-400">{t.inv_price}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-emerald-700 dark:text-emerald-400">{t.inv_subtotal}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-28 text-emerald-700 dark:text-emerald-400">شامل الضريبة</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {selectedCars.map((car, index) => {
                      const calcItem = calculations.items[index];
                      return (
                        <TableRow key={car.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border-b transition-colors">
                          <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="text-xs py-2 font-medium">{car.car_name} {car.model} {car.color ? `- ${car.color}` : ''} {car.plate_number ? `- لوحة: ${car.plate_number}` : ''}</TableCell>
                          <TableCell className="py-2">
                            <Select value={car.car_condition} onValueChange={(v) => handleCarChange(car.id, 'car_condition', v)} disabled={isApproved}>
                              <SelectTrigger className="h-7 text-[10px] border-0 border-b border-border rounded-none bg-transparent shadow-none w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">جديدة</SelectItem>
                                <SelectItem value="used">مستعملة</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center text-xs py-2">1</TableCell>
                          <TableCell className="py-2">
                            <Input type="number" value={car.sale_price} onChange={(e) => handleCarChange(car.id, 'sale_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" disabled={isApproved} />
                          </TableCell>
                          <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.baseAmount || 0)}</TableCell>
                          <TableCell className="text-center text-xs py-2 font-semibold">
                            {formatCurrency(calcItem?.total || 0)}
                            {car.car_condition === 'used' && <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-normal">ضريبة هامش</span>}
                          </TableCell>
                          <TableCell className="py-2">
                            {selectedCars.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCar(car.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full">
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {Array.from({ length: Math.max(0, 3 - selectedCars.length) }).map((_, i) => (
                      <TableRow key={`empty-${i}`} className="border-b border-dashed">
                        <TableCell className="text-center text-xs py-2 text-muted-foreground/40 font-mono">{selectedCars.length + i + 1}</TableCell>
                        <TableCell className="py-2" colSpan={7}></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-3 border-t flex gap-2 flex-wrap bg-muted/20">
                  <Select onValueChange={handleAddCar}>
                    <SelectTrigger className="w-[300px] h-9 text-xs rounded-lg">
                      <SelectValue placeholder={t.inv_select_car_placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {remainingCars.map((car) => (
                        <SelectItem key={car.id} value={car.id}>
                          <div className="flex items-center gap-2">
                            <Car className="w-3 h-3" />
                            <span>{car.name} {car.model}</span>
                            <span className="text-muted-foreground text-xs" dir="ltr">{car.chassis_number}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {savedTemplates.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 h-9 text-xs rounded-lg">
                          <FileSpreadsheet className="w-3 h-3" />
                          {t.inv_import_template}
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {savedTemplates.map((template) => (
                          <DropdownMenuItem
                            key={template.id}
                            onClick={() => {
                              let matchedCount = 0;
                              template.data.forEach((item) => {
                                const matchingCar = remainingCars.find(car => car.name.includes(item.description) || car.chassis_number === item.description);
                                if (matchingCar) { handleAddCar(matchingCar.id); matchedCount++; }
                              });
                              if (matchedCount > 0) { toast.success(t.inv_imported_cars.replace('{count}', String(matchedCount))); }
                              else { toast.warning(t.inv_no_matching_cars); }
                            }}
                          >
                            {template.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Inventory Items Table */}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b-2 border-emerald-200 dark:border-emerald-800">
                      <TableHead className="text-right text-[11px] font-bold w-8 text-emerald-700 dark:text-emerald-400">#</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[180px] text-emerald-700 dark:text-emerald-400">{t.inv_item}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-emerald-700 dark:text-emerald-400">{t.inv_quantity}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-emerald-700 dark:text-emerald-400">{t.inv_available}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-emerald-700 dark:text-emerald-400">{t.inv_price}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-emerald-700 dark:text-emerald-400">{t.inv_subtotal}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-28 text-emerald-700 dark:text-emerald-400">شامل الضريبة</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {selectedInventoryItems.map((item, index) => {
                      const calcItem = calculations.inventoryItems[index];
                      return (
                        <TableRow key={item.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border-b transition-colors">
                          <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="py-2">
                            <Input 
                              value={item.item_name} 
                              onChange={(e) => handleInventoryItemChange(item.id, 'item_name', e.target.value)} 
                              placeholder={t.inv_item_name_placeholder || 'اسم الصنف / الخدمة'} 
                              className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" 
                              disabled={isApproved}
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input type="number" min={1} max={item.available_quantity || undefined} value={item.quantity} onChange={(e) => handleInventoryItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} className="h-7 text-xs text-center w-16 border-0 border-b border-border rounded-none bg-transparent" disabled={isApproved} />
                          </TableCell>
                          <TableCell className="text-center text-xs py-2 text-muted-foreground">{item.available_quantity}</TableCell>
                          <TableCell className="py-2">
                            <Input type="number" value={item.sale_price} onChange={(e) => handleInventoryItemChange(item.id, 'sale_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" disabled={isApproved} />
                          </TableCell>
                          <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.baseAmount || 0)}</TableCell>
                          <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.total || 0)}</TableCell>
                          <TableCell className="py-2">
                            {selectedInventoryItems.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInventoryItem(item.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full">
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {Array.from({ length: Math.max(0, 3 - selectedInventoryItems.length) }).map((_, i) => (
                      <TableRow key={`empty-${i}`} className="border-b border-dashed">
                        <TableCell className="text-center text-xs py-2 text-muted-foreground/40 font-mono">{selectedInventoryItems.length + i + 1}</TableCell>
                        <TableCell className="py-2" colSpan={7}></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-3 border-t flex gap-2 flex-wrap bg-muted/20">
                  <Button type="button" variant="outline" size="sm" className="gap-2 h-9 text-xs rounded-lg" onClick={handleAddManualItem} disabled={isApproved}>
                    <Plus className="w-3 h-3" />
                    {t.inv_add_item || 'إضافة صنف'}
                  </Button>
                  {availableInventoryItems.length > 0 && (
                    <Select onValueChange={handleAddInventoryItem}>
                      <SelectTrigger className="w-[250px] h-9 text-xs rounded-lg">
                        <SelectValue placeholder={t.inv_select_item_placeholder || 'اختر من المخزون...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableInventoryItems.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3" />
                              <span>{item.name}</span>
                              {item.barcode && <span className="text-muted-foreground text-xs" dir="ltr">{item.barcode}</span>}
                              <span className="text-muted-foreground text-xs">({item.current_quantity || 0})</span>
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
                  isViewingExisting && currentSaleStatus === 'approved' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : isViewingExisting 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {isViewingExisting ? (currentSaleStatus === 'approved' ? (t.inv_status_approved || 'معتمدة') : (t.inv_status_draft || 'مسودة')) : (t.inv_new || 'جديدة')}
                </div>
              </div>
              <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
                <Label className="text-[9px] text-muted-foreground block mb-1">توقيت الإصدار</Label>
                <div className="text-[11px] font-mono font-semibold">{invoiceData.sale_date} {invoiceData.issue_time}</div>
              </div>
              <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
                <Label className="text-[9px] text-muted-foreground block mb-1">{t.inv_voucher_number || 'رقم السند'}</Label>
                <div className="text-[11px] font-bold">{isViewingExisting ? (invoiceData.invoice_number || currentInvoiceIndex + 1) : '-'}</div>
              </div>
              <div className="bg-card rounded-lg border p-2.5 text-center shadow-sm">
                <Label className="text-[9px] text-muted-foreground block mb-1">{t.inv_salesperson || 'البائع'}</Label>
                <div className="text-[11px] font-semibold truncate">{invoiceData.seller_name || '-'}</div>
              </div>
            </div>
          </div>

          {/* ===== Totals Section - Modern Cards ===== */}
          <div className="p-4 border-t bg-card">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* الإجمالي الصافي */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-center text-white shadow-lg">
                <div className="text-3xl font-black">{formatCurrency(displayTotals.finalTotal)}</div>
                <div className="text-[11px] font-medium mt-1 opacity-90">{t.inv_net}</div>
              </div>
              {/* المجموع */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(displayTotals.subtotal)}</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-500 font-semibold mt-1">{t.inv_total}</div>
              </div>
              {/* الخصم */}
              <div className="bg-muted/60 border-2 border-border rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="h-8 text-lg font-black text-center w-20 border-0 border-b-2 border-border rounded-none bg-transparent"
                    dir="ltr"
                  />
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
              {/* الربح */}
              <div className={`border-2 rounded-xl p-4 text-center ${calculations.profit >= 0 ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800'}`}>
                <div className={`text-2xl font-black ${calculations.profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{formatCurrency(calculations.profit)}</div>
                <div className={`text-[10px] font-semibold mt-1 ${calculations.profit >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>{t.inv_profit}</div>
              </div>
            </div>

            {/* Paid Amount + Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-border/40">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_paid_amount}</Label>
                <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none" placeholder="0" dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.inv_terms}</Label>
                <Input placeholder={t.inv_terms_placeholder} className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-emerald-500 shadow-none" />
              </div>
            </div>
          </div>

          {/* ===== Modern Action Bar ===== */}
          <div className="border-t-2 border-emerald-100 dark:border-emerald-900 bg-gradient-to-b from-card to-muted/30">
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
                  <DropdownMenuItem onClick={() => setActivePage('sales-report')}>
                    <FileText className="w-3.5 h-3.5 ml-2" /> تقرير المبيعات
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActivePage('profit-report')}>
                    <FileText className="w-3.5 h-3.5 ml-2" /> تقرير الأرباح
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
                    <FileSpreadsheet className="w-3.5 h-3.5 ml-2" /> {t.inv_import_data}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!isViewingExisting || isApproved} onClick={() => setReverseDialogOpen(true)} className="text-amber-600">
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
                  <DropdownMenuItem onClick={() => setActivePage('journal-entries')} disabled={!isViewingExisting || !isApproved}>
                    <FileText className="w-3.5 h-3.5 ml-2" /> عرض القيد المحاسبي
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Primary Action Buttons */}
            <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
              {isViewingExisting ? (
                <>
                  {!isApproved && isEditing && (
                    <Button onClick={handleUpdateSale} size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" disabled={updateSale.isPending}>
                      <Save className="w-3.5 h-3.5" />
                      {updateSale.isPending ? t.inv_saving : t.inv_save_changes}
                    </Button>
                  )}
                  {isApproved && (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 h-9">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">{t.inv_status_approved}</span>
                    </div>
                  )}
                </>
              ) : (
                <Button onClick={handleSubmit} size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" disabled={addMultiCarSale.isPending}>
                  <Plus className="w-3.5 h-3.5" />
                  {addMultiCarSale.isPending ? t.inv_saving : 'إضافة'}
                </Button>
              )}

              <Button variant="outline" onClick={handleNewInvoice} size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm">
                <FileText className="w-3.5 h-3.5 text-emerald-600" /> جديد
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className={`gap-1.5 text-xs h-9 rounded-lg shadow-sm ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400' : ''}`}
                disabled={!isViewingExisting || isApproved}
                onClick={() => { setIsEditing(!isEditing); if (!isEditing) toast.info('تم تفعيل وضع التعديل'); }}
              >
                <FileEdit className="w-3.5 h-3.5" />
                {isEditing ? 'إلغاء التعديل' : 'تعديل'}
              </Button>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" disabled={!isViewingExisting || isApproved} onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" /> حذف
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-xs h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 shadow-sm" 
                disabled={!isViewingExisting || isApproved}
                onClick={() => setApproveDialogOpen(true)}
              >
                <CheckCircle className="w-3.5 h-3.5" /> محاسبة
              </Button>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" onClick={() => { searchBarRef.current?.scrollIntoView({ behavior: 'smooth' }); const input = searchBarRef.current?.querySelector('input'); if (input) setTimeout(() => input.focus(), 300); }}>
                <Search className="w-3.5 h-3.5 text-muted-foreground" /> بحث
              </Button>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-sm" disabled={!isViewingExisting} onClick={handlePrintExisting}>
                <Printer className="w-3.5 h-3.5 text-emerald-600" /> طباعة
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm">
                    مزيد.. <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setActivePage('medad-import')}>
                    <FileSpreadsheet className="w-3.5 h-3.5 ml-2" /> {t.inv_import_data}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!isViewingExisting || isApproved} onClick={() => setReverseDialogOpen(true)} className="text-amber-600">
                    <RotateCcw className="w-3.5 h-3.5 ml-2" /> {t.inv_return}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActivePage('installments')}>
                    <FileText className="w-3.5 h-3.5 ml-2" /> الأقساط
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={() => setActivePage('sales')} size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 shadow-sm">
                <X className="w-3.5 h-3.5" /> إغلاق
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      {invoicePreviewData && (
        <InvoicePreviewDialog
          open={invoiceOpen}
          onOpenChange={handleCloseInvoice}
          data={invoicePreviewData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.inv_delete_sale_confirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.inv_delete_sale_desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSale}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSale.isPending ? t.inv_deleting : t.delete}
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
              {t.inv_return_invoice}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t.inv_return_sale_confirm}</p>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>{t.inv_return_cars_to_inventory}</li>
                <li>{t.inv_delete_journal_entry}</li>
                <li>{t.inv_update_stats}</li>
              </ul>
              <p className="text-destructive font-medium">{t.inv_cannot_undo}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReverseSale}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {reverseSale.isPending ? t.inv_returning : t.inv_return_invoice_btn}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              {t.inv_approve_confirm}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.inv_approve_confirm_desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveSale}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {approveSale.isPending ? t.inv_approving : t.inv_approve_invoice}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}