import { useState } from 'react';
import { LayoutGrid, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface RestaurantTable {
  id: string;
  table_number: string;
  capacity: number;
  status: string;
}

export function TablesPage() {
  const { companyId } = useCompany();

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['restaurant-tables', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('restaurant_tables')
        .select('*')
        .eq('company_id', companyId!)
        .order('table_number', { ascending: true });
      if (error) throw error;
      return data as RestaurantTable[];
    },
    enabled: !!companyId,
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="w-6 h-6" />
            إدارة الطاولات
          </h1>
          <p className="text-muted-foreground mt-1">{tables.length} طاولة</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />إضافة طاولة</Button>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {tables.map(table => (
          <Card key={table.id} className={`cursor-pointer transition-colors ${table.status === 'occupied' ? 'border-destructive bg-destructive/5' : table.status === 'reserved' ? 'border-yellow-500 bg-yellow-500/5' : 'border-primary/50 bg-primary/5'}`}>
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold mb-1">{table.table_number}</h3>
              <p className="text-sm text-muted-foreground mb-2">{table.capacity} أشخاص</p>
              <Badge variant={table.status === 'occupied' ? 'destructive' : table.status === 'reserved' ? 'secondary' : 'outline'}>
                {table.status === 'occupied' ? 'مشغولة' : table.status === 'reserved' ? 'محجوزة' : 'متاحة'}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {!tables.length && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد طاولات مسجلة</p>
          </div>
        )}
      </div>
    </div>
  );
}
