/**
 * Comprehensive Financial Statements Page - Slim Orchestrator
 * Delegates logic to useFinancialStatements hook and section components.
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  FileSpreadsheet, Download, Upload, Printer, FileText,
  Scale, Wallet, BarChart3, Database, BookOpen, Users,
  TrendingUp, Calculator, FileUp, ClipboardList,
} from 'lucide-react';

import { useFinancialStatements } from './hooks/useFinancialStatements';
import { DataSourceSelector } from './sections/DataSourceSelector';
import { ProfitReconciliationSection } from './sections/ProfitReconciliationSection';
import { NotesTabContent } from './sections/NotesTabContent';
import { BalanceSheetView } from './views/BalanceSheetView';
import { IncomeStatementView } from './views/IncomeStatementView';
import { EquityChangesView } from './views/EquityChangesView';
import { CashFlowView } from './views/CashFlowView';
import { FinancialStatementsFormulaEditor } from './FinancialStatementsFormulaEditor';
import { ZakatDetailDialog } from './ZakatDetailDialog';
import { TrialBalanceImportManager } from './TrialBalanceImportManager';
import { AuditTrailPanel } from './AuditTrailPanel';
import { BranchCurrencyBar } from './BranchCurrencySelector';

export function ComprehensiveFinancialStatementsPage() {
  const hook = useFinancialStatements();
  const {
    data, hasData, dataSource, fileName, activeTab, setActiveTab,
    showTBImport, setShowTBImport, showAuditTrail, setShowAuditTrail,
    zakatDialogOpen, setZakatDialogOpen, fileInputRef,
    company, selectedFiscalYear, auditEntries, auditLog, addAuditEntry,
    branches, selectedBranch, handleBranchChange,
    selectedCurrency, handleCurrencyChange, customRate, setCustomRate, currentCurrency, currencySymbol,
    formatCurrency, handleFileUpload, handleClear, handleTBDataGenerated, handleExport,
  } = hook;

  const ExportDropdown = ({ onExport }: { onExport: (type: 'print' | 'excel' | 'pdf') => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" />تصدير</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('pdf')} className="gap-2 cursor-pointer"><FileText className="w-4 h-4" />تصدير PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('print')} className="gap-2 cursor-pointer"><Printer className="w-4 h-4" />طباعة</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('excel')} className="gap-2 cursor-pointer"><FileSpreadsheet className="w-4 h-4" />تصدير Excel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">القوائم المالية الشاملة</h1>
          <p className="text-muted-foreground">قائمة المركز المالي، الدخل، التغيرات في حقوق الملكية، التدفقات النقدية، والإيضاحات</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showAuditTrail ? 'default' : 'outline'} size="sm" onClick={() => setShowAuditTrail(!showAuditTrail)} className="gap-1">
            <ClipboardList className="w-4 h-4" />سجل التدقيق
            {auditEntries.length > 0 && <Badge variant="secondary" className="text-[10px] px-1 mr-1">{auditEntries.length}</Badge>}
          </Button>
          {hasData && (
            <Badge variant={dataSource === 'excel' ? 'default' : dataSource === 'trial-balance' ? 'outline' : 'secondary'} className="gap-1">
              {dataSource === 'excel' ? <><FileSpreadsheet className="w-3 h-3" /> {fileName}</> :
               dataSource === 'trial-balance' ? <><FileUp className="w-3 h-3" /> ميزان: {fileName}</> :
               <><Database className="w-3 h-3" /> بيانات النظام</>}
            </Badge>
          )}
        </div>
      </div>

      <BranchCurrencyBar branches={branches} selectedBranch={selectedBranch} onBranchChange={handleBranchChange} selectedCurrency={selectedCurrency} onCurrencyChange={handleCurrencyChange} customRate={customRate} onCustomRateChange={setCustomRate} />

      {showAuditTrail && <AuditTrailPanel entries={auditEntries} onClear={() => { auditLog.clear(); }} />}

      {/* Data Source Selection */}
      {!hasData && !showTBImport && <DataSourceSelector hook={hook} />}

      {!hasData && showTBImport && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><FileUp className="w-5 h-5 text-primary" />استيراد ميزان المراجعة</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowTBImport(false)}>العودة لخيارات المصادر</Button>
          </div>
          <TrialBalanceImportManager companyName={company?.name || 'الشركة'} reportDate={selectedFiscalYear?.end_date || new Date().toISOString().split('T')[0]} onDataGenerated={handleTBDataGenerated} onAuditLog={addAuditEntry} />
        </div>
      )}

      {/* Main Content */}
      {hasData && (
        <>
          <CompanySummaryCard hook={hook} />
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="overview" className="gap-1"><BarChart3 className="w-4 h-4" />الفهرس</TabsTrigger>
              <TabsTrigger value="balance-sheet" className="gap-1"><Scale className="w-4 h-4" />المركز المالي</TabsTrigger>
              <TabsTrigger value="income-statement" className="gap-1"><TrendingUp className="w-4 h-4" />قائمة الدخل</TabsTrigger>
              <TabsTrigger value="equity-changes" className="gap-1"><Users className="w-4 h-4" />حقوق الملكية</TabsTrigger>
              <TabsTrigger value="cash-flow" className="gap-1"><Wallet className="w-4 h-4" />التدفق النقدي</TabsTrigger>
              <TabsTrigger value="notes" className="gap-1"><BookOpen className="w-4 h-4" />الإيضاحات</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><OverviewTab data={data} setActiveTab={setActiveTab} /></TabsContent>

            <TabsContent value="balance-sheet">
              <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>قائمة المركز المالي</CardTitle><ExportDropdown onExport={handleExport} /></div></CardHeader>
                <CardContent><ScrollArea className="h-[600px]"><BalanceSheetView data={data.balanceSheet} reportDate={data.reportDate || '31 ديسمبر 2025م'} previousReportDate={data.previousReportDate} /></ScrollArea></CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="income-statement">
              <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>قائمة الدخل الشامل</CardTitle><ExportDropdown onExport={handleExport} /></div></CardHeader>
                <CardContent><ScrollArea className="h-[600px]"><IncomeStatementView data={data.incomeStatement} reportDate={data.reportDate || '31 ديسمبر 2025م'} previousReportDate={data.previousReportDate} /></ScrollArea></CardContent>
              </Card>
              <ProfitReconciliationSection hook={hook} />
            </TabsContent>

            <TabsContent value="equity-changes">
              <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>قائمة التغير في حقوق الملكية</CardTitle><ExportDropdown onExport={handleExport} /></div></CardHeader>
                <CardContent><ScrollArea className="h-[600px]"><EquityChangesView data={data.equityChanges} reportDate={data.reportDate || '31 ديسمبر 2025م'} /></ScrollArea></CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cash-flow">
              <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>قائمة التدفق النقدي</CardTitle><ExportDropdown onExport={handleExport} /></div></CardHeader>
                <CardContent><ScrollArea className="h-[600px]"><CashFlowView data={data.cashFlow} reportDate={data.reportDate || '31 ديسمبر 2025م'} previousReportDate={data.previousReportDate} /></ScrollArea></CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>الإيضاحات على القوائم المالية</CardTitle><ExportDropdown onExport={handleExport} /></div>
                <CardDescription>كما في {data.reportDate || '31 ديسمبر 2025م'}</CardDescription></CardHeader>
                <CardContent><NotesTabContent data={data} /></CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      <ZakatDetailDialog open={zakatDialogOpen} onOpenChange={setZakatDialogOpen} data={data.notes.zakat || null} currencySymbol={currencySymbol} />
    </div>
  );
}

