import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Clock, Calendar, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEmployees } from '@/hooks/usePayroll';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

export function AttendancePage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();
  const { t, language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '', date: new Date().toISOString().split('T')[0],
    check_in: '08:00', check_out: '17:00', status: 'present', overtime_hours: 0, notes: '',
  });

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance', companyId, selectedDate],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('employee_attendance').select('*, employees(name, job_title)')
        .eq('company_id', companyId).eq('date', selectedDate).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const addAttendance = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('employee_attendance').insert({
        company_id: companyId, employee_id: data.employee_id, date: data.date,
        check_in: data.check_in || null, check_out: data.check_out || null,
        status: data.status, overtime_hours: data.overtime_hours, notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['attendance'] }); toast.success(t.attendance_recorded); setIsDialogOpen(false); },
    onError: () => toast.error(t.error_occurred),
  });

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    present: { label: t.present, variant: 'default' },
    absent: { label: t.absent, variant: 'destructive' },
    late: { label: t.late, variant: 'outline' },
    leave: { label: t.on_leave, variant: 'secondary' },
    holiday: { label: t.holiday, variant: 'secondary' },
  };

  const stats = {
    present: attendance.filter((a: any) => a.status === 'present').length,
    absent: attendance.filter((a: any) => a.status === 'absent').length,
    late: attendance.filter((a: any) => a.status === 'late').length,
    leave: attendance.filter((a: any) => a.status === 'leave').length,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Clock className="w-6 h-6" />{t.attendance_title}</h1>
          <p className="text-muted-foreground">{t.attendance_subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.record_attendance}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t.record_employee_attendance}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addAttendance.mutate(formData); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.select_employee}</Label>
                  <Select value={formData.employee_id} onValueChange={(v) => setFormData({ ...formData, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder={t.select_employee} /></SelectTrigger>
                    <SelectContent>{employees.filter(e => e.is_active).map((emp) => (<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t.date}</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>{t.status}</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">{t.present}</SelectItem>
                        <SelectItem value="absent">{t.absent}</SelectItem>
                        <SelectItem value="late">{t.late}</SelectItem>
                        <SelectItem value="leave">{t.on_leave}</SelectItem>
                        <SelectItem value="holiday">{t.holiday}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t.check_in}</Label><Input type="time" value={formData.check_in} onChange={(e) => setFormData({ ...formData, check_in: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t.check_out}</Label><Input type="time" value={formData.check_out} onChange={(e) => setFormData({ ...formData, check_out: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>{t.overtime_hours}</Label><Input type="number" value={formData.overtime_hours} onChange={(e) => setFormData({ ...formData, overtime_hours: parseFloat(e.target.value) || 0 })} /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button>
                  <Button type="submit" disabled={addAttendance.isPending || !formData.employee_id}>
                    {addAttendance.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}{t.register_btn}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-emerald-500" /><div><div className="text-2xl font-bold">{stats.present}</div><p className="text-sm text-muted-foreground">{t.present}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><UserX className="w-5 h-5 text-destructive" /><div><div className="text-2xl font-bold">{stats.absent}</div><p className="text-sm text-muted-foreground">{t.absent}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /><div><div className="text-2xl font-bold">{stats.late}</div><p className="text-sm text-muted-foreground">{t.late}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /><div><div className="text-2xl font-bold">{stats.leave}</div><p className="text-sm text-muted-foreground">{t.on_leave}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t.attendance_record} - {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: language === 'ar' ? ar : undefined })}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t.name}</TableHead>
                  <TableHead className="text-right">{t.job_title}</TableHead>
                  <TableHead className="text-right">{t.check_in}</TableHead>
                  <TableHead className="text-right">{t.check_out}</TableHead>
                  <TableHead className="text-right">{t.status}</TableHead>
                  <TableHead className="text-right">{t.overtime_hours}</TableHead>
                  <TableHead className="text-right">{t.notes}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employees?.name}</TableCell>
                    <TableCell>{record.employees?.job_title}</TableCell>
                    <TableCell dir="ltr">{record.check_in || '-'}</TableCell>
                    <TableCell dir="ltr">{record.check_out || '-'}</TableCell>
                    <TableCell><Badge variant={statusLabels[record.status]?.variant || 'default'}>{statusLabels[record.status]?.label || record.status}</Badge></TableCell>
                    <TableCell>{record.overtime_hours || 0}</TableCell>
                    <TableCell>{record.notes || '-'}</TableCell>
                  </TableRow>
                ))}
                {attendance.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t.no_attendance_records}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}