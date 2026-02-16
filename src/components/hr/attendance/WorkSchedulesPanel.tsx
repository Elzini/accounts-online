import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Plus, Clock, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

const DAYS = [
  { key: 'Sat', ar: 'السبت', en: 'Sat' },
  { key: 'Sun', ar: 'الأحد', en: 'Sun' },
  { key: 'Mon', ar: 'الإثنين', en: 'Mon' },
  { key: 'Tue', ar: 'الثلاثاء', en: 'Tue' },
  { key: 'Wed', ar: 'الأربعاء', en: 'Wed' },
  { key: 'Thu', ar: 'الخميس', en: 'Thu' },
  { key: 'Fri', ar: 'الجمعة', en: 'Fri' },
];

export function WorkSchedulesPanel() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    start_time: '08:00',
    end_time: '17:00',
    work_days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    break_duration_minutes: 60,
    late_tolerance_minutes: 15,
    early_leave_tolerance_minutes: 15,
    overtime_after_minutes: 30,
    is_default: false,
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['work-schedules', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('hr_work_schedules').select('*').eq('company_id', companyId).order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!companyId) throw new Error('No company');
      if (editing) {
        const { error } = await supabase.from('hr_work_schedules').update({
          name: data.name,
          start_time: data.start_time,
          end_time: data.end_time,
          work_days: data.work_days,
          break_duration_minutes: data.break_duration_minutes,
          late_tolerance_minutes: data.late_tolerance_minutes,
          early_leave_tolerance_minutes: data.early_leave_tolerance_minutes,
          overtime_after_minutes: data.overtime_after_minutes,
          is_default: data.is_default,
        }).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hr_work_schedules').insert({
          company_id: companyId,
          name: data.name,
          start_time: data.start_time,
          end_time: data.end_time,
          work_days: data.work_days,
          break_duration_minutes: data.break_duration_minutes,
          late_tolerance_minutes: data.late_tolerance_minutes,
          early_leave_tolerance_minutes: data.early_leave_tolerance_minutes,
          overtime_after_minutes: data.overtime_after_minutes,
          is_default: data.is_default,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedules'] });
      toast.success(language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
      resetForm();
    },
    onError: () => toast.error(language === 'ar' ? 'حدث خطأ' : 'Error occurred'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hr_work_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedules'] });
      toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted');
    },
  });

  const resetForm = () => {
    setForm({ name: '', start_time: '08:00', end_time: '17:00', work_days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'], break_duration_minutes: 60, late_tolerance_minutes: 15, early_leave_tolerance_minutes: 15, overtime_after_minutes: 30, is_default: false });
    setEditing(null);
    setIsOpen(false);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name,
      start_time: s.start_time,
      end_time: s.end_time,
      work_days: s.work_days || [],
      break_duration_minutes: s.break_duration_minutes || 60,
      late_tolerance_minutes: s.late_tolerance_minutes || 15,
      early_leave_tolerance_minutes: s.early_leave_tolerance_minutes || 15,
      overtime_after_minutes: s.overtime_after_minutes || 30,
      is_default: s.is_default || false,
    });
    setIsOpen(true);
  };

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      work_days: prev.work_days.includes(day) ? prev.work_days.filter(d => d !== day) : [...prev.work_days, day],
    }));
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {language === 'ar' ? 'مواعيد العمل والورديات' : 'Work Schedules & Shifts'}
        </h2>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'إضافة جدول' : 'Add Schedule'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? (language === 'ar' ? 'تعديل الجدول' : 'Edit Schedule') : (language === 'ar' ? 'إضافة جدول عمل جديد' : 'Add New Work Schedule')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'اسم الجدول' : 'Schedule Name'}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder={language === 'ar' ? 'مثال: الوردية الصباحية' : 'e.g. Morning Shift'} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'بداية الدوام' : 'Start Time'}</Label>
                  <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'نهاية الدوام' : 'End Time'}</Label>
                  <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'أيام العمل' : 'Work Days'}</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <label key={day.key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${form.work_days.includes(day.key) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}>
                      <Checkbox checked={form.work_days.includes(day.key)} onCheckedChange={() => toggleDay(day.key)} className="hidden" />
                      {language === 'ar' ? day.ar : day.en}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'سماح التأخير (دقيقة)' : 'Late Tolerance (min)'}</Label>
                  <Input type="number" value={form.late_tolerance_minutes} onChange={(e) => setForm({ ...form, late_tolerance_minutes: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'فترة الراحة (دقيقة)' : 'Break (min)'}</Label>
                  <Input type="number" value={form.break_duration_minutes} onChange={(e) => setForm({ ...form, break_duration_minutes: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'إضافي بعد (دقيقة)' : 'Overtime After (min)'}</Label>
                  <Input type="number" value={form.overtime_after_minutes} onChange={(e) => setForm({ ...form, overtime_after_minutes: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={form.is_default} onCheckedChange={(v) => setForm({ ...form, is_default: !!v })} />
                    <span className="text-sm">{language === 'ar' ? 'جدول افتراضي' : 'Default Schedule'}</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                <Button type="submit" disabled={saveMutation.isPending || !form.name}>
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {editing ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'إضافة' : 'Add')}
                </Button>
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
                <TableHead className="text-right">{language === 'ar' ? 'اسم الجدول' : 'Name'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'بداية' : 'Start'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'نهاية' : 'End'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'أيام العمل' : 'Work Days'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'سماح التأخير' : 'Late Tolerance'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.name}
                    {s.is_default && <Badge variant="secondary" className="mr-2 text-xs">{language === 'ar' ? 'افتراضي' : 'Default'}</Badge>}
                  </TableCell>
                  <TableCell dir="ltr">{s.start_time?.substring(0, 5)}</TableCell>
                  <TableCell dir="ltr">{s.end_time?.substring(0, 5)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(s.work_days || []).map((d: string) => (
                        <Badge key={d} variant="outline" className="text-xs">{language === 'ar' ? DAYS.find(dd => dd.key === d)?.ar : d}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{s.late_tolerance_minutes} {language === 'ar' ? 'دقيقة' : 'min'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm(language === 'ar' ? 'حذف هذا الجدول؟' : 'Delete?')) deleteMutation.mutate(s.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {schedules.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد جداول عمل. أضف جدولاً جديداً' : 'No work schedules. Add one'}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