/** Company summary card with key metrics */
function CompanySummaryCard({ hook }: { hook: ReturnType<typeof useFinancialStatements> }) {
  const { data, company, fileInputRef, handleFileUpload, handleClear, setZakatDialogOpen, formatCurrency, currencySymbol, selectedCurrency } = hook;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{data.companyName || company?.name || 'الشركة'}</CardTitle>
            <CardDescription>
              {data.companyType}
              {selectedCurrency !== 'SAR' && <span className="mr-2 text-primary">• العملة: {currencySymbol}</span>}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <FinancialStatementsFormulaEditor currentValues={{
              total_sales: data.incomeStatement.revenue, gross_profit_from_sales: data.incomeStatement.grossProfit,
              general_expenses: data.incomeStatement.generalAndAdminExpenses, capital: data.balanceSheet.totalEquity,
              fixed_assets_net: data.balanceSheet.totalNonCurrentAssets, net_profit: data.incomeStatement.netProfit,
              zakat_base: data.notes.zakat?.zakatBase || 0, zakat_provision: data.notes.zakat?.totalZakatProvision || data.incomeStatement.zakat,
              cash_and_banks: data.balanceSheet.totalCurrentAssets, car_inventory: data.balanceSheet.totalCurrentAssets,
              accounts_receivable: data.balanceSheet.totalCurrentAssets, accounts_payable: data.balanceSheet.totalCurrentLiabilities,
              vat_payable: data.balanceSheet.totalCurrentLiabilities, retained_earnings: data.balanceSheet.totalEquity,
            }} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" />ملف جديد</Button>
            <Button variant="ghost" size="sm" onClick={handleClear}>مسح</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={<Scale className="w-6 h-6 mx-auto text-primary mb-1" />} label="إجمالي الموجودات" value={`${formatCurrency(data.balanceSheet.totalAssets)} ${currencySymbol}`} />
          <MetricCard icon={<TrendingUp className="w-6 h-6 mx-auto text-primary mb-1" />} label="الإيرادات" value={`${formatCurrency(data.incomeStatement.revenue)} ${currencySymbol}`} />
          <MetricCard icon={<Wallet className="w-6 h-6 mx-auto text-primary mb-1" />} label="صافي الربح" value={`${formatCurrency(data.incomeStatement.netProfit)} ${currencySymbol}`} negative={data.incomeStatement.netProfit < 0} />
          <div className="text-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setZakatDialogOpen(true)} title="اضغط لعرض التفاصيل">
            <Calculator className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">مخصص الزكاة</p>
            <p className="font-bold">{formatCurrency(data.notes.zakat?.totalZakatProvision || data.incomeStatement.zakat)} {currencySymbol}</p>
            <p className="text-[10px] text-primary mt-1">اضغط للتفاصيل</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ icon, label, value, negative }: { icon: React.ReactNode; label: string; value: string; negative?: boolean }) {
  return (
    <div className="text-center p-3 bg-muted/50 rounded-lg">
      {icon}
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-bold ${negative ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}

/** Overview / Index tab */
function OverviewTab({ data, setActiveTab }: { data: any; setActiveTab: (t: string) => void }) {
  const items = [
    { num: '1-2', name: 'تقرير مراجع الحسابات المستقل' },
    { num: '3', name: 'قائمة المركز المالي', tab: 'balance-sheet' },
    { num: '4', name: 'قائمة الدخل الشامل', tab: 'income-statement' },
    { num: '5', name: 'قائمة التغير في حقوق الملكية', tab: 'equity-changes' },
    { num: '6', name: 'قائمة التدفق النقدي', tab: 'cash-flow' },
    { num: '7-20', name: 'الإيضاحات على القوائم المالية', tab: 'notes' },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{data.companyName}</CardTitle>
        <CardDescription className="text-center">{data.companyType}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xl font-bold">القوائم المالية</h2>
          <p>للسنة المنتهية في {data.reportDate || '31 ديسمبر 2025م'}</p>
          <p className="text-primary font-semibold">مع تقرير مراجع الحسابات المستقل</p>
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="font-bold mb-4 text-center">الفهرس</h3>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className={`flex justify-between items-center p-2 rounded-lg ${item.tab ? 'hover:bg-muted cursor-pointer' : ''}`} onClick={() => item.tab && setActiveTab(item.tab)}>
                <span>{item.name}</span><span className="text-muted-foreground">{item.num}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ComprehensiveFinancialStatementsPage;
