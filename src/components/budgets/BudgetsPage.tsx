import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Calculator, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { toast } from 'sonner';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'outline' },
  approved: { label: 'معتمدة', variant: 'default' },
  closed: { label: 'مغلقة', variant: 'secondary' },
};

export function BudgetsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const companyId = useCompanyId();
  const { selectedFiscalYear } = useFiscalYear();
  const queryClient = useQueryClient();

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
      toast.success('تم إنشاء الموازنة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowForm(false);
      setForm({ name: '', start_date: '', end_date: '', notes: '' });
    },
    onError: () => toast.error('خطأ في إنشاء الموازنة'),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return budgets;
    return budgets.filter((b: any) => b.name?.toLowerCase().includes(search.toLowerCase()));
  }, [budgets, search]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الموازنات التقديرية</h1>
          <p className="text-muted-foreground">إعداد ومتابعة الموازنات ومقارنة الفعلي بالمخطط</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 ml-2" />
          موازنة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الموازنات</p>
              <p className="text-xl font-bold">{budgets.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">معتمدة</p>
              <p className="text-xl font-bold">{budgets.filter((b: any) => b.status === 'approved').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">مسودة</p>
              <p className="text-xl font-bold">{budgets.filter((b: any) => b.status === 'draft').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>قائمة الموازنات</CardTitle>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">#</TableHead>
                <TableHead className="text-right">اسم الموازنة</TableHead>
                <TableHead className="text-right">من</TableHead>
                <TableHead className="text-right">إلى</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">جاري التحميل...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    لا توجد موازنات
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
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>موازنة جديدة</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>اسم الموازنة</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: موازنة 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>تاريخ البداية</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>تاريخ النهاية</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            <Button onClick={() => addBudget.mutate()} disabled={!form.name || !form.start_date || !form.end_date}>إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
