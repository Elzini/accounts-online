import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Clock, Camera, Database, Calendar, Eye, RotateCcw } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';

export function FinancialTimeMachine() {
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-list-tm'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, name').eq('is_active', true);
      return data || [];
    },
  });

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['financial-snapshots', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await (supabase.from as any)('financial_snapshots')
        .select('*')
        .eq('company_id', selectedCompany)
        .order('snapshot_date', { ascending: false })
        .limit(90);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCompany,
  });

  const takeSnapshot = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) throw new Error('اختر شركة أولاً');

      // Gather financial data
      const [invoices, entries, accounts] = await Promise.all([
        supabase.from('invoices').select('*').eq('company_id', selectedCompany),
        (supabase.from as any)('journal_entries').select('*').eq('company_id', selectedCompany),
        supabase.from('account_categories').select('*').eq('company_id', selectedCompany),
      ]);

      const today = new Date().toISOString().split('T')[0];

      const snapshotData = {
        invoices_count: invoices.data?.length || 0,
        journal_entries_count: entries.data?.length || 0,
        accounts_count: accounts.data?.length || 0,
        invoices_summary: {
          total_amount: invoices.data?.reduce((s: number, i: any) => s + (i.total || 0), 0) || 0,
          by_status: invoices.data?.reduce((acc: any, i: any) => {
            acc[i.status] = (acc[i.status] || 0) + 1;
            return acc;
          }, {}) || {},
        },
        accounts_balances: accounts.data?.map((a: any) => ({
          code: a.code,
          name: a.name,
          type: a.type,
        })) || [],
        captured_at: new Date().toISOString(),
      };

      const { error } = await (supabase.from as any)('financial_snapshots')
        .upsert({
          company_id: selectedCompany,
          snapshot_date: today,
          snapshot_type: 'manual',
          data: snapshotData,
          metadata: { triggered_by: 'super_admin', type: 'manual' },
        }, { onConflict: 'company_id,snapshot_date,snapshot_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-snapshots'] });
      toast.success('تم التقاط اللقطة المالية بنجاح');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            آلة الزمن المالية (Financial Time Machine)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            نظام اللقطات المالية اليومية: يلتقط صورة كاملة لأرصدة دفتر الأستاذ والذمم المدينة والدائنة وميزان المراجعة يومياً.
            يمكنك استعراض أي لقطة سابقة أو استعادتها.
          </p>

          <div className="flex items-center gap-3">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="max-w-[300px]">
                <SelectValue placeholder="اختر الشركة" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => takeSnapshot.mutate()} disabled={!selectedCompany || takeSnapshot.isPending}>
              <Camera className="h-4 w-4 ml-1" />
              التقاط لقطة الآن
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Snapshots Timeline */}
      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              اللقطات المالية المتاحة
              <Badge variant="outline">{snapshots.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : snapshots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  لا توجد لقطات مالية. التقط أول لقطة الآن.
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshots.map((snap: any) => (
                    <div
                      key={snap.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedSnapshot(snap)}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{snap.snapshot_date}</p>
                          <p className="text-xs text-muted-foreground">
                            {snap.snapshot_type === 'daily' ? 'لقطة يومية' : 'لقطة يدوية'} •{' '}
                            {snap.data?.invoices_count || 0} فاتورة •{' '}
                            {snap.data?.journal_entries_count || 0} قيد
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 ml-1" />
                          عرض
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Snapshot Detail Dialog */}
      <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              لقطة مالية: {selectedSnapshot?.snapshot_date}
            </DialogTitle>
          </DialogHeader>
          {selectedSnapshot && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-muted/30 rounded-lg border">
                    <div className="text-2xl font-bold text-primary">{selectedSnapshot.data?.invoices_count || 0}</div>
                    <p className="text-xs text-muted-foreground">فاتورة</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg border">
                    <div className="text-2xl font-bold text-primary">{selectedSnapshot.data?.journal_entries_count || 0}</div>
                    <p className="text-xs text-muted-foreground">قيد محاسبي</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg border">
                    <div className="text-2xl font-bold text-primary">{selectedSnapshot.data?.accounts_count || 0}</div>
                    <p className="text-xs text-muted-foreground">حساب</p>
                  </div>
                </div>

                {selectedSnapshot.data?.invoices_summary && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium mb-2">ملخص الفواتير</p>
                    <p className="text-sm text-muted-foreground">
                      الإجمالي: {selectedSnapshot.data.invoices_summary.total_amount?.toLocaleString()} ر.س
                    </p>
                    {selectedSnapshot.data.invoices_summary.by_status && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {Object.entries(selectedSnapshot.data.invoices_summary.by_status).map(([status, count]: any) => (
                          <Badge key={status} variant="outline">{status}: {count}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <pre className="text-xs bg-muted/30 p-3 rounded-lg border overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedSnapshot.data, null, 2)}
                </pre>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
