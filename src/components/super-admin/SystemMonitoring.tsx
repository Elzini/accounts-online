import { useQuery } from '@tanstack/react-query';
import { Monitor, Cpu, HardDrive, Database, Wifi, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

export function SystemMonitoring() {
  // Fetch system stats
  const { data: stats } = useQuery({
    queryKey: ['system-monitoring'],
    queryFn: async () => {
      const [companiesRes, profilesRes, journalsRes, salesRes] = await Promise.all([
        supabase.from('companies').select('id, database_size_mb, api_calls_count', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }),
        supabase.from('sales').select('id', { count: 'exact', head: true }),
      ]);

      const companies = companiesRes.data || [];
      const totalDbSize = companies.reduce((s, c) => s + Number((c as any).database_size_mb || 0), 0);
      const totalApiCalls = companies.reduce((s, c) => s + Number((c as any).api_calls_count || 0), 0);

      return {
        totalCompanies: companiesRes.count || 0,
        totalUsers: profilesRes.count || 0,
        totalJournals: journalsRes.count || 0,
        totalSales: salesRes.count || 0,
        totalDbSize,
        totalApiCalls,
      };
    },
    refetchInterval: 30000,
  });

  // Simulated server metrics (in production these would come from monitoring API)
  const serverMetrics = {
    cpuUsage: 23,
    memoryUsage: 45,
    diskUsage: 32,
    apiLoad: stats?.totalApiCalls || 0,
    uptime: '99.97%',
    responseTime: '142ms',
  };

  const metricColor = (value: number) => {
    if (value < 50) return 'text-green-500';
    if (value < 80) return 'text-amber-500';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Monitor className="w-6 h-6" /> مراقبة النظام</h2>
        <p className="text-muted-foreground">مراقبة أداء السيرفرات والموارد</p>
      </div>

      {/* Server Health */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Cpu className={`w-8 h-8 mx-auto mb-2 ${metricColor(serverMetrics.cpuUsage)}`} />
            <p className="text-2xl font-bold">{serverMetrics.cpuUsage}%</p>
            <p className="text-xs text-muted-foreground">CPU</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <HardDrive className={`w-8 h-8 mx-auto mb-2 ${metricColor(serverMetrics.memoryUsage)}`} />
            <p className="text-2xl font-bold">{serverMetrics.memoryUsage}%</p>
            <p className="text-xs text-muted-foreground">الذاكرة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Database className={`w-8 h-8 mx-auto mb-2 ${metricColor(serverMetrics.diskUsage)}`} />
            <p className="text-2xl font-bold">{serverMetrics.diskUsage}%</p>
            <p className="text-xs text-muted-foreground">التخزين</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wifi className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{serverMetrics.responseTime}</p>
            <p className="text-xs text-muted-foreground">زمن الاستجابة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Monitor className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{serverMetrics.uptime}</p>
            <p className="text-xs text-muted-foreground">وقت التشغيل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wifi className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{serverMetrics.apiLoad.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">طلبات API</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">استخدام الموارد</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span>المعالج (CPU)</span><span>{serverMetrics.cpuUsage}%</span></div>
              <Progress value={serverMetrics.cpuUsage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span>الذاكرة (RAM)</span><span>{serverMetrics.memoryUsage}%</span></div>
              <Progress value={serverMetrics.memoryUsage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span>التخزين (Disk)</span><span>{serverMetrics.diskUsage}%</span></div>
              <Progress value={serverMetrics.diskUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">إحصائيات قاعدة البيانات</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between p-2 rounded bg-muted/50">
              <span className="text-sm">إجمالي الشركات</span>
              <span className="font-bold">{stats?.totalCompanies || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-muted/50">
              <span className="text-sm">إجمالي المستخدمين</span>
              <span className="font-bold">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-muted/50">
              <span className="text-sm">إجمالي القيود المحاسبية</span>
              <span className="font-bold">{stats?.totalJournals?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-muted/50">
              <span className="text-sm">إجمالي المبيعات</span>
              <span className="font-bold">{stats?.totalSales?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-muted/50">
              <span className="text-sm">حجم قاعدة البيانات</span>
              <span className="font-bold">{(stats?.totalDbSize || 0).toFixed(1)} MB</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
