import { useState, useEffect } from 'react';
import { ArrowRight, Save, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Customer, Sale, ActivePage } from '@/types';
import { toast } from 'sonner';

interface SaleFormProps {
  customers: Customer[];
  cars: Car[];
  nextSaleId: number;
  onSave: (sale: Omit<Sale, 'id' | 'profit'>) => void;
  setActivePage: (page: ActivePage) => void;
}

export function SaleForm({ customers, cars, nextSaleId, onSave, setActivePage }: SaleFormProps) {
  const availableCars = cars.filter(car => car.status === 'available');
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    carId: '',
    chassisNumber: '',
    inventoryNumber: '',
    carName: '',
    model: '',
    color: '',
    purchasePrice: '',
    salePrice: '',
    sellerName: '',
    commission: '',
    otherExpenses: '',
    saleDate: new Date().toISOString().split('T')[0],
  });

  const [profit, setProfit] = useState(0);

  useEffect(() => {
    const salePrice = parseFloat(formData.salePrice) || 0;
    const purchasePrice = parseFloat(formData.purchasePrice) || 0;
    const commission = parseFloat(formData.commission) || 0;
    const otherExpenses = parseFloat(formData.otherExpenses) || 0;
    setProfit(salePrice - purchasePrice - commission - otherExpenses);
  }, [formData.salePrice, formData.purchasePrice, formData.commission, formData.otherExpenses]);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id.toString() === customerId);
    setFormData({
      ...formData,
      customerId,
      customerName: customer?.name || '',
    });
  };

  const handleCarChange = (carId: string) => {
    const car = availableCars.find(c => c.id.toString() === carId);
    if (car) {
      setFormData({
        ...formData,
        carId,
        chassisNumber: car.chassisNumber,
        inventoryNumber: car.inventoryNumber.toString(),
        carName: car.name,
        model: car.model,
        color: car.color,
        purchasePrice: car.purchasePrice.toString(),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.carId || !formData.salePrice) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    onSave({
      carId: parseInt(formData.carId),
      customerId: parseInt(formData.customerId),
      customerName: formData.customerName,
      carName: formData.carName,
      model: formData.model,
      color: formData.color,
      chassisNumber: formData.chassisNumber,
      purchasePrice: parseFloat(formData.purchasePrice),
      salePrice: parseFloat(formData.salePrice),
      sellerName: formData.sellerName,
      commission: parseFloat(formData.commission) || 0,
      otherExpenses: parseFloat(formData.otherExpenses) || 0,
      saleDate: new Date(formData.saleDate),
    });
    toast.success('تم تسجيل عملية البيع بنجاح');
    setActivePage('sales');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  return (
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
              <p className="text-white/80 text-sm">رقم البيع: {nextSaleId}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم العميل *</Label>
              <Select value={formData.customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">اسم العميل</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                readOnly
                className="h-12 bg-muted"
              />
            </div>
          </div>

          {/* Car Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم الهيكل *</Label>
              <Select value={formData.carId} onValueChange={handleCarChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="اختر السيارة" />
                </SelectTrigger>
                <SelectContent>
                  {availableCars.map((car) => (
                    <SelectItem key={car.id} value={car.id.toString()}>
                      {car.chassisNumber} - {car.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventoryNumber">رقم المخزون</Label>
              <Input
                id="inventoryNumber"
                value={formData.inventoryNumber}
                readOnly
                className="h-12 bg-muted"
              />
            </div>
          </div>

          {/* Car Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carName">اسم السيارة</Label>
              <Input id="carName" value={formData.carName} readOnly className="h-12 bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">الموديل</Label>
              <Input id="model" value={formData.model} readOnly className="h-12 bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">اللون</Label>
              <Input id="color" value={formData.color} readOnly className="h-12 bg-muted" />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">سعر الشراء</Label>
              <Input
                id="purchasePrice"
                value={formData.purchasePrice}
                readOnly
                className="h-12 bg-muted"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">سعر البيع *</Label>
              <Input
                id="salePrice"
                type="number"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                placeholder="0"
                className="h-12"
                dir="ltr"
              />
            </div>
          </div>

          {/* Seller & Expenses */}
          <div className="space-y-2">
            <Label htmlFor="sellerName">اسم البائع</Label>
            <Input
              id="sellerName"
              value={formData.sellerName}
              onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
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
              <Label htmlFor="otherExpenses">مصروفات أخرى</Label>
              <Input
                id="otherExpenses"
                type="number"
                value={formData.otherExpenses}
                onChange={(e) => setFormData({ ...formData, otherExpenses: e.target.value })}
                placeholder="0"
                className="h-12"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saleDate">تاريخ البيع</Label>
            <Input
              id="saleDate"
              type="date"
              value={formData.saleDate}
              onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
              className="h-12"
              dir="ltr"
            />
          </div>

          {/* Profit Display */}
          <div className={`p-4 rounded-xl ${profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
            <p className="text-sm font-medium text-muted-foreground">الربح المتوقع</p>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(profit)} ريال
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-12 gradient-success hover:opacity-90">
              <Save className="w-5 h-5 ml-2" />
              حفظ البيانات
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
  );
}
