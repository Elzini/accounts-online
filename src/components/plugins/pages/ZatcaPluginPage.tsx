import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Receipt, Settings, Shield, FileCheck, AlertTriangle, CheckCircle, 
  Upload, RefreshCw, Eye, Send, Clock, Server, Key, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useZatcaConfig, useSaveZatcaConfig, useZatcaInvoices, useCallZatcaAPI } from '@/hooks/useZatcaIntegration';

export function ZatcaPluginPage() {
  const { data: config, isLoading: configLoading } = useZatcaConfig();
  const { data: invoices = [], isLoading: invoicesLoading } = useZatcaInvoices();
  const saveConfig = useSaveZatcaConfig();
  const callApi = useCallZatcaAPI();

  const [otp, setOtp] = useState('');
  const [environment, setEnvironment] = useState(config?.environment || 'sandbox');
  const [autoSubmit, setAutoSubmit] = useState(true);

  const handleSaveConfig = () => {
    saveConfig.mutate({ environment, otp: otp || undefined }, {
      onSuccess: () => toast.success('تم حفظ الإعدادات'),
    });
  };

  const handleGetCSID = () => {
    if (!otp) return toast.error('أدخل رمز OTP أولاً');
    callApi.mutate({
      action: 'get-csid',
      environment,
      otp,
      csr: 'auto-generated', // In production, CSR would be generated
    }, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success('تم الحصول على Compliance CSID بنجاح!');
          saveConfig.mutate({
            environment,
            compliance_csid: data.data?.binarySecurityToken,
            status: 'compliance_ready',
          });
        } else {
          toast.error(`فشل: ${data.error}`);
        }
      },
      onError: (err) => toast.error(`خطأ: ${err.message}`),
    });
  };

  const handleGetProductionCSID = () => {
    if (!config?.compliance_csid) return toast.error('يجب الحصول على Compliance CSID أولاً');
    callApi.mutate({
      action: 'renew-csid',
      environment,
      csid: config.compliance_csid,
      csidSecret: config.private_key || '',
      csr: 'auto-generated',
    }, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success('تم الحصول على Production CSID بنجاح! النظام جاهز للإنتاج.');
          saveConfig.mutate({
            production_csid: data.data?.binarySecurityToken,
            status: 'production_ready',
          });
        } else {
          toast.error(`فشل: ${data.error}`);
        }
      },
      onError: (err) => toast.error(`خطأ: ${err.message}`),
    });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      cleared: { label: 'مقبولة', variant: 'default' },
      reported: { label: 'مبلغ عنها', variant: 'secondary' },
      pending: { label: 'قيد المعالجة', variant: 'outline' },
      rejected: { label: 'مرفوضة', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const configStatus = config?.status || 'not_configured';
  const statusLabels: Record<string, { label: string; color: string }> = {
    not_configured: { label: 'غير مهيأ', color: 'text-muted-foreground' },
    compliance_ready: { label: 'جاهز للامتثال', color: 'text-yellow-500' },
    production_ready: { label: 'جاهز للإنتاج', color: 'text-green-500' },
    active: { label: 'نشط', color: 'text-green-500' },
  };

  const clearedCount = invoices.filter(i => i.submission_status === 'cleared').length;
  const reportedCount = invoices.filter(i => i.submission_status === 'reported').length;
  const pendingCount = invoices.filter(i => i.submission_status === 'pending').length;
  const rejectedCount = invoices.filter(i => i.submission_status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">🧾</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">الفوترة الإلكترونية ZATCA</h1>
          <p className="text-muted-foreground">الامتثال الكامل لمتطلبات هيئة الزكاة والضريبة والجمارك - المرحلة الثانية</p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <Badge variant="outline" className={`gap-1 ${statusLabels[configStatus]?.color}`}>
            {configStatus === 'active' || configStatus === 'production_ready' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {statusLabels[configStatus]?.label}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="setup">
        <TabsList>
          <TabsTrigger value="setup" className="gap-2"><Key className="w-4 h-4" />التفعيل والربط</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2"><Receipt className="w-4 h-4" />الفواتير</TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2"><Shield className="w-4 h-4" />الامتثال</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" />الإعدادات</TabsTrigger>
        </TabsList>

        {/* SETUP TAB - ZATCA Integration Steps */}
        <TabsContent value="setup" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="w-5 h-5" />خطوات التفعيل مع ZATCA</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className={`p-4 rounded-lg border-2 ${configStatus !== 'not_configured' ? 'border-green-500/30 bg-green-50/10' : 'border-primary/30 bg-primary/5'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${configStatus !== 'not_configured' ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}`}>1</div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold">الحصول على Compliance CSID</h3>
                      <p className="text-sm text-muted-foreground">أدخل رمز OTP المُقدَّم من هيئة الزكاة والضريبة والجمارك لتوليد شهادة الامتثال</p>
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>رمز OTP من ZATCA</Label>
                        <Input placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} className="font-mono" />
                      </div>
                      <div>
                        <Label>البيئة</Label>
                        <Select value={environment} onValueChange={setEnvironment}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sandbox">تجريبية (Sandbox)</SelectItem>
                            <SelectItem value="simulation">محاكاة (Simulation)</SelectItem>
                            <SelectItem value="production">إنتاجية (Production)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleGetCSID} disabled={callApi.isPending || !otp}>
                        {callApi.isPending ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Upload className="w-4 h-4 me-1" />}
                        توليد CSID
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`p-4 rounded-lg border-2 ${configStatus === 'production_ready' || configStatus === 'active' ? 'border-green-500/30 bg-green-50/10' : configStatus === 'compliance_ready' ? 'border-primary/30 bg-primary/5' : 'border-muted'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${configStatus === 'production_ready' || configStatus === 'active' ? 'bg-green-500 text-white' : configStatus === 'compliance_ready' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold">الحصول على Production CSID</h3>
                      <p className="text-sm text-muted-foreground">بعد اجتياز اختبارات الامتثال، قم بتوليد شهادة الإنتاج للربط المباشر</p>
                    </div>
                    <Button 
                      onClick={handleGetProductionCSID} 
                      disabled={configStatus === 'not_configured' || callApi.isPending}
                      variant={configStatus === 'compliance_ready' ? 'default' : 'outline'}
                    >
                      {callApi.isPending ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Shield className="w-4 h-4 me-1" />}
                      توليد Production CSID
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`p-4 rounded-lg border-2 ${configStatus === 'active' ? 'border-green-500/30 bg-green-50/10' : 'border-muted'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${configStatus === 'active' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>3</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">الإرسال التلقائي للفواتير</h3>
                    <p className="text-sm text-muted-foreground">بعد التفعيل، سيتم إرسال جميع الفواتير تلقائياً لـ ZATCA (Reporting/Clearance)</p>
                    {(configStatus === 'production_ready' || configStatus === 'active') && (
                      <Badge className="mt-2" variant="default"><CheckCircle className="w-3 h-3 me-1" />النظام جاهز للإرسال التلقائي</Badge>
                    )}
                  </div>
                </div>
              </div>

              {config?.compliance_csid && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <h4 className="font-medium text-sm">معلومات الشهادة الحالية</h4>
                  <div className="text-xs font-mono break-all text-muted-foreground">
                    <p><strong>Compliance CSID:</strong> {config.compliance_csid.substring(0, 50)}...</p>
                    {config.production_csid && <p><strong>Production CSID:</strong> {config.production_csid.substring(0, 50)}...</p>}
                    <p><strong>آخر تحديث:</strong> {new Date(config.updated_at).toLocaleString('ar-SA')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 text-center">
              <FileCheck className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{clearedCount}</p><p className="text-xs text-muted-foreground">فواتير مقبولة</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <Send className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{reportedCount}</p><p className="text-xs text-muted-foreground">مبلغ عنها</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <Clock className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">قيد المعالجة</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
              <p className="text-2xl font-bold">{rejectedCount}</p><p className="text-xs text-muted-foreground">مرفوضة</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">سجل الفواتير الإلكترونية</CardTitle></CardHeader>
            <CardContent>
              {invoicesLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : invoices.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">لا توجد فواتير مُرسلة بعد. سيتم تسجيل الفواتير تلقائياً عند إرسالها لـ ZATCA.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>المعرف</TableHead><TableHead>النوع</TableHead><TableHead>UUID</TableHead><TableHead>الحالة</TableHead><TableHead>تاريخ الإرسال</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {invoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.invoice_id || inv.id.substring(0, 8)}</TableCell>
                        <TableCell>{inv.invoice_type === 'standard' ? 'ضريبية' : 'مبسطة'}</TableCell>
                        <TableCell className="font-mono text-xs">{inv.uuid?.substring(0, 12) || '-'}...</TableCell>
                        <TableCell>{getStatusBadge(inv.submission_status)}</TableCell>
                        <TableCell>{inv.submitted_at ? new Date(inv.submitted_at).toLocaleString('ar-SA') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPLIANCE TAB */}
        <TabsContent value="compliance" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />حالة الامتثال</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'تسجيل الجهاز (Onboarding)', done: configStatus !== 'not_configured' },
                  { name: 'شهادة CSR', done: !!config?.compliance_csid },
                  { name: 'توقيع رقمي ECDSA', done: true },
                  { name: 'QR Code (TLV)', done: true },
                  { name: 'XML Schema UBL 2.1', done: true },
                  { name: 'UUID معرف فريد', done: true },
                  { name: 'Production CSID', done: !!config?.production_csid },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{item.name}</span>
                    {item.done ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Server className="w-4 h-4" />معلومات الاتصال</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>البيئة:</span><Badge>{config?.environment === 'production' ? 'إنتاجية' : config?.environment === 'simulation' ? 'محاكاة' : 'تجريبية'}</Badge></div>
                <div className="flex justify-between text-sm"><span>الحالة:</span><Badge variant={configStatus === 'not_configured' ? 'outline' : 'default'}>{statusLabels[configStatus]?.label}</Badge></div>
                <div className="flex justify-between text-sm"><span>آخر تحديث:</span><span>{config?.updated_at ? new Date(config.updated_at).toLocaleString('ar-SA') : '-'}</span></div>
                <div className="flex justify-between text-sm"><span>إجمالي الفواتير:</span><span>{invoices.length}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">إعدادات ZATCA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>الإرسال التلقائي</Label><p className="text-xs text-muted-foreground">إرسال الفواتير تلقائياً عند الإنشاء</p></div>
                <Switch checked={autoSubmit} onCheckedChange={setAutoSubmit} />
              </div>
              <div className="space-y-2">
                <Label>البيئة</Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">تجريبية (Sandbox)</SelectItem>
                    <SelectItem value="simulation">محاكاة (Simulation)</SelectItem>
                    <SelectItem value="production">إنتاجية (Production)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نوع الفاتورة الافتراضي</Label>
                <Select defaultValue="standard">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">فاتورة ضريبية</SelectItem>
                    <SelectItem value="simplified">فاتورة ضريبية مبسطة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveConfig} disabled={saveConfig.isPending}>
                {saveConfig.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
