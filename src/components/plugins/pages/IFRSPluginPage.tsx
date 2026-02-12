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
  Scale, Shield, Clock, Eye, Loader2
} from 'lucide-react';
import { 
  useAccounts, useTrialBalance, useIncomeStatement, useBalanceSheet, useJournalEntries 
} from '@/hooks/useAccounting';
import { useFixedAssets } from '@/hooks/useFixedAssets';
import { useFiscalYearBounds } from '@/hooks/useFiscalYearBounds';
import { useLanguage } from '@/contexts/LanguageContext';

type ReportType = 'balance-sheet' | 'income-statement' | 'equity-changes' | 'cash-flow' | 'notes' | null;

export function IFRSPluginPage() {
  const { t, direction, language } = useLanguage();
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

  const standards = useMemo(() => {
    const hasAccounts = accounts.length > 0;
    const hasJournals = journalEntries.length > 0;
    const hasAssets = fixedAssets.length > 0;
    const hasRevenue = accounts.some(a => a.type === 'revenue');
    const hasLiabilities = accounts.some(a => a.type === 'liabilities');
    const hasInventory = accounts.some(a => a.code?.startsWith('12') || a.name?.includes('مخزون') || a.name?.toLowerCase().includes('inventory'));
    const hasProvisions = accounts.some(a => a.name?.includes('مخصص') || a.name?.includes('التزام') || a.name?.toLowerCase().includes('provision'));
    const hasLeaseAccounts = accounts.some(a => a.name?.includes('إيجار') || a.name?.includes('تأجير') || a.name?.toLowerCase().includes('lease'));
    const hasFinancialInstruments = accounts.some(a => 
      a.name?.includes('استثمار') || a.name?.includes('قرض') || a.name?.includes('أوراق') || a.name?.toLowerCase().includes('investment')
    );

    return [
      { 
        code: 'IFRS 9', name: 'الأدوات المالية', 
        description: 'تصنيف وقياس الأصول والالتزامات المالية',
        status: hasFinancialInstruments && hasJournals ? 'compliant' : hasAccounts ? 'partial' : 'review',
        progress: hasFinancialInstruments && hasJournals ? 100 : hasAccounts ? 50 : 20,
      },
      { 
        code: 'IFRS 15', name: 'الإيرادات من العقود مع العملاء',
        description: 'الاعتراف بالإيرادات وفق نموذج الخطوات الخمس',
        status: hasRevenue && hasJournals ? 'compliant' : hasRevenue ? 'partial' : 'review',
        progress: hasRevenue && hasJournals ? 100 : hasRevenue ? 60 : 10,
      },
      { 
        code: 'IFRS 16', name: 'عقود الإيجار',
        description: 'معالجة عقود الإيجار التشغيلية والتمويلية',
        status: hasLeaseAccounts ? 'compliant' : 'partial',
        progress: hasLeaseAccounts ? 85 : 30,
      },
      { 
        code: 'IAS 1', name: 'عرض القوائم المالية',
        description: 'متطلبات العرض العام للقوائم المالية',
        status: hasAccounts && hasJournals && trialBalance ? 'compliant' : hasAccounts ? 'partial' : 'review',
        progress: hasAccounts && hasJournals && trialBalance ? 100 : hasAccounts ? 50 : 10,
      },
      { 
        code: 'IAS 2', name: 'المخزون',
        description: 'قياس المخزون بالتكلفة أو صافي القيمة القابلة للتحقق',
        status: hasInventory ? 'compliant' : hasAccounts ? 'partial' : 'review',
        progress: hasInventory ? 100 : hasAccounts ? 40 : 0,
      },
      { 
        code: 'IAS 16', name: 'الممتلكات والمعدات والآلات',
        description: 'الاعتراف والقياس والإهلاك للأصول الثابتة',
        status: hasAssets ? 'compliant' : hasAccounts ? 'partial' : 'review',
        progress: hasAssets ? 90 : hasAccounts ? 40 : 0,
      },
      { 
        code: 'IAS 36', name: 'انخفاض قيمة الأصول',
        description: 'اختبار انخفاض القيمة للأصول غير المالية',
        status: hasAssets ? 'partial' : 'review',
        progress: hasAssets ? 60 : 20,
      },
      { 
        code: 'IAS 37', name: 'المخصصات والالتزامات والأصول المحتملة',
        description: 'الاعتراف بالمخصصات والالتزامات المحتملة',
        status: hasProvisions && hasLiabilities ? 'compliant' : hasLiabilities ? 'partial' : 'review',
        progress: hasProvisions && hasLiabilities ? 100 : hasLiabilities ? 50 : 20,
      },
    ];
  }, [accounts, journalEntries, fixedAssets, trialBalance]);

  const compliantCount = standards.filter(s => s.status === 'compliant').length;
  const overallProgress = Math.round(standards.reduce((sum, s) => sum + s.progress, 0) / standards.length);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      compliant: { label: t.ifrs_status_compliant, variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      partial: { label: t.ifrs_status_partial, variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      review: { label: t.ifrs_status_review, variant: 'outline', icon: <AlertTriangle className="w-3 h-3" /> },
    };
    const info = map[status] || { label: status, variant: 'outline' as const, icon: null };
    return <Badge variant={info.variant} className="gap-1">{info.icon}{info.label}</Badge>;
  };

  const reports = [
    { id: 'balance-sheet' as const, name: t.ifrs_report_balance_sheet, ready: !!balanceSheet },
    { id: 'income-statement' as const, name: t.ifrs_report_income, ready: !!incomeStatement },
    { id: 'equity-changes' as const, name: t.ifrs_report_equity, ready: !!balanceSheet },
    { id: 'cash-flow' as const, name: t.ifrs_report_cash_flow, ready: !!incomeStatement },
    { id: 'notes' as const, name: t.ifrs_report_notes, ready: accounts.length > 0 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-3 text-muted-foreground">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      <div className="flex items-center gap-4">
        <div className="text-4xl">🌍</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.ifrs_title}</h1>
          <p className="text-muted-foreground">{t.ifrs_subtitle}</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-primary" />v1.0.0</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Scale className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{compliantCount}/{standards.length}</p>
          <p className="text-xs text-muted-foreground">{t.ifrs_compliant_standards}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FileText className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{reports.filter(r => r.ready).length}/{reports.length}</p>
          <p className="text-xs text-muted-foreground">{t.ifrs_ready_reports}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Shield className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{overallProgress}%</p>
          <p className="text-xs text-muted-foreground">{t.ifrs_compliance_ratio}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{accounts.length}</p>
          <p className="text-xs text-muted-foreground">{t.ifrs_accounts_count}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="standards">
        <TabsList>
          <TabsTrigger value="standards" className="gap-2"><Globe className="w-4 h-4" />{t.ifrs_tab_standards}</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><FileText className="w-4 h-4" />{t.ifrs_tab_reports}</TabsTrigger>
        </TabsList>

        <TabsContent value="standards" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t.ifrs_compliance_status}</CardTitle></CardHeader>
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
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t.ifrs_financial_reports}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.ifrs_col_report}</TableHead>
                    <TableHead>{t.ifrs_col_status}</TableHead>
                    <TableHead>{t.ifrs_col_actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        <Badge variant={r.ready ? 'default' : 'outline'}>
                          {r.ready ? t.ifrs_status_ready : t.ifrs_status_no_data}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" variant="ghost" className="gap-1" 
                          disabled={!r.ready}
                          onClick={() => setSelectedReport(r.id)}
                        >
                          <Eye className="w-3 h-3" /> {t.ifrs_view}
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
              {selectedReport === 'balance-sheet' && t.ifrs_report_balance_sheet}
              {selectedReport === 'income-statement' && t.ifrs_report_income}
              {selectedReport === 'equity-changes' && t.ifrs_report_equity}
              {selectedReport === 'cash-flow' && t.ifrs_report_cash_flow}
              {selectedReport === 'notes' && t.ifrs_report_notes}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {selectedReport === 'balance-sheet' && balanceSheet && <BalanceSheetReport data={balanceSheet} t={t} />}
            {/* Other reports would go here */}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Balance Sheet Report ─────────────────────
function BalanceSheetReport({ data, t }: { data: any, t: any }) {
  const fmt = (n: number) => n?.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
  return (
    <div className="space-y-6 p-4 text-sm">
      <h2 className="text-center text-lg font-bold">{t.ifrs_report_balance_sheet}</h2>
      <p className="text-center text-xs text-muted-foreground">IFRS</p>
      <Separator />
      
      <div>
        <h3 className="font-bold text-primary mb-2">{t.ifrs_assets}</h3>
        <h4 className="font-medium text-muted-foreground mr-4 mb-1">{t.ifrs_non_current_assets}</h4>
        {data.assets?.filter((a: any) => a.code?.startsWith('11')).map((a: any, i: number) => (
          <div key={i} className="flex justify-between mr-8 py-1 border-b border-dashed border-muted">
            <span>{a.name}</span><span className="font-mono">{fmt(a.balance)}</span>
          </div>
        ))}
        <h4 className="font-medium text-muted-foreground mr-4 mb-1 mt-3">{t.ifrs_current_assets}</h4>
        {data.assets?.filter((a: any) => a.code?.startsWith('12')).map((a: any, i: number) => (
          <div key={i} className="flex justify-between mr-8 py-1 border-b border-dashed border-muted">
            <span>{a.name}</span><span className="font-mono">{fmt(a.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-2 pt-2 border-t">
          <span>{t.ifrs_total_assets}</span><span className="font-mono">{fmt(data.totalAssets)}</span>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-bold text-primary mb-2">{t.ifrs_liabilities_equity}</h3>
        <h4 className="font-medium text-muted-foreground mr-4 mb-1">{t.ifrs_liabilities}</h4>
        {data.liabilities?.map((a: any, i: number) => (
          <div key={i} className="flex justify-between mr-8 py-1 border-b border-dashed border-muted">
            <span>{a.name}</span><span className="font-mono">{fmt(a.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-2">
          <span>{t.ifrs_total_liabilities}</span><span className="font-mono">{fmt(data.totalLiabilities)}</span>
        </div>

        <h4 className="font-medium text-muted-foreground mr-4 mb-1 mt-3">{t.ifrs_equity}</h4>
        {data.equity?.map((a: any, i: number) => (
          <div key={i} className="flex justify-between mr-8 py-1 border-b border-dashed border-muted">
            <span>{a.name}</span><span className="font-mono">{fmt(a.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-2">
          <span>{t.ifrs_total_equity}</span><span className="font-mono">{fmt(data.totalEquity)}</span>
        </div>

        <div className="flex justify-between font-bold mt-4 pt-4 border-t-2 border-double">
          <span>{t.ifrs_total_liabilities_equity}</span><span className="font-mono">{fmt(data.totalLiabilities + data.totalEquity)}</span>
        </div>
      </div>
    </div>
  );
}
