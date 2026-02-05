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
import { useSuppliers, useAddPurchaseBatch, useCars, useUpdateCar, useDeleteCar } from '@/hooks/useDatabase';
import { useTaxSettings, useAccounts } from '@/hooks/useAccounting';
import { PurchaseInvoiceDialog } from '@/components/invoices/PurchaseInvoiceDialog';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { PaymentAccountSelector } from './PaymentAccountSelector';
import { InvoiceSearchBar } from './InvoiceSearchBar';

interface PurchaseInvoiceFormProps {
  setActivePage: (page: ActivePage) => void;
}

interface CarItem {
  id: string;
  chassis_number: string;
  name: string;
  model: string;
  color: string;
  purchase_price: string;
  quantity: number;
  unit: string;
}

const createEmptyCar = (): CarItem => ({
  id: crypto.randomUUID(),
  chassis_number: '',
  name: '',
  model: '',
  color: '',
  purchase_price: '',
  quantity: 1,
  unit: 'سيارة',
});

export function PurchaseInvoiceForm({ setActivePage }: PurchaseInvoiceFormProps) {
  const { data: suppliers = [] } = useSuppliers();
  const { data: taxSettings } = useTaxSettings();
  const { data: accounts = [] } = useAccounts();
  const { data: existingCars = [] } = useCars();
  const { company } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const addPurchaseBatch = useAddPurchaseBatch();
  const updateCar = useUpdateCar();
  const deleteCar = useDeleteCar();

  // Filter purchases by fiscal year
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

  // Generate next invoice number
  const nextInvoiceNumber = useMemo(() => {
    const maxInventory = existingCars.reduce((max, car) => 
      Math.max(max, car.inventory_number), 0
    );
    return maxInventory + 1;
  }, [existingCars]);

  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_account_id: '',
    warehouse: 'الرئيسي',
    notes: '',
    price_includes_tax: true,
  });

  // Set default payment account (الصندوق الرئيسي)
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
  const [currentCarId, setCurrentCarId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);

  const selectedSupplier = suppliers.find(s => s.id === invoiceData.supplier_id);
  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_purchases ? (taxSettings?.tax_rate || 15) : 0;

  const handleAddCar = () => {
    setCars([...cars, createEmptyCar()]);
  };

  const handleRemoveCar = (id: string) => {
    if (cars.length === 1) {
      toast.error('يجب إضافة سيارة واحدة على الأقل');
      return;
    }
    setCars(cars.filter(car => car.id !== id));
  };

  const handleCarChange = (id: string, field: keyof CarItem, value: string | number) => {
    setCars(cars.map(car => 
      car.id === id ? { ...car, [field]: value } : car
    ));
  };

  // Calculate totals
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalVAT = 0;

    const itemsWithCalc = cars.map(car => {
      const price = parseFloat(car.purchase_price) || 0;
      const quantity = car.quantity || 1;
      
      let baseAmount: number;
      let vatAmount: number;
      let total: number;

      if (invoiceData.price_includes_tax && taxRate > 0) {
        // السعر شامل الضريبة
        total = price * quantity;
        baseAmount = total / (1 + taxRate / 100);
        vatAmount = total - baseAmount;
      } else {
        // السعر غير شامل الضريبة
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

    return {
      items: itemsWithCalc,
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      totalVAT,
      finalTotal,
      roundedTotal: Math.round(finalTotal),
    };
  }, [cars, invoiceData.price_includes_tax, taxRate, discount, discountType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleSubmit = async () => {
    if (!invoiceData.supplier_id) {
      toast.error('الرجاء اختيار المورد');
      return;
    }

    const invalidCar = cars.find(car => 
      !car.chassis_number || !car.name || !car.purchase_price
    );
    if (invalidCar) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة لكل سيارة');
      return;
    }

    // Check for duplicate chassis numbers within the batch
    const chassisNumbers = cars.map(car => car.chassis_number);
    const duplicates = chassisNumbers.filter((item, index) => chassisNumbers.indexOf(item) !== index);
    if (duplicates.length > 0) {
      toast.error('يوجد تكرار في أرقام الهيكل');
      return;
    }

    try {
      // Calculate actual purchase prices (base amounts without tax)
      const carsWithPrices = calculations.items.map((car, index) => ({
        chassis_number: cars[index].chassis_number,
        name: cars[index].name,
        model: cars[index].model || null,
        color: cars[index].color || null,
        purchase_price: car.baseAmount / (cars[index].quantity || 1), // Store base price per unit
        fiscal_year_id: selectedFiscalYear?.id ?? null,
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
      
      // Store saved data for invoice
      setSavedBatchData({
        ...result,
        supplier: selectedSupplier,
        cars: cars,
      });
      
      toast.success(`تم إضافة ${cars.length} سيارة للمخزون بنجاح`);
      setInvoiceOpen(true);
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('أحد أرقام الهيكل موجود مسبقاً');
      } else {
        console.error('Purchase batch error:', error);
        toast.error('حدث خطأ أثناء إضافة السيارات');
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
      warehouse: 'الرئيسي',
      notes: '',
      price_includes_tax: true,
    });
    setCars([createEmptyCar()]);
    setDiscount(0);
    setSavedBatchData(null);
    setIsViewingExisting(false);
    setCurrentCarId(null);
  };

  const handleCloseInvoice = (open: boolean) => {
    setInvoiceOpen(open);
    if (!open) {
      setActivePage('purchases');
    }
  };

  // Navigation functions - use fiscal year filtered data
  const handleFirstPurchase = () => {
    if (fiscalYearFilteredCars.length > 0) {
      setCurrentInvoiceIndex(0);
      loadCarData(fiscalYearFilteredCars[0]);
    }
  };

  const handlePreviousPurchase = () => {
    if (currentInvoiceIndex > 0) {
      const newIndex = currentInvoiceIndex - 1;
      setCurrentInvoiceIndex(newIndex);
      loadCarData(fiscalYearFilteredCars[newIndex]);
    }
  };

  const handleNextPurchase = () => {
    if (currentInvoiceIndex < fiscalYearFilteredCars.length - 1) {
      const newIndex = currentInvoiceIndex + 1;
      setCurrentInvoiceIndex(newIndex);
      loadCarData(fiscalYearFilteredCars[newIndex]);
    }
  };

  const handleLastPurchase = () => {
    if (fiscalYearFilteredCars.length > 0) {
      const lastIndex = fiscalYearFilteredCars.length - 1;
      setCurrentInvoiceIndex(lastIndex);
      loadCarData(fiscalYearFilteredCars[lastIndex]);
    }
  };

  const loadCarData = (car: any) => {
    setIsViewingExisting(true);
    setCurrentCarId(car.id);
    
    // When loading existing data, the stored price is the BASE price (without tax)
    // So we need to set price_includes_tax to false to avoid double-dividing
    setInvoiceData({
      invoice_number: String(car.inventory_number || ''),
      supplier_id: car.supplier_id || '',
      purchase_date: car.purchase_date,
      due_date: car.purchase_date,
      payment_account_id: car.payment_account_id || '',
      warehouse: 'الرئيسي',
      notes: '',
      price_includes_tax: false, // Stored price is BASE price, not inclusive
    });

    setCars([{
      id: crypto.randomUUID(),
      chassis_number: car.chassis_number,
      name: car.name,
      model: car.model || '',
      color: car.color || '',
      purchase_price: String(car.purchase_price),
      quantity: 1,
      unit: 'سيارة',
    }]);
  };

  // Handle delete purchase
  const handleDeletePurchase = async () => {
    if (!currentCarId) return;
    
    const car = existingCars.find(c => c.id === currentCarId);
    if (!car) return;
    
    // Can't delete sold cars
    if (car.status === 'sold') {
      toast.error('لا يمكن حذف سيارة مباعة');
      return;
    }
    
    try {
      await deleteCar.mutateAsync(currentCarId);
      toast.success('تم حذف فاتورة الشراء بنجاح');
      setDeleteDialogOpen(false);
      handleNewInvoice();
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الفاتورة');
    }
  };

  // Handle reverse purchase (same as delete for purchases)
  const handleReversePurchase = async () => {
    if (!currentCarId) return;
    
    const car = existingCars.find(c => c.id === currentCarId);
    if (!car) return;
    
    // Can't reverse sold cars
    if (car.status === 'sold') {
      toast.error('لا يمكن إرجاع فاتورة سيارة مباعة');
      return;
    }
    
    try {
      await deleteCar.mutateAsync(currentCarId);
      toast.success('تم إرجاع فاتورة الشراء بنجاح وحذف السيارة من المخزون');
      setReverseDialogOpen(false);
      handleNewInvoice();
    } catch (error) {
      toast.error('حدث خطأ أثناء إرجاع الفاتورة');
    }
  };

  // Handle update purchase
  const handleUpdatePurchase = async () => {
    if (!currentCarId) return;

    const carData = cars[0];
    if (!carData || !carData.chassis_number || !carData.name || !carData.purchase_price) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      await updateCar.mutateAsync({
        id: currentCarId,
        car: {
          name: carData.name,
          model: carData.model || null,
          chassis_number: carData.chassis_number,
          color: carData.color || null,
          purchase_price: parseFloat(carData.purchase_price),
          purchase_date: invoiceData.purchase_date,
          payment_account_id: invoiceData.payment_account_id || null,
          supplier_id: invoiceData.supplier_id || null,
        }
      });
      toast.success('تم تحديث بيانات الشراء بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث البيانات');
    }
  };

  // Handle print existing invoice
  const handlePrintExisting = () => {
    if (!currentCarId) return;
    
    const car = existingCars.find(c => c.id === currentCarId);
    if (!car) return;

    setSavedBatchData({
      batch: { id: car.id },
      supplier: selectedSupplier,
      cars: cars,
    });
    setInvoiceOpen(true);
  };

  // Prepare invoice preview data
  const invoicePreviewData = useMemo(() => {
    if (!savedBatchData) return null;

    return {
      invoiceNumber: savedBatchData.batch?.id?.slice(0, 8) || nextInvoiceNumber,
      invoiceDate: invoiceData.purchase_date,
      supplierName: selectedSupplier?.name || 'المورد',
      supplierTaxNumber: selectedSupplier?.registration_number || '',
      supplierAddress: selectedSupplier?.address || '',
      supplierPhone: selectedSupplier?.phone || '',
      companyName: taxSettings?.company_name_ar || company?.name || 'الشركة',
      companyTaxNumber: taxSettings?.tax_number || '',
      companyAddress: taxSettings?.national_address || company?.address || '',
      items: calculations.items.map(car => ({
        description: `${car.name} ${car.model || ''} - ${car.chassis_number}`,
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
  }, [savedBatchData, invoiceData, selectedSupplier, calculations, taxSettings, company, taxRate, nextInvoiceNumber]);

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4">
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              <h1 className="text-xl font-bold">فاتورة مشتريات</h1>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setActivePage('purchases')}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b bg-muted/20">
            <InvoiceSearchBar
              mode="purchases"
              purchases={fiscalYearFilteredCars}
              suppliers={suppliers}
              onSelectResult={(result) => {
                if (result.type === 'invoice' || result.type === 'car') {
                  // Load the car/purchase
                  const car = result.data;
                  const carIndex = fiscalYearFilteredCars.findIndex(c => c.id === car.id);
                  if (carIndex >= 0) {
                    setCurrentInvoiceIndex(carIndex);
                    loadCarData(fiscalYearFilteredCars[carIndex]);
                  }
                } else if (result.type === 'supplier') {
                  // Load first purchase of this supplier or set supplier for new invoice
                  const supplierPurchases = result.data.purchases;
                  if (supplierPurchases && supplierPurchases.length > 0) {
                    const carIndex = fiscalYearFilteredCars.findIndex(c => c.id === supplierPurchases[0].id);
                    if (carIndex >= 0) {
                      setCurrentInvoiceIndex(carIndex);
                      loadCarData(fiscalYearFilteredCars[carIndex]);
                    }
                  } else {
                    setInvoiceData(prev => ({ ...prev, supplier_id: result.id }));
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
                <Label className="text-xs">المورد *</Label>
                <Select value={invoiceData.supplier_id} onValueChange={(v) => setInvoiceData({ ...invoiceData, supplier_id: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedSupplier && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">الرصيد:</Label>
                  <div className="h-9 flex items-center text-sm font-medium text-success">
                    {formatCurrency(0)} ر.س
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">فاتورة المورد</Label>
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
                <Label className="text-xs">تاريخ الشراء</Label>
                <Input
                  type="date"
                  value={invoiceData.purchase_date}
                  onChange={(e) => setInvoiceData({ ...invoiceData, purchase_date: e.target.value })}
                  className="h-9 text-sm"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الاستحقاق</Label>
                <Input
                  type="date"
                  value={invoiceData.due_date}
                  onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })}
                  className="h-9 text-sm"
                  dir="ltr"
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
                  type="payment"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الضريبة</Label>
                <div className="h-9 flex items-center text-sm bg-background px-3 rounded-md border">
                  مشتريات بالنسبة الأساسية
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

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">ملاحظات</Label>
              <Textarea
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                className="h-16 text-sm resize-none"
              />
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
                  <TableHead className="text-center text-xs w-20">VAT</TableHead>
                  <TableHead className="text-center text-xs w-24">المجموع الكلي</TableHead>
                  <TableHead className="text-center text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.items.map((car, index) => (
                  <TableRow key={car.id} className="hover:bg-muted/30">
                    <TableCell className="text-center text-sm">{index + 1}</TableCell>
                    <TableCell>
                      <Input
                        value={cars[index].name}
                        onChange={(e) => handleCarChange(car.id, 'name', e.target.value)}
                        placeholder="اسم السيارة"
                        className="h-8 text-sm border-0 bg-transparent focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Car className="w-4 h-4" />
                        سيارة
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={cars[index].chassis_number}
                        onChange={(e) => handleCarChange(car.id, 'chassis_number', e.target.value)}
                        placeholder="رقم الهيكل"
                        className="h-8 text-sm border-0 bg-transparent focus-visible:ring-1"
                        dir="ltr"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={cars[index].quantity}
                        onChange={(e) => handleCarChange(car.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="h-8 text-sm text-center border-0 bg-transparent focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell className="text-center text-sm">سيارة</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={cars[index].purchase_price}
                        onChange={(e) => handleCarChange(car.id, 'purchase_price', e.target.value)}
                        placeholder="0"
                        className="h-8 text-sm text-center w-24"
                        dir="ltr"
                      />
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {formatCurrency(car.baseAmount)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-warning">
                      {taxRate}%
                    </TableCell>
                    <TableCell className="text-center text-sm font-bold text-primary">
                      {formatCurrency(car.total)}
                    </TableCell>
                    <TableCell>
                      {cars.length > 1 && (
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
                ))}
              </TableBody>
            </Table>

            {/* Add Item Button */}
            <div className="p-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCar}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة سيارة
              </Button>
            </div>
          </div>

          {/* Totals Section */}
          <div className="p-4 bg-muted/30 border-t">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">المجموع</Label>
                <div className="text-lg font-bold">{formatCurrency(calculations.subtotal)}</div>
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
                <Label className="text-xs text-muted-foreground">تقريب الصافي</Label>
                <div className="text-xl font-bold text-primary">{formatCurrency(calculations.roundedTotal)}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-muted/50 border-t flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              {isViewingExisting ? (
                <Button onClick={handleUpdatePurchase} className="gap-2 gradient-primary" disabled={updateCar.isPending}>
                  <Save className="w-4 h-4" />
                  {updateCar.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-2 gradient-primary" disabled={addPurchaseBatch.isPending}>
                  <Save className="w-4 h-4" />
                  {addPurchaseBatch.isPending ? 'جاري الحفظ...' : 'اعتماد'}
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
                onClick={() => setActivePage('purchases')}
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
                  onClick={handleNextPurchase}
                  disabled={currentInvoiceIndex >= fiscalYearFilteredCars.length - 1}
                  title="الفاتورة التالية"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={handleLastPurchase}
                  disabled={fiscalYearFilteredCars.length === 0}
                  title="آخر فاتورة"
                >
                  <ChevronRight className="w-4 h-4" />
                  <ChevronRight className="w-4 h-4 -mr-2" />
                </Button>
                <span className="px-3 text-sm bg-muted min-w-[50px] text-center">
                  {fiscalYearFilteredCars.length > 0 ? currentInvoiceIndex + 1 : 0} / {fiscalYearFilteredCars.length}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={handlePreviousPurchase}
                  disabled={currentInvoiceIndex <= 0}
                  title="الفاتورة السابقة"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={handleFirstPurchase}
                  disabled={fiscalYearFilteredCars.length === 0}
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
        <PurchaseInvoiceDialog
          open={invoiceOpen}
          onOpenChange={handleCloseInvoice}
          data={invoicePreviewData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف فاتورة الشراء؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف السيارة من المخزون. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePurchase}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCar.isPending ? 'جاري الحذف...' : 'حذف'}
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
              إرجاع فاتورة الشراء
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>هل أنت متأكد من إرجاع هذه الفاتورة؟</p>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>سيتم حذف السيارة من المخزون</li>
                <li>سيتم حذف القيد المحاسبي المرتبط</li>
                <li>سيتم تحديث الإحصائيات والتقارير</li>
              </ul>
              <p className="text-destructive font-medium">لا يمكن التراجع عن هذا الإجراء.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReversePurchase}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {deleteCar.isPending ? 'جاري الإرجاع...' : 'إرجاع الفاتورة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
