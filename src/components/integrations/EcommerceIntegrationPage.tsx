import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ShoppingCart, Link2, RefreshCw, CheckCircle2, Settings, Loader2, Package, Users, FileText } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
// Service layer - ecommerce integrations feature under development
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface IntegrationConfig {
  store_url: string;
  api_key: string;
  webhook_secret: string;
  sync_products: boolean;
  sync_orders: boolean;
  sync_customers: boolean;
}

const PLATFORMS = {
  salla: {
    name: 'سلة',
    color: 'bg-purple-500',
    docsUrl: 'https://docs.salla.dev',
    description: 'ربط متجرك في سلة لمزامنة المنتجات والطلبات تلقائياً',
    steps: [
      'سجل الدخول لحسابك في سلة',
      'اذهب إلى لوحة التحكم → التطبيقات → إضافة تطبيق',
      'اختر "تطبيق خاص" واحصل على Client ID و Client Secret',
      'أدخل البيانات أدناه',
    ],
  },
  zid: {
    name: 'زد',
    color: 'bg-blue-500',
    docsUrl: 'https://docs.zid.sa',
    description: 'ربط متجرك في زد لمزامنة المنتجات والطلبات تلقائياً',
    steps: [
      'سجل الدخول لحسابك في زد',
      'اذهب إلى الإعدادات → التكاملات → API',
      'أنشئ مفتاح API جديد',
      'أدخل البيانات أدناه',
    ],
  },
};

export function EcommerceIntegrationPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [activePlatform, setActivePlatform] = useState<'salla' | 'zid'>('salla');
  const [config, setConfig] = useState<Record<string, IntegrationConfig>>({
    salla: { store_url: '', api_key: '', webhook_secret: '', sync_products: true, sync_orders: true, sync_customers: true },
    zid: { store_url: '', api_key: '', webhook_secret: '', sync_products: true, sync_orders: true, sync_customers: true },
  });

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['ecommerce-integrations', companyId],
    queryFn: async () => {
      // ecommerce_integrations table removed during schema cleanup
      return [] as Array<{ platform: string; is_active: boolean; last_sync_at: string | null }>;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async (_platform: string) => {
      toast.info('ميزة التكامل مع المتاجر الإلكترونية قيد التطوير');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-integrations', companyId] });
    },
    onError: () => toast.error('خطأ في حفظ الإعدادات'),
  });

  const getIntegration = (platform: string) => integrations.find((i: any) => i.platform === platform);

  const platformInfo = PLATFORMS[activePlatform];
  const currentIntegration = getIntegration(activePlatform);
  const currentConfig = config[activePlatform];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          ربط منصات التجارة الإلكترونية
        </h1>
        <p className="text-muted-foreground">مزامنة المنتجات والطلبات والعملاء مع سلة وزد</p>
      </div>

      <Tabs value={activePlatform} onValueChange={v => setActivePlatform(v as 'salla' | 'zid')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="salla" className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            سلة (Salla)
            {getIntegration('salla')?.is_active && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          </TabsTrigger>
          <TabsTrigger value="zid" className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            زد (Zid)
            {getIntegration('zid')?.is_active && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          </TabsTrigger>
        </TabsList>

        {(['salla', 'zid'] as const).map(platform => (
          <TabsContent key={platform} value={platform}>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Setup Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="w-5 h-5" />
                      إعداد {PLATFORMS[platform].name}
                    </CardTitle>
                    {currentIntegration?.is_active && <Badge className="bg-emerald-500">متصل</Badge>}
                  </div>
                  <CardDescription>{PLATFORMS[platform].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">خطوات الربط:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      {PLATFORMS[platform].steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">رابط المتجر</label>
                      <Input
                        placeholder={platform === 'salla' ? 'https://store.salla.sa/...' : 'https://store.zid.sa/...'}
                        value={config[platform].store_url}
                        onChange={e => setConfig(p => ({ ...p, [platform]: { ...p[platform], store_url: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">مفتاح API</label>
                      <Input
                        type="password"
                        placeholder="أدخل مفتاح API"
                        value={config[platform].api_key}
                        onChange={e => setConfig(p => ({ ...p, [platform]: { ...p[platform], api_key: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Webhook Secret (اختياري)</label>
                      <Input
                        type="password"
                        placeholder="للإشعارات الفورية"
                        value={config[platform].webhook_secret}
                        onChange={e => setConfig(p => ({ ...p, [platform]: { ...p[platform], webhook_secret: e.target.value } }))}
                      />
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => saveMutation.mutate(platform)} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Settings className="w-4 h-4 ml-2" />}
                    حفظ وتفعيل
                  </Button>
                </CardContent>
              </Card>

              {/* Sync Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    إعدادات المزامنة
                  </CardTitle>
                  <CardDescription>اختر البيانات التي تريد مزامنتها</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">المنتجات</p>
                        <p className="text-xs text-muted-foreground">مزامنة الأصناف والأسعار والمخزون</p>
                      </div>
                    </div>
                    <Switch
                      checked={config[platform].sync_products}
                      onCheckedChange={v => setConfig(p => ({ ...p, [platform]: { ...p[platform], sync_products: v } }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">الطلبات</p>
                        <p className="text-xs text-muted-foreground">استيراد الطلبات كفواتير بيع تلقائياً</p>
                      </div>
                    </div>
                    <Switch
                      checked={config[platform].sync_orders}
                      onCheckedChange={v => setConfig(p => ({ ...p, [platform]: { ...p[platform], sync_orders: v } }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">العملاء</p>
                        <p className="text-xs text-muted-foreground">مزامنة بيانات العملاء والعناوين</p>
                      </div>
                    </div>
                    <Switch
                      checked={config[platform].sync_customers}
                      onCheckedChange={v => setConfig(p => ({ ...p, [platform]: { ...p[platform], sync_customers: v } }))}
                    />
                  </div>

                  {currentIntegration?.last_sync_at && (
                    <p className="text-xs text-muted-foreground text-center">
                      آخر مزامنة: {new Date(currentIntegration.last_sync_at).toLocaleString('ar-SA')}
                    </p>
                  )}

                  <Button variant="outline" className="w-full" disabled={!currentIntegration?.is_active}>
                    <RefreshCw className="w-4 h-4 ml-2" />
                    مزامنة الآن
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
