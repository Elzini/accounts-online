import { useState } from 'react';
import { ArrowRight, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActivePage } from '@/types';
import { toast } from 'sonner';
import { useAddCustomer } from '@/hooks/useDatabase';

interface CustomerFormProps {
  setActivePage: (page: ActivePage) => void;
}

export function CustomerForm({ setActivePage }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    id_number: '',
    registration_number: '',
    phone: '',
    address: '',
  });

  const addCustomer = useAddCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    try {
      await addCustomer.mutateAsync(formData);
      toast.success('تم إضافة العميل بنجاح');
      setActivePage('customers');
    } catch (error: any) {
      console.error('Error adding customer:', error);
      if (error?.code === '42501' || error?.message?.includes('row-level security')) {
        toast.error('ليس لديك صلاحية لإضافة عميل');
      } else if (error?.code === '23514' || error?.message?.includes('check constraint')) {
        toast.error('البيانات المدخلة غير صالحة - تأكد من صحة المعلومات');
      } else {
        toast.error('حدث خطأ أثناء إضافة العميل: ' + (error?.message || 'خطأ غير معروف'));
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
              <Label htmlFor="id_number">رقم الهوية</Label>
              <Input
                id="id_number"
                value={formData.id_number}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                placeholder="أدخل رقم الهوية"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_number">الرقم الضريبي</Label>
              <Input
                id="registration_number"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                placeholder="أدخل الرقم الضريبي"
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
            <Button 
              type="submit" 
              className="flex-1 h-12 gradient-primary hover:opacity-90"
              disabled={addCustomer.isPending}
            >
              <Save className="w-5 h-5 ml-2" />
              {addCustomer.isPending ? 'جاري الحفظ...' : 'حفظ البيانات'}
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
