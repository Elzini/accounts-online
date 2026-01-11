import { useState } from 'react';
import { ArrowRight, Save, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Supplier, ActivePage } from '@/types';
import { toast } from 'sonner';

interface PurchaseFormProps {
  suppliers: Supplier[];
  nextCarId: number;
  onSave: (car: Omit<Car, 'id' | 'inventoryNumber' | 'status'>) => void;
  setActivePage: (page: ActivePage) => void;
}

export function PurchaseForm({ suppliers, nextCarId, onSave, setActivePage }: PurchaseFormProps) {
  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    chassisNumber: '',
    name: '',
    model: '',
    color: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id.toString() === supplierId);
    setFormData({
      ...formData,
      supplierId,
      supplierName: supplier?.name || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId || !formData.chassisNumber || !formData.name || !formData.purchasePrice) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    onSave({
      chassisNumber: formData.chassisNumber,
      name: formData.name,
      model: formData.model,
      color: formData.color,
      purchasePrice: parseFloat(formData.purchasePrice),
      purchaseDate: new Date(formData.purchaseDate),
      supplierId: parseInt(formData.supplierId),
      supplierName: formData.supplierName,
    });
    toast.success('تم إضافة السيارة للمخزون بنجاح');
    setActivePage('purchases');
  };

  return (
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
              <p className="text-white/80 text-sm">رقم السيارة: {nextCarId} | رقم المخزون: {nextCarId}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم المورد *</Label>
              <Select value={formData.supplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierName">اسم المورد</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                readOnly
                className="h-12 bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chassisNumber">رقم الهيكل *</Label>
            <Input
              id="chassisNumber"
              value={formData.chassisNumber}
              onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
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
              <Label htmlFor="purchasePrice">سعر الشراء *</Label>
              <Input
                id="purchasePrice"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0"
                className="h-12"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">تاريخ الشراء</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              className="h-12"
              dir="ltr"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-12 gradient-primary hover:opacity-90">
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
