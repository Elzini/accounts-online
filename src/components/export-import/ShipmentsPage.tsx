import { useState } from 'react';
import { Plus, Search, Ship, Loader2, Plane, Truck as TruckIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Shipment {
  id: string;
  shipment_number: number;
  shipment_type: string;
  status: string;
  origin_country: string | null;
  destination_country: string | null;
  supplier_name: string | null;
  customer_name: string | null;
  total_value: number;
  currency: string;
  shipping_cost: number;
  customs_fees: number;
  shipping_method: string;
  departure_date: string | null;
  arrival_date: string | null;
  container_number: string | null;
  created_at: string;
}

export function ShipmentsPage() {
  const { companyId } = useCompany();
  const [search, setSearch] = useState('');

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('shipments')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Shipment[];
    },
    enabled: !!companyId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge variant="secondary">تم التسليم</Badge>;
      case 'in_transit': return <Badge variant="secondary">في الطريق</Badge>;
      case 'customs': return <Badge variant="outline">بالجمارك</Badge>;
      case 'cancelled': return <Badge variant="destructive">ملغي</Badge>;
      default: return <Badge variant="outline">معلق</Badge>;
    }
  };

  const getShippingIcon = (method: string) => {
    switch (method) {
      case 'sea': return <Ship className="w-4 h-4" />;
      case 'air': return <Plane className="w-4 h-4" />;
      default: return <TruckIcon className="w-4 h-4" />;
    }
  };

  const filtered = shipments.filter(s =>
    String(s.shipment_number).includes(search) ||
    (s.supplier_name || '').includes(search) ||
    (s.customer_name || '').includes(search) ||
    (s.container_number || '').includes(search)
  );

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ship className="w-6 h-6" />
            الشحنات
          </h1>
          <p className="text-muted-foreground mt-1">{shipments.length} شحنة</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />شحنة جديدة</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="بحث في الشحنات..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الشحنة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المورد/العميل</TableHead>
                <TableHead>المنشأ → الوجهة</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead>الشحن</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(shipment => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium">#{shipment.shipment_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {shipment.shipment_type === 'import' ? 'استيراد' : 'تصدير'}
                    </Badge>
                  </TableCell>
                  <TableCell>{shipment.supplier_name || shipment.customer_name || '-'}</TableCell>
                  <TableCell className="text-sm">
                    {shipment.origin_country || '?'} → {shipment.destination_country || '?'}
                  </TableCell>
                  <TableCell className="font-medium">{shipment.total_value.toLocaleString()} {shipment.currency}</TableCell>
                  <TableCell className="flex items-center gap-1">
                    {getShippingIcon(shipment.shipping_method)}
                    <span className="text-sm">{shipment.shipping_method === 'sea' ? 'بحري' : shipment.shipping_method === 'air' ? 'جوي' : 'بري'}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد شحنات</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
