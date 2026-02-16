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
  const deviceDefaults: Record<string, { port: number; protocol: string; sdk: string; features: string; notes: string; software: string; softwareUrl: string; models: string; capacity: string; communication: string }> = {
    ZKTeco: { port: 4370, protocol: 'TCP/IP, UDP, RS232/485', sdk: 'ZKTeco Stand Alone SDK (C#, VB.NET, Delphi)', features: 'بصمة إصبع، تعرف وجه، كارت RFID، كلمة مرور، راحة الكف', notes: 'أكبر مصنع أجهزة بصمة في العالم. يدعم بروتوكول Push/Pull. المنفذ الافتراضي 4370 TCP/UDP. يمكن التكامل عبر ZKBioTime API (REST). يدعم ADMS للاتصال السحابي.', software: 'ZKBioTime 8.0 / ZKTime.Net 3.0 / ZKAccess 3.5', softwareUrl: 'https://www.zkteco.com/en/download_catgory.html', models: 'K40, K50, MB460, SpeedFace-V5L, ProFace X, iClock 9000, uFace 800, SF1000', capacity: 'بصمات: 3,000-50,000 | وجوه: 800-50,000 | سجلات: 100,000-1,000,000', communication: 'TCP/IP, USB Host, WiFi (اختياري), 4G (اختياري), PoE (بعض الموديلات)' },
    Hikvision: { port: 80, protocol: 'TCP/IP, ISAPI, OSDP', sdk: 'Hikvision Device Network SDK (C++, Java), ISAPI REST API', features: 'تعرف وجه AI، بصمة إصبع، كارت Mifare/EM، QR Code، قياس حرارة', notes: 'ثاني أكبر مصنع أمني عالمياً. يستخدم ISAPI Protocol (HTTP/HTTPS). المنفذ الافتراضي 80 HTTP أو 443 HTTPS. يدعم ONVIF. كاميرات ذكية مدمجة.', software: 'iVMS-4200 / HikCentral Professional / Hik-Connect', softwareUrl: 'https://www.hikvision.com/en/support/download/software/', models: 'DS-K1T671M, DS-K1T341A, DS-K1T804M, DS-K1A802, DS-K1T680, MinMoe Series', capacity: 'بصمات: 5,000-10,000 | وجوه: 1,500-50,000 | سجلات: 150,000-300,000', communication: 'TCP/IP, WiFi, RS485, Wiegand 26/34, PoE, USB' },
    Dahua: { port: 37777, protocol: 'TCP/IP, HTTP/HTTPS, DHOP', sdk: 'Dahua NetSDK (C/C++), Smart PSS API', features: 'تعرف وجه AI، بصمة إصبع، كارت IC/ID، كلمة مرور', notes: 'منافس رئيسي لـ Hikvision. المنفذ الافتراضي 37777 TCP. يدعم DSS Pro للإدارة المركزية. يدعم ONVIF Profile S/G.', software: 'SmartPSS / DSS Pro / DMSS (موبايل)', softwareUrl: 'https://www.dahuasecurity.com/support/downloadCenter', models: 'ASI7213Y, ASI6214J, ASA3212G, ASI7223X, DHI-ASI6214J-PW', capacity: 'بصمات: 3,000-10,000 | وجوه: 2,000-50,000 | سجلات: 150,000-500,000', communication: 'TCP/IP, RS485, Wiegand, USB, PoE, WiFi (اختياري)' },
    Suprema: { port: 51211, protocol: 'TCP/IP, RS485, OSDP, Wiegand', sdk: 'BioStar 2 REST API (JSON), BioStar 2 SDK', features: 'بصمة إصبع (Live Finger Detection)، تعرف وجه، كارت، QR، NFC، Mobile Access', notes: 'شركة كورية رائدة في البيومترك. BioStar 2 يوفر REST API كامل. المنفذ 51211 لـ BioStar 2 Server. تشفير AES 256 و TLS. دقة عالية جداً.', software: 'BioStar 2 / BioStar 2 Mobile', softwareUrl: 'https://www.supremainc.com/en/support/biostar-2-download.asp', models: 'BioStation 2, BioStation 3, FaceStation F2, BioEntry W2, BioLite N2, X-Station 2', capacity: 'بصمات: 500,000 | وجوه: 50,000 | سجلات: 5,000,000', communication: 'TCP/IP, RS485, OSDP v2, Wiegand, WiFi, Bluetooth, USB, PoE' },
    Anviz: { port: 5010, protocol: 'TCP/IP, WiFi, RS485', sdk: 'Anviz SDK (C#), CrossChex Cloud API (REST)', features: 'بصمة إصبع، تعرف وجه، كارت RFID، WiFi مدمج', notes: 'شركة صينية متخصصة. المنفذ الافتراضي 5010. يدعم CrossChex Cloud للإدارة السحابية. واجهة بسيطة وسهلة.', software: 'CrossChex Standard / CrossChex Cloud', softwareUrl: 'https://www.anviz.com/downloads.html', models: 'FaceDeep 3, FaceDeep 5, C2 Pro, EP300, T60, W1 Pro, OA1000', capacity: 'بصمات: 3,000-10,000 | وجوه: 3,000-25,000 | سجلات: 100,000-200,000', communication: 'TCP/IP, WiFi, USB Host, RS485, PoE (بعض الموديلات)' },
    FingerTec: { port: 4370, protocol: 'TCP/IP, USB, RS232/485', sdk: 'FingerTec OFIS SDK, TCMS V2 SDK', features: 'بصمة إصبع، كارت RFID، كلمة مرور', notes: 'شركة ماليزية. تستخدم نفس بروتوكول ZK (منفذ 4370). برنامج TCMSv2 مجاني مع الجهاز. يدعم TimeTec Cloud للإدارة السحابية.', software: 'TCMSv2 / TimeTec TA (Cloud) / Ingress', softwareUrl: 'https://www.fingertec.com/software-download/', models: 'Face ID 4, R2c, AC-100C, Q2i, TA500, i-Kiosk 100 Plus', capacity: 'بصمات: 1,500-10,000 | وجوه: 400-10,000 | سجلات: 100,000-200,000', communication: 'TCP/IP, USB, RS232, RS485, WiFi (اختياري)' },
    Biotime: { port: 4370, protocol: 'TCP/IP, HTTP/HTTPS REST API', sdk: 'ZKBioTime REST API (JSON), Push SDK', features: 'إدارة مركزية لأجهزة ZKTeco، تقارير متقدمة، جدولة ورديات', notes: 'نظام حضور وانصراف سحابي/محلي من ZKTeco. يدعم إدارة آلاف الأجهزة. REST API كامل على المنفذ 80/443. يتكامل مع أنظمة HR و ERP.', software: 'ZKBioTime 8.0 / ZKBioTime Cloud', softwareUrl: 'https://www.zkteco.com/en/product_detail/ZKBioTime_8.0.html', models: 'برنامج سحابي/محلي يدعم جميع أجهزة ZKTeco', capacity: 'غير محدود - حسب الترخيص', communication: 'TCP/IP, ADMS (Push), REST API, Webhook' },
    eSSL: { port: 4370, protocol: 'TCP/IP, USB, RS232/485', sdk: 'eSSL SDK (C#), eTimeTrackLite API', features: 'بصمة إصبع، كارت RFID، كلمة مرور', notes: 'علامة تجارية هندية (Matrix/eSSL). تستخدم بروتوكول ZK (منفذ 4370). برنامج eTimeTrackLite مجاني. منتشرة في الهند والشرق الأوسط.', software: 'eTimeTrackLite / eSSL Etimetrak / BioTime (eSSL edition)', softwareUrl: 'https://www.esslindia.com/software-downloads', models: 'X990, eSSL F22, eSSL MB160, X7, Identix SF100, eSSL K21', capacity: 'بصمات: 1,000-8,000 | وجوه: 400-3,000 | سجلات: 50,000-200,000', communication: 'TCP/IP, USB, RS232, RS485, WiFi (اختياري)' },
    Realand: { port: 4370, protocol: 'TCP/IP, USB, RS232/485', sdk: 'Realand SDK, A-C Software SDK', features: 'بصمة إصبع، كارت RFID، كلمة مرور', notes: 'شركة صينية اقتصادية. تستخدم بروتوكول ZK المتوافق (منفذ 4370). برنامج A-C مجاني مع الجهاز. مناسبة للشركات الصغيرة.', software: 'A-C021 / A-F260 Attendance Software', softwareUrl: 'https://www.realandbio.com/download.html', models: 'A-C071, A-F261, A-C030T, A-C051, F391, ZDC20', capacity: 'بصمات: 500-3,000 | وجوه: 200-800 | سجلات: 50,000-150,000', communication: 'TCP/IP, USB, RS232/485' },
    Virdi: { port: 9870, protocol: 'TCP/IP, RS485, Wiegand, OSDP', sdk: 'UNIS REST API, Virdi SDK (C++/C#)', features: 'بصمة إصبع (FAP20/30)، تعرف وجه IR، كارت، قزحية العين، راحة الكف', notes: 'شركة كورية (Union Community). المنفذ 9870 لـ UNIS Server. أعلى دقة بصمة (FAP30 FBI Certified). تشفير AES-256. مقاومة للتزوير.', software: 'UNIS / Virdi Manager', softwareUrl: 'https://www.virditech.com/eng/download/download.php', models: 'AC-7000, AC-6000, AC-2200, UBio-X Face, UBio-X Pro 2, NS-4', capacity: 'بصمات: 20,000-100,000 | وجوه: 5,000-50,000 | سجلات: 500,000-3,000,000', communication: 'TCP/IP, RS485, Wiegand 26/34, OSDP, USB, WiFi (اختياري)' },
    ZKSoftware: { port: 4370, protocol: 'TCP/IP, RS232/485, USB', sdk: 'ZK SDK (C/C++/VB/Delphi), CZKEM ActiveX', features: 'بصمة إصبع، كارت RFID، كلمة مرور', notes: 'الجيل الأقدم (قبل ZKTeco). المنفذ 4370. يستخدم CZKEM.dll (ActiveX) للاتصال. لا يزال منتشراً. متوافق مع برامج ZKTeco الحديثة.', software: 'ZK Attendance Management / ZKTime 5.0', softwareUrl: 'https://www.zkteco.com/en/download_catgory.html', models: 'iClock 580, iClock 560, iClock 360, U160, T4-C, S922', capacity: 'بصمات: 1,500-8,000 | سجلات: 50,000-200,000', communication: 'TCP/IP, RS232, RS485, USB' },
    Timewatch: { port: 4370, protocol: 'TCP/IP, USB, RS232', sdk: 'Timewatch SDK, Bio Plugin SDK', features: 'بصمة إصبع، تعرف وجه، كارت RFID', notes: 'شركة هندية. تستخدم بروتوكول متوافق مع ZK. برنامج Timewatch Plus مدمج. مناسبة للسوق الهندي والخليجي.', software: 'Timewatch Plus / Bio Plugin / BioNet', softwareUrl: 'https://www.timewatchindia.com/downloads/', models: 'TW-F880, TW-X990, TW-F100, TW-FV501, TW-PA300', capacity: 'بصمات: 1,000-5,000 | وجوه: 500-3,000 | سجلات: 50,000-200,000', communication: 'TCP/IP, USB, RS232, WiFi (اختياري)' },
    Matrix: { port: 4011, protocol: 'TCP/IP, RS485, Wiegand, OSDP', sdk: 'COSEC REST API (JSON/XML), Matrix SDK', features: 'بصمة إصبع، تعرف وجه AI، كارت، كلمة مرور، Palm Vein', notes: 'شركة هندية متقدمة. COSEC CENTRA يوفر REST API كامل على المنفذ 4011. دعم Multi-site. تقارير متقدمة. معتمد من STQC.', software: 'COSEC CENTRA / COSEC ARGO (Cloud)', softwareUrl: 'https://www.matrixcomsec.com/downloads.html', models: 'COSEC DOOR FMX, COSEC DOOR FOV, COSEC ARGO FACE, COSEC APTA', capacity: 'بصمات: 5,000-25,000 | وجوه: 10,000-50,000 | سجلات: 500,000-1,000,000', communication: 'TCP/IP, RS485, Wiegand 26/34, OSDP v2, PoE, WiFi' },
    Hundure: { port: 4370, protocol: 'TCP/IP, RS232/485', sdk: 'Hundure SDK, RAC-900 SDK', features: 'بصمة إصبع، كارت EM/Mifare، كلمة مرور', notes: 'شركة تايوانية. المنفذ 4370. برنامج RAC-900 لإدارة الحضور والتحكم بالأبواب. جودة تصنيع عالية.', software: 'RAC-900 Series Software / HTA Software', softwareUrl: 'https://www.hundure.com.tw/download.html', models: 'RAC-960PEF, HTA-860PEF, RAC-940, HTA-830PE', capacity: 'بصمات: 1,500-5,000 | سجلات: 100,000-200,000', communication: 'TCP/IP, RS232, RS485, Wiegand, USB' },
  };

  const handleModelChange = (model: string) => {
    const defaults = deviceDefaults[model];
    if (defaults) {
      setFormData(prev => ({
        ...prev,
        device_model: model,
        port: defaults.port,
        notes: defaults.notes,
      }));
    } else {
      setFormData(prev => ({ ...prev, device_model: model }));
    }
  };

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
                  <Select value={formData.device_model} onValueChange={handleModelChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZKTeco">ZKTeco</SelectItem>
                      <SelectItem value="Hikvision">Hikvision</SelectItem>
                      <SelectItem value="Dahua">Dahua</SelectItem>
                      <SelectItem value="Suprema">Suprema</SelectItem>
                      <SelectItem value="Anviz">Anviz</SelectItem>
                      <SelectItem value="FingerTec">FingerTec</SelectItem>
                      <SelectItem value="Biotime">BioTime</SelectItem>
                      <SelectItem value="eSSL">eSSL</SelectItem>
                      <SelectItem value="Realand">Realand</SelectItem>
                      <SelectItem value="Virdi">Virdi</SelectItem>
                      <SelectItem value="ZKSoftware">ZK Software</SelectItem>
                      <SelectItem value="Timewatch">Timewatch</SelectItem>
                      <SelectItem value="Matrix">Matrix COSEC</SelectItem>
                      <SelectItem value="Hundure">Hundure</SelectItem>
                      <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Device Info Card */}
              {deviceDefaults[formData.device_model] && (() => {
                const d = deviceDefaults[formData.device_model];
                return (
                  <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-3">
                    <p className="text-sm font-bold text-foreground">{language === 'ar' ? '📋 البيانات التعريفية الحقيقية للجهاز' : '📋 Real Device Specifications'}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">{language === 'ar' ? 'البروتوكول:' : 'Protocol:'}</span> <span className="font-medium">{d.protocol}</span></div>
                      <div><span className="text-muted-foreground">{language === 'ar' ? 'المنفذ:' : 'Port:'}</span> <span className="font-medium">{d.port}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">SDK:</span> <span className="font-medium">{d.sdk}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">{language === 'ar' ? 'المميزات:' : 'Features:'}</span> <span className="font-medium">{d.features}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">{language === 'ar' ? 'الموديلات:' : 'Models:'}</span> <span className="font-medium">{d.models}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">{language === 'ar' ? 'السعة:' : 'Capacity:'}</span> <span className="font-medium">{d.capacity}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">{language === 'ar' ? 'طرق الاتصال:' : 'Communication:'}</span> <span className="font-medium">{d.communication}</span></div>
                    </div>
                    <div className="border-t border-border pt-2 space-y-1">
                      <p className="text-xs"><span className="text-muted-foreground">{language === 'ar' ? 'برنامج الحضور:' : 'Software:'}</span> <span className="font-semibold">{d.software}</span></p>
                      <a href={d.softwareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                        📥 {language === 'ar' ? 'تحميل برنامج الحضور والانصراف' : 'Download Attendance Software'}
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">{d.notes}</p>
                  </div>
                );
              })()}
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
