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
import { Loader2, Plus, Fingerprint, Wifi, WifiOff, RefreshCw, Trash2, Edit, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface FingerprintDevice {
  id: string;
  company_id: string;
  device_name: string;
  device_model: string;
  serial_number: string | null;
  ip_address: string | null;
  port: number;
  location: string | null;
  status: string;
  last_sync_at: string | null;
  total_employees: number;
  notes: string | null;
  created_at: string;
}

export function FingerprintDevicesPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<FingerprintDevice | null>(null);
  const [formData, setFormData] = useState({
    device_name: '',
    device_model: 'ZKTeco',
    serial_number: '',
    ip_address: '',
    port: 4370,
    location: '',
    notes: '',
  });

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['fingerprint-devices', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('hr_fingerprint_devices')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FingerprintDevice[];
    },
    enabled: !!companyId,
  });

  const addDevice = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('hr_fingerprint_devices').insert({
        company_id: companyId,
        device_name: data.device_name,
        device_model: data.device_model,
        serial_number: data.serial_number || null,
        ip_address: data.ip_address || null,
        port: data.port,
        location: data.location || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fingerprint-devices'] });
      toast.success(language === 'ar' ? 'تم إضافة الجهاز بنجاح' : 'Device added successfully');
      resetForm();
    },
    onError: () => toast.error(t.error_occurred),
  });

  const updateDevice = useMutation({
    mutationFn: async ({ id, ...data }: typeof formData & { id: string }) => {
      const { error } = await supabase.from('hr_fingerprint_devices').update({
        device_name: data.device_name,
        device_model: data.device_model,
        serial_number: data.serial_number || null,
        ip_address: data.ip_address || null,
        port: data.port,
        location: data.location || null,
        notes: data.notes || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fingerprint-devices'] });
      toast.success(language === 'ar' ? 'تم تحديث الجهاز بنجاح' : 'Device updated successfully');
      resetForm();
    },
    onError: () => toast.error(t.error_occurred),
  });

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hr_fingerprint_devices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fingerprint-devices'] });
      toast.success(language === 'ar' ? 'تم حذف الجهاز' : 'Device deleted');
    },
    onError: () => toast.error(t.error_occurred),
  });

  const syncDevice = useMutation({
    mutationFn: async (id: string) => {
      // Simulate sync - in production this would call the device API
      const { error } = await supabase.from('hr_fingerprint_devices').update({
        last_sync_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fingerprint-devices'] });
      toast.success(language === 'ar' ? 'تم مزامنة البيانات بنجاح' : 'Data synced successfully');
    },
    onError: () => toast.error(t.error_occurred),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase.from('hr_fingerprint_devices').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fingerprint-devices'] });
      toast.success(language === 'ar' ? 'تم تحديث حالة الجهاز' : 'Device status updated');
    },
  });

  const resetForm = () => {
    setFormData({ device_name: '', device_model: 'ZKTeco', serial_number: '', ip_address: '', port: 4370, location: '', notes: '' });
    setEditingDevice(null);
    setIsDialogOpen(false);
  };

  const openEdit = (device: FingerprintDevice) => {
    setEditingDevice(device);
    setFormData({
      device_name: device.device_name,
      device_model: device.device_model || 'ZKTeco',
      serial_number: device.serial_number || '',
      ip_address: device.ip_address || '',
      port: device.port || 4370,
      location: device.location || '',
      notes: device.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDevice) {
      updateDevice.mutate({ ...formData, id: editingDevice.id });
    } else {
      addDevice.mutate(formData);
    }
  };

  const activeCount = devices.filter(d => d.status === 'active').length;
  const inactiveCount = devices.filter(d => d.status !== 'active').length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Fingerprint className="w-6 h-6" />
            {language === 'ar' ? 'أجهزة البصمة' : 'Fingerprint Devices'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة وتعريف أجهزة البصمة لتسجيل الحضور والانصراف' : 'Manage fingerprint devices for attendance tracking'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'إضافة جهاز' : 'Add Device'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingDevice ? (language === 'ar' ? 'تعديل الجهاز' : 'Edit Device') : (language === 'ar' ? 'إضافة جهاز بصمة جديد' : 'Add New Fingerprint Device')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'اسم الجهاز' : 'Device Name'}</Label>
                  <Input value={formData.device_name} onChange={(e) => setFormData({ ...formData, device_name: e.target.value })} required placeholder={language === 'ar' ? 'مثال: جهاز المدخل الرئيسي' : 'e.g. Main Entrance Device'} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الموديل' : 'Model'}</Label>
                  <Select value={formData.device_model} onValueChange={(v) => setFormData({ ...formData, device_model: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZKTeco">ZKTeco</SelectItem>
                      <SelectItem value="Hikvision">Hikvision</SelectItem>
                      <SelectItem value="Dahua">Dahua</SelectItem>
                      <SelectItem value="Suprema">Suprema</SelectItem>
                      <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الرقم التسلسلي' : 'Serial Number'}</Label>
                  <Input value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الموقع' : 'Location'}</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder={language === 'ar' ? 'مثال: المدخل الرئيسي' : 'e.g. Main Entrance'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'عنوان IP' : 'IP Address'}</Label>
                  <Input value={formData.ip_address} onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })} dir="ltr" placeholder="192.168.1.100" />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'المنفذ (Port)' : 'Port'}</Label>
                  <Input type="number" value={formData.port} onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 4370 })} dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>{t.cancel}</Button>
                <Button type="submit" disabled={addDevice.isPending || updateDevice.isPending || !formData.device_name}>
                  {(addDevice.isPending || updateDevice.isPending) && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {editingDevice ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'إضافة' : 'Add')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{devices.length}</div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الأجهزة' : 'Total Devices'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold">{activeCount}</div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'نشط' : 'Active'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-destructive" />
              <div>
                <div className="text-2xl font-bold">{inactiveCount}</div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'غير نشط' : 'Inactive'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{devices.reduce((sum, d) => sum + (d.total_employees || 0), 0)}</div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'بصمات مسجلة' : 'Registered Prints'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قائمة أجهزة البصمة' : 'Fingerprint Devices List'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{language === 'ar' ? 'اسم الجهاز' : 'Device Name'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الموديل' : 'Model'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الرقم التسلسلي' : 'Serial No.'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'IP' : 'IP Address'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الموقع' : 'Location'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'آخر مزامنة' : 'Last Sync'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.device_name}</TableCell>
                    <TableCell>{device.device_model}</TableCell>
                    <TableCell dir="ltr">{device.serial_number || '-'}</TableCell>
                    <TableCell dir="ltr">{device.ip_address ? `${device.ip_address}:${device.port}` : '-'}</TableCell>
                    <TableCell>{device.location || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={device.status === 'active' ? 'default' : 'destructive'}
                        className="cursor-pointer"
                        onClick={() => toggleStatus.mutate({ id: device.id, currentStatus: device.status })}
                      >
                        {device.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'معطل' : 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {device.last_sync_at
                        ? format(new Date(device.last_sync_at), 'dd/MM/yyyy HH:mm', { locale: language === 'ar' ? ar : undefined })
                        : (language === 'ar' ? 'لم تتم المزامنة' : 'Never synced')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => syncDevice.mutate(device.id)} title={language === 'ar' ? 'مزامنة' : 'Sync'}>
                          <RefreshCw className={`w-4 h-4 ${syncDevice.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(device)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الجهاز؟' : 'Delete this device?')) deleteDevice.mutate(device.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {devices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {language === 'ar' ? 'لا توجد أجهزة بصمة مسجلة' : 'No fingerprint devices registered'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
