import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BarChart3, Download, UserCheck, UserX, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

export function AttendanceReportsPanel() {
  const companyId = useCompanyId();
  const { language } = useLanguage();
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from('employees').select('id, name, employee_number, job_title, department').eq('company_id', companyId).eq('is_active', true).order('name');
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance-report', companyId, dateFrom, dateTo, selectedEmployee],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase.from('employee_attendance').select('*, employees(name, employee_number, job_title, department)')
        .eq('company_id', companyId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: true });
      if (selectedEmployee !== 'all') {
        query = query.eq('employee_id', selectedEmployee);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Compute stats
  const totalDays = eachDayOfInterval({ start: parseISO(dateFrom), end: parseISO(dateTo) }).length;
  const presentCount = attendance.filter((a: any) => a.status === 'present').length;
  const absentCount = attendance.filter((a: any) => a.status === 'absent').length;
  const lateCount = attendance.filter((a: any) => a.status === 'late').length;
  const leaveCount = attendance.filter((a: any) => a.status === 'leave').length;
  const totalOvertime = attendance.reduce((sum: number, a: any) => sum + (a.overtime_hours || 0), 0);

  // Group by employee for summary
  const employeeSummary: Record<string, { name: string; department: string; present: number; absent: number; late: number; leave: number; overtime: number; workDays: number }> = {};
  for (const record of attendance as any[]) {
    const empId = record.employee_id;
    if (!employeeSummary[empId]) {
      employeeSummary[empId] = {
        name: record.employees?.name || '',
        department: record.employees?.department || '',
        present: 0, absent: 0, late: 0, leave: 0, overtime: 0, workDays: 0,
      };
    }
    employeeSummary[empId][record.status as 'present' | 'absent' | 'late' | 'leave']++;
    employeeSummary[empId].overtime += record.overtime_hours || 0;
    employeeSummary[empId].workDays++;
  }

  const exportCSV = () => {
    const headers = [language === 'ar' ? 'الموظف' : 'Employee', language === 'ar' ? 'التاريخ' : 'Date', language === 'ar' ? 'حضور' : 'Check In', language === 'ar' ? 'انصراف' : 'Check Out', language === 'ar' ? 'الحالة' : 'Status', language === 'ar' ? 'إضافي' : 'Overtime'];
    const rows = attendance.map((a: any) => [a.employees?.name, a.date, a.check_in || '', a.check_out || '', a.status, a.overtime_hours || 0]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${dateFrom}_${dateTo}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{language === 'ar' ? 'من تاريخ' : 'From'}</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-auto" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{language === 'ar' ? 'إلى تاريخ' : 'To'}</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-auto" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{language === 'ar' ? 'الموظف' : 'Employee'}</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع الموظفين' : 'All Employees'}</SelectItem>
              {employees.map((e: any) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCSV}>
          <Download className="w-4 h-4" />
          {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-emerald-500" /><div><div className="text-2xl font-bold">{presentCount}</div><p className="text-xs text-muted-foreground">{language === 'ar' ? 'حاضر' : 'Present'}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><UserX className="w-5 h-5 text-destructive" /><div><div className="text-2xl font-bold">{absentCount}</div><p className="text-xs text-muted-foreground">{language === 'ar' ? 'غائب' : 'Absent'}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /><div><div className="text-2xl font-bold">{lateCount}</div><p className="text-xs text-muted-foreground">{language === 'ar' ? 'متأخر' : 'Late'}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500" /><div><div className="text-2xl font-bold">{leaveCount}</div><p className="text-xs text-muted-foreground">{language === 'ar' ? 'إجازة' : 'Leave'}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /><div><div className="text-2xl font-bold">{totalOvertime.toFixed(1)}</div><p className="text-xs text-muted-foreground">{language === 'ar' ? 'ساعات إضافية' : 'Overtime Hrs'}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">{language === 'ar' ? 'ملخص الموظفين' : 'Employee Summary'}</TabsTrigger>
          <TabsTrigger value="details">{language === 'ar' ? 'التفاصيل اليومية' : 'Daily Details'}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader><CardTitle>{language === 'ar' ? 'كشف ملخص الحضور والانصراف' : 'Attendance Summary Sheet'}</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{language === 'ar' ? 'الموظف' : 'Employee'}</TableHead>
                        <TableHead className="text-right">{language === 'ar' ? 'القسم' : 'Dept'}</TableHead>
                        <TableHead className="text-center">{language === 'ar' ? 'حضور' : 'Present'}</TableHead>
                        <TableHead className="text-center">{language === 'ar' ? 'غياب' : 'Absent'}</TableHead>
                        <TableHead className="text-center">{language === 'ar' ? 'تأخير' : 'Late'}</TableHead>
                        <TableHead className="text-center">{language === 'ar' ? 'إجازة' : 'Leave'}</TableHead>
                        <TableHead className="text-center">{language === 'ar' ? 'إضافي' : 'OT'}</TableHead>
                        <TableHead className="text-center">{language === 'ar' ? 'نسبة الحضور' : 'Rate'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(employeeSummary).map(([empId, s]) => {
                        const rate = s.workDays > 0 ? Math.round(((s.present + s.late) / s.workDays) * 100) : 0;
                        return (
                          <TableRow key={empId}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell>{s.department || '-'}</TableCell>
                            <TableCell className="text-center"><Badge variant="default">{s.present}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="destructive">{s.absent}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="outline">{s.late}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="secondary">{s.leave}</Badge></TableCell>
                            <TableCell className="text-center">{s.overtime.toFixed(1)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={rate >= 90 ? 'default' : rate >= 70 ? 'outline' : 'destructive'}>{rate}%</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {Object.keys(employeeSummary).length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {language === 'ar' ? 'لا توجد بيانات في الفترة المحددة' : 'No data for selected period'}
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader><CardTitle>{language === 'ar' ? 'التفاصيل اليومية' : 'Daily Details'}</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                        <TableHead className="text-right">{language === 'ar' ? 'الموظف' : 'Employee'}</TableHead>
                        <TableHead className="text-right">{language === 'ar' ? 'حضور' : 'Check In'}</TableHead>
                        <TableHead className="text-right">{language === 'ar' ? 'انصراف' : 'Check Out'}</TableHead>
                        <TableHead className="text-right">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead className="text-right">{language === 'ar' ? 'المصدر' : 'Source'}</TableHead>
                        <TableHead className="text-right">{language === 'ar' ? 'إضافي' : 'OT'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell>{format(parseISO(a.date), 'dd/MM/yyyy EEEE', { locale: language === 'ar' ? ar : undefined })}</TableCell>
                          <TableCell className="font-medium">{a.employees?.name}</TableCell>
                          <TableCell dir="ltr">{a.check_in || '-'}</TableCell>
                          <TableCell dir="ltr">{a.check_out || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={a.status === 'present' ? 'default' : a.status === 'absent' ? 'destructive' : a.status === 'late' ? 'outline' : 'secondary'}>
                              {a.status === 'present' ? (language === 'ar' ? 'حاضر' : 'Present') :
                               a.status === 'absent' ? (language === 'ar' ? 'غائب' : 'Absent') :
                               a.status === 'late' ? (language === 'ar' ? 'متأخر' : 'Late') :
                               (language === 'ar' ? 'إجازة' : 'Leave')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {a.source === 'fingerprint' ? (language === 'ar' ? '👆 بصمة' : '👆 FP') : (language === 'ar' ? '✏️ يدوي' : '✏️ Manual')}
                            </Badge>
                          </TableCell>
                          <TableCell>{a.overtime_hours || 0}</TableCell>
                        </TableRow>
                      ))}
                      {attendance.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
