import { useState } from 'react';
import { ArrowRight, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Customer, ActivePage } from '@/types';
import { toast } from 'sonner';

interface CustomerFormProps {
  onSave: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  setActivePage: (page: ActivePage) => void;
}

export function CustomerForm({ onSave, setActivePage }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    registrationNumber: '',
    phone: '',
    address: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    onSave(formData);
    toast.success('تم إضافة العميل بنجاح');
    setActivePage('customers');
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        {/* Header */}
        <div className="gradient-primary p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">إضافة عميل جديد</h1>
              <p className="text-white/80 text-sm">أدخل بيانات العميل</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">اسم العميل *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسم العميل"
              className="h-12"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idNumber">رقم الهوية</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="أدخل رقم الهوية"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">رقم السجل</Label>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="أدخل رقم السجل"
                className="h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="أدخل رقم الهاتف"
              className="h-12"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="أدخل العنوان"
              className="h-12"
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
