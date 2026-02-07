// صفحة القوائم المالية الشاملة - مطابق لتصدير مداد

import { useState, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  FileSpreadsheet, Download, Upload, Printer, FileText,
  Building2, Calculator, TrendingUp, Scale, Wallet, BarChart3,
  Loader2, Database, BookOpen, FileCheck, Users, Package,
  AlertTriangle, CheckCircle2, Wrench, FileUp, ClipboardList
} from 'lucide-react';
import { readExcelFile, ExcelWorkbook } from '@/lib/excelUtils';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { getSystemFinancialStatements } from '@/services/systemFinancialData';
import { useSales } from '@/hooks/useDatabase';
import { useExpenses } from '@/hooks/useExpenses';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { supabase } from '@/integrations/supabase/client';

import { ComprehensiveFinancialData, emptyFinancialData } from './types';
import parseMedadExcel from './utils/medadParser';
import { printFinancialStatementsPDF } from './utils/pdfExport';
import { BalanceSheetView } from './views/BalanceSheetView';
import { IncomeStatementView } from './views/IncomeStatementView';
import { EquityChangesView } from './views/EquityChangesView';
import { CashFlowView } from './views/CashFlowView';
import { ZakatNoteView } from './notes/ZakatNoteView';
import { 
  CashAndBankNoteView, 
  CostOfRevenueNoteView, 
  GeneralExpensesNoteView,
  EmployeeBenefitsNoteView,
  CapitalNoteView,
  AccountingPoliciesNoteView,
  FixedAssetsNoteView,
  CreditorsNoteView,
} from './notes/OtherNotesViews';
import { FinancialStatementsFormulaEditor } from './FinancialStatementsFormulaEditor';
import { TrialBalanceImportManager } from './TrialBalanceImportManager';
import { AuditTrailPanel } from './AuditTrailPanel';
import { BranchCurrencyBar, Branch, SUPPORTED_CURRENCIES, convertAmount } from './BranchCurrencySelector';
import { createAuditLog, AuditLogEntry } from '@/services/importAuditLog';

