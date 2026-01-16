import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Save, DollarSign, Plus, X, Car, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ActivePage } from '@/types';
import { toast } from 'sonner';
import { useCustomers, useCars, useAddMultiCarSale } from '@/hooks/useDatabase';
import { useCarTransfers, getPendingTransferForCar, linkTransferToSale } from '@/hooks/useTransfers';
import { CarTransfer } from '@/services/transfers';

interface MultiCarSaleFormProps {
  setActivePage: (page: ActivePage) => void;
}

interface SelectedCarItem {
  car_id: string;
  sale_price: string;
  purchase_price: number;
  car_name: string;
  model: string;
  chassis_number: string;
  pendingTransfer?: CarTransfer | null;
}

export function MultiCarSaleForm({ setActivePage }: MultiCarSaleFormProps) {
  const { data: customers = [] } = useCustomers();
  const { data: allCars = [] } = useCars();
  const addMultiCarSale = useAddMultiCarSale();

  // Include both available and transferred cars for sale
  const availableCars = useMemo(() => 
    allCars.filter(car => car.status === 'available' || car.status === 'transferred'),
    [allCars]
  );

  const [formData, setFormData] = useState({
    customer_id: '',
    seller_name: '',
    commission: '',
    other_expenses: '',
    sale_date: new Date().toISOString().split('T')[0],
  });

  const [selectedCars, setSelectedCars] = useState<SelectedCarItem[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalSalePrice, setTotalSalePrice] = useState(0);
  const [totalPurchasePrice, setTotalPurchasePrice] = useState(0);

  // Cars that are still available for selection (not already selected)
  const remainingCars = useMemo(() => 
    availableCars.filter(car => !selectedCars.some(sc => sc.car_id === car.id)),
    [availableCars, selectedCars]
  );

  useEffect(() => {
    const saleTotal = selectedCars.reduce((sum, car) => sum + (parseFloat(car.sale_price) || 0), 0);
    const purchaseTotal = selectedCars.reduce((sum, car) => sum + car.purchase_price, 0);
    const commission = parseFloat(formData.commission) || 0;
    const otherExpenses = parseFloat(formData.other_expenses) || 0;
    
    setTotalSalePrice(saleTotal);
    setTotalPurchasePrice(purchaseTotal);
    setTotalProfit(saleTotal - purchaseTotal - commission - otherExpenses);
  }, [selectedCars, formData.commission, formData.other_expenses]);

  const handleAddCar = async (carId: string) => {
    const car = availableCars.find(c => c.id === carId);
    if (!car) return;

    // Check if car has a pending transfer
    let pendingTransfer: CarTransfer | null = null;
    try {
      pendingTransfer = await getPendingTransferForCar(carId);
    } catch (error) {
      console.error('Error checking pending transfer:', error);
    }

    setSelectedCars([...selectedCars, {
      car_id: car.id,
      sale_price: '',
      purchase_price: Number(car.purchase_price),
      car_name: car.name,
      model: car.model || '',
      chassis_number: car.chassis_number,
      pendingTransfer,
    }]);
  };

  const handleRemoveCar = (carId: string) => {
    setSelectedCars(selectedCars.filter(car => car.car_id !== carId));
  };

  const handleCarPriceChange = (carId: string, salePrice: string) => {
    setSelectedCars(selectedCars.map(car => 
      car.car_id === carId ? { ...car, sale_price: salePrice } : car
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      toast.error('الرجاء اختيار العميل');
      return;
    }

    if (selectedCars.length === 0) {
      toast.error('الرجاء إضافة سيارة واحدة على الأقل');
      return;
    }

    const invalidCar = selectedCars.find(car => !car.sale_price || parseFloat(car.sale_price) <= 0);
    if (invalidCar) {
      toast.error('الرجاء إدخال سعر البيع لجميع السيارات');
      return;
    }

    try {
      const sale = await addMultiCarSale.mutateAsync({
        customer_id: formData.customer_id,
        seller_name: formData.seller_name || undefined,
        commission: parseFloat(formData.commission) || 0,
        other_expenses: parseFloat(formData.other_expenses) || 0,
        sale_date: formData.sale_date,
        cars: selectedCars.map(car => ({
          car_id: car.car_id,
          sale_price: parseFloat(car.sale_price),
          purchase_price: car.purchase_price,
        })),
      });

      // Link pending transfers to this sale
      for (const car of selectedCars) {
        if (car.pendingTransfer) {
          try {
            await linkTransferToSale(
              car.pendingTransfer.id,
              sale.id,
              parseFloat(car.sale_price),
              car.pendingTransfer.agreed_commission,
              car.pendingTransfer.commission_percentage
            );
          } catch (error) {
            console.error('Error linking transfer to sale:', error);
          }
        }
      }

      const transferredCarsCount = selectedCars.filter(c => c.pendingTransfer).length;
      const message = transferredCarsCount > 0
        ? `تم تسجيل بيع ${selectedCars.length} سيارة وربط ${transferredCarsCount} تحويل بنجاح`
        : `تم تسجيل عملية بيع ${selectedCars.length} سيارة بنجاح`;
      
      toast.success(message);
      setActivePage('sales');
    } catch (error) {
      console.error('Sale error:', error);
      toast.error('حدث خطأ أثناء تسجيل البيع');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        {/* Header */}
        <div className="gradient-success p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">تسجيل عملية بيع</h1>
              <p className="text-white/80 text-sm">يمكنك إضافة أكثر من سيارة في فاتورة واحدة</p>
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

          {/* Cars Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">السيارات ({selectedCars.length})</Label>
              {remainingCars.length > 0 && (
                <Select onValueChange={handleAddCar} value="">
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="إضافة سيارة" />
                  </SelectTrigger>
                  <SelectContent>
                    {remainingCars.map((car) => (
                      <SelectItem key={car.id} value={car.id}>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          <span>{car.name} - {car.model}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Cars List */}
            {selectedCars.length === 0 ? (
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center">
                <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لم يتم اختيار أي سيارة</p>
                <p className="text-sm text-muted-foreground">اختر سيارة من القائمة أعلاه</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedCars.map((car, index) => (
                  <div key={car.car_id} className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{car.car_name} - {car.model}</h4>
                          {car.pendingTransfer && (
                            <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300">
                              <ArrowLeftRight className="w-3 h-3" />
                              محولة لـ {car.pendingTransfer.partner_dealership?.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">رقم الهيكل: {car.chassis_number}</p>
                        {car.pendingTransfer && (
                          <p className="text-xs text-blue-600 mt-1">
                            العمولة: {car.pendingTransfer.agreed_commission > 0 
                              ? `${formatCurrency(car.pendingTransfer.agreed_commission)} ريال`
                              : `${car.pendingTransfer.commission_percentage}%`
                            }
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCar(car.car_id)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">سعر الشراء</p>
                        <p className="font-medium">{formatCurrency(car.purchase_price)} ريال</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor={`sale-price-${index}`} className="text-sm mb-1 block">سعر البيع *</Label>
                        <Input
                          id={`sale-price-${index}`}
                          type="number"
                          value={car.sale_price}
                          onChange={(e) => handleCarPriceChange(car.car_id, e.target.value)}
                          placeholder="أدخل سعر البيع"
                          className="h-10"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          {/* Totals Display */}
          {selectedCars.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 p-4 rounded-xl">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الشراء</p>
                <p className="text-xl font-bold">{formatCurrency(totalPurchasePrice)} ريال</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-xl">
                <p className="text-sm font-medium text-muted-foreground">إجمالي البيع</p>
                <p className="text-xl font-bold">{formatCurrency(totalSalePrice)} ريال</p>
              </div>
              <div className={`p-4 rounded-xl ${totalProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <p className="text-sm font-medium text-muted-foreground">الربح الإجمالي</p>
                <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(totalProfit)} ريال
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1 h-12 gradient-success hover:opacity-90"
              disabled={addMultiCarSale.isPending || selectedCars.length === 0}
            >
              <Save className="w-5 h-5 ml-2" />
              {addMultiCarSale.isPending ? 'جاري الحفظ...' : `حفظ البيانات (${selectedCars.length} سيارة)`}
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