import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, AlertTriangle, Info, AlertCircle, Building2 } from 'lucide-react';

const priorityConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  high: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'عاجل' },
  medium: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'متوسط' },
  low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'منخفض' },
};

export function CentralSmartAlerts() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['central-smart-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-for-alerts'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, name');
      return data || [];
    },
  });

  const companyMap = Object.fromEntries(companies.map((c: any) => [c.id, c.name]));

  const highCount = alerts.filter((a: any) => a.priority === 'high').length;
  const mediumCount = alerts.filter((a: any) => a.priority === 'medium').length;

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          التنبيهات الذكية المركزية
          <Badge variant="destructive" className="mr-2">{alerts.length} تنبيه</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ملخص سريع */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{highCount}</p>
            <p className="text-xs text-muted-foreground">عاجل</p>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-500">{mediumCount}</p>
            <p className="text-xs text-muted-foreground">متوسط</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{alerts.length - highCount - mediumCount}</p>
            <p className="text-xs text-muted-foreground">منخفض</p>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">🎉 لا توجد تنبيهات نشطة</div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert: any) => {
                const config = priorityConfig[alert.priority] || priorityConfig.low;
                const Icon = config.icon;
                return (
                  <div key={alert.id} className={`border rounded-lg p-3 ${config.bg}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                        <div>
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {companyMap[alert.company_id] || 'عام'}
                      </span>
                      <span>{new Date(alert.created_at).toLocaleString('ar-SA')}</span>
                      {alert.notification_type && (
                        <Badge variant="secondary" className="text-xs">{alert.notification_type}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
