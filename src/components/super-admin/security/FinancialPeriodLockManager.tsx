import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Lock, Unlock, Calendar, Plus, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export function FinancialPeriodLockManager() {
  const queryClient = useQueryClient();
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockData, setLockData] = useState({ companyId: '', periodStart: '', periodEnd: '', reason: '' });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-list-for-lock'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, name').eq('is_active', true);
      return data || [];
    },
  });

  const { data: locks = [], isLoading } = useQuery({
    queryKey: ['financial-period-locks'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('financial_period_locks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createLock = useMutation({
    mutationFn: async () => {
      if (!lockData.companyId || !lockData.periodStart || !lockData.periodEnd) {
        throw new Error('جميع الحقول مطلوبة');
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from as any)('financial_period_locks')
        .insert({
          company_id: lockData.companyId,
          period_start: lockData.periodStart,
          period_end: lockData.periodEnd,
          locked_by: user?.id,
          lock_reason: lockData.reason,
          is_locked: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-period-locks'] });
      setShowLockDialog(false);
      setLockData({ companyId: '', periodStart: '', periodEnd: '', reason: '' });
      toast.success('تم قفل الفترة المالية');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const unlockPeriod = useMutation({
    mutationFn: async (lockId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from as any)('financial_period_locks')
        .update({
          is_locked: false,
          unlocked_by: user?.id,
          unlocked_at: new Date().toISOString(),
        })
        .eq('id', lockId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-period-locks'] });
      toast.success('تم فتح الفترة المالية');
    },
  });

  const getCompanyName = (id: string) => companies.find((c: any) => c.id === id)?.name || id;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            إدارة قفل الفترات المالية
            <Badge variant="outline">{locks.filter((l: any) => l.is_locked).length} فترة مقفلة</Badge>
          </CardTitle>
          <Button size="sm" onClick={() => setShowLockDialog(true)}>
            <Plus className="h-4 w-4 ml-1" />
            قفل فترة جديدة
          </Button>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">تأثير قفل الفترة</p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                  <li>• لا يمكن تعديل أو حذف أي معاملة ضمن الفترة المقفلة</li>
                  <li>• لا يمكن إنشاء معاملات جديدة بتواريخ ضمن الفترة المقفلة</li>
                  <li>• فقط مدير النظام يمكنه فتح الفترة المقفلة</li>
                </ul>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : locks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد فترات مقفلة</div>
            ) : (
              <div className="space-y-2">
                {locks.map((lock: any) => (
                  <div key={lock.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-3">
                      {lock.is_locked ? (
                        <Lock className="h-4 w-4 text-red-500" />
                      ) : (
                        <Unlock className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{getCompanyName(lock.company_id)}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{lock.period_start} → {lock.period_end}</span>
                        </div>
                        {lock.lock_reason && (
                          <p className="text-xs text-muted-foreground mt-1">السبب: {lock.lock_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lock.is_locked ? (
                        <>
                          <Badge className="bg-red-500/10 text-red-600">مقفلة</Badge>
                          <Button size="sm" variant="outline" onClick={() => unlockPeriod.mutate(lock.id)}>
                            <Unlock className="h-3 w-3 ml-1" />
                            فتح
                          </Button>
                        </>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-600">مفتوحة</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Lock Period Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>قفل فترة مالية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الشركة</label>
              <Select value={lockData.companyId} onValueChange={(v) => setLockData({ ...lockData, companyId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الشركة" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">من تاريخ</label>
                <Input type="date" value={lockData.periodStart}
                  onChange={(e) => setLockData({ ...lockData, periodStart: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">إلى تاريخ</label>
                <Input type="date" value={lockData.periodEnd}
                  onChange={(e) => setLockData({ ...lockData, periodEnd: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">سبب القفل</label>
              <Input placeholder="سبب قفل الفترة..."
                value={lockData.reason}
                onChange={(e) => setLockData({ ...lockData, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => createLock.mutate()} disabled={createLock.isPending}>
              <Lock className="h-4 w-4 ml-1" />
              قفل الفترة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
