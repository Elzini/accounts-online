import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, Database, Globe, Lock, Key, Activity, Save, Plus, X, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper to fetch a system setting
async function fetchSetting(key: string): Promise<string | null> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .is('company_id', null)
    .maybeSingle();
  return data?.value || null;
}

// Helper to save a system setting
async function saveSetting(key: string, value: string): Promise<void> {
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', key)
    .is('company_id', null)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('app_settings')
      .update({ value })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('app_settings')
      .insert({ key, value, company_id: null });
    if (error) throw error;
  }
}

const DEFAULT_CURRENCIES = ['SAR', 'USD', 'EUR', 'AED', 'KWD', 'BHD', 'QAR', 'OMR', 'EGP', 'JOD', 'IQD'];
const DEFAULT_COUNTRIES = [
  { code: 'SA', name: 'السعودية', vat: 15 },
  { code: 'AE', name: 'الإمارات', vat: 5 },
  { code: 'KW', name: 'الكويت', vat: 0 },
  { code: 'BH', name: 'البحرين', vat: 10 },
  { code: 'QA', name: 'قطر', vat: 0 },
  { code: 'OM', name: 'عمان', vat: 5 },
  { code: 'EG', name: 'مصر', vat: 14 },
  { code: 'JO', name: 'الأردن', vat: 16 },
  { code: 'IQ', name: 'العراق', vat: 0 },
];

