import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, FileCheck, ArrowDownLeft, ArrowUpRight, RotateCcw, CheckCircle2, XCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useExcelExport } from '@/hooks/useExcelExport';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function ChecksPage() {
  const { t, language, direction } = useLanguage();
  const [tab, setTab] = useState<'received' | 'issued'>('received');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const companyId = useCompanyId();
  const { selectedFiscalYear } = useFiscalYear();
  const queryClient = useQueryClient();
  const { exportToExcel } = useExcelExport();

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: t.chk_status_pending, variant: 'outline' },
    deposited: { label: t.chk_status_deposited, variant: 'secondary' },
    collected: { label: t.chk_status_collected, variant: 'default' },
    returned: { label: t.chk_status_returned, variant: 'destructive' },
    cancelled: { label: t.chk_status_cancelled, variant: 'destructive' },
    endorsed: { label: t.chk_status_endorsed, variant: 'secondary' },
  };

  const [form, setForm] = useState({
    check_number: '',
    check_type: 'received' as 'received' | 'issued',
    amount: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    bank_name: '',
    drawer_name: '',
    payee_name: '',
    notes: '',
  });

  const { data: checks = [], isLoading } = useQuery({
    queryKey: ['checks', companyId, tab, selectedFiscalYear?.id],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .eq('company_id', companyId)
        .eq('check_type', tab)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const addCheck = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('checks').insert({
        company_id: companyId,
        check_number: form.check_number,
        check_type: form.check_type,
        amount: parseFloat(form.amount),
        issue_date: form.issue_date,
        due_date: form.due_date,
        bank_name: form.bank_name,
        drawer_name: form.drawer_name,
        payee_name: form.payee_name,
        notes: form.notes,
        fiscal_year_id: selectedFiscalYear?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t.chk_toast_added);
      queryClient.invalidateQueries({ queryKey: ['checks'] });
      setShowForm(false);
      setForm({ check_number: '', check_type: tab, amount: '', issue_date: new Date().toISOString().split('T')[0], due_date: '', bank_name: '', drawer_name: '', payee_name: '', notes: '' });
    },
    onError: () => toast.error(t.chk_toast_error),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('checks').update({ status, status_date: new Date().toISOString().split('T')[0] }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t.chk_toast_status_updated);
      queryClient.invalidateQueries({ queryKey: ['checks'] });
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return checks;
    const q = search.toLowerCase();
    return checks.filter((c: any) =>
      c.check_number?.toLowerCase().includes(q) ||
      c.drawer_name?.toLowerCase().includes(q) ||
      c.payee_name?.toLowerCase().includes(q) ||
      c.bank_name?.toLowerCase().includes(q)
    );
  }, [checks, search]);

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const fmt = (n: number) => n?.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';

  const totalAmount = filtered.reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0);
  const pendingCount = filtered.filter((c: any) => c.status === 'pending').length;
  const collectedCount = filtered.filter((c: any) => c.status === 'collected').length;
  const returnedCount = filtered.filter((c: any) => c.status === 'returned').length;

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.chk_title}</h1>
          <p className="text-muted-foreground">{t.chk_subtitle}</p>
        </div>
        <Button onClick={() => { setForm(f => ({ ...f, check_type: tab })); setShowForm(true); }}>
          <Plus className="w-4 h-4 ml-2" />
          {t.chk_new}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.chk_total}</p>
            <p className="text-lg font-bold">{fmt(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.chk_pending}</p>
            <p className="text-lg font-bold text-yellow-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.chk_collected}</p>
            <p className="text-lg font-bold text-green-600">{collectedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.chk_returned}</p>
            <p className="text-lg font-bold text-red-600">{returnedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="received" className="gap-2">
              <ArrowDownLeft className="w-4 h-4" /> {t.chk_received}
            </TabsTrigger>
            <TabsTrigger value="issued" className="gap-2">
              <ArrowUpRight className="w-4 h-4" /> {t.chk_issued}
            </TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t.chk_search} value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{t.chk_col_number}</TableHead>
                    <TableHead className="text-right">{t.chk_col_amount}</TableHead>
                    <TableHead className="text-right">{t.chk_col_issue_date}</TableHead>
                    <TableHead className="text-right">{t.chk_col_due_date}</TableHead>
                    <TableHead className="text-right">{t.chk_col_bank}</TableHead>
                    <TableHead className="text-right">{tab === 'received' ? t.chk_col_drawer : t.chk_col_payee}</TableHead>
                    <TableHead className="text-right">{t.chk_col_status}</TableHead>
                    <TableHead className="text-right">{t.chk_col_actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t.chk_loading}</TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        {t.chk_no_data}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((check: any) => (
                      <TableRow key={check.id}>
                        <TableCell className="font-medium">{check.check_number}</TableCell>
                        <TableCell className="font-bold">{fmt(check.amount)}</TableCell>
                        <TableCell>{check.issue_date}</TableCell>
                        <TableCell>{check.due_date}</TableCell>
                        <TableCell>{check.bank_name || '-'}</TableCell>
                        <TableCell>{tab === 'received' ? check.drawer_name : check.payee_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={statusMap[check.status]?.variant || 'outline'}>
                            {statusMap[check.status]?.label || check.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {check.status === 'pending' && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: check.id, status: 'deposited' })} title="إيداع">
                                  <Send className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: check.id, status: 'collected' })} title="تحصيل">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            {check.status === 'deposited' && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: check.id, status: 'collected' })} title="تحصيل">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: check.id, status: 'returned' })} title="ارتجاع">
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            {check.status !== 'cancelled' && check.status !== 'collected' && (
                              <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: check.id, status: 'cancelled' })} title="إلغاء">
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Check Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg" dir={direction}>
          <DialogHeader>
            <DialogTitle>{form.check_type === 'received' ? t.chk_add_received : t.chk_add_issued}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.chk_col_number}</Label>
                <Input value={form.check_number} onChange={(e) => setForm(f => ({ ...f, check_number: e.target.value }))} />
              </div>
              <div>
                <Label>{t.chk_col_amount}</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.chk_col_issue_date}</Label>
                <Input type="date" value={form.issue_date} onChange={(e) => setForm(f => ({ ...f, issue_date: e.target.value }))} />
              </div>
              <div>
                <Label>{t.chk_col_due_date}</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{t.chk_col_bank}</Label>
              <Input value={form.bank_name} onChange={(e) => setForm(f => ({ ...f, bank_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.chk_drawer_name}</Label>
                <Input value={form.drawer_name} onChange={(e) => setForm(f => ({ ...f, drawer_name: e.target.value }))} />
              </div>
              <div>
                <Label>{t.chk_payee_name}</Label>
                <Input value={form.payee_name} onChange={(e) => setForm(f => ({ ...f, payee_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{t.chk_notes}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>{t.cancel}</Button>
            <Button onClick={() => addCheck.mutate()} disabled={!form.check_number || !form.amount || !form.due_date}>
              {t.chk_save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}