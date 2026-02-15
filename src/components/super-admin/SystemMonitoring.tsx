import { useQuery } from '@tanstack/react-query';
import { Monitor, Cpu, HardDrive, Database, Wifi, Server, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

export function SystemMonitoring() {
  // Fetch real system stats from database
  const { data: stats } = useQuery({
    queryKey: ['system-monitoring-real'],
    queryFn: async () => {
      const [
        companiesRes, profilesRes, journalsRes, salesRes,
        invoicesRes, checksRes, expensesRes, customersRes,
        suppliersRes, carsRes,
      ] = await Promise.all([
        supabase.from('companies').select('id, database_size_mb, api_calls_count, is_active, last_activity_at', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }),
        supabase.from('sales').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('checks').select('id', { count: 'exact', head: true }),
        supabase.from('expenses').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('cars').select('id', { count: 'exact', head: true }),
      ]);

      const companies = companiesRes.data || [];
      const totalDbSize = companies.reduce((s, c) => s + Number((c as any).database_size_mb || 0), 0);
      const totalApiCalls = companies.reduce((s, c) => s + Number((c as any).api_calls_count || 0), 0);
      const activeCompanies = companies.filter(c => c.is_active).length;

      // Calculate activity in last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const activeRecently = companies.filter(c => 
        (c as any).last_activity_at && (c as any).last_activity_at > oneDayAgo
      ).length;

      return {
        totalCompanies: companiesRes.count || 0,
        activeCompanies,
        activeRecently,
        totalUsers: profilesRes.count || 0,
        totalJournals: journalsRes.count || 0,
        totalSales: salesRes.count || 0,
        totalInvoices: invoicesRes.count || 0,
        totalChecks: checksRes.count || 0,
        totalExpenses: expensesRes.count || 0,
        totalCustomers: customersRes.count || 0,
        totalSuppliers: suppliersRes.count || 0,
        totalCars: carsRes.count || 0,
        totalDbSize,
        totalApiCalls,
      };
    },
    refetchInterval: 30000,
  });

  // Fetch recent activity logs for error monitoring
  const { data: recentErrors = [] } = useQuery({
    queryKey: ['system-recent-errors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Fetch per-company usage breakdown
  const { data: companyUsage = [] } = useQuery({
    queryKey: ['system-company-usage'],
    queryFn: async () => {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, database_size_mb, api_calls_count, last_activity_at, is_active')
        .order('api_calls_count', { ascending: false })
        .limit(20);

      if (!companies) return [];

      // For each top company, get user count
      const enriched = await Promise.all(
        companies.map(async (c) => {
          const { count: userCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', c.id);

          const { count: journalCount } = await supabase
            .from('journal_entries')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', c.id);

          return {
            ...c,
            users: userCount || 0,
            journals: journalCount || 0,
            dbSize: Number((c as any).database_size_mb || 0),
            apiCalls: Number((c as any).api_calls_count || 0),
            lastActivity: (c as any).last_activity_at,
          };
        })
      );

      return enriched;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Calculate real resource usage based on data
  const totalRecords = (stats?.totalJournals || 0) + (stats?.totalSales || 0) + (stats?.totalInvoices || 0) + (stats?.totalChecks || 0) + (stats?.totalExpenses || 0);
  const estimatedDbUsage = Math.min(95, Math.max(1, totalRecords / 1000)); // Rough estimate
  const estimatedApiLoad = Math.min(95, Math.max(1, (stats?.totalApiCalls || 0) / 100));

  const metricColor = (value: number) => {
    if (value < 50) return 'text-green-500';
    if (value < 80) return 'text-amber-500';
    return 'text-destructive';
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'غير متاح';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Monitor className="w-6 h-6" /> مراقبة النظام</h2>
        <p className="text-muted-foreground">بيانات حية من قاعدة البيانات</p>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Server className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats?.totalCompanies || 0}</p>
            <p className="text-xs text-muted-foreground">شركات مسجلة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Cpu className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats?.activeCompanies || 0}</p>
            <p className="text-xs text-muted-foreground">شركات نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wifi className={`w-8 h-8 mx-auto mb-2 ${metricColor(estimatedApiLoad)}`} />
            <p className="text-2xl font-bold">{(stats?.totalApiCalls || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">إجمالي طلبات API</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Database className={`w-8 h-8 mx-auto mb-2 ${metricColor(estimatedDbUsage)}`} />
            <p className="text-2xl font-bold">{(stats?.totalDbSize || 0).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">حجم DB (MB)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">إجمالي السجلات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Monitor className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats?.activeRecently || 0}</p>
            <p className="text-xs text-muted-foreground">نشط آخر 24 ساعة</p>
          </CardContent>
        </Card>
      </div>

      {/* Database Stats Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">إحصائيات قاعدة البيانات</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'الشركات', value: stats?.totalCompanies || 0 },
              { label: 'المستخدمين', value: stats?.totalUsers || 0 },
              { label: 'القيود المحاسبية', value: stats?.totalJournals || 0 },
              { label: 'المبيعات', value: stats?.totalSales || 0 },
              { label: 'الفواتير', value: stats?.totalInvoices || 0 },
              { label: 'الشيكات', value: stats?.totalChecks || 0 },
              { label: 'المصروفات', value: stats?.totalExpenses || 0 },
              { label: 'العملاء', value: stats?.totalCustomers || 0 },
              { label: 'الموردين', value: stats?.totalSuppliers || 0 },
              { label: 'السيارات', value: stats?.totalCars || 0 },
            ].map(item => (
              <div key={item.label} className="flex justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">{item.label}</span>
                <span className="font-bold">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Per-Company Usage */}
        <Card>
          <CardHeader><CardTitle className="text-base">استخدام الشركات (أعلى 20)</CardTitle></CardHeader>
          <CardContent>
            {companyUsage.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشركة</TableHead>
                      <TableHead>المستخدمين</TableHead>
                      <TableHead>القيود</TableHead>
                      <TableHead>DB</TableHead>
                      <TableHead>آخر نشاط</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyUsage.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                            {c.name}
                          </div>
                        </TableCell>
                        <TableCell>{c.users}</TableCell>
                        <TableCell>{c.journals.toLocaleString()}</TableCell>
                        <TableCell>{c.dbSize.toFixed(1)} MB</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatTime(c.lastActivity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error/Activity Logs */}
      {recentErrors.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">سجل النشاط الأخير</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentErrors.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell><Badge variant="outline">{log.activity_type}</Badge></TableCell>
                    <TableCell className="text-sm">{log.description || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ip_address || '-'}</TableCell>
                    <TableCell className="text-xs">{new Date(log.created_at).toLocaleString('ar-SA')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