export function ComprehensiveFinancialStatementsPage() {
  const { company, companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const { filterByFiscalYear } = useFiscalYearFilter();
  
  const { data: sales = [] } = useSales();
  const { data: expenses = [] } = useExpenses();
  
  const [data, setData] = useState<ComprehensiveFinancialData>(emptyFinancialData);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'none' | 'excel' | 'system' | 'trial-balance'>('none');
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFixingCogs, setIsFixingCogs] = useState(false);
  const [showTBImport, setShowTBImport] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // === سجل التدقيق ===
  const [auditLog] = useState(() => createAuditLog());
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  
  const addAuditEntry = useCallback((action: Parameters<typeof auditLog.addEntry>[0], details: string, metadata?: Record<string, any>) => {
    auditLog.addEntry(action, details, metadata);
    setAuditEntries([...auditLog.getEntries()]);
  }, [auditLog]);
  
  // === الفروع ===
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches] = useState<Branch[]>([]);
  
  const handleBranchChange = useCallback((branchId: string) => {
    setSelectedBranch(branchId);
    const branchName = branchId === 'all' ? 'جميع الفروع' : branchId === 'main' ? 'الفرع الرئيسي' : branchId;
    addAuditEntry('branch_selected', `تم تحديد: ${branchName}`);
  }, [addAuditEntry]);
  
  // === العملات ===
  const [selectedCurrency, setSelectedCurrency] = useState('SAR');
  const [customRate, setCustomRate] = useState<number | undefined>(undefined);
  
  const currentCurrency = useMemo(() => {
    const found = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);
    if (found && customRate !== undefined) {
      return { ...found, rate: customRate };
    }
    return found || SUPPORTED_CURRENCIES[0];
  }, [selectedCurrency, customRate]);
  
  const handleCurrencyChange = useCallback((code: string) => {
    setSelectedCurrency(code);
    setCustomRate(undefined);
    const curr = SUPPORTED_CURRENCIES.find(c => c.code === code);
    addAuditEntry('currency_changed', `تم التغيير إلى: ${curr?.nameAr || code}`);
  }, [addAuditEntry]);
  
  // تحويل مبلغ للعملة المحددة
  const cv = useCallback((amount: number) => {
    if (currentCurrency.code === 'SAR') return amount;
    return convertAmount(amount, currentCurrency);
  }, [currentCurrency]);
  
  const currencySymbol = currentCurrency.symbol;
  
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  
  // حساب صافي الربح من تقرير الأرباح
  const profitReportData = useMemo(() => {
    const filteredSales = filterByFiscalYear(sales, 'sale_date');
    const filteredExpenses = filterByFiscalYear(expenses, 'expense_date');
    
    const totalGrossProfit = filteredSales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0);
    
    const soldCarIds = filteredSales.map(s => s.car_id);
    const carExpenses = filteredExpenses
      .filter(exp => exp.car_id && soldCarIds.includes(exp.car_id))
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    
    const generalExpenses = filteredExpenses
      .filter(exp => !exp.car_id)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    
    const netProfit = totalGrossProfit - carExpenses - generalExpenses;
    
    return { totalGrossProfit, carExpenses, generalExpenses, netProfit };
  }, [sales, expenses, filterByFiscalYear]);
  
  const handleFixMissingCogs = async () => {
    if (!companyId) return;
    
    setIsFixingCogs(true);
    try {
      const { data: result, error } = await supabase.rpc('fix_missing_cogs_entries');
      if (error) throw error;
      
      const fixedCount = result?.filter((r: any) => r.fixed).length || 0;
      if (fixedCount > 0) {
        toast.success(`تم إصلاح ${fixedCount} قيد محاسبي`);
        handleCalculateFromSystem();
      } else {
        toast.info('جميع القيود صحيحة، لا يوجد ما يحتاج إصلاح');
      }
    } catch (error) {
      console.error('Error fixing COGS:', error);
      toast.error('فشل إصلاح القيود - تأكد من الصلاحيات');
    } finally {
      setIsFixingCogs(false);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cv(amount));
  };

  // حساب من بيانات النظام
  const handleCalculateFromSystem = async () => {
    if (!companyId) {
      toast.error('يرجى اختيار الشركة أولاً');
      return;
    }

    setIsLoading(true);
    addAuditEntry('system_calculation', 'بدء حساب القوائم المالية من بيانات النظام');
    try {
      const startDate = selectedFiscalYear?.start_date;
      const endDate = selectedFiscalYear?.end_date;
      
      const systemData = await getSystemFinancialStatements(
        companyId,
        company?.name || 'الشركة',
        startDate,
        endDate
      );

      setData(systemData);
      setDataSource('system');
      setFileName(null);
      setActiveTab('balance-sheet');
      addAuditEntry('statements_generated', 'تم توليد القوائم المالية من بيانات النظام بنجاح', {
        totalAssets: systemData.balanceSheet.totalAssets,
        netProfit: systemData.incomeStatement.netProfit,
      });
      
      toast.success('تم حساب القوائم المالية من بيانات النظام بنجاح');
    } catch (error) {
      console.error('Error calculating from system:', error);
      toast.error('فشل حساب القوائم المالية من النظام');
    } finally {
      setIsLoading(false);
    }
  };

  // رفع ملف Excel من مداد
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    addAuditEntry('medad_import', `رفع ملف مداد: ${file.name}`);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = await readExcelFile(arrayBuffer);
      
      const parsedData = parseMedadExcel(workbook);

      const isEffectivelyEmpty =
        (parsedData.balanceSheet?.totalAssets || 0) === 0 &&
        (parsedData.balanceSheet?.totalLiabilitiesAndEquity || 0) === 0 &&
        (parsedData.incomeStatement?.revenue || 0) === 0 &&
        (parsedData.incomeStatement?.costOfRevenue || 0) === 0 &&
        (parsedData.incomeStatement?.generalAndAdminExpenses || 0) === 0;

      if (isEffectivelyEmpty) {
        setData(emptyFinancialData);
        setFileName(null);
        setDataSource('none');
        setActiveTab('overview');
        toast.error('تم رفع الملف لكن لم يتم التعرف على أعمدة ميزان المراجعة.');
        setIsLoading(false);
        return;
      }
      
      if (!parsedData.companyName && company?.name) {
        parsedData.companyName = company.name;
      }
      
      setData(parsedData);
      setFileName(file.name);
      setDataSource('excel');
      setActiveTab('balance-sheet');
      addAuditEntry('statements_generated', `تم استيراد القوائم المالية من مداد: ${file.name}`, {
        sheets: workbook.SheetNames.length,
      });
      
      toast.success(`تم استيراد القوائم المالية بنجاح (${workbook.SheetNames.length} صفحة)`);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast.error('خطأ في تحليل ملف Excel');
    } finally {
      setIsLoading(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setData(emptyFinancialData);
    setDataSource('none');
    setFileName(null);
    setActiveTab('overview');
    setShowTBImport(false);
    addAuditEntry('data_cleared', 'تم مسح جميع البيانات');
    toast.info('تم مسح البيانات');
  };

  const handleTBDataGenerated = (generatedData: ComprehensiveFinancialData, source: string) => {
    setData(generatedData);
    setDataSource('trial-balance');
    setFileName(source);
    setActiveTab('balance-sheet');
    setShowTBImport(false);
    addAuditEntry('statements_generated', `تم توليد القوائم من ميزان المراجعة: ${source}`);
  };

  const handleExportPDF = () => {
    if (!hasData) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    printFinancialStatementsPDF(data);
    addAuditEntry('export_pdf', 'تم تصدير القوائم المالية كـ PDF');
    toast.success('جاري فتح نافذة الطباعة...');
  };

  const ExportDropdown = ({ onExport }: { onExport: (type: 'print' | 'excel' | 'pdf') => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('pdf')} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4" />
          تصدير PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('print')} className="gap-2 cursor-pointer">
          <Printer className="w-4 h-4" />
          طباعة
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('excel')} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4" />
          تصدير Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const handleExport = (type: 'print' | 'excel' | 'pdf') => {
    if (type === 'pdf') {
      handleExportPDF();
    } else if (type === 'print') {
      handleExportPDF();
    } else if (type === 'excel') {
      addAuditEntry('export_excel', 'تم طلب تصدير Excel');
      toast.info('جاري تصدير Excel...');
    }
  };

  const hasData = dataSource !== 'none';

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">القوائم المالية الشاملة</h1>
          <p className="text-muted-foreground">مطابق لتصدير مداد - قائمة المركز المالي، الدخل، التغيرات في حقوق الملكية، التدفقات النقدية، والإيضاحات</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={showAuditTrail ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setShowAuditTrail(!showAuditTrail)}
            className="gap-1"
          >
            <ClipboardList className="w-4 h-4" />
            سجل التدقيق
            {auditEntries.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 mr-1">{auditEntries.length}</Badge>
            )}
          </Button>
          {hasData && (
            <Badge variant={dataSource === 'excel' ? 'default' : dataSource === 'trial-balance' ? 'outline' : 'secondary'} className="gap-1">
              {dataSource === 'excel' ? (
                <><FileSpreadsheet className="w-3 h-3" /> {fileName}</>
              ) : dataSource === 'trial-balance' ? (
                <><FileUp className="w-3 h-3" /> ميزان: {fileName}</>
              ) : (
                <><Database className="w-3 h-3" /> بيانات النظام</>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* شريط الفرع والعملة */}
      <BranchCurrencyBar
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={handleBranchChange}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={handleCurrencyChange}
        customRate={customRate}
        onCustomRateChange={setCustomRate}
      />

      {/* سجل التدقيق */}
      {showAuditTrail && (
        <AuditTrailPanel 
          entries={auditEntries} 
          onClear={() => {
            auditLog.clear();
            setAuditEntries([]);
          }} 
        />
      )}

      {/* منطقة استيراد الملف */}
      {!hasData && !showTBImport && (
        <Card className="border-dashed border-2">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">إنشاء القوائم المالية</h3>
                <p className="text-muted-foreground">اختر مصدر البيانات لإنشاء القوائم المالية الشاملة</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {/* حساب من النظام */}
                <Card className="p-4 hover:border-primary cursor-pointer transition-colors" onClick={handleCalculateFromSystem}>
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Database className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold">حساب من النظام</h4>
                    <p className="text-xs text-muted-foreground">
                      احسب القوائم المالية تلقائياً من قيود اليومية
                    </p>
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      disabled={isLoading}
                      onClick={(e) => { e.stopPropagation(); handleCalculateFromSystem(); }}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> جاري الحساب...</>
                      ) : (
                        <><Database className="w-4 h-4 mr-2" /> حساب تلقائي</>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* استيراد ميزان المراجعة */}
                <Card className="p-4 hover:border-primary cursor-pointer transition-colors border-primary/30" onClick={() => setShowTBImport(true)}>
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                      <FileUp className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <h4 className="font-semibold">استيراد ميزان المراجعة</h4>
                    <p className="text-xs text-muted-foreground">
                      رفع ملف Excel/CSV مع ربط تلقائي للحسابات
                    </p>
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={(e) => { e.stopPropagation(); setShowTBImport(true); }}
                    >
                      <FileUp className="w-4 h-4 mr-2" /> استيراد ميزان
                    </Button>
                  </div>
                </Card>

                {/* استيراد من مداد Excel */}
                <Card className="p-4 hover:border-primary cursor-pointer transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold">استيراد من مداد</h4>
                    <p className="text-xs text-muted-foreground">
                      رفع ملف Excel المصدّر من نظام مداد ERP
                    </p>
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      disabled={isLoading}
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> جاري التحميل...</>
                      ) : (
                        <><Upload className="w-4 h-4 mr-2" /> رفع ملف مداد</>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
              />
              
              {selectedFiscalYear && (
                <p className="text-sm text-muted-foreground">
                  السنة المالية المحددة: <span className="font-semibold">{selectedFiscalYear.name}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* واجهة استيراد ميزان المراجعة */}
      {!hasData && showTBImport && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileUp className="w-5 h-5 text-primary" />
              استيراد ميزان المراجعة
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowTBImport(false)}>
              العودة لخيارات المصادر
            </Button>
          </div>
          <TrialBalanceImportManager
            companyName={company?.name || 'الشركة'}
            reportDate={selectedFiscalYear?.end_date || new Date().toISOString().split('T')[0]}
            onDataGenerated={handleTBDataGenerated}
            onAuditLog={addAuditEntry}
          />
        </div>
      )}

      {/* عرض البيانات */}
      {hasData && (
        <>
          {/* ملخص الشركة */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{data.companyName || company?.name || 'الشركة'}</CardTitle>
                  <CardDescription>
                    {data.companyType}
                    {selectedCurrency !== 'SAR' && (
                      <span className="mr-2 text-primary">• العملة: {currentCurrency.nameAr} ({currentCurrency.symbol})</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <FinancialStatementsFormulaEditor
                    currentValues={{
                      total_sales: data.incomeStatement.revenue,
                      gross_profit_from_sales: data.incomeStatement.grossProfit,
                      general_expenses: data.incomeStatement.generalAndAdminExpenses,
                      capital: data.balanceSheet.totalEquity,
                      fixed_assets_net: data.balanceSheet.totalNonCurrentAssets,
                      net_profit: data.incomeStatement.netProfit,
                      zakat_base: data.notes.zakat?.zakatBase || 0,
                      zakat_provision: data.notes.zakat?.totalZakatProvision || data.incomeStatement.zakat,
                      cash_and_banks: data.balanceSheet.totalCurrentAssets,
                      car_inventory: data.balanceSheet.totalCurrentAssets,
                      accounts_receivable: data.balanceSheet.totalCurrentAssets,
                      accounts_payable: data.balanceSheet.totalCurrentLiabilities,
                      vat_payable: data.balanceSheet.totalCurrentLiabilities,
                      retained_earnings: data.balanceSheet.totalEquity,
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    ملف جديد
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    مسح
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Scale className="w-6 h-6 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">إجمالي الموجودات</p>
                  <p className="font-bold">{formatCurrency(data.balanceSheet.totalAssets)} {currencySymbol}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <TrendingUp className="w-6 h-6 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">الإيرادات</p>
                  <p className="font-bold">{formatCurrency(data.incomeStatement.revenue)} {currencySymbol}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Wallet className="w-6 h-6 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">صافي الربح</p>
                  <p className={`font-bold ${data.incomeStatement.netProfit < 0 ? 'text-destructive' : ''}`}>
                    {formatCurrency(data.incomeStatement.netProfit)} {currencySymbol}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Calculator className="w-6 h-6 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">مخصص الزكاة</p>
                  <p className="font-bold">{formatCurrency(data.notes.zakat?.totalZakatProvision || data.incomeStatement.zakat)} {currencySymbol}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* التبويبات */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="overview" className="gap-1">
                <BarChart3 className="w-4 h-4" />
                الفهرس
              </TabsTrigger>
              <TabsTrigger value="balance-sheet" className="gap-1">
                <Scale className="w-4 h-4" />
                المركز المالي
              </TabsTrigger>
              <TabsTrigger value="income-statement" className="gap-1">
                <TrendingUp className="w-4 h-4" />
                قائمة الدخل
              </TabsTrigger>
              <TabsTrigger value="equity-changes" className="gap-1">
                <Users className="w-4 h-4" />
                حقوق الملكية
              </TabsTrigger>
              <TabsTrigger value="cash-flow" className="gap-1">
                <Wallet className="w-4 h-4" />
                التدفق النقدي
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1">
                <BookOpen className="w-4 h-4" />
                الإيضاحات
              </TabsTrigger>
            </TabsList>

            {/* الفهرس */}
            <TabsContent value="overview">
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
                      {[
                        { num: '1-2', name: 'تقرير مراجع الحسابات المستقل' },
                        { num: '3', name: 'قائمة المركز المالي كما في 31 ديسمبر 2025م', tab: 'balance-sheet' },
                        { num: '4', name: 'قائمة الدخل الشامل للسنة المنتهية في 31 ديسمبر 2025م', tab: 'income-statement' },
                        { num: '5', name: 'قائمة التغير في حقوق الملكية للسنة المنتهية في 31 ديسمبر 2025م', tab: 'equity-changes' },
                        { num: '6', name: 'قائمة التدفق النقدي للسنة المنتهية في 31 ديسمبر 2025م', tab: 'cash-flow' },
                        { num: '7-20', name: 'الإيضاحات على القوائم المالية كما في 31 ديسمبر 2025م', tab: 'notes' },
                      ].map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`flex justify-between items-center p-2 rounded-lg ${item.tab ? 'hover:bg-muted cursor-pointer' : ''}`}
                          onClick={() => item.tab && setActiveTab(item.tab)}
                        >
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">{item.num}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* قائمة المركز المالي */}
            <TabsContent value="balance-sheet">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>قائمة المركز المالي</CardTitle>
                    <ExportDropdown onExport={handleExport} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <BalanceSheetView 
                      data={data.balanceSheet} 
                      reportDate={data.reportDate || '31 ديسمبر 2025م'}
                      previousReportDate={data.previousReportDate}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* قائمة الدخل */}
            <TabsContent value="income-statement">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>قائمة الدخل الشامل</CardTitle>
                    <ExportDropdown onExport={handleExport} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <IncomeStatementView 
                      data={data.incomeStatement} 
                      reportDate={data.reportDate || '31 ديسمبر 2025م'}
                      previousReportDate={data.previousReportDate}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* قسم تسوية الأرباح */}
              <Card className="mt-4 border-2 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      تسوية صافي الربح (مقارنة المصادر)
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleFixMissingCogs}
                      disabled={isFixingCogs}
                      className="gap-2"
                    >
                      <Wrench className="w-4 h-4" />
                      {isFixingCogs ? 'جاري الإصلاح...' : 'إصلاح القيود'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold mb-2">من القيود المحاسبية</h4>
                      <p className={`text-2xl font-bold ${data.incomeStatement.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {formatCurrency(data.incomeStatement.netProfit)} {currencySymbol}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold mb-2">من تقرير الأرباح (المبيعات)</h4>
                      <p className={`text-2xl font-bold ${profitReportData.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {formatCurrency(profitReportData.netProfit)} {currencySymbol}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between p-3 rounded-lg border-2">
                    <div className="flex items-center gap-2">
                      {Math.abs(data.incomeStatement.netProfit - profitReportData.netProfit) < 1 ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-600">الأرقام متطابقة ✓</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <span className="text-amber-600">فرق: {formatCurrency(data.incomeStatement.netProfit - profitReportData.netProfit)} {currencySymbol}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* قائمة التغيرات في حقوق الملكية */}
            <TabsContent value="equity-changes">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>قائمة التغير في حقوق الملكية</CardTitle>
                    <ExportDropdown onExport={handleExport} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <EquityChangesView 
                      data={data.equityChanges} 
                      reportDate={data.reportDate || '31 ديسمبر 2025م'}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* قائمة التدفق النقدي */}
            <TabsContent value="cash-flow">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>قائمة التدفق النقدي</CardTitle>
                    <ExportDropdown onExport={handleExport} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <CashFlowView 
                      data={data.cashFlow} 
                      reportDate={data.reportDate || '31 ديسمبر 2025م'}
                      previousReportDate={data.previousReportDate}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* الإيضاحات */}
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>الإيضاحات على القوائم المالية</CardTitle>
                    <ExportDropdown onExport={handleExport} />
                  </div>
                  <CardDescription>كما في {data.reportDate || '31 ديسمبر 2025م'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[700px]">
                    <div className="space-y-8">
                      {data.notes.accountingPolicies && (
                        <>
                          <AccountingPoliciesNoteView 
                            data={data.notes.accountingPolicies} 
                            noteNumber={3}
                          />
                          <Separator />
                        </>
                      )}

                      {data.notes.cashAndBank && (
                        <>
                          <CashAndBankNoteView 
                            data={data.notes.cashAndBank} 
                            reportDate={data.reportDate || '31 ديسمبر 2025م'}
                            noteNumber={5}
                          />
                          <Separator />
                        </>
                      )}

                      {data.notes.fixedAssets && (
                        <>
                          <FixedAssetsNoteView 
                            data={data.notes.fixedAssets} 
                            reportDate={data.reportDate || '31 ديسمبر 2025م'}
                            noteNumber={7}
                          />
                          <Separator />
                        </>
                      )}

                      {data.notes.creditors && (
                        <>
                          <CreditorsNoteView 
                            data={data.notes.creditors} 
                            reportDate={data.reportDate || '31 ديسمبر 2025م'}
                            noteNumber={8}
                          />
                          <Separator />
                        </>
                      )}

                      {data.notes.zakat && (
                        <>
                          <ZakatNoteView 
                            data={data.notes.zakat} 
                            reportDate={data.reportDate || '31 ديسمبر 2025م'}
                            noteNumber={11}
                          />
                          <Separator />
                        </>
                      )}

                      {data.notes.employeeBenefits && (
                        <>
                          <EmployeeBenefitsNoteView 
                            data={data.notes.employeeBenefits} 
                            reportDate={data.reportDate || '31 ديسمبر 2025م'}
                            noteNumber={12}
                          />
                          <Separator />
                        </>
                      )}

                      {data.notes.capital && (
                        <>
                          <CapitalNoteView 
                            data={data.notes.capital} 
                            noteNumber={13}
                          />
                          <Separator />
                        </>
                      )}

                      {data.notes.costOfRevenue && (
                        <>
                          <CostOfRevenueNoteView 
                            data={data.notes.costOfRevenue} 
                            reportDate={data.reportDate || '31 ديسمبر 2025م'}
                            noteNumber={14}
                          />
                          <Separator />
                        </>
                      )}

                      {data.notes.generalAndAdminExpenses && (
                        <>
                          <GeneralExpensesNoteView 
                            data={data.notes.generalAndAdminExpenses} 
                            reportDate={data.reportDate || '31 ديسمبر 2025م'}
                            noteNumber={15}
                          />
                          <Separator />
                        </>
                      )}

                      <div className="space-y-4" dir="rtl">
                        <h3 className="text-lg font-bold">16- الأحداث بعد نهاية الفترة المالية</h3>
                        <p className="text-sm text-muted-foreground">
                          {data.notes.eventsAfterReportingPeriod?.description || 
                           'تعتقد الإدارة أنه لم تطرأ أية أحداث لاحقة هامة منذ السنة المنتهية في 31 ديسمبر 2025م قد يكون لها أثر جوهري على المركز المالي للشركة كجزء من هذه القوائم المالية.'}
                        </p>
                      </div>

                      {!data.notes.zakat && !data.notes.costOfRevenue && !data.notes.generalAndAdminExpenses && (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>لم يتم العثور على إيضاحات تفصيلية في الملف</p>
                          <p className="text-sm">تأكد من أن ملف Excel يحتوي على صفحات الإيضاحات</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

export default ComprehensiveFinancialStatementsPage;
