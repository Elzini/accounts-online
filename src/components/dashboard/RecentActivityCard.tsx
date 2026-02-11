import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ArrowUpRight, Car } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecentSale {
  id: string;
  date: string;
  customerName: string;
  carName: string;
  amount: number;
  profit: number;
}

interface RecentActivityCardProps {
  recentSales: RecentSale[];
}

export function RecentActivityCard({ recentSales }: RecentActivityCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: ar });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative overflow-hidden bg-card rounded-xl md:rounded-2xl p-4 md:p-6 border border-border/60">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl md:rounded-t-2xl" style={{ backgroundColor: 'hsl(var(--success))' }} />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-card-foreground">آخر المبيعات</h3>
        <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
      </div>
      <ScrollArea className="h-[280px]">
        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد مبيعات حديثة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Car className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{sale.carName}</p>
                      <p className="text-xs text-muted-foreground">{sale.customerName}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{formatCurrency(sale.amount)}</p>
                    <p className="text-xs text-success">+{formatCurrency(sale.profit)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{formatDate(sale.date)}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
