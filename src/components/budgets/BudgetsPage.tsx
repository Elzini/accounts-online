import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Calculator, TrendingUp, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function BudgetsPage() {
  const { t, direction } = useLanguage();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const companyId = useCompanyId();
  const { selectedFiscalYear } = useFiscalYear();
  const queryClient = useQueryClient();

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    draft: { label: t.budgets_status_draft, variant: 'outline' },
    approved: { label: t.budgets_status_approved, variant: 'default' },
    closed: { label: t.budgets_status_closed, variant: 'secondary' },
  };

  const [form, setForm] = useState({
    name: '',
    start_date: selectedFiscalYear?.start_date || '',
    end_date: selectedFiscalYear?.end_date || '',
    notes: '',
  });

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', companyId, selectedFiscalYear?.id],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const addBudget = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('budgets').insert({
        company_id: companyId,
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
        notes: form.notes,
        fiscal_year_id: selectedFiscalYear?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t.budgets_toast_created);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowForm(false);
      setForm({ name: '', start_date: '', end_date: '', notes: '' });
    },
    onError: () => toast.error(t.budgets_toast_error),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return budgets;
    return budgets.filter((b: any) => b.name?.toLowerCase().includes(search.toLowerCase()));
  }, [budgets, search]);

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.budgets_title}</h1>
          <p className="text-muted-foreground">{t.budgets_subtitle}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 ml-2" />
          {t.budgets_new}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t.budgets_total}</p>
              <p className="text-xl font-bold">{budgets.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">{t.budgets_approved}</p>
              <p className="text-xl font-bold">{budgets.filter((b: any) => b.status === 'approved').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">{t.budgets_draft}</p>
              <p className="text-xl font-bold">{budgets.filter((b: any) => b.status === 'draft').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{t.budgets_list}</CardTitle>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">#</TableHead>
                <TableHead className="text-right">{t.budgets_col_name}</TableHead>
                <TableHead className="text-right">{t.budgets_col_start}</TableHead>
                <TableHead className="text-right">{t.budgets_col_end}</TableHead>
                <TableHead className="text-right">{t.budgets_col_status}</TableHead>
                <TableHead className="text-right">{t.budgets_col_notes}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t.loading}</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    {t.no_data}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((budget: any, i: number) => (
                  <TableRow key={budget.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{budget.name}</TableCell>
                    <TableCell>{budget.start_date}</TableCell>
                    <TableCell>{budget.end_date}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[budget.status]?.variant || 'outline'}>
                        {statusLabels[budget.status]?.label || budget.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{budget.notes || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Budget Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md" dir={direction}>
          <DialogHeader>
            <DialogTitle>{t.budgets_new}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>{t.budgets_col_name}</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="2026..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.budgets_col_start}</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>{t.budgets_col_end}</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{t.budgets_col_notes}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>{t.cancel}</Button>
            <Button onClick={() => addBudget.mutate()} disabled={!form.name || !form.start_date || !form.end_date}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
