import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plug, ShoppingBag, CreditCard, Building, Globe, Webhook } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Integration {
  platform: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'ecommerce' | 'payment' | 'banking' | 'other';
}

const integrations: Integration[] = [
  { platform: 'salla', name: 'سلة', description: 'ربط مع متجر سلة لمزامنة الطلبات والمنتجات', icon: <ShoppingBag className="w-8 h-8 text-purple-500" />, category: 'ecommerce' },
  { platform: 'zid', name: 'زد', description: 'ربط مع منصة زد لإدارة المبيعات الإلكترونية', icon: <ShoppingBag className="w-8 h-8 text-blue-500" />, category: 'ecommerce' },
  { platform: 'shopify', name: 'Shopify', description: 'ربط مع متجر Shopify لمزامنة المنتجات والطلبات', icon: <ShoppingBag className="w-8 h-8 text-emerald-500" />, category: 'ecommerce' },
  { platform: 'mada', name: 'مدى', description: 'بوابة دفع مدى للمدفوعات المحلية', icon: <CreditCard className="w-8 h-8 text-green-600" />, category: 'payment' },
  { platform: 'apple_pay', name: 'Apple Pay', description: 'قبول المدفوعات عبر Apple Pay', icon: <CreditCard className="w-8 h-8 text-gray-800" />, category: 'payment' },
  { platform: 'bank_api', name: 'الربط البنكي', description: 'استيراد كشوف حسابات بنكية تلقائياً', icon: <Building className="w-8 h-8 text-indigo-500" />, category: 'banking' },
];

export function IntegrationsPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [configDialog, setConfigDialog] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['integrations', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const toggleIntegration = useMutation({
    mutationFn: async ({ platform, is_active }: { platform: string; is_active: boolean }) => {
      if (!companyId) throw new Error('No company');
      const existing = configs.find((c: any) => c.platform === platform);
      if (existing) {
        const { error } = await supabase.from('integration_configs').update({ is_active }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('integration_configs').insert({ company_id: companyId, platform, is_active });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('تم تحديث التكامل');
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const isActive = (platform: string) => configs.find((c: any) => c.platform === platform)?.is_active || false;

  const categories = [
    { key: 'ecommerce', label: 'التجارة الإلكترونية', icon: <Globe className="w-5 h-5" /> },
    { key: 'payment', label: 'بوابات الدفع', icon: <CreditCard className="w-5 h-5" /> },
    { key: 'banking', label: 'الربط البنكي', icon: <Building className="w-5 h-5" /> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Plug className="w-6 h-6" />
          التكاملات الخارجية
        </h1>
        <p className="text-muted-foreground">ربط النظام مع منصات التجارة الإلكترونية وبوابات الدفع والأنظمة البنكية</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{configs.filter((c: any) => c.is_active).length}</div><p className="text-sm text-muted-foreground">تكاملات نشطة</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{integrations.length}</div><p className="text-sm text-muted-foreground">تكاملات متاحة</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{configs.filter((c: any) => c.last_sync_at).length}</div><p className="text-sm text-muted-foreground">تمت المزامنة</p></CardContent></Card>
      </div>

      {categories.map((cat) => (
        <div key={cat.key} className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">{cat.icon}{cat.label}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.filter(i => i.category === cat.key).map((integration) => (
              <Card key={integration.platform} className={isActive(integration.platform) ? 'border-primary/50 bg-primary/5' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {integration.icon}
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{integration.description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={isActive(integration.platform)}
                      onCheckedChange={(checked) => toggleIntegration.mutate({ platform: integration.platform, is_active: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={isActive(integration.platform) ? 'default' : 'secondary'}>
                      {isActive(integration.platform) ? 'مفعّل' : 'غير مفعّل'}
                    </Badge>
                    {isActive(integration.platform) && (
                      <Button size="sm" variant="outline" onClick={() => setConfigDialog(integration.platform)}>
                        إعدادات
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Config Dialog */}
      <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعدادات التكامل - {integrations.find(i => i.platform === configDialog)?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." dir="ltr" />
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">ملاحظة:</p>
              <p>لإكمال الربط، يرجى التواصل مع فريق الدعم لتزويدك بمفاتيح API اللازمة وإتمام عملية التكامل.</p>
            </div>
            <Button className="w-full" onClick={() => { toast.success('تم حفظ الإعدادات'); setConfigDialog(null); }}>
              حفظ الإعدادات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
