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
import { useLanguage } from '@/contexts/LanguageContext';
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
  quantity: number;
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
      quantity: 1,
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

    const calcItem = (price: number, quantity: number) => {
      let baseAmount: number, vatAmount: number, total: number;
      if (invoiceData.price_includes_tax && taxRate > 0) {
        total = price * quantity;
        baseAmount = total / (1 + taxRate / 100);
        vatAmount = total - baseAmount;
      } else {
        baseAmount = price * quantity;
        vatAmount = baseAmount * (taxRate / 100);
        total = baseAmount + vatAmount;
      }
      subtotal += baseAmount;
      totalVAT += vatAmount;
      return { baseAmount, vatAmount, total };
    };

    // Car items
    const itemsWithCalc = selectedCars.map(car => {
      const price = parseFloat(car.sale_price) || 0;
      const result = calcItem(price, car.quantity || 1);
      return { ...car, ...result };
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
    const profit = finalTotal - totalPurchasePrice - commission - otherExpenses;
    const totalQuantity = isCarDealership ? selectedCars.length : selectedInventoryItems.reduce((sum, i) => sum + i.quantity, 0);

    return {
      items: itemsWithCalc,
      inventoryItems: inventoryItemsWithCalc,
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      totalVAT,
      finalTotal,
      roundedTotal: Math.round(finalTotal),
      totalPurchasePrice,
      profit,
      quantity: totalQuantity,
    };
  }, [selectedCars, selectedInventoryItems, invoiceData.price_includes_tax, invoiceData.commission, invoiceData.other_expenses, taxRate, discount, discountType, isCarDealership]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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
            quantity: 1,
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
          quantity: 1,
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
        // Approve invoice in invoices table
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('invoices')
          .update({ 
            status: 'issued',
          })
          .eq('id', currentSaleId);
        if (error) throw error;
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
            description: `${car.car_name} ${car.model || ''} - ${car.chassis_number}`,
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
      subtotal: calculations.subtotal || Number(savedSaleData?.subtotal) || 0,
      taxAmount: calculations.totalVAT || Number(savedSaleData?.vat_amount) || 0,
      total: calculations.finalTotal || Number(savedSaleData?.total) || 0,
      taxSettings: taxSettings,
      companyLogoUrl: (company as any)?.invoice_logo_url || company?.logo_url,
      salesmanName: invoiceData.seller_name || savedSaleData?.seller_name || '',
      branchName: '',
    };
  }, [savedSaleData, invoiceData, selectedCustomer, calculations, taxSettings, company, taxRate, nextInvoiceNumber]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4">
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          
          {/* ===== Top Toolbar (dark header with nav + record count) ===== */}
          <div className="bg-secondary text-secondary-foreground px-3 py-2 flex items-center justify-between gap-2 border-b">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-secondary-foreground hover:bg-secondary-foreground/10" onClick={handleLastSale} disabled={fiscalYearFilteredSales.length === 0}>
                <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -mr-2" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-secondary-foreground hover:bg-secondary-foreground/10" onClick={handleNextSale} disabled={currentInvoiceIndex >= fiscalYearFilteredSales.length - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-xs bg-secondary-foreground/10 rounded min-w-[60px] text-center font-mono">
                {fiscalYearFilteredSales.length > 0 ? currentInvoiceIndex + 1 : 0} / {fiscalYearFilteredSales.length}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-secondary-foreground hover:bg-secondary-foreground/10" onClick={handlePreviousSale} disabled={currentInvoiceIndex <= 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-secondary-foreground hover:bg-secondary-foreground/10" onClick={handleFirstSale} disabled={fiscalYearFilteredSales.length === 0}>
                <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold">{t.inv_sales_invoice}</h1>
              <FileText className="w-4 h-4" />
              {isViewingExisting && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse ${currentSaleStatus === 'approved' ? 'bg-success/20 text-success' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'}`}>
                  {currentSaleStatus === 'approved' ? t.inv_status_approved : '⏳ ' + t.inv_status_draft}
                </span>
              )}
            </div>
          </div>

          {/* ===== Draft Status Banner ===== */}
          {isViewingExisting && currentSaleStatus === 'draft' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600 dark:text-yellow-400 text-lg">📋</span>
                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
                  هذه الفاتورة محفوظة كمسودة - يمكنك تعديلها أو اعتمادها محاسبياً
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 text-[10px] h-6 rounded bg-white dark:bg-card border-yellow-300 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50"
                  onClick={() => {
                    setIsEditing(true);
                    toast.info('تم تفعيل وضع التعديل');
                  }}
                >
                  <FileEdit className="w-3 h-3" />
                  تعديل
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 text-[10px] h-6 rounded bg-success/10 border-success/30 text-success hover:bg-success/20"
                  onClick={() => setApproveDialogOpen(true)}
                >
                  <CheckCircle className="w-3 h-3" />
                  اعتماد محاسبة
                </Button>
              </div>
            </div>
          )}

          {/* ===== Search Bar ===== */}
          <div className="p-2 border-b bg-muted/20" ref={searchBarRef}>
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

          {/* ===== Invoice Header Form (ERP Grid Style) ===== */}
          <div className="p-3 border-b space-y-3 bg-card">
            {/* Row 1: Currency, Warehouse, Customer Account, Invoice Number */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap min-w-[60px] text-muted-foreground">{t.inv_customer} *</Label>
                <Select value={invoiceData.customer_id} onValueChange={(v) => setInvoiceData({ ...invoiceData, customer_id: v })}>
                  <SelectTrigger className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none">
                    <SelectValue placeholder={t.inv_select_customer} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap min-w-[50px] text-muted-foreground">{t.inv_warehouse}</Label>
                <Select value={invoiceData.warehouse} onValueChange={(v) => setInvoiceData({ ...invoiceData, warehouse: v })}>
                  <SelectTrigger className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">{t.inv_main_warehouse}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap min-w-[60px] text-muted-foreground">{t.inv_cash_account}</Label>
                <PaymentAccountSelector
                  value={invoiceData.payment_account_id}
                  onChange={(v) => setInvoiceData({ ...invoiceData, payment_account_id: v })}
                  type="receipt"
                  className="h-8 border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none text-xs"
                  hideLabel
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap min-w-[60px] text-muted-foreground">{t.inv_invoice_number}</Label>
                <Input
                  value={invoiceData.invoice_number || nextInvoiceNumber}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
                  className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none"
                  placeholder={String(nextInvoiceNumber)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap min-w-[50px] text-muted-foreground">{t.inv_payment_method}</Label>
                <Select defaultValue="cash">
                  <SelectTrigger className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t.inv_deferred}</SelectItem>
                    <SelectItem value="bank">{t.inv_bank_transfer}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedCustomer && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap text-muted-foreground">{t.inv_balance}</Label>
                  <span className="text-xs font-medium text-success">{formatCurrency(0)} {currency}</span>
                </div>
              )}
            </div>

            {/* Row 2: Date, Salesman, Tax, Cost Center */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap min-w-[50px] text-muted-foreground">{t.inv_date}</Label>
                <Input
                  type="date"
                  value={invoiceData.sale_date}
                  onChange={(e) => setInvoiceData({ ...invoiceData, sale_date: e.target.value })}
                  className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none"
                  dir="ltr"
                  disabled={isApproved}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap min-w-[50px] text-muted-foreground">{t.inv_salesperson}</Label>
                <Input
                  value={invoiceData.seller_name}
                  onChange={(e) => setInvoiceData({ ...invoiceData, seller_name: e.target.value })}
                  className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none"
                  placeholder={t.inv_salesperson_name}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap min-w-[60px] text-muted-foreground">{t.inv_cost_center}</Label>
                <Input
                  type="number"
                  value={invoiceData.other_expenses}
                  onChange={(e) => setInvoiceData({ ...invoiceData, other_expenses: e.target.value })}
                  className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none"
                  placeholder="0"
                  dir="ltr"
                />
              </div>
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
                <Label className="text-xs whitespace-nowrap min-w-[50px] text-muted-foreground">{t.inv_commission}</Label>
                <Input
                  type="number"
                  value={invoiceData.commission}
                  onChange={(e) => setInvoiceData({ ...invoiceData, commission: e.target.value })}
                  className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none"
                  placeholder="0"
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap text-muted-foreground">{t.inv_notes}</Label>
                <Input
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                  placeholder=""
                  className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none"
                />
              </div>
            </div>

            {/* Row 3: Installment checkbox */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              <Checkbox 
                id="is_installment"
                checked={invoiceData.is_installment}
                onCheckedChange={(checked) => setInvoiceData({ ...invoiceData, is_installment: !!checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_installment" className="text-xs cursor-pointer font-medium text-primary">
                {t.inv_installment_sale}
              </Label>
            </div>

            {invoiceData.is_installment && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-2 bg-primary/5 rounded border border-primary/20">
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

          {/* ===== Items Table (ERP Grid with colored header) ===== */}
          <div className="overflow-x-auto">
            {isCarDealership ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10 border-b-2 border-primary/30">
                      <TableHead className="text-right text-[11px] font-bold w-8 text-primary">#</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[180px] text-primary">{t.inv_description}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-primary">{t.inv_quantity}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-primary">{t.inv_price}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-primary">{t.inv_subtotal}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-28 text-primary">{t.inv_price_includes_tax}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {selectedCars.map((car, index) => {
                      const calcItem = calculations.items[index];
                      return (
                        <TableRow key={car.id} className="hover:bg-primary/5 border-b bg-[hsl(var(--primary)/0.03)]">
                          <TableCell className="text-center text-xs py-1">{index + 1}</TableCell>
                          <TableCell className="text-xs py-1 font-medium">{car.car_name} {car.model} {car.color ? `- ${car.color}` : ''}</TableCell>
                          <TableCell className="text-center text-xs py-1">1</TableCell>
                          <TableCell className="py-1">
                            <Input type="number" value={car.sale_price} onChange={(e) => handleCarChange(car.id, 'sale_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" disabled={isApproved} />
                          </TableCell>
                          <TableCell className="text-center text-xs py-1 font-medium">{formatCurrency(calcItem?.baseAmount || 0)}</TableCell>
                          <TableCell className="text-center text-xs py-1 font-medium">{formatCurrency(calcItem?.total || 0)}</TableCell>
                          <TableCell className="py-1">
                            {selectedCars.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCar(car.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Empty rows for ERP look */}
                    {Array.from({ length: Math.max(0, 4 - selectedCars.length) }).map((_, i) => (
                      <TableRow key={`empty-${i}`} className="border-b">
                        <TableCell className="text-center text-xs py-1 text-muted-foreground">{selectedCars.length + i + 1}</TableCell>
                        <TableCell className="py-1" colSpan={6}></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-2 border-t flex gap-2 flex-wrap bg-muted/20">
                  <Select onValueChange={handleAddCar}>
                    <SelectTrigger className="w-[300px] h-8 text-xs">
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
                        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
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
                    <TableRow className="bg-primary/10 border-b-2 border-primary/30">
                      <TableHead className="text-right text-[11px] font-bold w-8 text-primary">#</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[180px] text-primary">{t.inv_item}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-primary">{t.inv_quantity}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-primary">{t.inv_available}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-primary">{t.inv_price}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-primary">{t.inv_subtotal}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-28 text-primary">{t.inv_price_includes_tax}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {selectedInventoryItems.map((item, index) => {
                      const calcItem = calculations.inventoryItems[index];
                      return (
                        <TableRow key={item.id} className="hover:bg-primary/5 border-b bg-[hsl(var(--primary)/0.03)]">
                          <TableCell className="text-center text-xs py-1">{index + 1}</TableCell>
                          <TableCell className="py-1">
                            <Input 
                              value={item.item_name} 
                              onChange={(e) => handleInventoryItemChange(item.id, 'item_name', e.target.value)} 
                              placeholder={t.inv_item_name_placeholder || 'اسم الصنف / الخدمة'} 
                              className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" 
                              disabled={isApproved}
                            />
                          </TableCell>
                          <TableCell className="py-1">
                            <Input type="number" min={1} max={item.available_quantity || undefined} value={item.quantity} onChange={(e) => handleInventoryItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} className="h-7 text-xs text-center w-16 border-0 border-b border-border rounded-none bg-transparent" disabled={isApproved} />
                          </TableCell>
                          <TableCell className="text-center text-xs py-1 text-muted-foreground">{item.available_quantity}</TableCell>
                          <TableCell className="py-1">
                            <Input type="number" value={item.sale_price} onChange={(e) => handleInventoryItemChange(item.id, 'sale_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" disabled={isApproved} />
                          </TableCell>
                          <TableCell className="text-center text-xs py-1 font-medium">{formatCurrency(calcItem?.baseAmount || 0)}</TableCell>
                          <TableCell className="text-center text-xs py-1 font-medium">{formatCurrency(calcItem?.total || 0)}</TableCell>
                          <TableCell className="py-1">
                            {selectedInventoryItems.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInventoryItem(item.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Empty rows for ERP look */}
                    {Array.from({ length: Math.max(0, 4 - selectedInventoryItems.length) }).map((_, i) => (
                      <TableRow key={`empty-${i}`} className="border-b">
                        <TableCell className="text-center text-xs py-1 text-muted-foreground">{selectedInventoryItems.length + i + 1}</TableCell>
                        <TableCell className="py-1" colSpan={7}></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-2 border-t flex gap-2 flex-wrap bg-muted/20">
                  <Button type="button" variant="outline" size="sm" className="gap-2 h-8 text-xs" onClick={handleAddManualItem} disabled={isApproved}>
                    <Plus className="w-3 h-3" />
                    {t.inv_add_item || 'إضافة صنف'}
                  </Button>
                  {availableInventoryItems.length > 0 && (
                    <Select onValueChange={handleAddInventoryItem}>
                      <SelectTrigger className="w-[250px] h-8 text-xs">
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

          {/* ===== Middle Info Section (Account, Status, Barcode, Voucher) ===== */}
          <div className="p-3 border-t bg-muted/20">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{t.inv_cash_account}</Label>
                <div className="text-xs font-medium bg-primary/5 border border-primary/20 rounded px-2 py-1.5 truncate">
                  {accounts.find(a => a.id === invoiceData.payment_account_id)?.name || '-'}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{t.inv_invoice_number}</Label>
                <div className="text-xs font-mono font-medium bg-muted border border-border rounded px-2 py-1.5">
                  {invoiceData.invoice_number || nextInvoiceNumber}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{t.inv_status_label || 'الحالة'}</Label>
                <div className={`text-xs font-medium rounded px-2 py-1.5 text-center ${
                  isViewingExisting && currentSaleStatus === 'approved' 
                    ? 'bg-success/15 text-success border border-success/30' 
                    : 'bg-warning/15 text-warning border border-warning/30'
                }`}>
                  {isViewingExisting ? (currentSaleStatus === 'approved' ? (t.inv_status_approved || 'معتمدة (مؤرشفة)') : (t.inv_status_draft || 'مسودة')) : (t.inv_new || 'جديدة')}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{t.inv_issue_time || 'توقيت إصدار الفاتورة'}</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    value={invoiceData.sale_date}
                    onChange={(e) => setInvoiceData({ ...invoiceData, sale_date: e.target.value })}
                    className="h-7 text-[11px] font-mono border-border rounded px-1.5 w-[120px]"
                    disabled={isApproved}
                  />
                  <Input
                    type="time"
                    value={invoiceData.issue_time}
                    onChange={(e) => setInvoiceData({ ...invoiceData, issue_time: e.target.value })}
                    className="h-7 text-[11px] font-mono border-border rounded px-1.5 w-[90px]"
                    disabled={isApproved}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{t.inv_voucher_number || 'رقم السند'}</Label>
                <div className="text-xs font-bold bg-card border-2 border-border rounded px-2 py-1.5 text-center">
                  {isViewingExisting ? (invoiceData.invoice_number || currentInvoiceIndex + 1) : '-'}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{t.inv_salesperson || 'البائع'}</Label>
                <div className="text-xs font-medium bg-card border border-border rounded px-2 py-1.5 truncate">
                  {invoiceData.seller_name || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Totals Section (Large colored boxes - ERP Style) ===== */}
          <div className="p-3 border-t bg-card">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* الإجمالي - Green box */}
              <div className="bg-success/15 border-2 border-success/40 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-success">{formatCurrency(calculations.finalTotal)}</div>
                <div className="text-[10px] text-success font-medium mt-1">{t.inv_net}</div>
              </div>
              {/* المجموع - Blue box */}
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{formatCurrency(calculations.subtotal)}</div>
                <div className="text-[10px] text-primary font-medium mt-1">{t.inv_total}</div>
              </div>
              {/* حسم الأقلام - Gray box */}
              <div className="bg-muted border-2 border-border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="h-8 text-lg font-bold text-center w-20 border-0 border-b border-border rounded-none bg-transparent"
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
                <div className="text-[10px] text-muted-foreground font-medium mt-1">{t.inv_discount}</div>
              </div>
              {/* القيمة المضافة - Outlined box */}
              <div className="border-2 border-warning/40 rounded-lg p-3 text-center bg-warning/5">
                <div className="text-2xl font-bold text-warning">{formatCurrency(calculations.totalVAT)}</div>
                <div className="text-[10px] text-warning font-medium mt-1">{t.inv_tax_label} {taxRate}%</div>
              </div>
              {/* الربح - Profit box */}
              <div className={`border-2 rounded-lg p-3 text-center ${calculations.profit >= 0 ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5'}`}>
                <div className={`text-2xl font-bold ${calculations.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(calculations.profit)}</div>
                <div className={`text-[10px] font-medium mt-1 ${calculations.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{t.inv_profit}</div>
              </div>
            </div>

            {/* Paid Amount + Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap text-muted-foreground">{t.inv_paid_amount}</Label>
                <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none w-32" placeholder="0" dir="ltr" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap text-muted-foreground">{t.inv_terms}</Label>
                <Input placeholder={t.inv_terms_placeholder} className="h-8 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-primary shadow-none" />
              </div>
            </div>
          </div>

          {/* ===== Bottom Action Bar - Row 1: Dropdown Menus (Al-Ameen ERP Style) ===== */}
          <div className="border-t border-border bg-gradient-to-b from-muted/80 to-muted/40">
            <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-border/50">
              {/* عمليات الضرائب */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-[11px] h-7 rounded bg-card border-border shadow-sm">
                    عمليات الضرائب
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setActivePage('vat-return-report')}>
                    <FileText className="w-3.5 h-3.5 ml-2" />
                    إنشاء إقرار ضريبي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActivePage('tax-settings')}>
                    <FileSpreadsheet className="w-3.5 h-3.5 ml-2" />
                    إعدادات الضريبة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* تقارير */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-[11px] h-7 rounded bg-card border-border shadow-sm">
                    تقارير
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setActivePage('sales-report')}>
                    <FileText className="w-3.5 h-3.5 ml-2" />
                    تقرير المبيعات
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActivePage('profit-report')}>
                    <FileText className="w-3.5 h-3.5 ml-2" />
                    تقرير الأرباح
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActivePage('account-statement')}>
                    <FileText className="w-3.5 h-3.5 ml-2" />
                    كشف حساب
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* عمليات */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-[11px] h-7 rounded bg-card border-border shadow-sm">
                    {t.inv_operations || 'عمليات'}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setActivePage('medad-import')}>
                    <FileSpreadsheet className="w-3.5 h-3.5 ml-2" />
                    {t.inv_import_data}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!isViewingExisting || isApproved} onClick={() => setReverseDialogOpen(true)} className="text-warning">
                    <RotateCcw className="w-3.5 h-3.5 ml-2" />
                    {t.inv_return}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('سيتم إضافة خاصية إرسال SMS قريباً')}>
                    <MessageSquare className="w-3.5 h-3.5 ml-2" />
                    إرسال SMS
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* عرض */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-[11px] h-7 rounded bg-card border-border shadow-sm">
                    عرض
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handlePrintExisting} disabled={!isViewingExisting}>
                    <Printer className="w-3.5 h-3.5 ml-2" />
                    معاينة قبل الطباعة
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActivePage('journal-entries')} disabled={!isViewingExisting || !isApproved}>
                    <FileText className="w-3.5 h-3.5 ml-2" />
                    عرض القيد المحاسبي
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Row 2: Action Buttons */}
            <div className="px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
              {/* إضافة / حفظ */}
              {isViewingExisting ? (
                <>
                  {!isApproved && isEditing && (
                    <Button onClick={handleUpdateSale} size="sm" className="gap-1.5 text-[11px] h-8 rounded bg-card border border-border text-foreground hover:bg-muted shadow-sm" variant="outline" disabled={updateSale.isPending}>
                      <Save className="w-3.5 h-3.5" />
                      {updateSale.isPending ? t.inv_saving : t.inv_save_changes}
                    </Button>
                  )}
                  {isApproved && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded border border-success/20 h-8">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{t.inv_status_approved}</span>
                    </div>
                  )}
                </>
              ) : (
                <Button onClick={handleSubmit} size="sm" className="gap-1.5 text-[11px] h-8 rounded bg-card border border-border text-foreground hover:bg-muted shadow-sm" variant="outline" disabled={addMultiCarSale.isPending}>
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  {addMultiCarSale.isPending ? t.inv_saving : 'إضافة'}
                </Button>
              )}

              <Button variant="outline" onClick={handleNewInvoice} size="sm" className="gap-1.5 text-[11px] h-8 rounded bg-card border-border shadow-sm">
                <FileText className="w-3.5 h-3.5 text-primary" />
                جديد
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className={`gap-1.5 text-[11px] h-8 rounded shadow-sm ${isEditing ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border'}`}
                disabled={!isViewingExisting || isApproved}
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) toast.info('تم تفعيل وضع التعديل');
                }}
              >
                <FileEdit className="w-3.5 h-3.5" />
                {isEditing ? 'إلغاء التعديل' : 'تعديل'}
              </Button>

              <Button variant="outline" size="sm" className="gap-1.5 text-[11px] h-8 rounded bg-card border-border shadow-sm" disabled={!isViewingExisting || isApproved} onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                حذف
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-[11px] h-8 rounded bg-success/10 border border-success/30 text-success hover:bg-success/20 shadow-sm" 
                disabled={!isViewingExisting || isApproved}
                onClick={() => setApproveDialogOpen(true)}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                محاسبة
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-[11px] h-8 rounded bg-card border-border shadow-sm"
                onClick={() => {
                  searchBarRef.current?.scrollIntoView({ behavior: 'smooth' });
                  const input = searchBarRef.current?.querySelector('input');
                  if (input) setTimeout(() => input.focus(), 300);
                }}
              >
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                بحث
              </Button>

              <Button variant="outline" size="sm" className="gap-1.5 text-[11px] h-8 rounded bg-[hsl(var(--primary)/0.08)] border-primary/30 shadow-sm" disabled={!isViewingExisting} onClick={handlePrintExisting}>
                <Printer className="w-3.5 h-3.5 text-primary" />
                طباعة
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-[11px] h-8 rounded bg-card border-border shadow-sm">
                    مزيد..
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setActivePage('medad-import')}>
                    <FileSpreadsheet className="w-3.5 h-3.5 ml-2" />
                    {t.inv_import_data}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!isViewingExisting || isApproved} onClick={() => setReverseDialogOpen(true)} className="text-warning">
                    <RotateCcw className="w-3.5 h-3.5 ml-2" />
                    {t.inv_return}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActivePage('installments')}>
                    <FileText className="w-3.5 h-3.5 ml-2" />
                    الأقساط
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={() => setActivePage('sales')} size="sm" className="gap-1.5 text-[11px] h-8 rounded bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 shadow-sm">
                <X className="w-3.5 h-3.5" />
                إغلاق
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