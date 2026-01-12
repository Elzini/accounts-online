import { useState } from 'react';
import { ArrowRight, Save, ShoppingCart, Plus, X, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ActivePage } from '@/types';
import { toast } from 'sonner';
import { useSuppliers, useAddPurchaseBatch } from '@/hooks/useDatabase';

interface BatchPurchaseFormProps {
  setActivePage: (page: ActivePage) => void;
}

interface CarItem {
  id: string;
  chassis_number: string;
  name: string;
  model: string;
  color: string;
  purchase_price: string;
}

const createEmptyCar = (): CarItem => ({
  id: crypto.randomUUID(),
  chassis_number: '',
  name: '',
  model: '',
  color: '',
  purchase_price: '',
});

export function BatchPurchaseForm({ setActivePage }: BatchPurchaseFormProps) {
  const { data: suppliers = [] } = useSuppliers();
  const addPurchaseBatch = useAddPurchaseBatch();

  const [batchData, setBatchData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [cars, setCars] = useState<CarItem[]>([createEmptyCar()]);

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

  const handleCarChange = (id: string, field: keyof CarItem, value: string) => {
    setCars(cars.map(car => 
      car.id === id ? { ...car, [field]: value } : car
    ));
  };

  const calculateTotal = () => {
    return cars.reduce((sum, car) => sum + (parseFloat(car.purchase_price) || 0), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!batchData.supplier_id) {
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
      await addPurchaseBatch.mutateAsync({
        batch: {
          supplier_id: batchData.supplier_id,
          purchase_date: batchData.purchase_date,
          notes: batchData.notes || null,
        },
        cars: cars.map(car => ({
          chassis_number: car.chassis_number,
          name: car.name,
          model: car.model || null,
          color: car.color || null,
          purchase_price: parseFloat(car.purchase_price),
        })),
      });
      toast.success(`تم إضافة ${cars.length} سيارة للمخزون بنجاح`);
      setActivePage('purchases');
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('أحد أرقام الهيكل موجود مسبقاً');
      } else {
        console.error('Purchase batch error:', error);
        toast.error('حدث خطأ أثناء إضافة السيارات');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        {/* Header */}
        <div className="gradient-primary p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">إضافة سيارات جديدة</h1>
              <p className="text-white/80 text-sm">يمكنك إضافة أكثر من سيارة في فاتورة واحدة</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Batch Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المورد *</Label>
              <Select value={batchData.supplier_id} onValueChange={(v) => setBatchData({ ...batchData, supplier_id: v })}>
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
              <Label htmlFor="purchase_date">تاريخ الشراء</Label>
              <Input
                id="purchase_date"
                type="date"
                value={batchData.purchase_date}
                onChange={(e) => setBatchData({ ...batchData, purchase_date: e.target.value })}
                className="h-12"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              value={batchData.notes}
              onChange={(e) => setBatchData({ ...batchData, notes: e.target.value })}
              placeholder="ملاحظات إضافية على الفاتورة"
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Cars Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">السيارات ({cars.length})</Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCar}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة سيارة
              </Button>
            </div>

            {/* Cars List */}
            <div className="space-y-4">
              {cars.map((car, index) => (
                <div key={car.id} className="bg-muted/50 rounded-xl p-4 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      <span className="font-semibold">سيارة {index + 1}</span>
                    </div>
                    {cars.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCar(car.id)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`chassis-${car.id}`}>رقم الهيكل *</Label>
                      <Input
                        id={`chassis-${car.id}`}
                        value={car.chassis_number}
                        onChange={(e) => handleCarChange(car.id, 'chassis_number', e.target.value)}
                        placeholder="أدخل رقم الهيكل"
                        className="h-10"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`name-${car.id}`}>اسم السيارة *</Label>
                      <Input
                        id={`name-${car.id}`}
                        value={car.name}
                        onChange={(e) => handleCarChange(car.id, 'name', e.target.value)}
                        placeholder="مثال: تويوتا كامري"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`model-${car.id}`}>الموديل</Label>
                      <Input
                        id={`model-${car.id}`}
                        value={car.model}
                        onChange={(e) => handleCarChange(car.id, 'model', e.target.value)}
                        placeholder="مثال: 2024"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`color-${car.id}`}>اللون</Label>
                      <Input
                        id={`color-${car.id}`}
                        value={car.color}
                        onChange={(e) => handleCarChange(car.id, 'color', e.target.value)}
                        placeholder="أدخل اللون"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`price-${car.id}`}>سعر الشراء *</Label>
                      <Input
                        id={`price-${car.id}`}
                        type="number"
                        value={car.purchase_price}
                        onChange={(e) => handleCarChange(car.id, 'purchase_price', e.target.value)}
                        placeholder="0"
                        className="h-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Display */}
          <div className="bg-primary/10 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي قيمة الشراء</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())} ريال</p>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-muted-foreground">عدد السيارات</p>
                <p className="text-2xl font-bold text-primary">{cars.length}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1 h-12 gradient-primary hover:opacity-90"
              disabled={addPurchaseBatch.isPending}
            >
              <Save className="w-5 h-5 ml-2" />
              {addPurchaseBatch.isPending ? 'جاري الحفظ...' : `حفظ البيانات (${cars.length} سيارة)`}
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