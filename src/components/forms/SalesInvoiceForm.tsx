import { useState, useMemo, useEffect } from 'react';
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
  RotateCcw
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
import { useCustomers, useCars, useAddMultiCarSale, useSales, useDeleteSale, useReverseSale, useUpdateSale, useSalesWithItems, useUpdateSaleWithItems } from '@/hooks/useDatabase';
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
  chassis_number: string;
  quantity: number;
  pendingTransfer?: CarTransfer | null;
}

export function SalesInvoiceForm({ setActivePage }: SalesInvoiceFormProps) {
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
  const companyId = useCompanyId();

  // Available cars for sale
  const availableCars = useMemo(() => 
    allCars.filter(car => car.status === 'available' || car.status === 'transferred'),
    [allCars]
  );

  // Generate next invoice number
  const nextInvoiceNumber = useMemo(() => {
    return existingSales.length + 1;
  }, [existingSales]);

  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    customer_id: '',
    sale_date: new Date().toISOString().split('T')[0],
    payment_account_id: '',
    warehouse: 'الرئيسي',
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

  const selectedCustomer = customers.find(c => c.id === invoiceData.customer_id);
  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_sales ? (taxSettings?.tax_rate || 15) : 0;

  // Cars that are still available for selection
  const remainingCars = useMemo(() => 
    availableCars.filter(car => !selectedCars.some(sc => sc.car_id === car.id)),
    [availableCars, selectedCars]
  );

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
      chassis_number: car.chassis_number,
      quantity: 1,
      pendingTransfer,
    }]);
  };

  const handleRemoveCar = (id: string) => {
    if (selectedCars.length === 1) {
      toast.error('يجب إضافة سيارة واحدة على الأقل');
      return;
    }
    setSelectedCars(selectedCars.filter(car => car.id !== id));
  };

  const handleCarChange = (id: string, field: keyof SelectedCarItem, value: string | number) => {
    setSelectedCars(selectedCars.map(car => 
      car.id === id ? { ...car, [field]: value } : car
    ));
  };

  // Calculate totals
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalVAT = 0;
    const commission = parseFloat(invoiceData.commission) || 0;
    const otherExpenses = parseFloat(invoiceData.other_expenses) || 0;

    const itemsWithCalc = selectedCars.map(car => {
      const price = parseFloat(car.sale_price) || 0;
      const quantity = car.quantity || 1;
      
      let baseAmount: number;
      let vatAmount: number;
      let total: number;

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

      return {
        ...car,
        baseAmount,
        vatAmount,
        total,
      };
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
    const totalPurchasePrice = selectedCars.reduce((sum, car) => sum + car.purchase_price, 0);
    const profit = finalTotal - totalPurchasePrice - commission - otherExpenses;

    return {
      items: itemsWithCalc,
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      totalVAT,
      finalTotal,
      roundedTotal: Math.round(finalTotal),
      totalPurchasePrice,
      profit,
      quantity: selectedCars.length,
    };
  }, [selectedCars, invoiceData.price_includes_tax, invoiceData.commission, invoiceData.other_expenses, taxRate, discount, discountType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleSubmit = async () => {
    if (!invoiceData.customer_id) {
      toast.error('الرجاء اختيار العميل');
      return;
    }

    if (selectedCars.length === 0) {
      toast.error('الرجاء إضافة سيارة واحدة على الأقل');
      return;
    }

    const invalidCar = selectedCars.find(car => !car.sale_price || parseFloat(car.sale_price) <= 0);
    if (invalidCar) {
      toast.error('الرجاء إدخال سعر البيع لجميع السيارات');
      return;
    }

    try {
      // Calculate actual sale prices - use the total price (with tax) that the customer pays
      const carsWithPrices = selectedCars.map((car, index) => ({
        car_id: car.car_id,
        sale_price: calculations.items[index].total, // Total price including tax
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

      // Link pending transfers to this sale
      for (const car of selectedCars) {
        if (car.pendingTransfer) {
          try {
            await linkTransferToSale(
              car.pendingTransfer.id,
              sale.id,
              parseFloat(car.sale_price),
              car.pendingTransfer.agreed_commission,
              car.pendingTransfer.commission_percentage
            );
          } catch (error) {
            console.error('Error linking transfer to sale:', error);
          }
        }
      }

      // Create installment contract if enabled
      if (invoiceData.is_installment && companyId) {
        const downPayment = parseFloat(invoiceData.down_payment) || 0;
        const numberOfInstallments = parseInt(invoiceData.number_of_installments) || 12;
        const remainingAmount = calculations.finalTotal - downPayment;
        const installmentAmount = remainingAmount / numberOfInstallments;

        try {
          await addInstallmentSale.mutateAsync({
            company_id: companyId,
            sale_id: sale.id,
            total_amount: calculations.finalTotal,
            down_payment: downPayment,
            remaining_amount: remainingAmount,
            number_of_installments: numberOfInstallments,
            installment_amount: installmentAmount,
            start_date: invoiceData.sale_date,
            status: 'active',
            notes: invoiceData.notes || null,
          });
          toast.success('تم إنشاء عقد التقسيط بنجاح');
        } catch (error) {
          console.error('Installment creation error:', error);
          toast.error('حدث خطأ أثناء إنشاء عقد التقسيط');
        }
      }
      
      // Store saved data for invoice
      setSavedSaleData({
        ...sale,
        customer: selectedCustomer,
        cars: selectedCars,
      });
      
      toast.success(`تم تسجيل بيع ${selectedCars.length} سيارة بنجاح`);
      setInvoiceOpen(true);
    } catch (error: any) {
      console.error('Sale error:', error);
      toast.error('حدث خطأ أثناء تسجيل البيع');
    }
  };

  const handleNewInvoice = () => {
    setInvoiceData({
      invoice_number: '',
      customer_id: '',
      sale_date: new Date().toISOString().split('T')[0],
      payment_account_id: accounts.find(a => a.code === '1101')?.id || '',
      warehouse: 'الرئيسي',
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
    setDiscount(0);
    setPaidAmount(0);
    setSavedSaleData(null);
    setIsViewingExisting(false);
    setCurrentSaleId(null);
  };

  const handleCloseInvoice = (open: boolean) => {
    setInvoiceOpen(open);
    if (!open) {
      setActivePage('sales');
    }
  };

  // Navigation functions
  const handleFirstSale = () => {
    if (existingSales.length > 0) {
      setCurrentInvoiceIndex(0);
      loadSaleData(existingSales[0]);
    }
  };

  const handlePreviousSale = () => {
    if (currentInvoiceIndex > 0) {
      const newIndex = currentInvoiceIndex - 1;
      setCurrentInvoiceIndex(newIndex);
      loadSaleData(existingSales[newIndex]);
    }
  };

  const handleNextSale = () => {
    if (currentInvoiceIndex < existingSales.length - 1) {
      const newIndex = currentInvoiceIndex + 1;
      setCurrentInvoiceIndex(newIndex);
      loadSaleData(existingSales[newIndex]);
    }
  };

  const handleLastSale = () => {
    if (existingSales.length > 0) {
      const lastIndex = existingSales.length - 1;
      setCurrentInvoiceIndex(lastIndex);
      loadSaleData(existingSales[lastIndex]);
    }
  };

  const loadSaleData = async (sale: any) => {
    setIsViewingExisting(true);
    setCurrentSaleId(sale.id);
    
    setInvoiceData({
      invoice_number: sale.sale_number || '',
      customer_id: sale.customer_id || '',
      sale_date: sale.sale_date,
      payment_account_id: sale.payment_account_id || '',
      warehouse: 'الرئيسي',
      seller_name: sale.seller_name || '',
      notes: '',
      price_includes_tax: true,
      commission: String(sale.commission || ''),
      other_expenses: String(sale.other_expenses || ''),
      is_installment: false,
      down_payment: '',
      number_of_installments: '12',
      last_payment_date: '',
      first_installment_date: new Date().toISOString().split('T')[0],
    });

    // Check if this is a multi-car sale (has sale_items)
    if (sale.sale_items && sale.sale_items.length > 0) {
      // Multi-car sale: load all items
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
      // Single car sale: load from car_id
      const car = allCars.find(c => c.id === sale.car_id);
      if (car) {
        setSelectedCars([{
          id: crypto.randomUUID(),
          car_id: car.id,
          sale_price: String(sale.sale_price),
          purchase_price: Number(car.purchase_price),
          car_name: car.name,
          model: car.model || '',
          chassis_number: car.chassis_number,
          quantity: 1,
          pendingTransfer: null,
        }]);
      }
    }
  };

  // Handle delete sale
  const handleDeleteSale = async () => {
    if (!currentSaleId) return;
    
    const sale = existingSales.find(s => s.id === currentSaleId);
    if (!sale) return;
    
    try {
      await deleteSale.mutateAsync({ saleId: currentSaleId, carId: sale.car_id });
      toast.success('تم حذف الفاتورة بنجاح');
      setDeleteDialogOpen(false);
      handleNewInvoice();
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الفاتورة');
    }
  };

  // Handle reverse sale
  const handleReverseSale = async () => {
    if (!currentSaleId) return;
    
    try {
      await reverseSale.mutateAsync(currentSaleId);
      toast.success('تم إرجاع الفاتورة بنجاح وإعادة السيارات للمخزون');
      setReverseDialogOpen(false);
      handleNewInvoice();
    } catch (error) {
      toast.error('حدث خطأ أثناء إرجاع الفاتورة');
    }
  };

  // Handle update sale
  const handleUpdateSale = async () => {
    if (!currentSaleId || !invoiceData.customer_id) {
      toast.error('الرجاء اختيار العميل');
      return;
    }

    if (selectedCars.length === 0) {
      toast.error('الرجاء إضافة سيارة واحدة على الأقل');
      return;
    }

    const invalidCar = selectedCars.find(car => !car.sale_price || parseFloat(car.sale_price) <= 0);
    if (invalidCar) {
      toast.error('الرجاء إدخال سعر البيع لجميع السيارات');
      return;
    }

    try {
      // Prepare items with updated prices
      const items = selectedCars.map((car, index) => ({
        car_id: car.car_id,
        sale_price: calculations.items[index].total,
        purchase_price: car.purchase_price,
      }));

      // Use the new updateSaleWithItems to also update sale_items
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
      toast.success('تم تحديث الفاتورة بنجاح');
    } catch (error) {
      console.error('Update sale error:', error);
      toast.error('حدث خطأ أثناء تحديث الفاتورة');
    }
  };

  // Handle print existing invoice
  const handlePrintExisting = () => {
    if (!currentSaleId) return;
    
    const sale = salesWithItems.find(s => s.id === currentSaleId) || existingSales.find(s => s.id === currentSaleId);
    if (!sale) return;

    setSavedSaleData({
      ...sale,
      customer: selectedCustomer,
      cars: selectedCars,
    });
    setInvoiceOpen(true);
  };

  // Prepare invoice preview data
  const invoicePreviewData = useMemo(() => {
    if (!savedSaleData) return null;

    return {
      invoiceNumber: savedSaleData.id?.slice(0, 8) || nextInvoiceNumber,
      invoiceDate: invoiceData.sale_date,
      invoiceType: 'sale' as const,
      sellerName: taxSettings?.company_name_ar || company?.name || 'الشركة',
      sellerTaxNumber: taxSettings?.tax_number || '',
      sellerAddress: taxSettings?.national_address || company?.address || '',
      buyerName: selectedCustomer?.name || 'العميل',
      buyerPhone: selectedCustomer?.phone || '',
      buyerAddress: selectedCustomer?.address || '',
      buyerTaxNumber: selectedCustomer?.registration_number || '',
      items: calculations.items.map(car => ({
        description: `${car.car_name} ${car.model || ''} - ${car.chassis_number}`,
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
      companyLogoUrl: company?.logo_url,
    };
  }, [savedSaleData, invoiceData, selectedCustomer, calculations, taxSettings, company, taxRate, nextInvoiceNumber]);

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4">
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-success text-success-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              <h1 className="text-xl font-bold">فاتورة مبيعات</h1>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setActivePage('sales')}
              className="text-success-foreground hover:bg-success-foreground/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b bg-muted/20">
            <InvoiceSearchBar
              mode="sales"
              sales={salesWithItems}
              customers={customers}
              onSelectResult={(result) => {
                if (result.type === 'invoice' || result.type === 'car') {
                  // Load the sale
                  const sale = result.data;
                  const saleIndex = existingSales.findIndex(s => s.id === sale.id);
                  if (saleIndex >= 0) {
                    setCurrentInvoiceIndex(saleIndex);
                    loadSaleData(existingSales[saleIndex]);
                  }
                } else if (result.type === 'customer') {
                  // Load first sale of this customer or set customer for new invoice
                  const customerSales = result.data.sales;
                  if (customerSales && customerSales.length > 0) {
                    const saleIndex = existingSales.findIndex(s => s.id === customerSales[0].id);
                    if (saleIndex >= 0) {
                      setCurrentInvoiceIndex(saleIndex);
                      loadSaleData(existingSales[saleIndex]);
                    }
                  } else {
                    setInvoiceData(prev => ({ ...prev, customer_id: result.id }));
                  }
                }
              }}
            />
          </div>

          {/* Invoice Header Form */}
          <div className="p-4 border-b bg-muted/30 space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">رقم الفاتورة</Label>
                <Input
                  value={invoiceData.invoice_number || nextInvoiceNumber}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
                  className="h-9 text-sm"
                  placeholder={String(nextInvoiceNumber)}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">العميل *</Label>
                <Select value={invoiceData.customer_id} onValueChange={(v) => setInvoiceData({ ...invoiceData, customer_id: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCustomer && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">الرصيد:</Label>
                  <div className="h-9 flex items-center text-sm font-medium text-success">
                    {formatCurrency(0)} ر.س
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">أمر البيع</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="المرجع"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">المستودع</Label>
                <Select value={invoiceData.warehouse} onValueChange={(v) => setInvoiceData({ ...invoiceData, warehouse: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الرئيسي">الرئيسي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">التاريخ</Label>
                <Input
                  type="date"
                  value={invoiceData.sale_date}
                  onChange={(e) => setInvoiceData({ ...invoiceData, sale_date: e.target.value })}
                  className="h-9 text-sm"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">المندوب</Label>
                <Input
                  value={invoiceData.seller_name}
                  onChange={(e) => setInvoiceData({ ...invoiceData, seller_name: e.target.value })}
                  className="h-9 text-sm"
                  placeholder="اسم البائع"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">طريقة الدفع</Label>
                <Select defaultValue="cash">
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">آجـــــلة</SelectItem>
                    <SelectItem value="bank">تحويل بنكي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">حساب النقدية</Label>
                <PaymentAccountSelector
                  value={invoiceData.payment_account_id}
                  onChange={(v) => setInvoiceData({ ...invoiceData, payment_account_id: v })}
                  type="receipt"
                  className="h-9"
                  hideLabel
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الضريبة</Label>
                <div className="h-9 flex items-center text-sm bg-background px-3 rounded-md border">
                  مبيعات بالنسبة الأساسية
                </div>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Checkbox 
                  id="price_includes_tax"
                  checked={invoiceData.price_includes_tax}
                  onCheckedChange={(checked) => setInvoiceData({ ...invoiceData, price_includes_tax: !!checked })}
                />
                <Label htmlFor="price_includes_tax" className="text-xs cursor-pointer">
                  السعر شامل الضريبة
                </Label>
              </div>
            </div>

            {/* Row 3 - Additional fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">العمولة</Label>
                <Input
                  type="number"
                  value={invoiceData.commission}
                  onChange={(e) => setInvoiceData({ ...invoiceData, commission: e.target.value })}
                  className="h-9 text-sm"
                  placeholder="0"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">م. التكلفة</Label>
                <Input
                  type="number"
                  value={invoiceData.other_expenses}
                  onChange={(e) => setInvoiceData({ ...invoiceData, other_expenses: e.target.value })}
                  className="h-9 text-sm"
                  placeholder="0"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">المدفوع</Label>
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm"
                  placeholder="0"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1 col-span-2 lg:col-span-3">
                <Label className="text-xs">ملاحظات</Label>
                <Input
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                  placeholder="ملاحظات..."
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Row 4 - Installment options */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="is_installment"
                  checked={invoiceData.is_installment}
                  onCheckedChange={(checked) => setInvoiceData({ ...invoiceData, is_installment: !!checked })}
                />
                <Label htmlFor="is_installment" className="text-xs cursor-pointer font-medium text-primary">
                  بيع بالتقسيط
                </Label>
              </div>
              
              {invoiceData.is_installment && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 p-3 bg-muted/30 rounded-lg border border-primary/20">
                  {/* سعر السيارة */}
                  <div className="space-y-1">
                    <Label className="text-xs">سعر السيارة</Label>
                    <div className="h-9 flex items-center text-sm font-medium bg-background px-3 rounded-md border">
                      {formatCurrency(calculations.finalTotal)} ر.س
                    </div>
                  </div>
                  
                  {/* الدفعة المقدمة */}
                  <div className="space-y-1">
                    <Label className="text-xs">الدفعة المقدمة</Label>
                    <Input
                      type="number"
                      value={invoiceData.down_payment}
                      onChange={(e) => setInvoiceData({ ...invoiceData, down_payment: e.target.value })}
                      className="h-9 text-sm"
                      placeholder="0"
                      dir="ltr"
                    />
                  </div>
                  
                  {/* عدد الأقساط */}
                  <div className="space-y-1">
                    <Label className="text-xs">عدد الأقساط</Label>
                    <Select 
                      value={invoiceData.number_of_installments} 
                      onValueChange={(v) => setInvoiceData({ ...invoiceData, number_of_installments: v })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 6, 9, 12, 18, 24, 36, 48, 60].map(num => (
                          <SelectItem key={num} value={String(num)}>
                            {num === 1 ? 'دفعة واحدة' : num === 2 ? 'دفعتين' : `${num} شهر`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* تاريخ أول قسط */}
                  <div className="space-y-1">
                    <Label className="text-xs">تاريخ أول قسط</Label>
                    <Input
                      type="date"
                      value={invoiceData.first_installment_date}
                      onChange={(e) => {
                        const firstDate = e.target.value;
                        setInvoiceData({ ...invoiceData, first_installment_date: firstDate });
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                  
                  {/* تاريخ آخر قسط */}
                  <div className="space-y-1">
                    <Label className="text-xs">تاريخ آخر قسط</Label>
                    <Input
                      type="date"
                      value={invoiceData.last_payment_date || (() => {
                        const months = parseInt(invoiceData.number_of_installments) || 12;
                        const firstDate = invoiceData.first_installment_date ? new Date(invoiceData.first_installment_date) : new Date();
                        const lastDate = new Date(firstDate);
                        lastDate.setMonth(lastDate.getMonth() + months - 1);
                        return lastDate.toISOString().split('T')[0];
                      })()}
                      onChange={(e) => setInvoiceData({ ...invoiceData, last_payment_date: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  
                  {/* المتبقي */}
                  <div className="space-y-1">
                    <Label className="text-xs">المتبقي</Label>
                    <div className="h-9 flex items-center text-sm font-medium text-destructive bg-background px-3 rounded-md border">
                      {formatCurrency(calculations.finalTotal - (parseFloat(invoiceData.down_payment) || 0))} ر.س
                    </div>
                  </div>
                  
                  {/* قيمة القسط */}
                  <div className="space-y-1">
                    <Label className="text-xs">قيمة القسط</Label>
                    <div className="h-9 flex items-center text-sm font-medium text-primary bg-background px-3 rounded-md border">
                      {formatCurrency((calculations.finalTotal - (parseFloat(invoiceData.down_payment) || 0)) / (parseInt(invoiceData.number_of_installments) || 12))} ر.س
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right text-xs w-10">#</TableHead>
                  <TableHead className="text-right text-xs min-w-[200px]">البيان</TableHead>
                  <TableHead className="text-right text-xs min-w-[120px]">الصنف</TableHead>
                  <TableHead className="text-right text-xs min-w-[150px]">رقم الهيكل</TableHead>
                  <TableHead className="text-center text-xs w-20">الكمية</TableHead>
                  <TableHead className="text-center text-xs w-20">الوحدة</TableHead>
                  <TableHead className="text-center text-xs w-24">السعر</TableHead>
                  <TableHead className="text-center text-xs w-24">المجموع</TableHead>
                  <TableHead className="text-center text-xs w-20">VAT %</TableHead>
                  <TableHead className="text-center text-xs w-24">المجموع</TableHead>
                  <TableHead className="text-center text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCars.map((car, index) => {
                  const calcItem = calculations.items[index];
                  return (
                    <TableRow key={car.id} className="hover:bg-muted/30">
                      <TableCell className="text-center text-sm">{index + 1}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {car.car_name} {car.model}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Car className="w-4 h-4" />
                          سيارة
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono" dir="ltr">
                        {car.chassis_number}
                      </TableCell>
                      <TableCell className="text-center text-sm">1</TableCell>
                      <TableCell className="text-center text-sm">سيارة</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={car.sale_price}
                          onChange={(e) => handleCarChange(car.id, 'sale_price', e.target.value)}
                          placeholder="0"
                          className="h-8 text-sm text-center w-24"
                          dir="ltr"
                        />
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">
                        {formatCurrency(calcItem?.baseAmount || 0)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-warning">
                        {taxRate}%
                      </TableCell>
                      <TableCell className="text-center text-sm font-bold text-primary">
                        {formatCurrency(calcItem?.total || 0)}
                      </TableCell>
                      <TableCell>
                        {selectedCars.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCar(car.id)}
                            className="h-7 w-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {selectedCars.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      اختر سيارة لإضافتها للفاتورة
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Add Item Section */}
            <div className="p-2 border-t flex gap-2 flex-wrap">
              <Select onValueChange={handleAddCar}>
                <SelectTrigger className="w-[300px] h-9 text-sm">
                  <SelectValue placeholder="اختر سيارة لإضافتها..." />
                </SelectTrigger>
                <SelectContent>
                  {remainingCars.map((car) => (
                    <SelectItem key={car.id} value={car.id}>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        <span>{car.name} {car.model}</span>
                        <span className="text-muted-foreground text-xs" dir="ltr">{car.chassis_number}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Import from saved templates */}
              {savedTemplates.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9">
                      <FileSpreadsheet className="w-4 h-4" />
                      استيراد من قالب
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
                            const matchingCar = remainingCars.find(car => 
                              car.name.includes(item.description) || 
                              car.chassis_number === item.description
                            );
                            if (matchingCar) {
                              handleAddCar(matchingCar.id);
                              matchedCount++;
                            }
                          });
                          if (matchedCount > 0) {
                            toast.success(`تم استيراد ${matchedCount} سيارة من القالب`);
                          } else {
                            toast.warning('لم يتم العثور على سيارات مطابقة');
                          }
                        }}
                      >
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Totals Section */}
          <div className="p-4 bg-muted/30 border-t">
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 items-center">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">المجموع</Label>
                <div className="text-lg font-bold">{formatCurrency(calculations.subtotal)}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">الكمية</Label>
                <div className="text-lg font-bold">{calculations.quantity}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">الخصم</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm w-20"
                    dir="ltr"
                  />
                  <Select value={discountType} onValueChange={(v: 'percentage' | 'amount') => setDiscountType(v)}>
                    <SelectTrigger className="h-8 text-sm w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">ر.س</SelectItem>
                      <SelectItem value="percentage">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">الإجمالي</Label>
                <div className="text-lg font-bold">{formatCurrency(calculations.subtotalAfterDiscount)}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">الضريبة {taxRate}%</Label>
                <div className="text-lg font-bold text-warning">{formatCurrency(calculations.totalVAT)}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">الصافي</Label>
                <div className="text-xl font-bold text-primary">{formatCurrency(calculations.finalTotal)}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">الربح</Label>
                <div className={`text-lg font-bold ${calculations.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(calculations.profit)}
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-4 pt-4 border-t">
              <Label className="text-xs text-muted-foreground">شروط البيع والدفع</Label>
              <Textarea
                placeholder="شروط وأحكام البيع..."
                className="mt-2 h-12 text-sm resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-muted/50 border-t flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              {isViewingExisting ? (
                <Button onClick={handleUpdateSale} className="gap-2 gradient-success" disabled={updateSale.isPending}>
                  <Save className="w-4 h-4" />
                  {updateSale.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-2 gradient-success" disabled={addMultiCarSale.isPending}>
                  <Save className="w-4 h-4" />
                  {addMultiCarSale.isPending ? 'جاري الحفظ...' : 'اعتماد'}
                </Button>
              )}
              <Button variant="outline" onClick={handleNewInvoice} className="gap-2">
                <Plus className="w-4 h-4" />
                جديد
              </Button>
              <Button 
                variant="outline" 
                className="gap-2" 
                disabled={!isViewingExisting}
                onClick={handlePrintExisting}
              >
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
              <Button variant="outline" className="gap-2" disabled>
                <FileSpreadsheet className="w-4 h-4" />
                استيراد بيانات
              </Button>
              <Button variant="outline" className="gap-2" disabled>
                <MessageSquare className="w-4 h-4" />
                SMS
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 text-orange-500 hover:text-orange-600" 
                disabled={!isViewingExisting}
                onClick={() => setReverseDialogOpen(true)}
              >
                <RotateCcw className="w-4 h-4" />
                إرجاع
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 text-destructive hover:text-destructive" 
                disabled={!isViewingExisting}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
                حذف
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setActivePage('sales')}
                className="gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                خروج
              </Button>
              <div className="flex items-center gap-1 border rounded-md overflow-hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={handleNextSale}
                  disabled={currentInvoiceIndex >= existingSales.length - 1}
                  title="الفاتورة التالية"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={handleLastSale}
                  disabled={existingSales.length === 0}
                  title="آخر فاتورة"
                >
                  <ChevronRight className="w-4 h-4" />
                  <ChevronRight className="w-4 h-4 -mr-2" />
                </Button>
                <span className="px-3 text-sm bg-muted min-w-[50px] text-center">
                  {existingSales.length > 0 ? currentInvoiceIndex + 1 : 0} / {existingSales.length}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={handlePreviousSale}
                  disabled={currentInvoiceIndex <= 0}
                  title="الفاتورة السابقة"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={handleFirstSale}
                  disabled={existingSales.length === 0}
                  title="أول فاتورة"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <ChevronLeft className="w-4 h-4 -ml-2" />
                </Button>
              </div>
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
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الفاتورة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الفاتورة وإعادة السيارات للمخزون. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSale}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSale.isPending ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reverse Confirmation Dialog */}
      <AlertDialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              إرجاع الفاتورة
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>هل أنت متأكد من إرجاع هذه الفاتورة؟</p>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>سيتم إعادة السيارات للمخزون</li>
                <li>سيتم حذف القيد المحاسبي المرتبط</li>
                <li>سيتم تحديث الإحصائيات والتقارير</li>
              </ul>
              <p className="text-destructive font-medium">لا يمكن التراجع عن هذا الإجراء.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReverseSale}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {reverseSale.isPending ? 'جاري الإرجاع...' : 'إرجاع الفاتورة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
