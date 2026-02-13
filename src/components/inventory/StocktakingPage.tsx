import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ClipboardList, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function StocktakingPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', notes: '' });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['stocktaking', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('stocktaking_sessions').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('stocktaking_sessions').insert({ company_id: companyId!, session_name: form.name, start_date: new Date().toISOString().split('T')[0], status: 'in_progress', notes: form.notes || null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stocktaking'] }); toast.success(t.st_created); setShowAdd(false); setForm({ name: '', notes: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.st_title}</h1><p className="text-muted-foreground">{t.st_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.st_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.st_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.st_session_name}</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={t.st_session_placeholder} /></div>
              <div><Label>{t.notes}</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.name}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><ClipboardList className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{sessions.length}</div><p className="text-sm text-muted-foreground">{t.st_sessions}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><PackageCheck className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{sessions.filter((s: any) => s.status === 'completed').length}</div><p className="text-sm text-muted-foreground">{t.st_completed}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-orange-600">{sessions.filter((s: any) => s.status === 'in_progress').length}</div><p className="text-sm text-muted-foreground">{t.st_in_progress}</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : sessions.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.st_no_sessions}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t.st_session}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.notes}</TableHead></TableRow></TableHeader>
            <TableBody>
              {sessions.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.session_name}</TableCell>
                  <TableCell>{s.start_date}</TableCell>
                  <TableCell><Badge variant={s.status === 'completed' ? 'default' : 'secondary'}>{s.status === 'completed' ? t.st_status_completed : t.st_status_in_progress}</Badge></TableCell>
                  <TableCell>{s.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}