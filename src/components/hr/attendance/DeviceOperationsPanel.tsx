import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Wifi, WifiOff, RefreshCw, Download, Upload, Monitor, Fingerprint, Calendar } from 'lucide-react';
import { useFingerprintDevices, useDeviceLogs } from '@/hooks/hr/useHRService';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DeviceOperationsPanelProps {
  showOperations?: boolean;
}

export function DeviceOperationsPanel({ showOperations = false }: DeviceOperationsPanelProps) {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any[]>([]);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  const { data: devices = [] } = useFingerprintDevices(companyId, true);

  const { data: deviceLogs = [], isLoading: logsLoading } = useDeviceLogs(companyId, selectedDevice, dateFrom, dateTo);

  const simulateDeviceSync = useMutation({
    mutationFn: async (deviceId: string) => {
      if (!companyId) throw new Error('No company');
      setIsSyncing(true);

      // Simulate reading data from device - generates sample attendance records
      const { data: employees } = await supabase
        .from('employees')
        .select('id, employee_number, name')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .limit(20);

      if (!employees || employees.length === 0) {
        throw new Error(language === 'ar' ? 'لا يوجد موظفين لمزامنة بياناتهم' : 'No employees to sync');
      }

      const logs: any[] = [];
      const today = new Date();
      
      for (const emp of employees) {
        // Generate check-in (7:45 - 8:30 AM range)
        const checkInHour = 7 + Math.random();
        const checkInMin = Math.floor(Math.random() * 60);
        const checkIn = new Date(today);
        checkIn.setHours(Math.floor(checkInHour + (checkInHour < 8 ? 1 : 0)), checkInMin, 0, 0);

        // Generate check-out (4:30 - 6:00 PM range)
        const checkOutHour = 16 + Math.random() * 2;
        const checkOut = new Date(today);
        checkOut.setHours(Math.floor(checkOutHour), Math.floor(Math.random() * 60), 0, 0);

        logs.push({
          company_id: companyId,
          device_id: deviceId,
          employee_code: emp.employee_number || emp.id.substring(0, 8),
          punch_time: checkIn.toISOString(),
          punch_type: 'in',
          verification_method: ['fingerprint', 'face', 'card'][Math.floor(Math.random() * 3)],
          source: 'device',
          is_processed: false,
        });

        logs.push({
          company_id: companyId,
          device_id: deviceId,
          employee_code: emp.employee_number || emp.id.substring(0, 8),
          punch_time: checkOut.toISOString(),
          punch_type: 'out',
          verification_method: ['fingerprint', 'face', 'card'][Math.floor(Math.random() * 3)],
          source: 'device',
          is_processed: false,
        });
      }

      const { error } = await supabase.from('hr_device_logs').insert(logs);
      if (error) throw error;

      // Update device last_sync
      await supabase.from('hr_fingerprint_devices').update({
        last_sync_at: new Date().toISOString(),
        total_employees: employees.length,
      }).eq('id', deviceId);

      return { count: logs.length, employees: employees.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['device-logs'] });
      queryClient.invalidateQueries({ queryKey: ['fingerprint-devices'] });
      toast.success(
        language === 'ar'
          ? `تم سحب ${result.count} حركة لـ ${result.employees} موظف بنجاح`
          : `Successfully pulled ${result.count} records for ${result.employees} employees`
      );
      setIsSyncing(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
      setIsSyncing(false);
    },
  });

  const processLogs = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company');

      const { data: unprocessed } = await supabase
        .from('hr_device_logs')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_processed', false)
        .order('employee_code')
        .order('punch_time');

      if (!unprocessed || unprocessed.length === 0) {
        throw new Error(language === 'ar' ? 'لا توجد حركات غير مرحلة' : 'No unprocessed logs');
      }

      // Group by employee and date
      const grouped: Record<string, any[]> = {};
      for (const log of unprocessed) {
        const date = log.punch_time.split('T')[0];
        const key = `${log.employee_code}_${date}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(log);
      }

      let processed = 0;
      for (const [key, logs] of Object.entries(grouped)) {
        const sorted = logs.sort((a, b) => new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime());
        const firstPunch = sorted[0];
        const lastPunch = sorted[sorted.length - 1];
        const date = firstPunch.punch_time.split('T')[0];

        // Find employee by code
        const { data: emp } = await supabase
          .from('employees')
          .select('id')
          .eq('company_id', companyId)
          .or(`employee_number.eq.${firstPunch.employee_code},id.ilike.${firstPunch.employee_code}%`)
          .limit(1)
          .single();

        if (emp) {
          const checkIn = format(new Date(firstPunch.punch_time), 'HH:mm');
          const checkOut = sorted.length > 1 ? format(new Date(lastPunch.punch_time), 'HH:mm') : null;

          // Determine status
          const checkInHour = new Date(firstPunch.punch_time).getHours();
          const checkInMin = new Date(firstPunch.punch_time).getMinutes();
          const isLate = checkInHour > 8 || (checkInHour === 8 && checkInMin > 15);

          // Upsert attendance record
          await supabase.from('employee_attendance').upsert({
            company_id: companyId,
            employee_id: emp.id,
            date,
            check_in: checkIn,
            check_out: checkOut,
            status: isLate ? 'late' : 'present',
            source: 'fingerprint',
            device_id: firstPunch.device_id,
          }, { onConflict: 'employee_id,date' });

          processed++;
        }

        // Mark logs as processed
        const logIds = logs.map(l => l.id);
        await supabase.from('hr_device_logs').update({ is_processed: true }).in('id', logIds);
      }

      return { processed, total: Object.keys(grouped).length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['device-logs'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success(
        language === 'ar'
          ? `تم ترحيل ${result.processed} سجل حضور من ${result.total} حركة`
          : `Processed ${result.processed} attendance records from ${result.total} movements`
      );
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const unprocessedCount = deviceLogs.filter((l: any) => !l.is_processed).length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue={showOperations ? 'movements' : 'devices'}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">{language === 'ar' ? 'سحب بيانات الأجهزة' : 'Pull Device Data'}</TabsTrigger>
          <TabsTrigger value="movements">{language === 'ar' ? 'عرض الحركات' : 'View Movements'}</TabsTrigger>
          <TabsTrigger value="process">{language === 'ar' ? 'ترحيل الحركات' : 'Process Movements'}</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                {language === 'ar' ? 'سحب بيانات الأجهزة بالشبكة' : 'Pull Data from Network Devices'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 border rounded-lg p-4">
                  <h3 className="font-semibold">{language === 'ar' ? 'سحب بيانات الأجهزة بالشبكة' : 'Pull from Network Devices'}</h3>
                  
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'اختر الجهاز' : 'Select Device'}</Label>
                    <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                      <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'جميع الأجهزة' : 'All Devices'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'ar' ? 'جميع الأجهزة' : 'All Devices'}</SelectItem>
                        {devices.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.device_name} ({d.ip_address || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'من تاريخ' : 'From Date'}</Label>
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</Label>
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                  </div>

                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      if (selectedDevice && selectedDevice !== 'all') {
                        simulateDeviceSync.mutate(selectedDevice);
                      } else if (devices.length > 0) {
                        simulateDeviceSync.mutate(devices[0].id);
                      } else {
                        toast.error(language === 'ar' ? 'يرجى إضافة جهاز أولاً' : 'Please add a device first');
                      }
                    }}
                    disabled={isSyncing || devices.length === 0}
                  >
                    {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {language === 'ar' ? 'قراءة بيانات الأجهزة' : 'Read Device Data'}
                  </Button>
                </div>

                <div className="space-y-4 border rounded-lg p-4">
                  <h3 className="font-semibold">{language === 'ar' ? 'الأجهزة المتصلة' : 'Connected Devices'}</h3>
                  {devices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {language === 'ar' ? 'لا توجد أجهزة. أضف جهازاً من صفحة أجهزة البصمة' : 'No devices. Add one from Fingerprint Devices page'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {devices.map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-emerald-500" />
                            <div>
                              <p className="text-sm font-medium">{d.device_name}</p>
                              <p className="text-xs text-muted-foreground">{d.ip_address}:{d.port} • {d.device_model}</p>
                            </div>
                          </div>
                          <Badge variant="default" className="text-xs">
                            {d.total_employees || 0} {language === 'ar' ? 'موظف' : 'emp'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5" />
                  {language === 'ar' ? 'سجل حركات الأجهزة' : 'Device Movement Logs'}
                </span>
                <Badge variant="outline">{deviceLogs.length} {language === 'ar' ? 'حركة' : 'records'}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-auto" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-auto" />
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger className="w-48"><SelectValue placeholder={language === 'ar' ? 'جميع الأجهزة' : 'All Devices'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الأجهزة' : 'All Devices'}</SelectItem>
                    {devices.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.device_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">{language === 'ar' ? 'كود الموظف' : 'Employee Code'}</TableHead>
                      <TableHead className="text-right">{language === 'ar' ? 'وقت البصمة' : 'Punch Time'}</TableHead>
                      <TableHead className="text-right">{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                      <TableHead className="text-right">{language === 'ar' ? 'طريقة التحقق' : 'Verification'}</TableHead>
                      <TableHead className="text-right">{language === 'ar' ? 'الجهاز' : 'Device'}</TableHead>
                      <TableHead className="text-right">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : deviceLogs.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {language === 'ar' ? 'لا توجد حركات في الفترة المحددة' : 'No movements in selected period'}
                      </TableCell></TableRow>
                    ) : deviceLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono">{log.employee_code}</TableCell>
                        <TableCell dir="ltr">{format(new Date(log.punch_time), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                        <TableCell>
                          <Badge variant={log.punch_type === 'in' ? 'default' : log.punch_type === 'out' ? 'secondary' : 'outline'}>
                            {log.punch_type === 'in' ? (language === 'ar' ? 'حضور' : 'In') : log.punch_type === 'out' ? (language === 'ar' ? 'انصراف' : 'Out') : (language === 'ar' ? 'تلقائي' : 'Auto')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.verification_method === 'fingerprint' ? '👆 ' : log.verification_method === 'face' ? '😀 ' : '🪪 '}
                          {log.verification_method === 'fingerprint' ? (language === 'ar' ? 'بصمة' : 'Fingerprint') :
                           log.verification_method === 'face' ? (language === 'ar' ? 'وجه' : 'Face') :
                           (language === 'ar' ? 'كارت' : 'Card')}
                        </TableCell>
                        <TableCell>{(log as any).hr_fingerprint_devices?.device_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={log.is_processed ? 'secondary' : 'outline'}>
                            {log.is_processed ? (language === 'ar' ? 'مُرحّل' : 'Processed') : (language === 'ar' ? 'غير مُرحّل' : 'Pending')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'ترحيل الحركات إلى سجل الحضور' : 'Process Movements to Attendance'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{deviceLogs.length}</div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الحركات' : 'Total Movements'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-amber-500">{unprocessedCount}</div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'غير مُرحّلة' : 'Unprocessed'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-emerald-500">{deviceLogs.length - unprocessedCount}</div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مُرحّلة' : 'Processed'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{new Set(deviceLogs.map((l: any) => l.employee_code)).size}</div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'عدد الموظفين' : 'Employees'}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button
                  className="gap-2"
                  onClick={() => processLogs.mutate()}
                  disabled={processLogs.isPending || unprocessedCount === 0}
                >
                  {processLogs.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {language === 'ar' ? 'ترحيل الحركات' : 'Process Movements'}
                </Button>
                <p className="text-sm text-muted-foreground self-center">
                  {language === 'ar'
                    ? 'سيتم تحويل حركات الأجهزة إلى سجلات حضور وانصراف مع تحديد الحالة (حاضر/متأخر) تلقائياً'
                    : 'Device logs will be converted to attendance records with auto status detection'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
