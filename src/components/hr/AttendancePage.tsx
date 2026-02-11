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
import { Loader2, Plus, Clock, Search, Calendar, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEmployees } from '@/hooks/usePayroll';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function AttendancePage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '08:00',
    check_out: '17:00',
    status: 'present',
    overtime_hours: 0,
    notes: '',
  });

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance', companyId, selectedDate],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('employee_attendance')
        .select('*, employees(name, job_title)')
        .eq('company_id', companyId)
        .eq('date', selectedDate)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const addAttendance = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('employee_attendance').insert({
        company_id: companyId,
        employee_id: data.employee_id,
        date: data.date,
        check_in: data.check_in || null,
        check_out: data.check_out || null,
        status: data.status,
        overtime_hours: data.overtime_hours,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('تم تسجيل الحضور بنجاح');
      setIsDialogOpen(false);
    },
    onError: () => toast.error('حدث خطأ أثناء التسجيل'),
  });

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    present: { label: 'حاضر', variant: 'default' },
    absent: { label: 'غائب', variant: 'destructive' },
    late: { label: 'متأخر', variant: 'outline' },
    leave: { label: 'إجازة', variant: 'secondary' },
    holiday: { label: 'عطلة', variant: 'secondary' },
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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6" />
            الحضور والانصراف
          </h1>
          <p className="text-muted-foreground">تسجيل ومتابعة حضور وانصراف الموظفين</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />تسجيل حضور</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>تسجيل حضور موظف</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addAttendance.mutate(formData); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>الموظف</Label>
                  <Select value={formData.employee_id} onValueChange={(v) => setFormData({ ...formData, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                    <SelectContent>
                      {employees.filter(e => e.is_active).map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>التاريخ</Label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">حاضر</SelectItem>
                        <SelectItem value="absent">غائب</SelectItem>
                        <SelectItem value="late">متأخر</SelectItem>
                        <SelectItem value="leave">إجازة</SelectItem>
                        <SelectItem value="holiday">عطلة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>وقت الحضور</Label>
                    <Input type="time" value={formData.check_in} onChange={(e) => setFormData({ ...formData, check_in: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت الانصراف</Label>
                    <Input type="time" value={formData.check_out} onChange={(e) => setFormData({ ...formData, check_out: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ساعات إضافية</Label>
                  <Input type="number" value={formData.overtime_hours} onChange={(e) => setFormData({ ...formData, overtime_hours: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={addAttendance.isPending || !formData.employee_id}>
                    {addAttendance.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    تسجيل
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-emerald-500" /><div><div className="text-2xl font-bold">{stats.present}</div><p className="text-sm text-muted-foreground">حاضرون</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><UserX className="w-5 h-5 text-destructive" /><div><div className="text-2xl font-bold">{stats.absent}</div><p className="text-sm text-muted-foreground">غائبون</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /><div><div className="text-2xl font-bold">{stats.late}</div><p className="text-sm text-muted-foreground">متأخرون</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /><div><div className="text-2xl font-bold">{stats.leave}</div><p className="text-sm text-muted-foreground">إجازة</p></div></div></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>سجل الحضور - {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: ar })}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">المسمى</TableHead>
                  <TableHead className="text-right">الحضور</TableHead>
                  <TableHead className="text-right">الانصراف</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">ساعات إضافية</TableHead>
                  <TableHead className="text-right">ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employees?.name}</TableCell>
                    <TableCell>{record.employees?.job_title}</TableCell>
                    <TableCell dir="ltr">{record.check_in || '-'}</TableCell>
                    <TableCell dir="ltr">{record.check_out || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[record.status]?.variant || 'default'}>
                        {statusLabels[record.status]?.label || record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.overtime_hours || 0}</TableCell>
                    <TableCell>{record.notes || '-'}</TableCell>
                  </TableRow>
                ))}
                {attendance.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا يوجد سجلات حضور لهذا اليوم</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
