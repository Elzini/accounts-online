import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2, Headphones, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  closed: 'bg-muted text-muted-foreground',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  urgent: 'bg-destructive/10 text-destructive',
};

export function HelpdeskPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', customer_name: '', customer_email: '', priority: 'medium', category: '' });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('support_tickets').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addTicket = useMutation({
    mutationFn: async () => {
      const num = `TK-${String(tickets.length + 1).padStart(4, '0')}`;
      const { error } = await supabase.from('support_tickets').insert({
        company_id: companyId!, ticket_number: num, subject: form.subject, description: form.description,
        customer_name: form.customer_name, customer_email: form.customer_email, priority: form.priority, category: form.category || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['support-tickets'] }); toast.success(t.hd_ticket_created); setShowAdd(false); setForm({ subject: '', description: '', customer_name: '', customer_email: '', priority: 'medium', category: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteTicket = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('support_tickets').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['support-tickets'] }); toast.success(t.mod_deleted); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'resolved') updates.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['support-tickets'] }); toast.success(t.hd_status_updated); },
  });

  const statusLabels: Record<string, string> = { open: t.hd_open, in_progress: t.hd_in_progress, resolved: t.hd_resolved, closed: t.hd_closed };
  const priorityLabels: Record<string, string> = { low: t.hd_low, medium: t.hd_medium, high: t.hd_high, urgent: t.hd_urgent };
  const filtered = tickets.filter((tk: any) => tk.ticket_number?.includes(search) || tk.subject?.includes(search) || tk.customer_name?.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.hd_title}</h1><p className="text-muted-foreground">{t.hd_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.hd_new_ticket}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{t.hd_new_ticket}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.hd_subject}</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.hd_customer_name}</Label><Input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} /></div>
                <div><Label>{t.hd_customer_email}</Label><Input type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.hd_priority}</Label>
                  <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>{t.hd_category}</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} /></div>
              </div>
              <div><Label>{t.description}</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} /></div>
              <Button className="w-full" onClick={() => addTicket.mutate()} disabled={!form.subject || addTicket.isPending}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><AlertCircle className="w-6 h-6 mx-auto mb-1 text-blue-600" /><div className="text-2xl font-bold">{tickets.filter((t: any) => t.status === 'open').length}</div><p className="text-sm text-muted-foreground">{t.hd_open}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-6 h-6 mx-auto mb-1 text-yellow-600" /><div className="text-2xl font-bold">{tickets.filter((t: any) => t.status === 'in_progress').length}</div><p className="text-sm text-muted-foreground">{t.hd_in_progress}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-600" /><div className="text-2xl font-bold">{tickets.filter((t: any) => t.status === 'resolved').length}</div><p className="text-sm text-muted-foreground">{t.hd_resolved}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Headphones className="w-6 h-6 mx-auto mb-1 text-primary" /><div className="text-2xl font-bold">{tickets.length}</div><p className="text-sm text-muted-foreground">{t.hd_total}</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-4"><div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" /><Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.mod_no_data}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{t.hd_ticket_no}</TableHead><TableHead>{t.hd_subject}</TableHead><TableHead>{t.hd_customer_name}</TableHead><TableHead>{t.hd_priority}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((tk: any) => (
                  <TableRow key={tk.id}>
                    <TableCell className="font-mono">{tk.ticket_number}</TableCell>
                    <TableCell>{tk.subject}</TableCell>
                    <TableCell>{tk.customer_name || '-'}</TableCell>
                    <TableCell><Badge className={priorityColors[tk.priority]}>{priorityLabels[tk.priority]}</Badge></TableCell>
                    <TableCell>
                      <Select value={tk.status} onValueChange={v => updateStatus.mutate({ id: tk.id, status: v })}>
                        <SelectTrigger className="h-7 w-28"><Badge className={statusColors[tk.status]}>{statusLabels[tk.status]}</Badge></SelectTrigger>
                        <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {tk.status === 'open' && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTicket.mutate(tk.id)}><Trash2 className="w-3 h-3" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
