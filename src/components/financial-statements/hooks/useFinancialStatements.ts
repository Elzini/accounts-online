/**
 * useFinancialStatements - Business logic hook for financial statements page
 * Extracted from ComprehensiveFinancialStatementsPage (1042 → ~300 lines logic)
 */
import { useState, useRef, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useSales } from '@/hooks/useDatabase';
import { useExpenses } from '@/hooks/useExpenses';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useNumberFormat } from '@/hooks/useNumberFormat';
import { getIndustryFeatures } from '@/core/engine/industryFeatures';
import { supabase } from '@/hooks/modules/useReportsServices';
import { readExcelFile } from '@/lib/excelUtils';
import { getSystemFinancialStatements } from '@/services/systemFinancialData';
import { ComprehensiveFinancialData, emptyFinancialData } from '../types';
import parseMedadExcel from '../utils/medadParser';
import { printFinancialStatementsPDF } from '../utils/pdfExport';
import { parseMedadExcelViaEdge } from '@/services/financialStatements';
import { createAuditLog, AuditLogEntry } from '@/services/importAuditLog';
import { SUPPORTED_CURRENCIES, convertAmount, Branch } from '../BranchCurrencySelector';

export type DataSource = 'none' | 'excel' | 'system' | 'trial-balance';

export function useFinancialStatements() {
  const { company, companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const { decimals: numDecimals } = useNumberFormat();
  const { data: sales = [] } = useSales();
  const { data: expenses = [] } = useExpenses();
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();

  const [data, setData] = useState<ComprehensiveFinancialData>(emptyFinancialData);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('none');
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFixingCogs, setIsFixingCogs] = useState(false);
  const [showTBImport, setShowTBImport] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [zakatDialogOpen, setZakatDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audit log
  const [auditLog] = useState(() => createAuditLog());
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);

  const addAuditEntry = useCallback((action: Parameters<typeof auditLog.addEntry>[0], details: string, metadata?: Record<string, any>) => {
    auditLog.addEntry(action, details, metadata);
    setAuditEntries([...auditLog.getEntries()]);
  }, [auditLog]);

  // Branch & Currency
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches] = useState<Branch[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('SAR');
  const [customRate, setCustomRate] = useState<number | undefined>(undefined);

  const currentCurrency = useMemo(() => {
    const found = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);
    if (found && customRate !== undefined) return { ...found, rate: customRate };
    return found || SUPPORTED_CURRENCIES[0];
  }, [selectedCurrency, customRate]);

  const handleBranchChange = useCallback((branchId: string) => {
    setSelectedBranch(branchId);
    const branchName = branchId === 'all' ? 'جميع الفروع' : branchId === 'main' ? 'الفرع الرئيسي' : branchId;
    addAuditEntry('branch_selected', `تم تحديد: ${branchName}`);
  }, [addAuditEntry]);

  const handleCurrencyChange = useCallback((code: string) => {
    setSelectedCurrency(code);
    setCustomRate(undefined);
    const curr = SUPPORTED_CURRENCIES.find(c => c.code === code);
    addAuditEntry('currency_changed', `تم التغيير إلى: ${curr?.nameAr || code}`);
  }, [addAuditEntry]);

  const cv = useCallback((amount: number) => {
    if (currentCurrency.code === 'SAR') return amount;
    return convertAmount(amount, currentCurrency);
  }, [currentCurrency]);

  const currencySymbol = currentCurrency.symbol;

  const formatCurrency = useCallback((amount: number) => {
    const v = numDecimals === 0 ? Math.round(cv(amount)) : cv(amount);
    return numDecimals === 0 ? String(v) : v.toFixed(numDecimals);
  }, [cv, numDecimals]);

  const { hasCarInventory: isCarDealership } = getIndustryFeatures(company?.company_type || 'general_trading');

  const profitReportData = useMemo(() => {
    if (!isCarDealership) {
      return { totalGrossProfit: 0, carExpenses: 0, generalExpenses: 0, netProfit: 0, isApplicable: false };
    }
    const filteredSales = filterByFiscalYear(sales, 'sale_date');
    const filteredExpenses = filterByFiscalYear(expenses, 'expense_date');
    const totalGrossProfit = filteredSales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0);
    const soldCarIds = filteredSales.map(s => s.car_id);
    const carExpenses = filteredExpenses.filter(exp => exp.car_id && soldCarIds.includes(exp.car_id)).reduce((sum, exp) => sum + Number(exp.amount), 0);
    const generalExpenses = filteredExpenses.filter(exp => !exp.car_id).reduce((sum, exp) => sum + Number(exp.amount), 0);
    const netProfit = totalGrossProfit - carExpenses - generalExpenses;
    return { totalGrossProfit, carExpenses, generalExpenses, netProfit, isApplicable: true };
  }, [sales, expenses, filterByFiscalYear, isCarDealership]);

  // Actions
  const handleCalculateFromSystem = useCallback(async () => {
    if (!companyId) { toast.error('يرجى اختيار الشركة أولاً'); return; }
    setIsLoading(true);
    addAuditEntry('system_calculation', 'بدء حساب القوائم المالية من بيانات النظام');
    try {
      const systemData = await getSystemFinancialStatements(companyId, company?.name || 'الشركة', selectedFiscalYear?.start_date, selectedFiscalYear?.end_date);
      setData(systemData);
      setDataSource('system');
      setFileName(null);
      setActiveTab('balance-sheet');
      addAuditEntry('statements_generated', 'تم توليد القوائم المالية من بيانات النظام بنجاح', { totalAssets: systemData.balanceSheet.totalAssets, netProfit: systemData.incomeStatement.netProfit });
      toast.success('تم حساب القوائم المالية من بيانات النظام بنجاح');
    } catch (error) {
      console.error('Error calculating from system:', error);
      toast.error('فشل حساب القوائم المالية من النظام');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, company, selectedFiscalYear, addAuditEntry]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    addAuditEntry('medad_import', `رفع ملف مداد: ${file.name}`);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = await readExcelFile(arrayBuffer);

      // Serialize workbook data for edge function
      const sheets: Record<string, any[][]> = {};
      for (const name of workbook.SheetNames) {
        sheets[name] = workbook.Sheets[name]?.data || [];
      }

      let parsedData: ComprehensiveFinancialData;

      // Try Edge Function first, fallback to local parser
      try {
        const edgeResult = await parseMedadExcelViaEdge(workbook.SheetNames, sheets);
        parsedData = edgeResult as ComprehensiveFinancialData;
      } catch (edgeFnError) {
        console.warn('Edge function unavailable, using local parser:', edgeFnError);
        parsedData = parseMedadExcel(workbook);
      }

      const isEffectivelyEmpty = (parsedData.balanceSheet?.totalAssets || 0) === 0 && (parsedData.balanceSheet?.totalLiabilitiesAndEquity || 0) === 0 && (parsedData.incomeStatement?.revenue || 0) === 0 && (parsedData.incomeStatement?.costOfRevenue || 0) === 0 && (parsedData.incomeStatement?.generalAndAdminExpenses || 0) === 0;
      if (isEffectivelyEmpty) {
        setData(emptyFinancialData); setFileName(null); setDataSource('none'); setActiveTab('overview');
        toast.error('تم رفع الملف لكن لم يتم التعرف على أعمدة ميزان المراجعة.');
        setIsLoading(false); return;
      }
      if (!parsedData.companyName && company?.name) parsedData.companyName = company.name;
      setData(parsedData); setFileName(file.name); setDataSource('excel'); setActiveTab('balance-sheet');
      addAuditEntry('statements_generated', `تم استيراد القوائم المالية من مداد: ${file.name}`, { sheets: workbook.SheetNames.length });
      toast.success(`تم استيراد القوائم المالية بنجاح (${workbook.SheetNames.length} صفحة)`);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast.error('خطأ في تحليل ملف Excel');
    } finally {
      setIsLoading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [addAuditEntry, company]);

  const handleClear = useCallback(() => {
    setData(emptyFinancialData); setDataSource('none'); setFileName(null); setActiveTab('overview'); setShowTBImport(false);
    addAuditEntry('data_cleared', 'تم مسح جميع البيانات');
    toast.info('تم مسح البيانات');
  }, [addAuditEntry]);

  const handleTBDataGenerated = useCallback((generatedData: ComprehensiveFinancialData, source: string) => {
    setData(generatedData); setDataSource('trial-balance'); setFileName(source); setActiveTab('balance-sheet'); setShowTBImport(false);
    addAuditEntry('statements_generated', `تم توليد القوائم من ميزان المراجعة: ${source}`);
  }, [addAuditEntry]);

  const handleExportPDF = useCallback(() => {
    if (dataSource === 'none') { toast.error('لا توجد بيانات للتصدير'); return; }
    printFinancialStatementsPDF(data);
    addAuditEntry('export_pdf', 'تم تصدير القوائم المالية كـ PDF');
    toast.success('جاري فتح نافذة الطباعة...');
  }, [data, dataSource, addAuditEntry]);

  const handleExport = useCallback((type: 'print' | 'excel' | 'pdf') => {
    if (type === 'pdf' || type === 'print') handleExportPDF();
    else if (type === 'excel') { addAuditEntry('export_excel', 'تم طلب تصدير Excel'); toast.info('جاري تصدير Excel...'); }
  }, [handleExportPDF, addAuditEntry]);

  const handleFixMissingCogs = useCallback(async () => {
    if (!companyId) return;
    setIsFixingCogs(true);
    try {
      const { data: result, error } = await supabase.rpc('fix_missing_cogs_entries');
      if (error) throw error;
      const fixedCount = result?.filter((r: any) => r.fixed).length || 0;
      if (fixedCount > 0) { toast.success(`تم إصلاح ${fixedCount} قيد محاسبي`); handleCalculateFromSystem(); }
      else toast.info('جميع القيود صحيحة، لا يوجد ما يحتاج إصلاح');
    } catch (error) {
      console.error('Error fixing COGS:', error);
      toast.error('فشل إصلاح القيود - تأكد من الصلاحيات');
    } finally {
      setIsFixingCogs(false);
    }
  }, [companyId, handleCalculateFromSystem]);

  const hasData = dataSource !== 'none';

  return {
    // Data
    data, hasData, dataSource, fileName, isLoading, isFixingCogs,
    // State
    activeTab, setActiveTab, showTBImport, setShowTBImport, showAuditTrail, setShowAuditTrail,
    zakatDialogOpen, setZakatDialogOpen, fileInputRef,
    // Company
    company, companyId, selectedFiscalYear,
    // Audit
    auditEntries, auditLog, addAuditEntry,
    // Branch/Currency
    branches, selectedBranch, handleBranchChange,
    selectedCurrency, handleCurrencyChange, customRate, setCustomRate, currentCurrency, currencySymbol,
    // Formatting
    formatCurrency, cv,
    // Industry
    isCarDealership, profitReportData,
    // Actions
    handleCalculateFromSystem, handleFileUpload, handleClear, handleTBDataGenerated,
    handleExportPDF, handleExport, handleFixMissingCogs,
  };
}
