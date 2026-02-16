import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Plus, CalendarDays, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function HolidaysPanel() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', holiday_date: '', end_date: '', is_recurring: false });

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('hr_holidays').select('*').eq('company_id', companyId).order('holiday_date');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const addHoliday = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('hr_holidays').insert({
        company_id: companyId,
        name: data.name,
        holiday_date: data.holiday_date,
        end_date: data.end_date || null,
        is_recurring: data.is_recurring,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success(language === 'ar' ? 'تمت الإضافة' : 'Added');
      setIsOpen(false);
      setForm({ name: '', holiday_date: '', end_date: '', is_recurring: false });
    },
    onError: () => toast.error(language === 'ar' ? 'حدث خطأ' : 'Error'),
  });

  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hr_holidays').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted');
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          {language === 'ar' ? 'العطلات الرسمية' : 'Official Holidays'}
        </h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'إضافة عطلة' : 'Add Holiday'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{language === 'ar' ? 'إضافة عطلة رسمية' : 'Add Official Holiday'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addHoliday.mutate(form); }} className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'اسم العطلة' : 'Holiday Name'}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder={language === 'ar' ? 'مثال: عيد الفطر' : 'e.g. National Day'} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'تاريخ البداية' : 'Start Date'}</Label>
                  <Input type="date" value={form.holiday_date} onChange={(e) => setForm({ ...form, holiday_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'تاريخ النهاية (اختياري)' : 'End Date (Optional)'}</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.is_recurring} onCheckedChange={(v) => setForm({ ...form, is_recurring: !!v })} />
                <span className="text-sm">{language === 'ar' ? 'تتكرر سنوياً' : 'Recurring Yearly'}</span>
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                <Button type="submit" disabled={addHoliday.isPending}>{language === 'ar' ? 'إضافة' : 'Add'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{language === 'ar' ? 'اسم العطلة' : 'Holiday Name'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'تاريخ النهاية' : 'End Date'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'متكررة' : 'Recurring'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((h: any) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{format(new Date(h.holiday_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{h.end_date ? format(new Date(h.end_date), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell>{h.is_recurring ? <Badge variant="secondary">{language === 'ar' ? 'سنوية' : 'Yearly'}</Badge> : '-'}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm(language === 'ar' ? 'حذف؟' : 'Delete?')) deleteHoliday.mutate(h.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {holidays.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد عطلات مسجلة' : 'No holidays registered'}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
