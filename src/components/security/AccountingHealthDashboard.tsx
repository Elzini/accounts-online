import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { runFullAccountingHealthCheck, SystemHealthReport, AccountingCheckResult } from '@/services/accountingHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Calculator, Receipt, Users, Building2, BarChart3,
  ShieldCheck, ShieldAlert, ShieldX, RefreshCw,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { toast } from 'sonner';

const categoryConfig = {
  journal: { icon: FileText, label: 'القيود المحاسبية', color: 'text-blue-500' },
  vat: { icon: Receipt, label: 'ضريبة القيمة المضافة', color: 'text-purple-500' },
  reconciliation: { icon: Users, label: 'التسويات', color: 'text-amber-500' },
  trial_balance: { icon: BarChart3, label: 'ميزان المراجعة', color: 'text-emerald-500' },
};

const statusIcon = {
  pass: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  fail: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

export function AccountingHealthDashboard() {
  const { companyId } = useCompany();
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

  const runCheck = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('لا يوجد سياق شركة');
      return runFullAccountingHealthCheck(companyId);
    },
    onSuccess: (data) => {
      setReport(data);
      if (data.overallStatus === 'healthy') toast.success(`✅ النظام صحي - ${data.overallScore}/100`);
      else if (data.overallStatus === 'warning') toast.warning(`⚠️ تحذيرات - ${data.overallScore}/100`);
      else toast.error(`🚨 مشاكل حرجة - ${data.overallScore}/100`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleExpand = (id: string) => {
    setExpandedChecks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';

  const scoreProgressColor = (score: number) =>
    score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس اللوحة */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Activity className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">فحص صحة النظام المحاسبي</h2>
                <p className="text-muted-foreground">تحقق شامل من سلامة القيود، الضريبة، التسويات، وميزان المراجعة</p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => runCheck.mutate()}
              disabled={runCheck.isPending}
            >
              {runCheck.isPending ? (
                <><Loader2 className="h-5 w-5 animate-spin ml-2" /> جاري الفحص...</>
              ) : (
                <><RefreshCw className="h-5 w-5 ml-2" /> فحص شامل الآن</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* النتيجة الإجمالية */}
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* النتيجة */}
            <Card className={`col-span-1 border-2 ${
              report.overallStatus === 'healthy' ? 'border-green-500/30' :
              report.overallStatus === 'warning' ? 'border-yellow-500/30' : 'border-red-500/30'
            }`}>
              <CardContent className="pt-6 text-center">
                {report.overallStatus === 'healthy' ? <ShieldCheck className="h-16 w-16 mx-auto text-green-500" /> :
                 report.overallStatus === 'warning' ? <ShieldAlert className="h-16 w-16 mx-auto text-yellow-500" /> :
                 <ShieldX className="h-16 w-16 mx-auto text-red-500" />}
                <h3 className={`text-4xl font-bold mt-2 ${scoreColor(report.overallScore)}`}>
                  {report.overallScore}
                  <span className="text-lg text-muted-foreground">/100</span>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.overallStatus === 'healthy' ? 'النظام صحي ✅' :
                   report.overallStatus === 'warning' ? 'تحذيرات ⚠️' : 'مشاكل حرجة 🚨'}
                </p>
                <div className="mt-3">
                  <Progress value={report.overallScore} className={`h-2 ${scoreProgressColor(report.overallScore)}`} />
                </div>
              </CardContent>
            </Card>

            {/* ملخص الفئات */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <h4 className="font-semibold">القيود المحاسبية</h4>
                </div>
                {report.checks.filter(c => c.category === 'journal').map(c => (
                  <div key={c.checkId} className="flex items-center justify-between text-sm py-1">
                    <span className="text-muted-foreground">{c.checkName.split('(')[0].trim()}</span>
                    {statusIcon[c.status] && (() => {
                      const Icon = statusIcon[c.status].icon;
                      return <Icon className={`h-4 w-4 ${statusIcon[c.status].color}`} />;
                    })()}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="h-5 w-5 text-purple-500" />
                  <h4 className="font-semibold">الضريبة والتسويات</h4>
                </div>
                {report.checks.filter(c => c.category === 'vat' || c.category === 'reconciliation').map(c => (
                  <div key={c.checkId} className="flex items-center justify-between text-sm py-1">
                    <span className="text-muted-foreground">{c.checkName.split('(')[0].trim()}</span>
                    {statusIcon[c.status] && (() => {
                      const Icon = statusIcon[c.status].icon;
                      return <Icon className={`h-4 w-4 ${statusIcon[c.status].color}`} />;
                    })()}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-green-500/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-500">{report.summary.passed}</p>
                    <p className="text-xs text-muted-foreground">ناجح</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-yellow-500">{report.summary.warnings}</p>
                    <p className="text-xs text-muted-foreground">تحذير</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-red-500">{report.summary.failed}</p>
                    <p className="text-xs text-muted-foreground">فاشل</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  آخر فحص: {new Date(report.reportDate).toLocaleString('ar-SA')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* تفاصيل الفحوصات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                تفاصيل الفحوصات ({report.checks.length} فحص)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {report.checks.map((check) => {
                    const isExpanded = expandedChecks.has(check.checkId);
                    const catConfig = categoryConfig[check.category];
                    const CatIcon = catConfig.icon;
                    const stConfig = statusIcon[check.status];
                    const StIcon = stConfig.icon;

                    return (
                      <div
                        key={check.checkId}
                        className={`border rounded-xl overflow-hidden ${stConfig.bg}`}
                      >
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => toggleExpand(check.checkId)}
                        >
                          <div className="flex items-center gap-3">
                            <CatIcon className={`h-5 w-5 ${catConfig.color}`} />
                            <div>
                              <h4 className="font-semibold text-sm">{check.checkName}</h4>
                              <p className="text-xs text-muted-foreground">{check.summary}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={check.status === 'pass' ? 'default' : check.status === 'fail' ? 'destructive' : 'secondary'}>
                              {check.severity}
                            </Badge>
                            <StIcon className={`h-5 w-5 ${stConfig.color}`} />
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t bg-background/50">
                            {/* التوصيات */}
                            {check.recommendations.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold mb-1">💡 التوصيات:</p>
                                {check.recommendations.map((rec, i) => (
                                  <p key={i} className="text-xs text-muted-foreground mr-4">• {rec}</p>
                                ))}
                              </div>
                            )}

                            {/* تفاصيل الأرقام */}
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Object.entries(check.details).filter(([k, v]) =>
                                typeof v === 'number' && !['issuesCount'].includes(k)
                              ).map(([key, value]) => (
                                <div key={key} className="bg-muted/50 rounded-lg p-2 text-center">
                                  <p className="text-xs text-muted-foreground">{formatDetailKey(key)}</p>
                                  <p className="text-sm font-semibold">{typeof value === 'number' ? value.toLocaleString() : String(value)}</p>
                                </div>
                              ))}
                            </div>

                            {/* قوائم المشاكل */}
                            {check.details?.imbalanced?.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-red-500 mb-1">❌ قيود غير متوازنة:</p>
                                {check.details.imbalanced.slice(0, 5).map((item: any, i: number) => (
                                  <p key={i} className="text-xs text-muted-foreground mr-4">
                                    قيد #{item.entryNumber} - فرق: {item.difference} ريال ({item.date})
                                  </p>
                                ))}
                              </div>
                            )}

                            {check.details?.gaps?.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-yellow-500 mb-1">⚠️ فجوات في التسلسل:</p>
                                {check.details.gaps.slice(0, 5).map((gap: any, i: number) => (
                                  <p key={i} className="text-xs text-muted-foreground mr-4">
                                    من #{gap.from} إلى #{gap.to} ({gap.missing} قيد مفقود)
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {!report && !runCheck.isPending && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Calculator className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">لم يتم تشغيل الفحص بعد</h3>
            <p className="text-muted-foreground mb-4">اضغط "فحص شامل الآن" للتحقق من سلامة جميع الحسابات والقيود والضرائب</p>
            <Button onClick={() => runCheck.mutate()} size="lg">
              <Activity className="h-5 w-5 ml-2" /> ابدأ الفحص
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatDetailKey(key: string): string {
  const labels: Record<string, string> = {
    totalEntries: 'إجمالي القيود',
    totalDebit: 'إجمالي المدين',
    totalCredit: 'إجمالي الدائن',
    difference: 'الفرق',
    entriesCount: 'عدد القيود',
    vatOutput: 'ضريبة المخرجات',
    vatInput: 'ضريبة المدخلات',
    netVAT: 'صافي الضريبة',
    expectedOutput: 'المتوقع (مخرجات)',
    expectedInput: 'المتوقع (مدخلات)',
    outputDifference: 'فرق المخرجات',
    inputDifference: 'فرق المدخلات',
    totalCustomers: 'عدد العملاء',
    totalSuppliers: 'عدد الموردين',
    foreignAccounts: 'حسابات أجنبية',
  };
  return labels[key] || key;
}
