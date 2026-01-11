import { useState } from 'react';
import { ArrowRight, Save, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivePage } from '@/types';
import { toast } from 'sonner';
import { useSuppliers, useAddCar } from '@/hooks/useDatabase';

interface PurchaseFormProps {
  setActivePage: (page: ActivePage) => void;
}

export function PurchaseForm({ setActivePage }: PurchaseFormProps) {
  const { data: suppliers = [] } = useSuppliers();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id || !formData.chassis_number || !formData.name || !formData.purchase_price) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    try {
      await addCar.mutateAsync({
        supplier_id: formData.supplier_id,
        chassis_number: formData.chassis_number,
        name: formData.name,
        model: formData.model || null,
        color: formData.color || null,
        purchase_price: parseFloat(formData.purchase_price),
        purchase_date: formData.purchase_date,
      });
      toast.success('تم إضافة السيارة للمخزون بنجاح');
      setActivePage('purchases');
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('رقم الهيكل موجود مسبقاً');
      } else {
        toast.error('حدث خطأ أثناء إضافة السيارة');
      }
    }
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
  );
}
