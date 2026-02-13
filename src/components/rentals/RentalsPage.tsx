import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Home, Key, DollarSign, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function RentalsPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ unitName: '', unitType: 'apartment', location: '', monthlyRent: '' });

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['rental-units', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('rental_units').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from('rental_units').insert({ company_id: companyId!, unit_name: form.unitName, unit_type: form.unitType, location: form.location || null, monthly_rent: Number(form.monthlyRent) || 0, status: 'available' }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rental-units'] }); toast.success(t.rental_added); setShowAdd(false); setForm({ unitName: '', unitType: 'apartment', location: '', monthlyRent: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('rental_units').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rental-units'] }); toast.success(t.mod_deleted); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.rental_title}</h1><p className="text-muted-foreground">{t.rental_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.rental_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.rental_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.rental_unit_name}</Label><Input value={form.unitName} onChange={e => setForm(p => ({ ...p, unitName: e.target.value }))} /></div>
              <div><Label>{t.rental_location}</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
              <div><Label>{t.rental_monthly_rent}</Label><Input type="number" value={form.monthlyRent} onChange={e => setForm(p => ({ ...p, monthlyRent: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.unitName}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Home className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{units.length}</div><p className="text-sm text-muted-foreground">{t.rental_units}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Key className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{units.filter((u: any) => u.status === 'occupied').length}</div><p className="text-sm text-muted-foreground">{t.rental_occupied}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{units.reduce((s: number, u: any) => s + Number(u.monthly_rent || 0), 0).toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{t.rental_total_rent}</p></CardContent></Card>
      </div>
      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : units.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.rental_no_units}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t.rental_unit}</TableHead><TableHead>{t.rental_location}</TableHead><TableHead>{t.rental_rent}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
            <TableBody>
              {units.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.unit_name}</TableCell>
                  <TableCell>{u.location || '-'}</TableCell>
                  <TableCell>{Number(u.monthly_rent || 0).toLocaleString()} {t.mod_currency}</TableCell>
                  <TableCell><Badge variant={u.status === 'occupied' ? 'default' : 'secondary'}>{u.status === 'occupied' ? t.rental_status_occupied : t.rental_status_available}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(u.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}