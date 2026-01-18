import { useState, useMemo } from 'react';
import { ArrowRight, Save, ShoppingCart, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivePage } from '@/types';
import { toast } from 'sonner';
import { useSuppliers, useAddCar } from '@/hooks/useDatabase';
import { useTaxSettings } from '@/hooks/useAccounting';
import { InvoicePreviewDialog } from '@/components/invoices/InvoicePreviewDialog';
import { useCompany } from '@/contexts/CompanyContext';

interface PurchaseFormProps {
  setActivePage: (page: ActivePage) => void;
}

export function PurchaseForm({ setActivePage }: PurchaseFormProps) {
  const { data: suppliers = [] } = useSuppliers();
  const { data: taxSettings } = useTaxSettings();
  const { company } = useCompany();
  const addCar = useAddCar();

  const [formData, setFormData] = useState({
    supplier_id: '',
    chassis_number: '',
    name: '',
    model: '',
    color: '',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
  });

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [savedCarData, setSavedCarData] = useState<any>(null);

  // Calculate tax details
  const taxDetails = useMemo(() => {
    const price = parseFloat(formData.purchase_price) || 0;
    const isActive = taxSettings?.is_active && taxSettings?.apply_to_purchases;
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
  }, [formData.purchase_price, taxSettings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(Math.round(value * 100) / 100);
  };

  const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id || !formData.chassis_number || !formData.name || !formData.purchase_price) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    try {
      const result = await addCar.mutateAsync({
        supplier_id: formData.supplier_id,
        chassis_number: formData.chassis_number,
        name: formData.name,
        model: formData.model || null,
        color: formData.color || null,
        purchase_price: parseFloat(formData.purchase_price),
        purchase_date: formData.purchase_date,
      });
      
      // Store saved data for invoice
      setSavedCarData({
        ...result,
        supplier: selectedSupplier,
      });
      
      toast.success('تم إضافة السيارة للمخزون بنجاح');
      setInvoiceOpen(true);
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('رقم الهيكل موجود مسبقاً');
      } else {
        toast.error('حدث خطأ أثناء إضافة السيارة');
      }
    }
  };

  const handleCloseInvoice = (open: boolean) => {
    setInvoiceOpen(open);
    if (!open) {
      setActivePage('purchases');
    }
  };

  // Prepare invoice data
  const invoiceData = useMemo(() => {
    if (!savedCarData) return null;
    
    const price = parseFloat(formData.purchase_price) || 0;
    const isActive = taxSettings?.is_active && taxSettings?.apply_to_purchases;
    const taxRate = isActive ? (taxSettings?.tax_rate || 0) : 0;
    const baseAmount = isActive ? price / (1 + taxRate / 100) : price;
    const taxAmount = isActive ? price - baseAmount : 0;

    return {
      invoiceNumber: savedCarData.inventory_number || Date.now(),
      invoiceDate: formData.purchase_date,
      invoiceType: 'purchase' as const,
      sellerName: selectedSupplier?.name || 'المورد',
      sellerTaxNumber: selectedSupplier?.id_number || '',
      sellerAddress: selectedSupplier?.address || '',
      buyerName: company?.name || taxSettings?.company_name_ar || 'الشركة',
      buyerPhone: company?.phone || '',
      buyerAddress: taxSettings?.national_address || company?.address || '',
      items: [
        {
          description: `${formData.name} ${formData.model || ''} - ${formData.chassis_number}`,
          quantity: 1,
          unitPrice: baseAmount,
          taxRate: taxRate,
          total: price,
        },
      ],
      subtotal: baseAmount,
      taxAmount: taxAmount,
      total: price,
      taxSettings: taxSettings,
    };
  }, [savedCarData, formData, taxSettings, selectedSupplier, company]);

  return (
    <>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          {/* Header */}
          <div className="gradient-primary p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">إضافة سيارة جديدة</h1>
                <p className="text-white/80 text-sm">إضافة سيارة للمخزون</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label>المورد *</Label>
              <Select value={formData.supplier_id} onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}>
                <SelectTrigger className="h-12">
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

            <div className="space-y-2">
              <Label htmlFor="chassis_number">رقم الهيكل *</Label>
              <Input
                id="chassis_number"
                value={formData.chassis_number}
                onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
                placeholder="أدخل رقم الهيكل"
                className="h-12"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم السيارة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: تويوتا كامري"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">الموديل</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="مثال: 2024"
                  className="h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">اللون</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="أدخل اللون"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_price">سعر الشراء *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  placeholder="0"
                  className="h-12"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">تاريخ الشراء</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="h-12"
                dir="ltr"
              />
            </div>

            {/* Tax Details */}
            {formData.purchase_price && (
              <div className="bg-muted/50 p-4 rounded-xl border">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-5 h-5 text-primary" />
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
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">الإجمالي شامل الضريبة</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(taxDetails.totalWithTax)} ريال</p>
                  </div>
                </div>
                {!taxDetails.isActive && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    الضريبة غير مفعلة على المشتريات
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex-1 h-12 gradient-primary hover:opacity-90"
                disabled={addCar.isPending}
              >
                <Save className="w-5 h-5 ml-2" />
                {addCar.isPending ? 'جاري الحفظ...' : 'حفظ البيانات'}
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
