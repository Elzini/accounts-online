import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Globe, Copy, ExternalLink, Shield, CheckCircle2, AlertCircle, Pencil, Save, X, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CompanySubdomain {
  id: string;
  name: string;
  subdomain: string | null;
  is_active: boolean;
  created_at: string;
}

const BASE_DOMAIN = 'elzini.com';
const RESERVED = ['www', 'app', 'api', 'admin', 'mail', 'smtp', 'ftp', 'ns1', 'ns2'];

function validateSubdomain(value: string): string | null {
  if (!value) return 'الـ Subdomain مطلوب';
  if (value.length < 3) return 'يجب أن يكون 3 أحرف على الأقل';
  if (value.length > 30) return 'يجب ألا يتجاوز 30 حرف';
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && value.length > 1) return 'أحرف إنجليزية صغيرة وأرقام وشرطات فقط';
  if (/^[a-z0-9]$/.test(value)) return null; // single char ok for now
  if (RESERVED.includes(value)) return 'هذا الاسم محجوز للنظام';
  return null;
}

export function SubdomainManagement() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testSubdomain, setTestSubdomain] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies-subdomains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, subdomain, is_active, created_at')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as CompanySubdomain[];
    },
  });

  const updateSubdomain = useMutation({
    mutationFn: async ({ id, subdomain }: { id: string; subdomain: string }) => {
      // Check uniqueness
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('subdomain', subdomain)
        .neq('id', id)
        .maybeSingle();

      if (existing) throw new Error('هذا الـ Subdomain مستخدم بالفعل');

      const { error } = await supabase
        .from('companies')
        .update({ subdomain })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies-subdomains'] });
      toast.success('تم تحديث الـ Subdomain بنجاح');
      setEditingId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleStartEdit = (company: CompanySubdomain) => {
    setEditingId(company.id);
    setEditValue(company.subdomain || '');
    setEditError(null);
  };

  const handleSaveEdit = () => {
    const error = validateSubdomain(editValue);
    if (error) {
      setEditError(error);
      return;
    }
    updateSubdomain.mutate({ id: editingId!, subdomain: editValue });
  };

  const handleTestRoute = async () => {
    if (!testSubdomain) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.rpc('resolve_company_by_subdomain', {
        p_subdomain: testSubdomain,
      });
      if (error) throw error;
      setTestResult({
        found: data && data.length > 0,
        company: data?.[0] || null,
      });
    } catch (err) {
      setTestResult({ found: false, error: 'فشل الاتصال' });
    } finally {
      setIsTesting(false);
    }
  };

  const copyUrl = (subdomain: string) => {
    navigator.clipboard.writeText(`https://${subdomain}.${BASE_DOMAIN}`);
    toast.success('تم نسخ الرابط');
  };

  const configuredCount = companies.filter(c => c.subdomain).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">إدارة النطاقات الفرعية</h2>
            <p className="text-muted-foreground">كل شركة تحصل على نطاق فرعي مستقل: company.{BASE_DOMAIN}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setTestDialogOpen(true)} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          اختبار التوجيه
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{companies.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي الشركات</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{configuredCount}</p>
              <p className="text-sm text-muted-foreground">نطاقات مُعدّة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{companies.length - configuredCount}</p>
              <p className="text-sm text-muted-foreground">بدون نطاق</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Architecture Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            بنية التوجيه الديناميكي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-primary">1. DNS Wildcard</p>
              <p className="text-muted-foreground">*.{BASE_DOMAIN} → Cloudflare Worker</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-primary">2. Tenant Resolution</p>
              <p className="text-muted-foreground">Subdomain → Company ID عبر RPC</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-primary">3. Schema Isolation</p>
              <p className="text-muted-foreground">كل شركة → tenant_[uuid] schema</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-primary">4. Data Encryption</p>
              <p className="text-muted-foreground">AES-256 per-tenant BYOK</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subdomains Table */}
      <Card>
        <CardHeader>
          <CardTitle>النطاقات الفرعية للشركات</CardTitle>
          <CardDescription>إدارة وتعديل النطاقات الفرعية لكل شركة</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">الشركة</TableHead>
                  <TableHead className="text-right">النطاق الفرعي</TableHead>
                  <TableHead className="text-right">الرابط الكامل</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company, index) => (
                  <TableRow key={company.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-semibold">{company.name}</TableCell>
                    <TableCell>
                      {editingId === company.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => {
                              setEditValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                              setEditError(null);
                            }}
                            className="w-40 text-left ltr"
                            dir="ltr"
                            placeholder="subdomain"
                          />
                          <span className="text-muted-foreground text-sm">.{BASE_DOMAIN}</span>
                          {editError && <span className="text-destructive text-xs">{editError}</span>}
                        </div>
                      ) : (
                        <Badge variant={company.subdomain ? 'default' : 'secondary'} className="font-mono">
                          {company.subdomain || 'غير محدد'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.subdomain ? (
                        <span className="text-sm font-mono text-muted-foreground" dir="ltr">
                          https://{company.subdomain}.{BASE_DOMAIN}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {company.subdomain && company.is_active ? (
                        <Badge className="bg-green-500/10 text-green-600">
                          <CheckCircle2 className="w-3 h-3 ml-1" />
                          نشط
                        </Badge>
                      ) : !company.subdomain ? (
                        <Badge variant="outline" className="text-amber-600">
                          <AlertCircle className="w-3 h-3 ml-1" />
                          غير مُعد
                        </Badge>
                      ) : (
                        <Badge variant="secondary">معطل</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        {editingId === company.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleSaveEdit}
                              disabled={updateSubdomain.isPending}
                              className="text-green-600"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(company)}
                              title="تعديل"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {company.subdomain && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyUrl(company.subdomain!)}
                                  title="نسخ الرابط"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`https://${company.subdomain}.${BASE_DOMAIN}`, '_blank')}
                                  title="فتح"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Test Routing Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-[450px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              اختبار التوجيه الديناميكي
            </DialogTitle>
            <DialogDescription>
              أدخل اسم النطاق الفرعي للتحقق من التوجيه
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                value={testSubdomain}
                onChange={(e) => setTestSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="company-name"
                dir="ltr"
                className="text-left font-mono"
              />
              <span className="text-muted-foreground whitespace-nowrap">.{BASE_DOMAIN}</span>
            </div>
            <Button onClick={handleTestRoute} disabled={!testSubdomain || isTesting} className="w-full">
              {isTesting ? 'جاري الاختبار...' : 'اختبار'}
            </Button>
            {testResult && (
              <Card className={testResult.found ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20' : 'border-destructive/50 bg-destructive/5'}>
                <CardContent className="p-4">
                  {testResult.found ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">تم العثور على الشركة</span>
                      </div>
                      <p className="text-sm">الشركة: <strong>{testResult.company?.name}</strong></p>
                      <p className="text-sm font-mono text-muted-foreground">ID: {testResult.company?.id}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">النطاق الفرعي غير مسجل</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
