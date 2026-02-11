import { useState, useMemo } from 'react';
import { Search, Car, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCars } from '@/hooks/useDatabase';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';

export function CarSearch() {
  const { data: cars = [] } = useCars();
  const { selectedFiscalYear } = useFiscalYear();
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const labels = useIndustryLabels();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();

    const carsInYear = !selectedFiscalYear
      ? cars
      : cars.filter((car) => {
          if (car.fiscal_year_id) return car.fiscal_year_id === selectedFiscalYear.id;
          const fyStart = new Date(selectedFiscalYear.start_date);
          fyStart.setHours(0, 0, 0, 0);
          const fyEnd = new Date(selectedFiscalYear.end_date);
          fyEnd.setHours(23, 59, 59, 999);
          const purchaseDate = new Date(car.purchase_date);
          return purchaseDate >= fyStart && purchaseDate <= fyEnd;
        });

    return carsInYear
      .filter(
        (car) =>
          car.name.toLowerCase().includes(query) ||
          car.chassis_number.toLowerCase().includes(query) ||
          car.model?.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [cars, searchQuery, selectedFiscalYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">بحث</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            البحث في {labels.itemsName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم أو الرقم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              autoFocus
            />
          </div>

          {searchQuery && searchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد نتائج للبحث</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {searchResults.map((car) => (
                <div
                  key={car.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{car.name}</h3>
                        <Badge className={
                          car.status === 'available' ? 'bg-success' : 
                          car.status === 'transferred' ? 'bg-orange-500' : 'bg-muted'
                        }>
                          {car.status === 'available' ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              متاحة
                            </span>
                          ) : car.status === 'transferred' ? (
                            <span className="flex items-center gap-1">
                              <ArrowRightLeft className="w-3 h-3" />
                              محولة
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              مباعة
                            </span>
                          )}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                        <p>رقم الشاسيه: <span className="font-mono">{car.chassis_number}</span></p>
                        {car.model && <p>الموديل: {car.model}</p>}
                        {car.color && <p>اللون: {car.color}</p>}
                        <p>رقم المخزون: {car.inventory_number}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">سعر الشراء</p>
                      <p className="font-bold text-primary">{formatCurrency(Number(car.purchase_price))} ريال</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(car.purchase_date)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ابدأ الكتابة للبحث</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}