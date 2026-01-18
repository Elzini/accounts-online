import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Save, DollarSign, ArrowLeftRight, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ActivePage } from '@/types';
import { toast } from 'sonner';
import { useCustomers, useCars, useAddSale } from '@/hooks/useDatabase';
import { getPendingTransferForCar, linkTransferToSale } from '@/hooks/useTransfers';
import { CarTransfer } from '@/services/transfers';
import { useQueryClient } from '@tanstack/react-query';
import { useTaxSettings } from '@/hooks/useAccounting';
import { InvoicePreviewDialog } from '@/components/invoices/InvoicePreviewDialog';
import { useCompany } from '@/contexts/CompanyContext';

interface SaleFormProps {
  setActivePage: (page: ActivePage) => void;
}

export function SaleForm({ setActivePage }: SaleFormProps) {
  const { data: customers = [] } = useCustomers();
  const { data: allCars = [] } = useCars();
  const { data: taxSettings } = useTaxSettings();
  const { company } = useCompany();
  const addSale = useAddSale();
  const queryClient = useQueryClient();

  // Include both available and transferred cars for sale
  const availableCars = allCars.filter(car => car.status === 'available' || car.status === 'transferred');

  const [formData, setFormData] = useState({
    customer_id: '',
    car_id: '',
    sale_price: '',
    seller_name: '',
    commission: '',
    other_expenses: '',
    sale_date: new Date().toISOString().split('T')[0],
  });

  const [selectedCar, setSelectedCar] = useState<typeof allCars[0] | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<CarTransfer | null>(null);
  const [profit, setProfit] = useState(0);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [savedSaleData, setSavedSaleData] = useState<any>(null);

  useEffect(() => {
    const salePrice = parseFloat(formData.sale_price) || 0;
    const purchasePrice = selectedCar ? Number(selectedCar.purchase_price) : 0;
    const commission = parseFloat(formData.commission) || 0;
    const otherExpenses = parseFloat(formData.other_expenses) || 0;
    setProfit(salePrice - purchasePrice - commission - otherExpenses);
  }, [formData.sale_price, formData.commission, formData.other_expenses, selectedCar]);

  // Calculate tax details
  const taxDetails = useMemo(() => {
    const price = parseFloat(formData.sale_price) || 0;
    const isActive = taxSettings?.is_active && taxSettings?.apply_to_sales;
    const taxRate = isActive ? (taxSettings?.tax_rate || 0) : 0;
    
    // السعر المدخل يعتبر شامل الضريبة
    const baseAmount = isActive ? price / (1 + taxRate / 100) : price;
    const taxAmount = isActive ? price - baseAmount : 0;
    
    return {
      isActive,
      taxRate,
      baseAmount,
      taxAmount,
      totalWithTax: price,
      taxName: taxSettings?.tax_name || 'ضريبة القيمة المضافة'
    };
  }, [formData.sale_price, taxSettings]);

  const handleCarChange = async (carId: string) => {
    const car = availableCars.find(c => c.id === carId);
    setSelectedCar(car || null);
    setFormData({ ...formData, car_id: carId });
    
    // Check for pending transfer
    if (car?.status === 'transferred') {
      try {
        const transfer = await getPendingTransferForCar(carId);
        setPendingTransfer(transfer);
      } catch (error) {
        console.error('Error checking pending transfer:', error);
        setPendingTransfer(null);
      }
    } else {
      setPendingTransfer(null);
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.car_id || !formData.sale_price) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    try {
      const sale = await addSale.mutateAsync({
        car_id: formData.car_id,
        customer_id: formData.customer_id,
        sale_price: parseFloat(formData.sale_price),
        seller_name: formData.seller_name || null,
        commission: parseFloat(formData.commission) || 0,
        other_expenses: parseFloat(formData.other_expenses) || 0,
        profit: profit,
        sale_date: formData.sale_date,
      });

      // Store sale data for invoice
      setSavedSaleData({
        ...sale,
        car: selectedCar,
        customer: selectedCustomer,
      });

      // Link pending transfer to this sale if exists
      if (pendingTransfer) {
        try {
          await linkTransferToSale(
            pendingTransfer.id,
            sale.id,
            parseFloat(formData.sale_price),
            pendingTransfer.agreed_commission,
            pendingTransfer.commission_percentage
          );
          queryClient.invalidateQueries({ queryKey: ['carTransfers'] });
          toast.success('تم تسجيل عملية البيع وربط التحويل بنجاح');
        } catch (error) {
          console.error('Error linking transfer to sale:', error);
          toast.success('تم تسجيل عملية البيع (حدث خطأ في ربط التحويل)');
        }
      } else {
        toast.success('تم تسجيل عملية البيع بنجاح');
      }
      
      setInvoiceOpen(true);
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل البيع');
    }
  };

  const handleCloseInvoice = (open: boolean) => {
    setInvoiceOpen(open);
    if (!open) {
      setActivePage('sales');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  // Prepare invoice data
  const invoiceData = useMemo(() => {
    if (!savedSaleData || !selectedCar) return null;
    
    const price = parseFloat(formData.sale_price) || 0;
    const isActive = taxSettings?.is_active && taxSettings?.apply_to_sales;
    const taxRate = isActive ? (taxSettings?.tax_rate || 0) : 0;
    const baseAmount = isActive ? price / (1 + taxRate / 100) : price;
    const taxAmount = isActive ? price - baseAmount : 0;

    return {
      invoiceNumber: savedSaleData.sale_number || Date.now(),
      invoiceDate: formData.sale_date,
      invoiceType: 'sale' as const,
      // البائع = الشركة
      sellerName: taxSettings?.company_name_ar || company?.name || 'الشركة',
      sellerTaxNumber: taxSettings?.tax_number || '',
      sellerAddress: taxSettings?.national_address || company?.address || '',
      // المشتري = العميل
      buyerName: selectedCustomer?.name || 'العميل',
      buyerPhone: selectedCustomer?.phone || '',
      buyerAddress: selectedCustomer?.address || '',
      buyerIdNumber: selectedCustomer?.id_number || '',
      buyerTaxNumber: selectedCustomer?.registration_number || '', // الرقم الضريبي للعميل
      items: [
        {
          description: `${selectedCar.name} ${selectedCar.model || ''} - ${selectedCar.chassis_number}`,
          quantity: 1,
          unitPrice: baseAmount,
          taxRate: taxRate,
          taxAmount: taxAmount,
          total: price,
        },
      ],
      subtotal: baseAmount,
      taxAmount: taxAmount,
      total: price,
      taxSettings: taxSettings,
    };
  }, [savedSaleData, selectedCar, formData, taxSettings, selectedCustomer, company]);

  return (
    <>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          {/* Header */}
          <div className="gradient-success p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">تسجيل عملية بيع</h1>
                <p className="text-white/80 text-sm">تسجيل بيع سيارة</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label>العميل *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                <SelectTrigger className="h-12">
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

            {/* Car Selection */}
            <div className="space-y-2">
              <Label>السيارة *</Label>
              <Select value={formData.car_id} onValueChange={handleCarChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="اختر السيارة" />
                </SelectTrigger>
                <SelectContent>
                  {availableCars.map((car) => (
                    <SelectItem key={car.id} value={car.id}>
                      <div className="flex items-center gap-2">
                        <span>{car.name} - {car.model} ({car.chassis_number})</span>
                        {car.status === 'transferred' && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">محولة</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Car Details */}
            {selectedCar && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">اسم السيارة</p>
                    <p className="font-semibold">{selectedCar.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الموديل</p>
                    <p className="font-semibold">{selectedCar.model || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">سعر الشراء</p>
                    <p className="font-semibold">{formatCurrency(Number(selectedCar.purchase_price))} ريال</p>
                  </div>
                </div>
                
                {pendingTransfer && (
                  <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowLeftRight className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-orange-700 dark:text-orange-400">سيارة محولة</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">المعرض الشريك</p>
                        <p className="font-medium">{pendingTransfer.partner_dealership?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">العمولة المتفق عليها</p>
                        <p className="font-medium text-orange-600">
                          {pendingTransfer.agreed_commission > 0 
                            ? `${formatCurrency(pendingTransfer.agreed_commission)} ريال`
                            : `${pendingTransfer.commission_percentage}%`
                          }
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-orange-600 mt-2">
                      سيتم ربط هذا البيع بالتحويل تلقائياً وحساب العمولة
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Prices */}
            <div className="space-y-2">
              <Label htmlFor="sale_price">سعر البيع *</Label>
              <Input
                id="sale_price"
                type="number"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                placeholder="0"
                className="h-12"
                dir="ltr"
              />
            </div>

            {/* Seller & Expenses */}
            <div className="space-y-2">
              <Label htmlFor="seller_name">اسم البائع</Label>
              <Input
                id="seller_name"
                value={formData.seller_name}
                onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
                placeholder="أدخل اسم البائع"
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission">عمولة البيع</Label>
                <Input
                  id="commission"
                  type="number"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  placeholder="0"
                  className="h-12"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_expenses">مصروفات أخرى</Label>
                <Input
                  id="other_expenses"
                  type="number"
                  value={formData.other_expenses}
                  onChange={(e) => setFormData({ ...formData, other_expenses: e.target.value })}
                  placeholder="0"
                  className="h-12"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_date">تاريخ البيع</Label>
              <Input
                id="sale_date"
                type="date"
                value={formData.sale_date}
                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                className="h-12"
                dir="ltr"
              />
            </div>

            {/* Tax Details */}
            {formData.sale_price && (
              <div className="bg-muted/50 p-4 rounded-xl border">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-5 h-5 text-success" />
                  <span className="font-semibold">تفاصيل الفاتورة</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">أصل المبلغ</p>
                    <p className="text-lg font-bold">{formatCurrency(taxDetails.baseAmount)} ريال</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {taxDetails.taxName} ({taxDetails.taxRate}%)
                    </p>
                    <p className="text-lg font-bold text-orange-600">
                      {taxDetails.isActive ? formatCurrency(taxDetails.taxAmount) : '0'} ريال
                    </p>
                  </div>
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">الإجمالي شامل الضريبة</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(taxDetails.totalWithTax)} ريال</p>
                  </div>
                </div>
                {!taxDetails.isActive && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    الضريبة غير مفعلة على المبيعات
                  </p>
                )}
              </div>
            )}

            {/* Profit Display */}
            <div className={`p-4 rounded-xl ${profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <p className="text-sm font-medium text-muted-foreground">الربح المتوقع</p>
              <p className={`text-2xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(profit)} ريال
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex-1 h-12 gradient-success hover:opacity-90"
                disabled={addSale.isPending}
              >
                <Save className="w-5 h-5 ml-2" />
                {addSale.isPending ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setActivePage('dashboard')}
                className="h-12 px-6"
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                الرئيسية
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      {invoiceData && (
        <InvoicePreviewDialog
          open={invoiceOpen}
          onOpenChange={handleCloseInvoice}
          data={invoiceData}
        />
      )}
    </>
  );
}
