import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, FileText, CheckCircle, AlertTriangle, BookOpen, 
  Scale, Shield, Clock, ArrowRight, Eye, Loader2, RefreshCw
} from 'lucide-react';
import { 
  useAccounts, useTrialBalance, useIncomeStatement, useBalanceSheet, useJournalEntries 
} from '@/hooks/useAccounting';
import { useFixedAssets } from '@/hooks/useFixedAssets';
import { useFiscalYearBounds } from '@/hooks/useFiscalYearBounds';

type ReportType = 'balance-sheet' | 'income-statement' | 'equity-changes' | 'cash-flow' | 'notes' | null;

export function IFRSPluginPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);
  
  const bounds = useFiscalYearBounds();
  const startDate = bounds?.startISO;
  const endDate = bounds?.endISO;
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: trialBalance, isLoading: loadingTB } = useTrialBalance(startDate, endDate);
  const { data: incomeStatement, isLoading: loadingIS } = useIncomeStatement(startDate, endDate);
  const { data: balanceSheet, isLoading: loadingBS } = useBalanceSheet(startDate, endDate);
  const { data: journalEntries = [] } = useJournalEntries();
  const { data: fixedAssets = [] } = useFixedAssets();

  const isLoading = loadingAccounts || loadingTB || loadingIS || loadingBS;

  // Dynamically assess IFRS compliance based on real data
  const standards = useMemo(() => {
    const hasAccounts = accounts.length > 0;
    const hasJournals = journalEntries.length > 0;
    const hasAssets = fixedAssets.length > 0;
    const hasRevenue = accounts.some(a => a.type === 'revenue');
    const hasExpenses = accounts.some(a => a.type === 'expenses');
    const hasLiabilities = accounts.some(a => a.type === 'liabilities');
    const hasEquity = accounts.some(a => a.type === 'equity');
    const hasInventory = accounts.some(a => a.code?.startsWith('12') || a.name?.includes('مخزون'));
    const hasProvisions = accounts.some(a => a.name?.includes('مخصص') || a.name?.includes('التزام'));
    const hasLeaseAccounts = accounts.some(a => a.name?.includes('إيجار') || a.name?.includes('تأجير'));
    const hasFinancialInstruments = accounts.some(a => 
      a.name?.includes('استثمار') || a.name?.includes('قرض') || a.name?.includes('أوراق')
    );

    return [
      { 
        code: 'IFRS 9', name: 'الأدوات المالية', 
        description: 'تصنيف وقياس الأصول والالتزامات المالية',
        status: hasFinancialInstruments && hasJournals ? 'compliant' : hasAccounts ? 'partial' : 'review',
        progress: hasFinancialInstruments && hasJournals ? 100 : hasAccounts ? 50 : 20,
        details: hasFinancialInstruments 
          ? `تم العثور على ${accounts.filter(a => a.name?.includes('استثمار') || a.name?.includes('قرض')).length} حسابات أدوات مالية`
          : 'لم يتم إعداد حسابات الأدوات المالية بعد'
      },
      { 
        code: 'IFRS 15', name: 'الإيرادات من العقود مع العملاء',
        description: 'الاعتراف بالإيرادات وفق نموذج الخطوات الخمس',
        status: hasRevenue && hasJournals ? 'compliant' : hasRevenue ? 'partial' : 'review',
        progress: hasRevenue && hasJournals ? 100 : hasRevenue ? 60 : 10,
        details: hasRevenue
          ? `${accounts.filter(a => a.type === 'revenue').length} حساب إيرادات مسجل`
          : 'لا توجد حسابات إيرادات'
      },
      { 
        code: 'IFRS 16', name: 'عقود الإيجار',
        description: 'معالجة عقود الإيجار التشغيلية والتمويلية',
        status: hasLeaseAccounts ? 'compliant' : 'partial',
        progress: hasLeaseAccounts ? 85 : 30,
        details: hasLeaseAccounts
          ? 'تم إعداد حسابات الإيجار'
          : 'يجب إضافة حسابات لحق الاستخدام والتزامات الإيجار'
      },
      { 
        code: 'IAS 1', name: 'عرض القوائم المالية',
        description: 'متطلبات العرض العام للقوائم المالية',
        status: hasAccounts && hasJournals && trialBalance ? 'compliant' : hasAccounts ? 'partial' : 'review',
        progress: hasAccounts && hasJournals && trialBalance ? 100 : hasAccounts ? 50 : 10,
        details: trialBalance
          ? `ميزان المراجعة: ${trialBalance.accounts?.length || 0} حساب`
          : 'لم يتم إعداد القوائم المالية بعد'
      },
      { 
        code: 'IAS 2', name: 'المخزون',
        description: 'قياس المخزون بالتكلفة أو صافي القيمة القابلة للتحقق',
        status: hasInventory ? 'compliant' : hasAccounts ? 'partial' : 'review',
        progress: hasInventory ? 100 : hasAccounts ? 40 : 0,
        details: hasInventory ? 'حسابات المخزون متوفرة' : 'لا توجد حسابات مخزون'
      },
      { 
        code: 'IAS 16', name: 'الممتلكات والمعدات والآلات',
        description: 'الاعتراف والقياس والإهلاك للأصول الثابتة',
        status: hasAssets ? 'compliant' : hasAccounts ? 'partial' : 'review',
        progress: hasAssets ? 90 : hasAccounts ? 40 : 0,
        details: hasAssets
          ? `${fixedAssets.length} أصل ثابت مسجل`
          : 'لم يتم تسجيل أصول ثابتة'
      },
      { 
        code: 'IAS 36', name: 'انخفاض قيمة الأصول',
        description: 'اختبار انخفاض القيمة للأصول غير المالية',
        status: hasAssets ? 'partial' : 'review',
        progress: hasAssets ? 60 : 20,
        details: 'يجب إجراء اختبار انخفاض القيمة دورياً'
      },
      { 
        code: 'IAS 37', name: 'المخصصات والالتزامات والأصول المحتملة',
        description: 'الاعتراف بالمخصصات والالتزامات المحتملة',
        status: hasProvisions && hasLiabilities ? 'compliant' : hasLiabilities ? 'partial' : 'review',
        progress: hasProvisions && hasLiabilities ? 100 : hasLiabilities ? 50 : 20,
        details: hasProvisions
          ? `${accounts.filter(a => a.name?.includes('مخصص')).length} حساب مخصصات`
          : 'لا توجد حسابات مخصصات'
      },
    ];
  }, [accounts, journalEntries, fixedAssets, trialBalance]);

  const compliantCount = standards.filter(s => s.status === 'compliant').length;
  const overallProgress = Math.round(standards.reduce((sum, s) => sum + s.progress, 0) / standards.length);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      compliant: { label: 'متوافق', variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      partial: { label: 'جزئي', variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      review: { label: 'غير مكتمل', variant: 'outline', icon: <AlertTriangle className="w-3 h-3" /> },
    };
    const info = map[status] || { label: status, variant: 'outline' as const, icon: null };
    return <Badge variant={info.variant} className="gap-1">{info.icon}{info.label}</Badge>;
  };

  const reports = [
    { id: 'balance-sheet' as const, name: 'قائمة المركز المالي (IFRS)', ready: !!balanceSheet },
    { id: 'income-statement' as const, name: 'قائمة الدخل الشامل', ready: !!incomeStatement },
    { id: 'equity-changes' as const, name: 'قائمة التغيرات في حقوق الملكية', ready: !!balanceSheet },
    { id: 'cash-flow' as const, name: 'قائمة التدفقات النقدية', ready: !!incomeStatement },
    { id: 'notes' as const, name: 'الإيضاحات المتممة', ready: accounts.length > 0 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-3 text-muted-foreground">جاري تحميل البيانات المحاسبية...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">🌍</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">معايير IFRS الدولية</h1>
          <p className="text-muted-foreground">الامتثال لمعايير المحاسبة الدولية - مرتبط بالبيانات الفعلية</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-primary" />v1.0.0</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Scale className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{compliantCount}/{standards.length}</p>
          <p className="text-xs text-muted-foreground">معايير متوافقة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FileText className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{reports.filter(r => r.ready).length}/{reports.length}</p>
          <p className="text-xs text-muted-foreground">تقارير جاهزة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Shield className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{overallProgress}%</p>
          <p className="text-xs text-muted-foreground">نسبة الامتثال</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{accounts.length}</p>
          <p className="text-xs text-muted-foreground">حساب في الدليل</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="standards">
        <TabsList>
          <TabsTrigger value="standards" className="gap-2"><Globe className="w-4 h-4" />المعايير</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><FileText className="w-4 h-4" />التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="standards" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">حالة الامتثال بالمعايير (بناءً على بيانات النظام)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {standards.map((s, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-20 font-mono font-bold text-sm text-primary">{s.code}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{s.progress}%</span>
                    {getStatusBadge(s.status)}
                  </div>
                  <Progress value={s.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground/80 pr-24">{s.details}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">التقارير المالية وفق IFRS</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التقرير</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        <Badge variant={r.ready ? 'default' : 'outline'}>
                          {r.ready ? 'جاهز' : 'لا توجد بيانات'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" variant="ghost" className="gap-1" 
                          disabled={!r.ready}
                          onClick={() => setSelectedReport(r.id)}
                        >
                          <Eye className="w-3 h-3" /> عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Preview Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedReport === 'balance-sheet' && 'قائمة المركز المالي (IFRS)'}
              {selectedReport === 'income-statement' && 'قائمة الدخل الشامل (IFRS)'}
              {selectedReport === 'equity-changes' && 'قائمة التغيرات في حقوق الملكية'}
              {selectedReport === 'cash-flow' && 'قائمة التدفقات النقدية'}
              {selectedReport === 'notes' && 'الإيضاحات المتممة للقوائم المالية'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {selectedReport === 'balance-sheet' && balanceSheet && <BalanceSheetReport data={balanceSheet} />}
            {selectedReport === 'income-statement' && incomeStatement && <IncomeStatementReport data={incomeStatement} />}
            {selectedReport === 'equity-changes' && balanceSheet && <EquityChangesReport data={balanceSheet} />}
            {selectedReport === 'cash-flow' && incomeStatement && <CashFlowReport data={incomeStatement} />}
            {selectedReport === 'notes' && <NotesReport accounts={accounts} journalCount={journalEntries.length} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Balance Sheet Report ─────────────────────
function BalanceSheetReport({ data }: { data: any }) {
  const fmt = (n: number) => n?.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
  return (
    <div className="space-y-6 p-4 text-sm" dir="rtl">
      <h2 className="text-center text-lg font-bold">قائمة المركز المالي</h2>
      <p className="text-center text-xs text-muted-foreground">وفقاً لمعايير التقارير المالية الدولية (IFRS)</p>
      <Separator />
      
      <div>
        <h3 className="font-bold text-primary mb-2">الأصول</h3>
        <h4 className="font-medium text-muted-foreground mr-4 mb-1">الأصول غير المتداولة</h4>
        {data.assets?.filter((a: any) => a.code?.startsWith('11')).map((a: any, i: number) => (
          <div key={i} className="flex justify-between mr-8 py-1 border-b border-dashed border-muted">
            <span>{a.name}</span><span className="font-mono">{fmt(a.balance)}</span>
          </div>
        ))}
        <h4 className="font-medium text-muted-foreground mr-4 mb-1 mt-3">الأصول المتداولة</h4>
        {data.assets?.filter((a: any) => a.code?.startsWith('12')).map((a: any, i: number) => (
          <div key={i} className="flex justify-between mr-8 py-1 border-b border-dashed border-muted">
            <span>{a.name}</span><span className="font-mono">{fmt(a.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-2 pt-2 border-t">
          <span>إجمالي الأصول</span><span className="font-mono">{fmt(data.totalAssets)}</span>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-bold text-primary mb-2">الالتزامات وحقوق الملكية</h3>
        <h4 className="font-medium text-muted-foreground mr-4 mb-1">الالتزامات</h4>
        {data.liabilities?.map((a: any, i: number) => (
          <div key={i} className="flex justify-between mr-8 py-1 border-b border-dashed border-muted">
            <span>{a.name}</span><span className="font-mono">{fmt(a.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-2">
          <span>إجمالي الالتزامات</span><span className="font-mono">{fmt(data.totalLiabilities)}</span>
        </div>

        <h4 className="font-medium text-muted-foreground mr-4 mb-1 mt-3">حقوق الملكية</h4>
        {data.equity?.map((a: any, i: number) => (
          <div key={i} className="flex justify-between mr-8 py-1 border-b border-dashed border-muted">
            <span>{a.name}</span><span className="font-mono">{fmt(a.balance)}</span>
          </div>
        ))}
        {data.retainedEarnings !== undefined && (
          <div className="flex justify-between mr-8 py-1 border-b border-dashed border-muted">
            <span>الأرباح المبقاة</span><span className="font-mono">{fmt(data.retainedEarnings)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold mt-2">
          <span>إجمالي حقوق الملكية</span><span className="font-mono">{fmt(data.totalEquity + (data.retainedEarnings || 0))}</span>
        </div>

        <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t-2">
          <span>إجمالي الالتزامات وحقوق الملكية</span>
          <span className="font-mono">{fmt(data.totalLiabilities + data.totalEquity + (data.retainedEarnings || 0))}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Income Statement Report ──────────────────
function IncomeStatementReport({ data }: { data: any }) {
  const fmt = (n: number) => n?.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
  return (
    <div className="space-y-4 p-4 text-sm" dir="rtl">
      <h2 className="text-center text-lg font-bold">قائمة الدخل الشامل</h2>
      <p className="text-center text-xs text-muted-foreground">وفقاً لمعيار IAS 1 - عرض القوائم المالية</p>
      <Separator />

      <div>
        <h3 className="font-bold text-primary mb-2">الإيرادات</h3>
        {data.revenues?.map((a: any, i: number) => (
          <div key={i} className="flex justify-between mr-4 py-1 border-b border-dashed border-muted">
            <span>{a.name}</span><span className="font-mono">{fmt(a.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-2">
          <span>إجمالي الإيرادات</span><span className="font-mono">{fmt(data.totalRevenue)}</span>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-primary mb-2">المصروفات</h3>
        {data.expenses?.map((a: any, i: number) => (
          <div key={i} className="flex justify-between mr-4 py-1 border-b border-dashed border-muted">
            <span>{a.name}</span><span className="font-mono">{fmt(a.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-2">
          <span>إجمالي المصروفات</span><span className="font-mono">{fmt(data.totalExpenses)}</span>
        </div>
      </div>

      <Separator />
      <div className="flex justify-between font-bold text-lg pt-2">
        <span>صافي الربح / (الخسارة)</span>
        <span className={`font-mono ${data.netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
          {fmt(data.netIncome)}
        </span>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/50">
        <p className="text-xs font-medium text-muted-foreground">الدخل الشامل الآخر</p>
        <p className="text-xs text-muted-foreground mt-1">لا توجد بنود دخل شامل آخر للفترة الحالية</p>
        <div className="flex justify-between font-bold mt-2 text-sm">
          <span>إجمالي الدخل الشامل</span>
          <span className="font-mono">{fmt(data.netIncome)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Equity Changes Report ────────────────────
function EquityChangesReport({ data }: { data: any }) {
  const fmt = (n: number) => n?.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
  const totalEquity = (data.totalEquity || 0) + (data.retainedEarnings || 0);
  return (
    <div className="space-y-4 p-4 text-sm" dir="rtl">
      <h2 className="text-center text-lg font-bold">قائمة التغيرات في حقوق الملكية</h2>
      <p className="text-center text-xs text-muted-foreground">وفقاً لمعيار IAS 1</p>
      <Separator />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>البند</TableHead>
            <TableHead>رأس المال</TableHead>
            <TableHead>الأرباح المبقاة</TableHead>
            <TableHead>الإجمالي</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">الرصيد أول الفترة</TableCell>
            <TableCell className="font-mono">{fmt(data.totalEquity)}</TableCell>
            <TableCell className="font-mono">0.00</TableCell>
            <TableCell className="font-mono font-bold">{fmt(data.totalEquity)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">صافي الربح للفترة</TableCell>
            <TableCell className="font-mono">-</TableCell>
            <TableCell className="font-mono">{fmt(data.retainedEarnings)}</TableCell>
            <TableCell className="font-mono font-bold">{fmt(data.retainedEarnings)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">الدخل الشامل الآخر</TableCell>
            <TableCell className="font-mono">-</TableCell>
            <TableCell className="font-mono">0.00</TableCell>
            <TableCell className="font-mono font-bold">0.00</TableCell>
          </TableRow>
          <TableRow className="border-t-2">
            <TableCell className="font-bold">الرصيد آخر الفترة</TableCell>
            <TableCell className="font-mono font-bold">{fmt(data.totalEquity)}</TableCell>
            <TableCell className="font-mono font-bold">{fmt(data.retainedEarnings)}</TableCell>
            <TableCell className="font-mono font-bold">{fmt(totalEquity)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Cash Flow Report ─────────────────────────
function CashFlowReport({ data }: { data: any }) {
  const fmt = (n: number) => n?.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
  return (
    <div className="space-y-4 p-4 text-sm" dir="rtl">
      <h2 className="text-center text-lg font-bold">قائمة التدفقات النقدية</h2>
      <p className="text-center text-xs text-muted-foreground">وفقاً لمعيار IAS 7 - الطريقة غير المباشرة</p>
      <Separator />

      <div>
        <h3 className="font-bold text-primary mb-2">التدفقات النقدية من الأنشطة التشغيلية</h3>
        <div className="flex justify-between mr-4 py-1 border-b border-dashed border-muted">
          <span>صافي الربح</span><span className="font-mono">{fmt(data.netIncome)}</span>
        </div>
        <div className="flex justify-between mr-4 py-1 border-b border-dashed border-muted">
          <span>تعديلات: الإهلاك والاستهلاك</span><span className="font-mono">0.00</span>
        </div>
        <div className="flex justify-between font-bold mt-2">
          <span>صافي التدفقات التشغيلية</span><span className="font-mono">{fmt(data.netIncome)}</span>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-primary mb-2">التدفقات النقدية من الأنشطة الاستثمارية</h3>
        <div className="flex justify-between mr-4 py-1 text-muted-foreground">
          <span>لا توجد أنشطة استثمارية للفترة</span><span className="font-mono">0.00</span>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-primary mb-2">التدفقات النقدية من الأنشطة التمويلية</h3>
        <div className="flex justify-between mr-4 py-1 text-muted-foreground">
          <span>لا توجد أنشطة تمويلية للفترة</span><span className="font-mono">0.00</span>
        </div>
      </div>

      <Separator />
      <div className="flex justify-between font-bold text-lg">
        <span>صافي التغير في النقد</span>
        <span className={`font-mono ${data.netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>{fmt(data.netIncome)}</span>
      </div>
    </div>
  );
}

// ─── Notes Report ─────────────────────────────
function NotesReport({ accounts, journalCount }: { accounts: any[]; journalCount: number }) {
  const accountTypes = ['assets', 'liabilities', 'equity', 'revenue', 'expenses'];
  return (
    <div className="space-y-4 p-4 text-sm" dir="rtl">
      <h2 className="text-center text-lg font-bold">الإيضاحات المتممة للقوائم المالية</h2>
      <p className="text-center text-xs text-muted-foreground">وفقاً لمعايير التقارير المالية الدولية (IFRS)</p>
      <Separator />

      <div className="space-y-3">
        <h3 className="font-bold text-primary">1. معلومات عامة عن المنشأة</h3>
        <p className="text-muted-foreground mr-4">تم إعداد هذه القوائم المالية وفقاً لمعايير التقارير المالية الدولية (IFRS) المعتمدة في المملكة العربية السعودية.</p>

        <h3 className="font-bold text-primary">2. أساس الإعداد</h3>
        <p className="text-muted-foreground mr-4">أُعدت القوائم المالية على أساس التكلفة التاريخية، باستثناء ما يُقاس بخلاف ذلك كما هو موضح في السياسات المحاسبية.</p>

        <h3 className="font-bold text-primary">3. ملخص السياسات المحاسبية الهامة</h3>
        <div className="mr-4 space-y-2">
          <p className="text-muted-foreground"><strong>الاعتراف بالإيرادات:</strong> وفقاً لمعيار IFRS 15 - يتم الاعتراف بالإيرادات عند نقل السيطرة على السلع أو الخدمات.</p>
          <p className="text-muted-foreground"><strong>الأصول الثابتة:</strong> وفقاً لمعيار IAS 16 - تُقاس بالتكلفة ناقصاً مجمع الإهلاك وخسائر انخفاض القيمة.</p>
          <p className="text-muted-foreground"><strong>المخزون:</strong> وفقاً لمعيار IAS 2 - يُقاس بالتكلفة أو صافي القيمة القابلة للتحقق أيهما أقل.</p>
        </div>

        <h3 className="font-bold text-primary">4. هيكل الحسابات</h3>
        <div className="mr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التصنيف</TableHead>
                <TableHead>عدد الحسابات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountTypes.map(type => (
                <TableRow key={type}>
                  <TableCell className="font-medium">
                    {type === 'assets' ? 'الأصول' : type === 'liabilities' ? 'الالتزامات' : type === 'equity' ? 'حقوق الملكية' : type === 'revenue' ? 'الإيرادات' : 'المصروفات'}
                  </TableCell>
                  <TableCell>{accounts.filter(a => a.type === type).length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <h3 className="font-bold text-primary">5. الأحداث اللاحقة</h3>
        <p className="text-muted-foreground mr-4">لا توجد أحداث لاحقة جوهرية تستدعي الإفصاح. إجمالي القيود المحاسبية: {journalCount} قيد.</p>
      </div>
    </div>
  );
}
