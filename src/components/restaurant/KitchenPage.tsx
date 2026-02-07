import { ChefHat, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface KitchenOrder {
  id: string;
  order_number: number;
  status: string;
  table_number: string | null;
  customer_name: string | null;
  notes: string | null;
}

export function KitchenPage() {
  const { companyId } = useCompany();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-orders', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('restaurant_orders')
        .select('*')
        .eq('company_id', companyId!)
        .in('status', ['new', 'preparing'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as KitchenOrder[];
    },
    enabled: !!companyId,
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChefHat className="w-6 h-6" />
          شاشة المطبخ
        </h1>
        <p className="text-muted-foreground mt-1">{orders.length} طلب نشط</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map(order => (
          <Card key={order.id} className={order.status === 'preparing' ? 'border-yellow-500' : 'border-primary'}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">طلب #{order.order_number}</CardTitle>
                <Badge variant={order.status === 'preparing' ? 'secondary' : 'outline'}>
                  {order.status === 'preparing' ? 'قيد التحضير' : 'جديد'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {order.table_number ? `طاولة ${order.table_number}` : order.customer_name || 'بدون اسم'}
              </p>
            </CardHeader>
            <CardContent>
              {order.notes && <p className="text-sm mb-3 text-muted-foreground">{order.notes}</p>}
              <div className="flex gap-2">
                {order.status === 'new' && <Button size="sm" className="flex-1">بدء التحضير</Button>}
                {order.status === 'preparing' && <Button size="sm" variant="secondary" className="flex-1">جاهز</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
        {!orders.length && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد طلبات نشطة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
