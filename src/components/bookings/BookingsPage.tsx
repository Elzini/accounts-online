import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, CalendarCheck, Clock, Users, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function BookingsPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', serviceType: '', bookingDate: '', bookingTime: '' });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('*').eq('company_id', companyId!).order('booking_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('bookings').insert({ company_id: companyId!, customer_name: form.customerName, customer_phone: form.customerPhone || null, service_type: form.serviceType || null, booking_date: form.bookingDate, booking_time: form.bookingTime || null, status: 'confirmed' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bookings'] }); toast.success(t.bk_created); setShowAdd(false); setForm({ customerName: '', customerPhone: '', serviceType: '', bookingDate: '', bookingTime: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('bookings').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bookings'] }); toast.success(t.mod_deleted); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.bk_title}</h1><p className="text-muted-foreground">{t.bk_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.bk_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.bk_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.bk_customer_name}</Label><Input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} /></div>
              <div><Label>{t.phone}</Label><Input value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))} /></div>
              <div><Label>{t.bk_service}</Label><Input value={form.serviceType} onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.date}</Label><Input type="date" value={form.bookingDate} onChange={e => setForm(p => ({ ...p, bookingDate: e.target.value }))} /></div>
                <div><Label>{t.bk_time}</Label><Input type="time" value={form.bookingTime} onChange={e => setForm(p => ({ ...p, bookingTime: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.customerName || !form.bookingDate}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><CalendarCheck className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{bookings.filter((b: any) => b.status === 'confirmed').length}</div><p className="text-sm text-muted-foreground">{t.bk_confirmed}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{bookings.filter((b: any) => b.status === 'pending').length}</div><p className="text-sm text-muted-foreground">{t.bk_pending}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{bookings.filter((b: any) => b.status === 'completed').length}</div><p className="text-sm text-muted-foreground">{t.bk_completed}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><XCircle className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{bookings.filter((b: any) => b.status === 'cancelled').length}</div><p className="text-sm text-muted-foreground">{t.bk_cancelled}</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : bookings.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.bk_no_bookings}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t.bk_customer}</TableHead><TableHead>{t.bk_service}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.bk_time}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
            <TableBody>
              {bookings.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.customer_name}</TableCell>
                  <TableCell>{b.service_type || '-'}</TableCell>
                  <TableCell>{b.booking_date}</TableCell>
                  <TableCell>{b.booking_time || '-'}</TableCell>
                  <TableCell><Badge variant={b.status === 'confirmed' ? 'default' : b.status === 'cancelled' ? 'destructive' : 'secondary'}>{b.status === 'confirmed' ? t.bk_confirmed : b.status === 'completed' ? t.bk_completed : b.status === 'cancelled' ? t.bk_cancelled : t.bk_pending}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(b.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}