import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2, Users, Car, DollarSign, ShoppingCart, TrendingUp,
  Wallet, Activity, Shield, HardDrive, Clock, Gauge, Save,
  Database, Key, Globe, BarChart3, Zap, AlertTriangle,
  CheckCircle2, XCircle, Settings2, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';

interface CompanyDashboardData {
  company_id: string;
  company_name: string;
  subdomain: string | null;
  is_active: boolean;
  company_type: string;
  created_at: string;
  // Stats
  users_count: number;
  cars_count: number;
  sales_count: number;
  total_sales: number;
  total_profit: number;
  customers_count: number;
  suppliers_count: number;
  expenses_total: number;
  journal_entries_count: number;
  // Quotas
  max_users: number;
  max_requests_per_minute: number;
  max_storage_mb: number;
  max_records_per_table: number;
  quota_active: boolean;
  // Isolation
  has_schema: boolean;
  has_encryption: boolean;
  // Rate limits
  recent_requests: number;
}

interface QuotaForm {
  max_users: number;
  max_requests_per_minute: number;
  max_storage_mb: number;
  max_records_per_table: number;
  is_active: boolean;
}

export function CompanyAdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaForm, setQuotaForm] = useState<QuotaForm>({
    max_users: 50,
    max_requests_per_minute: 100,
    max_storage_mb: 500,
    max_records_per_table: 100000,
    is_active: true,
  });

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['company-admin-dashboard'],
    queryFn: async (): Promise<CompanyDashboardData[]> => {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;

      const results: CompanyDashboardData[] = [];

      for (const company of companies || []) {
        const [
          usersRes, carsRes, salesRes, customersRes, suppliersRes,
          expensesRes, journalRes, quotaRes, rateLimitRes
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('cars').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('sales').select('sale_price, profit').eq('company_id', company.id),
          supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('expenses').select('amount').eq('company_id', company.id),
          supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('tenant_resource_quotas').select('*').eq('company_id', company.id).maybeSingle(),
          supabase.from('tenant_rate_limits').select('request_count').eq('company_id', company.id),
        ]);

        const salesData = salesRes.data || [];
        const expensesData = expensesRes.data || [];
        const quota = quotaRes.data;

        // Check schema & encryption existence
        let hasSchema = false;
        let hasEncryption = false;
        try {
          const { data: schemaCheck } = await supabase.rpc('check_tenant_schema_exists', {
            p_company_id: company.id
          });
          hasSchema = !!schemaCheck;
        } catch { hasSchema = false; }

        const { data: encKey } = await supabase
          .from('tenant_encryption_keys')
          .select('id')
          .eq('company_id', company.id)
          .maybeSingle();
        hasEncryption = !!encKey;

        const recentRequests = (rateLimitRes.data || []).reduce((sum, r) => sum + (r.request_count || 0), 0);

        results.push({
          company_id: company.id,
          company_name: company.name,
          subdomain: (company as any).subdomain || null,
          is_active: company.is_active,
          company_type: (company as any).company_type || 'car_dealership',
          created_at: company.created_at,
          users_count: usersRes.count || 0,
          cars_count: carsRes.count || 0,
          sales_count: salesData.length,
          total_sales: salesData.reduce((s, r) => s + (r.sale_price || 0), 0),
          total_profit: salesData.reduce((s, r) => s + (r.profit || 0), 0),
          customers_count: customersRes.count || 0,
          suppliers_count: suppliersRes.count || 0,
          expenses_total: expensesData.reduce((s, r) => s + (r.amount || 0), 0),
          journal_entries_count: journalRes.count || 0,
          max_users: quota?.max_users || 50,
          max_requests_per_minute: quota?.max_requests_per_minute || 100,
          max_storage_mb: quota?.max_storage_mb || 500,
          max_records_per_table: quota?.max_records_per_table || 100000,
          quota_active: quota?.is_active ?? true,
          has_schema: hasSchema,
          has_encryption: hasEncryption,
          recent_requests: recentRequests,
        });
      }

      return results;
    },
  });

  const updateQuota = useMutation({
    mutationFn: async ({ companyId, form }: { companyId: string; form: QuotaForm }) => {
      const { error } = await supabase
        .from('tenant_resource_quotas')
        .update({
          max_users: form.max_users,
          max_requests_per_minute: form.max_requests_per_minute,
          max_storage_mb: form.max_storage_mb,
          max_records_per_table: form.max_records_per_table,
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-admin-dashboard'] });
      toast.success('تم تحديث الحصص بنجاح');
      setQuotaDialogOpen(false);
    },
    onError: () => toast.error('حدث خطأ أثناء تحديث الحصص'),
  });

  const openQuotaDialog = (company: CompanyDashboardData) => {
    setSelectedCompanyId(company.company_id);
    setQuotaForm({
      max_users: company.max_users,
      max_requests_per_minute: company.max_requests_per_minute,
      max_storage_mb: company.max_storage_mb,
      max_records_per_table: company.max_records_per_table,
      is_active: company.quota_active,
    });
    setQuotaDialogOpen(true);
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(num);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('ar-SA').format(num);

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d));

  const ACTIVITY_LABELS: Record<string, string> = {
    car_dealership: 'معرض سيارات',
    construction: 'مقاولات',
    general_trading: 'تجارة عامة',
    restaurant: 'مطاعم',
    export_import: 'استيراد وتصدير',
  };

  // Totals
  const totals = dashboardData?.reduce(
    (acc, c) => ({
      users: acc.users + c.users_count,
      sales: acc.sales + c.total_sales,
      profit: acc.profit + c.total_profit,
      expenses: acc.expenses + c.expenses_total,
      requests: acc.requests + c.recent_requests,
      companies: acc.companies + 1,
      activeCompanies: acc.activeCompanies + (c.is_active ? 1 : 0),
      isolated: acc.isolated + (c.has_schema ? 1 : 0),
      encrypted: acc.encrypted + (c.has_encryption ? 1 : 0),
    }),
    { users: 0, sales: 0, profit: 0, expenses: 0, requests: 0, companies: 0, activeCompanies: 0, isolated: 0, encrypted: 0 }
  ) || { users: 0, sales: 0, profit: 0, expenses: 0, requests: 0, companies: 0, activeCompanies: 0, isolated: 0, encrypted: 0 };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-20 mb-2" /><Skeleton className="h-4 w-28" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Gauge className="w-7 h-7 text-primary" />
          لوحة إدارة الشركات المتقدمة
        </h2>
        <p className="text-muted-foreground mt-1">إدارة الحصص، مراقبة النشاط، وتتبع أداء كل شركة</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> إجمالي الشركات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.companies}</div>
            <p className="text-xs text-muted-foreground">{totals.activeCompanies} نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totals.users)}</div>
          </CardContent>
        </Card>

        <Card className="bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-success flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> إجمالي الأرباح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totals.profit)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> العزل والتشفير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.isolated}/{totals.companies}</div>
            <p className="text-xs text-muted-foreground">{totals.encrypted} مشفر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> الطلبات الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totals.requests)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Admin Table */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" /> نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="quotas" className="gap-2">
            <HardDrive className="w-4 h-4" /> الحصص والموارد
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" /> الأمان والعزل
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                أداء الشركات
              </CardTitle>
              <CardDescription>ملخص النشاط والأداء المالي لكل شركة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right text-xs">الشركة</TableHead>
                      <TableHead className="text-center text-xs">النطاق</TableHead>
                      <TableHead className="text-center text-xs">النوع</TableHead>
                      <TableHead className="text-center text-xs">المستخدمين</TableHead>
                      <TableHead className="text-center text-xs">العملاء</TableHead>
                      <TableHead className="text-center text-xs">المبيعات</TableHead>
                      <TableHead className="text-center text-xs">الأرباح</TableHead>
                      <TableHead className="text-center text-xs">المصروفات</TableHead>
                      <TableHead className="text-center text-xs">صافي الربح</TableHead>
                      <TableHead className="text-center text-xs">القيود</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData?.map((c) => {
                      const netProfit = c.total_profit - c.expenses_total;
                      return (
                        <TableRow key={c.company_id}>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${c.is_active ? 'bg-success' : 'bg-destructive'}`} />
                              <span className="font-semibold">{c.company_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {c.subdomain ? (
                              <Badge variant="outline" className="text-[10px]">
                                <Globe className="w-3 h-3 ml-1" />
                                {c.subdomain}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-[10px]">
                              {ACTIVITY_LABELS[c.company_type] || c.company_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-xs font-medium">{c.users_count}</TableCell>
                          <TableCell className="text-center text-xs">{c.customers_count}</TableCell>
                          <TableCell className="text-center text-xs">{formatCurrency(c.total_sales)}</TableCell>
                          <TableCell className="text-center text-xs text-success font-medium">
                            {formatCurrency(c.total_profit)}
                          </TableCell>
                          <TableCell className="text-center text-xs text-destructive">
                            {formatCurrency(c.expenses_total)}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            <span className={`font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {formatCurrency(netProfit)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-xs">{c.journal_entries_count}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotas Tab */}
        <TabsContent value="quotas">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-primary" />
                حصص الموارد لكل شركة
              </CardTitle>
              <CardDescription>التحكم في حدود الاستخدام والموارد المتاحة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right text-xs">الشركة</TableHead>
                      <TableHead className="text-center text-xs">المستخدمين</TableHead>
                      <TableHead className="text-center text-xs">الحد الأقصى</TableHead>
                      <TableHead className="text-center text-xs">الاستخدام %</TableHead>
                      <TableHead className="text-center text-xs">طلبات/دقيقة</TableHead>
                      <TableHead className="text-center text-xs">التخزين (MB)</TableHead>
                      <TableHead className="text-center text-xs">سجلات/جدول</TableHead>
                      <TableHead className="text-center text-xs">الحالة</TableHead>
                      <TableHead className="text-center text-xs">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData?.map((c) => {
                      const usagePercent = c.max_users > 0 ? Math.round((c.users_count / c.max_users) * 100) : 0;
                      const isNearLimit = usagePercent >= 80;
                      return (
                        <TableRow key={c.company_id}>
                          <TableCell className="text-xs font-semibold">{c.company_name}</TableCell>
                          <TableCell className="text-center text-xs font-medium">{c.users_count}</TableCell>
                          <TableCell className="text-center text-xs">{c.max_users}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Progress value={usagePercent} className={`w-16 h-2 ${isNearLimit ? '[&>div]:bg-destructive' : ''}`} />
                              <span className={`text-xs font-medium ${isNearLimit ? 'text-destructive' : ''}`}>
                                {usagePercent}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs">{c.max_requests_per_minute}</TableCell>
                          <TableCell className="text-center text-xs">{formatNumber(c.max_storage_mb)}</TableCell>
                          <TableCell className="text-center text-xs">{formatNumber(c.max_records_per_table)}</TableCell>
                          <TableCell className="text-center">
                            {c.quota_active ? (
                              <Badge className="bg-success/10 text-success text-[10px]">
                                <CheckCircle2 className="w-3 h-3 ml-1" /> مفعّل
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                <XCircle className="w-3 h-3 ml-1" /> معطّل
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button size="sm" variant="outline" onClick={() => openQuotaDialog(c)} className="gap-1 text-xs">
                              <Settings2 className="w-3.5 h-3.5" /> تعديل
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                حالة الأمان والعزل
              </CardTitle>
              <CardDescription>عرض حالة العزل المادي والتشفير لكل شركة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right text-xs">الشركة</TableHead>
                      <TableHead className="text-center text-xs">النطاق الفرعي</TableHead>
                      <TableHead className="text-center text-xs">Schema مستقل</TableHead>
                      <TableHead className="text-center text-xs">تشفير AES-256</TableHead>
                      <TableHead className="text-center text-xs">حد الطلبات</TableHead>
                      <TableHead className="text-center text-xs">الطلبات الأخيرة</TableHead>
                      <TableHead className="text-center text-xs">تاريخ الإنشاء</TableHead>
                      <TableHead className="text-center text-xs">التقييم</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData?.map((c) => {
                      const score = (c.has_schema ? 1 : 0) + (c.has_encryption ? 1 : 0) + (c.subdomain ? 1 : 0) + (c.quota_active ? 1 : 0);
                      const scoreLabel = score === 4 ? 'ممتاز' : score >= 3 ? 'جيد' : score >= 2 ? 'متوسط' : 'ضعيف';
                      const scoreColor = score === 4 ? 'text-success' : score >= 3 ? 'text-primary' : score >= 2 ? 'text-yellow-500' : 'text-destructive';
                      return (
                        <TableRow key={c.company_id}>
                          <TableCell className="text-xs font-semibold">{c.company_name}</TableCell>
                          <TableCell className="text-center">
                            {c.subdomain ? (
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <Globe className="w-3 h-3" /> {c.subdomain}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">غير مهيأ</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {c.has_schema ? (
                              <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-destructive mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {c.has_encryption ? (
                              <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-destructive mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs">{c.max_requests_per_minute}/دقيقة</TableCell>
                          <TableCell className="text-center text-xs font-medium">{c.recent_requests}</TableCell>
                          <TableCell className="text-center text-xs">{formatDate(c.created_at)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] font-bold ${scoreColor}`}>
                              {score}/4 — {scoreLabel}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quota Edit Dialog */}
      <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
        <DialogContent className="sm:max-w-[480px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" />
              تعديل حصص الشركة
            </DialogTitle>
            <DialogDescription>
              {dashboardData?.find(c => c.company_id === selectedCompanyId)?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> الحد الأقصى للمستخدمين</Label>
              <Input
                type="number"
                value={quotaForm.max_users}
                onChange={(e) => setQuotaForm({ ...quotaForm, max_users: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2"><Zap className="w-4 h-4" /> طلبات/دقيقة</Label>
              <Input
                type="number"
                value={quotaForm.max_requests_per_minute}
                onChange={(e) => setQuotaForm({ ...quotaForm, max_requests_per_minute: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2"><HardDrive className="w-4 h-4" /> التخزين (MB)</Label>
              <Input
                type="number"
                value={quotaForm.max_storage_mb}
                onChange={(e) => setQuotaForm({ ...quotaForm, max_storage_mb: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2"><Database className="w-4 h-4" /> سجلات/جدول</Label>
              <Input
                type="number"
                value={quotaForm.max_records_per_table}
                onChange={(e) => setQuotaForm({ ...quotaForm, max_records_per_table: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={quotaForm.is_active}
                onCheckedChange={(v) => setQuotaForm({ ...quotaForm, is_active: v })}
              />
              <Label>تفعيل حدود الموارد</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaDialogOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => selectedCompanyId && updateQuota.mutate({ companyId: selectedCompanyId, form: quotaForm })}
              disabled={updateQuota.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {updateQuota.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
