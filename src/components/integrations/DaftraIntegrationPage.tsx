/**
 * Daftra Integration Page
 * Full integration with Daftra accounting platform
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase, untypedFrom } from '@/integrations/supabase/untypedFrom';
import {
  useDaftraConfig,
  useDaftraAuthenticate,
  useDaftraTestConnection,
  useDaftraSyncAccounts,
  useDaftraSyncJournals,
  useDaftraSyncClients,
  useDaftraSyncSuppliers,
  useDaftraDeleteConfig,
} from '@/hooks/useDaftraIntegration';
import {
  Link2, Unlink, RefreshCw, CheckCircle2, XCircle, Loader2,
  BookOpen, Users, Truck, ArrowUpDown, Settings, Shield, AlertTriangle,
} from 'lucide-react';

export function DaftraIntegrationPage() {
  const companyId = useCompanyId();
  const { data: config, isLoading } = useDaftraConfig();
  const authenticate = useDaftraAuthenticate();
  const testConnection = useDaftraTestConnection();
  const syncAccounts = useDaftraSyncAccounts();
  const syncJournals = useDaftraSyncJournals();
  const syncClients = useDaftraSyncClients();
  const syncSuppliers = useDaftraSyncSuppliers();
  const deleteConfig = useDaftraDeleteConfig();

  const [credentials, setCredentials] = useState({
    subdomain: '',
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
  });

  const isConnected = config?.is_active;

  const handleConnect = async () => {
    if (!companyId) return;
    try {
      await authenticate.mutateAsync({ companyId, credentials });
      toast.success('تم الاتصال بدفترة بنجاح ✅');
    } catch (err: any) {
      toast.error(`فشل الاتصال: ${err.message}`);
    }
  };

  const handleTestConnection = async () => {
    if (!companyId) return;
    try {
      const result = await testConnection.mutateAsync(companyId);
      if (result?.success) {
        toast.success('الاتصال يعمل بنجاح ✅');
      } else {
        toast.error(`فشل اختبار الاتصال: ${result?.error}`);
      }
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    }
  };

  const handleDisconnect = async () => {
    if (!companyId) return;
    try {
      await deleteConfig.mutateAsync(companyId);
      toast.success('تم قطع الاتصال بدفترة');
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    }
  };

  const handleSyncAccounts = async () => {
    if (!companyId) return;
    try {
      const { data: accounts } = await supabase
        .from('account_categories')
        .select('id, code, name, type, description, parent_id')
        .eq('company_id', companyId);

      if (!accounts?.length) {
        toast.error('لا توجد حسابات للمزامنة');
        return;
      }

      // Build id→code map for parent resolution
      const idToCode = new Map<string, string>();
      for (const a of accounts) {
        idToCode.set(a.id, a.code);
      }

      const result = await syncAccounts.mutateAsync({
        companyId,
        accounts: accounts.map(a => ({
          code: a.code,
          name: a.name,
          type: a.type,
          description: a.description || '',
          parent_code: a.parent_id ? idToCode.get(a.parent_id) || '' : '',
        })),
      });

      toast.success(`تمت مزامنة ${result?.synced || 0} حساب • ${result?.updated || 0} محدّث • ${result?.skipped || 0} متجاوز • ${result?.errors || 0} أخطاء`);
    } catch (err: any) {
      toast.error(`خطأ في المزامنة: ${err.message}`);
    }
  };

  const handleSyncJournals = async () => {
    if (!companyId) return;
    try {
      const { data: entries } = await untypedFrom('journal_entries')
        .select('id, entry_number, description, entry_date')
        .eq('company_id', companyId)
        .eq('is_posted', true)
        .order('entry_number', { ascending: true })
        .limit(50);

      if (!entries?.length) {
        toast.error('لا توجد قيود مرحّلة للمزامنة');
        return;
      }

      const entryIds = entries.map(e => e.id);
      const { data: lines } = await supabase
        .from('journal_entry_lines')
        .select('journal_entry_id, account_id, description, debit, credit')
        .in('journal_entry_id', entryIds);

      const accountIds = [...new Set((lines || []).map(l => l.account_id).filter(Boolean))] as string[];
      const { data: accounts } = await supabase
        .from('account_categories')
        .select('id, code, name')
        .in('id', accountIds);

      const accountMap = new Map((accounts || []).map(a => [a.id, a]));

      const formattedEntries = entries.map(entry => ({
        entry_number: entry.entry_number,
        description: entry.description || `قيد رقم ${entry.entry_number}`,
        lines: (lines || [])
          .filter(l => l.journal_entry_id === entry.id)
          .filter(l => Number(l.debit || 0) !== 0 || Number(l.credit || 0) !== 0)
          .map(l => {
            const account = l.account_id ? accountMap.get(l.account_id) : undefined;
            return {
              account_name: account?.name || '',
              account_code: account?.code || '',
              debit: Number(l.debit || 0),
              credit: Number(l.credit || 0),
              description: l.description || '',
            };
          }),
      }));

      const result = await syncJournals.mutateAsync({ companyId, entries: formattedEntries });
      toast.success(`تمت مزامنة ${result?.synced || 0} قيد • ${result?.errors || 0} أخطاء`);
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    }
  };

  const handleSyncClients = async () => {
    if (!companyId) return;
    try {
      const { data: clients } = await supabase
        .from('customers')
        .select('name, phone, address')
        .eq('company_id', companyId);

      if (!clients?.length) {
        toast.error('لا يوجد عملاء للمزامنة');
        return;
      }

      const result = await syncClients.mutateAsync({
        companyId,
        clients: clients.map((c: any) => ({
          name: c.name,
          phone: c.phone || '',
          address: c.address || '',
        })),
      });

      toast.success(`تمت مزامنة ${result?.synced || 0} عميل • ${result?.errors || 0} أخطاء`);
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    }
  };

  const handleSyncSuppliers = async () => {
    if (!companyId) return;
    try {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('name, phone, address')
        .eq('company_id', companyId);

      if (!suppliers?.length) {
        toast.error('لا يوجد موردين للمزامنة');
        return;
      }

      const result = await syncSuppliers.mutateAsync({
        companyId,
        suppliers: suppliers.map((s: any) => ({
          name: s.name,
          phone: s.phone || '',
          address: s.address || '',
        })),
      });

      toast.success(`تمت مزامنة ${result?.synced || 0} مورد • ${result?.errors || 0} أخطاء`);
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ربط دفترة</h1>
          <p className="text-muted-foreground">مزامنة البيانات المحاسبية مع منصة دفترة</p>
        </div>
        {isConnected && (
          <Badge variant="default" className="gap-1 text-sm px-3 py-1">
            <CheckCircle2 className="w-4 h-4" />
            متصل
          </Badge>
        )}
      </div>

      {!isConnected ? (
        /* Connection Form */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              الاتصال بدفترة
            </CardTitle>
            <CardDescription>
              أدخل بيانات API الخاصة بحساب دفترة. يمكنك الحصول عليها من الإعدادات → Api Keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النطاق الفرعي (Subdomain)</Label>
                <Input
                  placeholder="yourcompany"
                  value={credentials.subdomain}
                  onChange={e => setCredentials(p => ({ ...p, subdomain: e.target.value }))}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">الجزء قبل .daftra.com</p>
              </div>
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  placeholder="1"
                  value={credentials.clientId}
                  onChange={e => setCredentials(p => ({ ...p, clientId: e.target.value }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  placeholder="jCfy6cMh1X6NTxR3OWLuvEFa0si5uZKr05UeoAEs"
                  value={credentials.clientSecret}
                  onChange={e => setCredentials(p => ({ ...p, clientSecret: e.target.value }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>اسم المستخدم</Label>
                <Input
                  placeholder="admin@company.com"
                  value={credentials.username}
                  onChange={e => setCredentials(p => ({ ...p, username: e.target.value }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input
                  type="password"
                  placeholder="********"
                  value={credentials.password}
                  onChange={e => setCredentials(p => ({ ...p, password: e.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                يتم تشفير بيانات الاعتماد وتخزينها بشكل آمن. لن يتم مشاركتها أو عرضها مرة أخرى.
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={authenticate.isPending || !credentials.subdomain || !credentials.clientId || !credentials.clientSecret || !credentials.username || !credentials.password}
              className="w-full"
            >
              {authenticate.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Link2 className="w-4 h-4 ml-2" />
              )}
              الاتصال بدفترة
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Connected State */
        <>
          {/* Connection Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  إعدادات الاتصال
                </CardTitle>
                <CardDescription>
                  متصل بـ {config?.subdomain}.daftra.com
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testConnection.isPending}
                >
                  {testConnection.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-1" />
                  ) : (
                    <RefreshCw className="w-4 h-4 ml-1" />
                  )}
                  اختبار الاتصال
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={deleteConfig.isPending}
                >
                  <Unlink className="w-4 h-4 ml-1" />
                  قطع الاتصال
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">الحالة:</span>
                  <p className="font-medium">
                    {config?.sync_status === 'connected' ? 'متصل' :
                      config?.sync_status === 'synced' ? 'مزامن' :
                        config?.sync_status === 'partial' ? 'مزامنة جزئية' : config?.sync_status || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">آخر مزامنة:</span>
                  <p className="font-medium">
                    {config?.last_sync_at
                      ? new Date(config.last_sync_at).toLocaleString('ar-SA')
                      : 'لم تتم بعد'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Tabs */}
          <Tabs defaultValue="accounts" dir="rtl">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="accounts" className="gap-1">
                <BookOpen className="w-3 h-3" />
                شجرة الحسابات
              </TabsTrigger>
              <TabsTrigger value="journals" className="gap-1">
                <ArrowUpDown className="w-3 h-3" />
                القيود
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-1">
                <Users className="w-3 h-3" />
                العملاء
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="gap-1">
                <Truck className="w-3 h-3" />
                الموردين
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="mt-4">
              <SyncCard
                title="مزامنة شجرة الحسابات"
                description="إرسال جميع الحسابات من دليل الحسابات إلى دفترة تلقائياً"
                onSync={handleSyncAccounts}
                isPending={syncAccounts.isPending}
                syncLog={config?.sync_log?.accounts}
                icon={<BookOpen className="w-5 h-5" />}
              />
            </TabsContent>

            <TabsContent value="journals" className="mt-4">
              <SyncCard
                title="مزامنة القيود المحاسبية"
                description="إرسال القيود المرحّلة إلى دفترة (أحدث 50 قيد)"
                onSync={handleSyncJournals}
                isPending={syncJournals.isPending}
                syncLog={config?.sync_log?.journals}
                icon={<ArrowUpDown className="w-5 h-5" />}
              />
            </TabsContent>

            <TabsContent value="clients" className="mt-4">
              <SyncCard
                title="مزامنة العملاء"
                description="إرسال بيانات العملاء من النظام إلى دفترة"
                onSync={handleSyncClients}
                isPending={syncClients.isPending}
                syncLog={config?.sync_log?.clients}
                icon={<Users className="w-5 h-5" />}
              />
            </TabsContent>

            <TabsContent value="suppliers" className="mt-4">
              <SyncCard
                title="مزامنة الموردين"
                description="إرسال بيانات الموردين من النظام إلى دفترة"
                onSync={handleSyncSuppliers}
                isPending={syncSuppliers.isPending}
                syncLog={config?.sync_log?.suppliers}
                icon={<Truck className="w-5 h-5" />}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// ==================== SYNC CARD COMPONENT ====================

function SyncCard({ title, description, onSync, isPending, syncLog, icon }: {
  title: string;
  description: string;
  onSync: () => void;
  isPending: boolean;
  syncLog?: any;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">{icon}</div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <Button onClick={onSync} disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
          ) : (
            <RefreshCw className="w-4 h-4 ml-2" />
          )}
          مزامنة الآن
        </Button>
      </CardHeader>
      {syncLog && (
        <CardContent>
          <Separator className="mb-4" />
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>نجاح: {syncLog.success || 0}</span>
            </div>
            {(syncLog.errors || 0) > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <XCircle className="w-4 h-4" />
                <span>أخطاء: {syncLog.errors}</span>
              </div>
            )}
          </div>
          {syncLog.details && syncLog.details.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto text-xs space-y-1 bg-muted p-3 rounded-lg">
              {syncLog.details.slice(0, 10).map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  {d.status === 'success' ? (
                    <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-destructive shrink-0" />
                  )}
                  <span>{d.name || d.code || d.entry_number}</span>
                  {d.error && <span className="text-destructive">- {d.error}</span>}
                </div>
              ))}
              {syncLog.details.length > 10 && (
                <p className="text-muted-foreground">... و{syncLog.details.length - 10} عنصر آخر</p>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
