import { useState } from 'react';
import { ArrowRight, Save, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ActivePage } from '@/types';
import { toast } from 'sonner';
import { useAddSupplier } from '@/hooks/useDatabase';

interface SupplierFormProps {
  setActivePage: (page: ActivePage) => void;
}

export function SupplierForm({ setActivePage }: SupplierFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    id_number: '',
    registration_number: '',
    phone: '',
    address: '',
    notes: '',
  });

  const addSupplier = useAddSupplier();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    // Validate phone length (5-30 characters)
    if (formData.phone.length < 5 || formData.phone.length > 30) {
      toast.error('رقم الهاتف يجب أن يكون بين 5 و 30 حرفاً');
      return;
    }

    // Validate name length (1-200 characters)
    if (formData.name.length < 1 || formData.name.length > 200) {
      toast.error('اسم المورد يجب أن يكون بين 1 و 200 حرف');
      return;
    }

    // Validate notes length (max 1000 characters)
    if (formData.notes && formData.notes.length > 1000) {
      toast.error('الملاحظات يجب أن تكون أقل من 1000 حرف');
      return;
    }

    try {
      await addSupplier.mutateAsync(formData);
      toast.success('تم إضافة المورد بنجاح');
      setActivePage('suppliers');
    } catch (error: any) {
      console.error('Error adding supplier:', error);
      if (error?.code === '42501' || error?.message?.includes('row-level security')) {
        toast.error('ليس لديك صلاحية لإضافة مورد');
      } else if (error?.code === '23514') {
        if (error?.message?.includes('phone')) {
          toast.error('رقم الهاتف يجب أن يكون بين 5 و 30 حرفاً');
        } else if (error?.message?.includes('name')) {
          toast.error('اسم المورد يجب أن يكون بين 1 و 200 حرف');
        } else {
          toast.error('البيانات المدخلة غير صالحة - تأكد من صحة المعلومات');
        }
      } else {
        toast.error('حدث خطأ أثناء إضافة المورد');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        {/* Header */}
        <div className="gradient-warning p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">إضافة مورد جديد</h1>
              <p className="text-white/80 text-sm">أدخل بيانات المورد</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المورد *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسم المورد"
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
            <Label htmlFor="phone">رقم الهاتف * (5-30 حرفاً)</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="أدخل رقم الهاتف (مثال: 05xxxxxxxx)"
              className="h-12"
              dir="ltr"
              minLength={5}
              maxLength={30}
            />
            {formData.phone && formData.phone.length < 5 && (
              <p className="text-xs text-destructive">رقم الهاتف قصير جداً (الحد الأدنى 5 أحرف)</p>
            )}
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

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أدخل أي ملاحظات إضافية"
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1 h-12 gradient-warning hover:opacity-90"
              disabled={addSupplier.isPending}
            >
              <Save className="w-5 h-5 ml-2" />
              {addSupplier.isPending ? 'جاري الحفظ...' : 'حفظ البيانات'}
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