export function SystemControlCenter() {
  const queryClient = useQueryClient();

  // Fetch all settings
  const { data: currencies = DEFAULT_CURRENCIES } = useQuery({
    queryKey: ['system-setting', 'supported_currencies'],
    queryFn: async () => {
      const val = await fetchSetting('supported_currencies');
      return val ? JSON.parse(val) : DEFAULT_CURRENCIES;
    },
  });

  const { data: countries = DEFAULT_COUNTRIES } = useQuery({
    queryKey: ['system-setting', 'supported_countries'],
    queryFn: async () => {
      const val = await fetchSetting('supported_countries');
      return val ? JSON.parse(val) : DEFAULT_COUNTRIES;
    },
  });

  const { data: trialSettings = { days: 14, autoActivate: true } } = useQuery({
    queryKey: ['system-setting', 'trial_settings'],
    queryFn: async () => {
      const val = await fetchSetting('trial_settings');
      return val ? JSON.parse(val) : { days: 14, autoActivate: true };
    },
  });

  const { data: securitySettings = { twoFactorRequired: false, apiRateLimit: 1000, ipRestrictions: [] as string[] } } = useQuery({
    queryKey: ['system-setting', 'security_settings'],
    queryFn: async () => {
      const val = await fetchSetting('security_settings');
      return val ? JSON.parse(val) : { twoFactorRequired: false, apiRateLimit: 1000, ipRestrictions: [] };
    },
  });

  // State for editing
  const [editCurrencies, setEditCurrencies] = useState<string[]>([]);
  const [editCountries, setEditCountries] = useState<typeof DEFAULT_COUNTRIES>([]);
  const [editTrial, setEditTrial] = useState({ days: 14, autoActivate: true });
  const [editSecurity, setEditSecurity] = useState({ twoFactorRequired: false, apiRateLimit: 1000, ipRestrictions: [] as string[] });
  const [newCurrency, setNewCurrency] = useState('');
  const [newCountry, setNewCountry] = useState({ code: '', name: '', vat: 0 });
  const [newIp, setNewIp] = useState('');

  useEffect(() => { setEditCurrencies(currencies); }, [currencies]);
  useEffect(() => { setEditCountries(countries); }, [countries]);
  useEffect(() => { setEditTrial(trialSettings); }, [trialSettings]);
  useEffect(() => { setEditSecurity(securitySettings); }, [securitySettings]);

  // Save mutations
  const saveMut = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      await saveSetting(key, JSON.stringify(value));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system-setting', variables.key] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء الحفظ'),
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['system-audit-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  // Fetch backup info
  const { data: backups = [] } = useQuery({
    queryKey: ['system-backups'],
    queryFn: async () => {
      const { data } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Fetch API keys count
  const { data: apiKeysCount = 0 } = useQuery({
    queryKey: ['system-api-keys-count'],
    queryFn: async () => {
      const { count } = await supabase.from('api_keys').select('id', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const addCurrency = () => {
    if (newCurrency && !editCurrencies.includes(newCurrency.toUpperCase())) {
      setEditCurrencies([...editCurrencies, newCurrency.toUpperCase()]);
      setNewCurrency('');
    }
  };

  const removeCurrency = (c: string) => setEditCurrencies(editCurrencies.filter(x => x !== c));

  const addCountry = () => {
    if (newCountry.code && newCountry.name) {
      setEditCountries([...editCountries, { ...newCountry }]);
      setNewCountry({ code: '', name: '', vat: 0 });
    }
  };

  const removeCountry = (code: string) => setEditCountries(editCountries.filter(c => c.code !== code));

  const updateCountryVat = (code: string, vat: number) => {
    setEditCountries(editCountries.map(c => c.code === code ? { ...c, vat } : c));
  };

  const addIpRestriction = () => {
    if (newIp && !editSecurity.ipRestrictions.includes(newIp)) {
      setEditSecurity({ ...editSecurity, ipRestrictions: [...editSecurity.ipRestrictions, newIp] });
      setNewIp('');
    }
  };

  const removeIp = (ip: string) => {
    setEditSecurity({ ...editSecurity, ipRestrictions: editSecurity.ipRestrictions.filter(i => i !== ip) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6" /> مركز التحكم في النظام</h2>
        <p className="text-muted-foreground">إعدادات عامة، أمان، نسخ احتياطي</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general" className="gap-2"><Globe className="w-4 h-4" /> إعدادات عامة</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" /> الأمان</TabsTrigger>
          <TabsTrigger value="backups" className="gap-2"><Database className="w-4 h-4" /> النسخ الاحتياطي</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Currencies */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">العملات المدعومة</CardTitle>
                <Button size="sm" onClick={() => saveMut.mutate({ key: 'supported_currencies', value: editCurrencies })} className="gap-1">
                  <Save className="w-3 h-3" /> حفظ
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {editCurrencies.map(c => (
                    <Badge key={c} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeCurrency(c)}>
                      {c} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="مثال: TRY" value={newCurrency} onChange={e => setNewCurrency(e.target.value)} className="w-24" />
                  <Button size="sm" variant="outline" onClick={addCurrency}><Plus className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>

            {/* Countries & Tax */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">الدول والضرائب</CardTitle>
                <Button size="sm" onClick={() => saveMut.mutate({ key: 'supported_countries', value: editCountries })} className="gap-1">
                  <Save className="w-3 h-3" /> حفظ
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {editCountries.map(c => (
                    <div key={c.code} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeCountry(c.code)}>
                          <X className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium">{c.name}</span>
                        <Badge variant="outline" className="text-xs">{c.code}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={c.vat}
                          onChange={e => updateCountryVat(c.code, +e.target.value)}
                          className="w-16 h-7 text-xs text-center"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="الرمز" value={newCountry.code} onChange={e => setNewCountry(nc => ({ ...nc, code: e.target.value.toUpperCase() }))} className="w-16" />
                  <Input placeholder="الاسم" value={newCountry.name} onChange={e => setNewCountry(nc => ({ ...nc, name: e.target.value }))} className="flex-1" />
                  <Input type="number" placeholder="%" value={newCountry.vat || ''} onChange={e => setNewCountry(nc => ({ ...nc, vat: +e.target.value }))} className="w-16" />
                  <Button size="sm" variant="outline" onClick={addCountry}><Plus className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>

            {/* Trial Settings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">إعدادات التجربة المجانية</CardTitle>
                <Button size="sm" onClick={() => saveMut.mutate({ key: 'trial_settings', value: editTrial })} className="gap-1">
                  <Save className="w-3 h-3" /> حفظ
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>فترة التجربة (أيام)</Label>
                  <Input type="number" value={editTrial.days} onChange={e => setEditTrial(t => ({ ...t, days: +e.target.value }))} className="mt-1" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editTrial.autoActivate} onCheckedChange={v => setEditTrial(t => ({ ...t, autoActivate: v }))} />
                  <Label>تفعيل تلقائي بعد التسجيل</Label>
                </div>
              </CardContent>
            </Card>

            {/* API Keys Summary */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="w-4 h-4" /> مفاتيح API</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>عدد المفاتيح النشطة</span><span className="font-bold">{apiKeysCount}</span></div>
                  <div className="flex justify-between"><span>تشفير</span><Badge>AES-256-GCM</Badge></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" /> إعدادات الأمان</CardTitle>
                <Button size="sm" onClick={() => saveMut.mutate({ key: 'security_settings', value: editSecurity })} className="gap-1">
                  <Save className="w-3 h-3" /> حفظ
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>المصادقة الثنائية إلزامية للمدراء</Label>
                  <Switch checked={editSecurity.twoFactorRequired} onCheckedChange={v => setEditSecurity(s => ({ ...s, twoFactorRequired: v }))} />
                </div>
                <div>
                  <Label>حد الطلبات API (لكل ساعة)</Label>
                  <Input type="number" value={editSecurity.apiRateLimit} onChange={e => setEditSecurity(s => ({ ...s, apiRateLimit: +e.target.value }))} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> تقييد IP</CardTitle>
                <Button size="sm" onClick={() => saveMut.mutate({ key: 'security_settings', value: editSecurity })} className="gap-1">
                  <Save className="w-3 h-3" /> حفظ
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {editSecurity.ipRestrictions.length > 0 ? (
                  <div className="space-y-1">
                    {editSecurity.ipRestrictions.map(ip => (
                      <div key={ip} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="font-mono text-sm">{ip}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeIp(ip)}><X className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد قيود IP - جميع العناوين مسموحة</p>
                )}
                <div className="flex gap-2">
                  <Input placeholder="مثال: 192.168.1.0/24" value={newIp} onChange={e => setNewIp(e.target.value)} />
                  <Button size="sm" variant="outline" onClick={addIpRestriction}><Plus className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audit Logs */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> سجل الأنشطة الأخيرة ({auditLogs.length})</CardTitle></CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>النوع</TableHead>
                        <TableHead>الإجراء</TableHead>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.slice(0, 50).map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell><Badge variant="outline">{log.entity_type}</Badge></TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell className="font-mono text-xs">{log.user_id?.substring(0, 8) || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{log.ip_address || '-'}</TableCell>
                          <TableCell className="text-xs">{new Date(log.created_at).toLocaleString('ar-SA')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">لا توجد سجلات أنشطة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups */}
        <TabsContent value="backups" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">سجل النسخ الاحتياطية ({backups.length})</CardTitle></CardHeader>
            <CardContent>
              {backups.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الحجم</TableHead>
                      <TableHead>الشركة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell><Badge variant="outline">{b.backup_type}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={b.status === 'completed' ? 'default' : 'secondary'}>
                            {b.status === 'completed' ? 'مكتمل' : b.status === 'in_progress' ? 'جاري' : b.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{b.file_size ? `${(b.file_size / 1024 / 1024).toFixed(1)} MB` : '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{b.company_id?.substring(0, 8) || '-'}</TableCell>
                        <TableCell className="text-xs">{new Date(b.created_at).toLocaleString('ar-SA')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد نسخ احتياطية مسجلة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
