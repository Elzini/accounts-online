import { Users, Truck, Car } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';

interface TopCustomer { id: string; name: string; phone: string; totalPurchases: number; totalAmount: number; }
interface TopSupplier { id: string; name: string; totalCars: number; totalAmount: number; }
interface TopCar { name: string; model: string; count: number; totalRevenue: number; }
interface TopPerformersCardProps { topCustomers: TopCustomer[]; topSuppliers: TopSupplier[]; topCars: TopCar[]; }

export function TopPerformersCard({ topCustomers, topSuppliers, topCars }: TopPerformersCardProps) {
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const formatCurrency = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(value);
  const gap = language === 'ar' ? 'ml-1' : 'mr-1';

  return (
    <div className="relative overflow-hidden bg-card rounded-xl md:rounded-2xl p-4 md:p-6 border border-border/60">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl md:rounded-t-2xl" style={{ backgroundColor: 'hsl(var(--primary))' }} />
      <h3 className="text-lg font-bold text-card-foreground mb-4">{t.chart_top_performers}</h3>
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="customers" className="text-xs md:text-sm"><Users className={`w-4 h-4 ${gap}`} />{t.chart_customers_tab}</TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs md:text-sm"><Truck className={`w-4 h-4 ${gap}`} />{t.chart_suppliers_tab}</TabsTrigger>
          <TabsTrigger value="cars" className="text-xs md:text-sm"><Car className={`w-4 h-4 ${gap}`} />{t.chart_cars_tab}</TabsTrigger>
        </TabsList>
        <TabsContent value="customers" className="mt-4">
          <ScrollArea className="h-[250px]">
            {topCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t.chart_no_data}</div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{index + 1}</div>
                      <div><p className="font-medium text-sm">{customer.name}</p><p className="text-xs text-muted-foreground">{customer.totalPurchases} {t.chart_purchases_count}</p></div>
                    </div>
                    <div className="text-left"><p className="font-bold text-sm text-success">{formatCurrency(customer.totalAmount)}</p></div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <ScrollArea className="h-[250px]">
            {topSuppliers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t.chart_no_data}</div>
            ) : (
              <div className="space-y-3">
                {topSuppliers.map((supplier, index) => (
                  <div key={supplier.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-sm font-bold text-warning">{index + 1}</div>
                      <div><p className="font-medium text-sm">{supplier.name}</p><p className="text-xs text-muted-foreground">{supplier.totalCars} {t.chart_car_unit}</p></div>
                    </div>
                    <div className="text-left"><p className="font-bold text-sm text-warning">{formatCurrency(supplier.totalAmount)}</p></div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="cars" className="mt-4">
          <ScrollArea className="h-[250px]">
            {topCars.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t.chart_no_data}</div>
            ) : (
              <div className="space-y-3">
                {topCars.map((car, index) => (
                  <div key={`${car.name}-${car.model}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-sm font-bold text-success">{index + 1}</div>
                      <div><p className="font-medium text-sm">{car.name} {car.model}</p><p className="text-xs text-muted-foreground">{car.count} {t.chart_sales_count}</p></div>
                    </div>
                    <div className="text-left"><p className="font-bold text-sm text-primary">{formatCurrency(car.totalRevenue)}</p></div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
