import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Star, Gift, Users, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function LoyaltyPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', pointsPerUnit: '1', unitValue: '1' });

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['loyalty-programs', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_programs').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: points = [] } = useQuery({
    queryKey: ['loyalty-points', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_points').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('loyalty_programs').insert({ company_id: companyId!, name: form.name, points_per_unit: Number(form.pointsPerUnit), unit_value: Number(form.unitValue), is_active: true });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] }); toast.success(t.loyalty_created); setShowAdd(false); setForm({ name: '', pointsPerUnit: '1', unitValue: '1' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('loyalty_programs').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] }); toast.success(t.mod_deleted); },
  });

  const totalPoints = points.reduce((s: number, p: any) => s + Number(p.points || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.loyalty_title}</h1><p className="text-muted-foreground">{t.loyalty_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.loyalty_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.loyalty_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.loyalty_program_name}</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.loyalty_points_per_unit}</Label><Input type="number" value={form.pointsPerUnit} onChange={e => setForm(p => ({ ...p, pointsPerUnit: e.target.value }))} /></div>
                <div><Label>{t.loyalty_unit_value}</Label><Input type="number" value={form.unitValue} onChange={e => setForm(p => ({ ...p, unitValue: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.name}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Gift className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{programs.length}</div><p className="text-sm text-muted-foreground">{t.loyalty_programs}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" /><div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div><p className="text-sm text-muted-foreground">{t.loyalty_total_points}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{programs.filter((p: any) => p.is_active).length}</div><p className="text-sm text-muted-foreground">{t.loyalty_active_programs}</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : programs.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.loyalty_no_programs}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t.loyalty_program}</TableHead><TableHead>{t.loyalty_points_per_unit}</TableHead><TableHead>{t.loyalty_unit_value}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
            <TableBody>
              {programs.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.points_per_unit}</TableCell>
                  <TableCell>{Number(p.unit_value).toLocaleString()} {t.mod_currency}</TableCell>
                  <TableCell><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? t.loyalty_status_active : t.loyalty_status_stopped}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}