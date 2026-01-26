import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  FileSpreadsheet, Download, Upload, Printer, FileText, CalendarIcon,
  Building2, Calculator, TrendingUp, Scale, Wallet, BarChart3,
  Loader2, Database, X, Save, Edit3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { usePdfExport } from '@/hooks/usePdfExport';
import { toast } from 'sonner';

// ===== Types =====
interface BalanceSheetData {
  currentAssets: { name: string; amount: number; note?: string }[];
  fixedAssets: { name: string; amount: number; note?: string }[];
  totalAssets: number;
  currentLiabilities: { name: string; amount: number; note?: string }[];
  longTermLiabilities: { name: string; amount: number; note?: string }[];
  totalLiabilities: number;
  equity: { name: string; amount: number; note?: string }[];
  totalEquity: number;
}

interface IncomeStatementData {
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpenses: { name: string; amount: number }[];
  totalOperatingExpenses: number;
  operatingProfit: number;
  otherIncome: number;
  otherExpenses: number;
  profitBeforeZakat: number;
  zakat: number;
  netProfit: number;
}

interface EquityChangesData {
  items: {
    description: string;
    capital: number;
    reserves: number;
    retainedEarnings: number;
    total: number;
  }[];
  openingBalance: { capital: number; reserves: number; retainedEarnings: number; total: number };
  closingBalance: { capital: number; reserves: number; retainedEarnings: number; total: number };
}

interface CashFlowData {
  operating: { name: string; amount: number }[];
  totalOperating: number;
  investing: { name: string; amount: number }[];
  totalInvesting: number;
  financing: { name: string; amount: number }[];
  totalFinancing: number;
  netChange: number;
  openingCash: number;
  closingCash: number;
}

// حساب الوعاء الزكوي
interface ZakatCalculationData {
  capital: number;
  reserves: number;
  retainedEarnings: number;
  netProfit: number;
  totalEquity: number;
  fixedAssets: number;
  prepaidExpenses: number;
  prepaidRent: number;
  zakatBase: number;
  zakatRate: number;
  zakatAmount: number;
  adjustments: { name: string; amount: number; type: 'add' | 'deduct' }[];
}

interface FinancialData {
  companyName: string;
  period: { from: string; to: string };
  balanceSheet: BalanceSheetData;
  incomeStatement: IncomeStatementData;
  equityChanges: EquityChangesData;
  cashFlow: CashFlowData;
  zakatCalculation: ZakatCalculationData;
}

const emptyFinancialData: FinancialData = {
  companyName: '',
  period: { from: '', to: '' },
  balanceSheet: {
    currentAssets: [],
    fixedAssets: [],
    totalAssets: 0,
    currentLiabilities: [],
    longTermLiabilities: [],
    totalLiabilities: 0,
    equity: [],
    totalEquity: 0,
  },
  incomeStatement: {
    revenue: 0,
    costOfRevenue: 0,
    grossProfit: 0,
    operatingExpenses: [],
    totalOperatingExpenses: 0,
    operatingProfit: 0,
    otherIncome: 0,
    otherExpenses: 0,
    profitBeforeZakat: 0,
    zakat: 0,
    netProfit: 0,
  },
  equityChanges: {
    items: [],
    openingBalance: { capital: 0, reserves: 0, retainedEarnings: 0, total: 0 },
    closingBalance: { capital: 0, reserves: 0, retainedEarnings: 0, total: 0 },
  },
  cashFlow: {
    operating: [],
    totalOperating: 0,
    investing: [],
    totalInvesting: 0,
    financing: [],
    totalFinancing: 0,
    netChange: 0,
    openingCash: 0,
    closingCash: 0,
  },
  zakatCalculation: {
    capital: 0,
    reserves: 0,
    retainedEarnings: 0,
    netProfit: 0,
    totalEquity: 0,
    fixedAssets: 0,
    prepaidExpenses: 0,
    prepaidRent: 0,
    zakatBase: 0,
    zakatRate: 2.5,
    zakatAmount: 0,
    adjustments: [],
  },
};

export function FinancialStatementsPage() {
  const { companyId, company } = useCompany();
  const [data, setData] = useState<FinancialData>(emptyFinancialData);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'none' | 'excel' | 'system'>('none');
  const [fileName, setFileName] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(new Date().getFullYear(), 11, 31),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const { exportToPdf } = usePdfExport();

  // ===== Parse Excel File =====
  const parseExcelFile = async (file: File) => {
    setIsLoading(true);
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          const parsedData = parseFinancialStatements(workbook);
          setData(parsedData);
          setFileName(file.name);
          setDataSource('excel');
          toast.success('تم تحليل الملف بنجاح');
        } catch (error) {
          console.error('Error parsing Excel:', error);
          toast.error('خطأ في تحليل الملف');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('خطأ في قراءة الملف');
      setIsLoading(false);
    }
  };

  // ===== Parse Financial Statements from Excel =====
  const parseFinancialStatements = (workbook: XLSX.WorkBook): FinancialData => {
    const result: FinancialData = { ...emptyFinancialData };
    
    // Try to find financial data across all sheets
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Parse each sheet
      parseSheetData(jsonData, result);
    });
    
    // Calculate totals
    result.balanceSheet.totalAssets = 
      result.balanceSheet.currentAssets.reduce((sum, item) => sum + item.amount, 0) +
      result.balanceSheet.fixedAssets.reduce((sum, item) => sum + item.amount, 0);
    
    result.balanceSheet.totalLiabilities = 
      result.balanceSheet.currentLiabilities.reduce((sum, item) => sum + item.amount, 0) +
      result.balanceSheet.longTermLiabilities.reduce((sum, item) => sum + item.amount, 0);
    
    result.balanceSheet.totalEquity = 
      result.balanceSheet.equity.reduce((sum, item) => sum + item.amount, 0);
    
    return result;
  };

  // ===== Parse Sheet Data =====
  const parseSheetData = (rows: any[][], result: FinancialData) => {
    let currentSection = '';
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const rowText = row.map(cell => String(cell || '')).join(' ').trim();
      
      // Detect company name from first rows
      if (i < 5 && !result.companyName && rowText.length > 5 && !rowText.includes('قائمة')) {
        const firstCell = String(row[0] || '').trim();
        if (firstCell.length > 5) {
          result.companyName = firstCell;
        }
      }
      
      // Detect sections
      if (rowText.includes('الموجودات المتداولة') || rowText.includes('الأصول المتداولة')) {
        currentSection = 'currentAssets';
        continue;
      }
      if (rowText.includes('الموجودات الغير متداولة') || rowText.includes('الأصول الثابتة')) {
        currentSection = 'fixedAssets';
        continue;
      }
      if (rowText.includes('المطلوبات المتداولة') || rowText.includes('الخصوم المتداولة')) {
        currentSection = 'currentLiabilities';
        continue;
      }
      if (rowText.includes('المطلوبات الغير متداولة') || rowText.includes('الخصوم طويلة الأجل')) {
        currentSection = 'longTermLiabilities';
        continue;
      }
      if (rowText.includes('حقوق الملكية')) {
        currentSection = 'equity';
        continue;
      }
      if (rowText.includes('الإيرادات') || rowText.includes('المبيعات')) {
        currentSection = 'revenue';
        continue;
      }
      if (rowText.includes('تكلفة الإيرادات') || rowText.includes('تكلفة المبيعات')) {
        currentSection = 'costOfRevenue';
        continue;
      }
      if (rowText.includes('مصاريف عمومية') || rowText.includes('مصروفات تشغيلية')) {
        currentSection = 'operatingExpenses';
        continue;
      }
      if (rowText.includes('التدفقات النقدية') && rowText.includes('التشغيلية')) {
        currentSection = 'operatingCash';
        continue;
      }
      if (rowText.includes('التدفقات النقدية') && rowText.includes('الاستثمارية')) {
        currentSection = 'investingCash';
        continue;
      }
      if (rowText.includes('التدفقات النقدية') && rowText.includes('التمويلية')) {
        currentSection = 'financingCash';
        continue;
      }
      
      // Skip headers and totals
      if (rowText.includes('إجمالي') || rowText.includes('اجمالي') || rowText.includes('مجموع') || 
          rowText.includes('البيان') || rowText.includes('إيضاح')) {
        // Extract totals
        const amount = extractAmount(row);
        if (amount !== 0) {
          if (rowText.includes('مجموع الموجودات')) {
            result.balanceSheet.totalAssets = Math.abs(amount);
          } else if (rowText.includes('مجموع المطلوبات')) {
            result.balanceSheet.totalLiabilities = Math.abs(amount);
          } else if (rowText.includes('مجموع حقوق الملكية')) {
            result.balanceSheet.totalEquity = Math.abs(amount);
          } else if (rowText.includes('إجمالي الربح') || rowText.includes('إجمالي الخسارة')) {
            result.incomeStatement.grossProfit = amount;
          } else if (rowText.includes('ربح العمليات') || rowText.includes('خسارة العمليات')) {
            result.incomeStatement.operatingProfit = amount;
          }
        }
        continue;
      }
      
      // Extract account name and amount
      const accountName = extractAccountName(row);
      const amount = extractAmount(row);
      
      if (!accountName || amount === 0) continue;
      
      // Add to appropriate section
      switch (currentSection) {
        case 'currentAssets':
          result.balanceSheet.currentAssets.push({ name: accountName, amount: Math.abs(amount) });
          break;
        case 'fixedAssets':
          result.balanceSheet.fixedAssets.push({ name: accountName, amount: Math.abs(amount) });
          break;
        case 'currentLiabilities':
          result.balanceSheet.currentLiabilities.push({ name: accountName, amount: Math.abs(amount) });
          break;
        case 'longTermLiabilities':
          result.balanceSheet.longTermLiabilities.push({ name: accountName, amount: Math.abs(amount) });
          break;
        case 'equity':
          result.balanceSheet.equity.push({ name: accountName, amount: Math.abs(amount) });
          break;
        case 'revenue':
          result.incomeStatement.revenue += Math.abs(amount);
          break;
        case 'costOfRevenue':
          result.incomeStatement.costOfRevenue += Math.abs(amount);
          break;
        case 'operatingExpenses':
          result.incomeStatement.operatingExpenses.push({ name: accountName, amount: Math.abs(amount) });
          break;
        case 'operatingCash':
          result.cashFlow.operating.push({ name: accountName, amount });
          break;
        case 'investingCash':
          result.cashFlow.investing.push({ name: accountName, amount });
          break;
        case 'financingCash':
          result.cashFlow.financing.push({ name: accountName, amount });
          break;
      }
    }
    
    // Calculate derived values
    result.incomeStatement.grossProfit = result.incomeStatement.revenue - result.incomeStatement.costOfRevenue;
    result.incomeStatement.totalOperatingExpenses = result.incomeStatement.operatingExpenses.reduce((sum, e) => sum + e.amount, 0);
    result.incomeStatement.operatingProfit = result.incomeStatement.grossProfit - result.incomeStatement.totalOperatingExpenses;
    result.incomeStatement.profitBeforeZakat = result.incomeStatement.operatingProfit + result.incomeStatement.otherIncome - result.incomeStatement.otherExpenses;
    
    // Calculate Zakat from equity and fixed assets
    const capital = result.balanceSheet.equity.find(e => e.name.includes('رأس المال'))?.amount || 0;
    const reserves = result.balanceSheet.equity.find(e => e.name.includes('احتياطي'))?.amount || 0;
    const retainedEarnings = result.balanceSheet.equity.find(e => e.name.includes('أرباح مبقاة') || e.name.includes('ارباح مبقاه'))?.amount || 0;
    const fixedAssetsTotal = result.balanceSheet.fixedAssets.reduce((sum, a) => sum + a.amount, 0);
    const prepaidRent = result.balanceSheet.currentAssets.find(a => 
      a.name.includes('ايجار مدفوع') || a.name.includes('إيجار مدفوع') || a.name.includes('ايجار مقدم')
    )?.amount || 0;
    const prepaidExpenses = result.balanceSheet.currentAssets.find(a => 
      a.name.includes('مصروفات مدفوعة مقدما') || a.name.includes('مصاريف مقدمة')
    )?.amount || 0;
    
    const totalEquity = capital + reserves + retainedEarnings + result.incomeStatement.profitBeforeZakat;
    const zakatBase = totalEquity - fixedAssetsTotal - (prepaidRent * 11 / 12);
    const zakatAmount = Math.max(0, zakatBase * 0.025);
    
    result.incomeStatement.zakat = zakatAmount;
    result.incomeStatement.netProfit = result.incomeStatement.profitBeforeZakat - result.incomeStatement.zakat;
    
    // Set Zakat Calculation data
    result.zakatCalculation = {
      capital,
      reserves,
      retainedEarnings,
      netProfit: result.incomeStatement.profitBeforeZakat,
      totalEquity,
      fixedAssets: fixedAssetsTotal,
      prepaidExpenses,
      prepaidRent,
      zakatBase,
      zakatRate: 2.5,
      zakatAmount,
      adjustments: [],
    };
    
    result.cashFlow.totalOperating = result.cashFlow.operating.reduce((sum, item) => sum + item.amount, 0);
    result.cashFlow.totalInvesting = result.cashFlow.investing.reduce((sum, item) => sum + item.amount, 0);
    result.cashFlow.totalFinancing = result.cashFlow.financing.reduce((sum, item) => sum + item.amount, 0);
    result.cashFlow.netChange = result.cashFlow.totalOperating + result.cashFlow.totalInvesting + result.cashFlow.totalFinancing;
    result.cashFlow.closingCash = result.cashFlow.openingCash + result.cashFlow.netChange;
  };

  // ===== Helper Functions =====
  const extractAccountName = (row: any[]): string => {
    for (const cell of row) {
      if (typeof cell === 'string' && cell.trim().length > 2 && !/^\d+(\.\d+)?$/.test(cell.trim())) {
        return cell.trim();
      }
    }
    return '';
  };

  const extractAmount = (row: any[]): number => {
    // Search for numeric values (prioritize larger absolute values in case of multiple)
    let amount = 0;
    for (const cell of row) {
      if (typeof cell === 'number' && !isNaN(cell) && Math.abs(cell) > Math.abs(amount)) {
        amount = cell;
      }
    }
    return amount;
  };

  // ===== Load from System Data =====
  const loadSystemData = async () => {
    if (!companyId) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }

    setIsLoading(true);
    try {
      const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
      const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

      // Fetch sales data
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          sale_price,
          car:cars(purchase_price),
          sale_items:sale_items(sale_price, car:cars(purchase_price))
        `)
        .eq('company_id', companyId)
        .gte('sale_date', startDate!)
        .lte('sale_date', endDate!);

      let revenue = 0;
      let costOfSales = 0;
      (salesData || []).forEach((sale: any) => {
        if (sale.sale_items && sale.sale_items.length > 0) {
          sale.sale_items.forEach((item: any) => {
            revenue += Number(item.sale_price) || 0;
            costOfSales += Number(item.car?.purchase_price) || 0;
          });
        } else {
          revenue += Number(sale.sale_price) || 0;
          costOfSales += Number(sale.car?.purchase_price) || 0;
        }
      });

      // Fetch expenses with categories
      const { data: expensesData } = await supabase
        .from('expenses')
        .select(`
          amount,
          description,
          category:expense_categories(name)
        `)
        .eq('company_id', companyId)
        .gte('expense_date', startDate!)
        .lte('expense_date', endDate!);

      const expensesByCategory: { [key: string]: number } = {};
      (expensesData || []).forEach((expense: any) => {
        const category = expense.category?.name || 'مصروفات أخرى';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(expense.amount);
      });

      const operatingExpenses = Object.entries(expensesByCategory).map(([name, amount]) => ({ name, amount }));
      const totalExpenses = operatingExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Fetch bank accounts for cash
      const { data: bankData } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('company_id', companyId);

      const totalCash = (bankData || []).reduce((sum: number, b: any) => sum + (Number(b.current_balance) || 0), 0);

      // Fetch cars inventory
      const { data: carsData } = await supabase
        .from('cars')
        .select('purchase_price')
        .eq('company_id', companyId)
        .eq('status', 'available');

      const inventoryValue = (carsData || []).reduce((sum: number, c: any) => sum + (Number(c.purchase_price) || 0), 0);

      // Build financial data
      const grossProfit = revenue - costOfSales;
      const operatingProfit = grossProfit - totalExpenses;
      const zakat = Math.max(0, operatingProfit * 0.025);
      const netProfit = operatingProfit - zakat;

      setData({
        companyName: company?.name || '',
        period: {
          from: startDate || '',
          to: endDate || '',
        },
        balanceSheet: {
          currentAssets: [
            { name: 'النقد وأرصدة لدى البنوك', amount: totalCash },
            { name: 'مخزون السيارات', amount: inventoryValue },
          ],
          fixedAssets: [],
          totalAssets: totalCash + inventoryValue,
          currentLiabilities: [],
          longTermLiabilities: [],
          totalLiabilities: 0,
          equity: [
            { name: 'رأس المال', amount: 0 },
            { name: 'الأرباح المحتجزة', amount: netProfit },
          ],
          totalEquity: netProfit,
        },
        incomeStatement: {
          revenue,
          costOfRevenue: costOfSales,
          grossProfit,
          operatingExpenses,
          totalOperatingExpenses: totalExpenses,
          operatingProfit,
          otherIncome: 0,
          otherExpenses: 0,
          profitBeforeZakat: operatingProfit,
          zakat,
          netProfit,
        },
        equityChanges: {
          items: [
            { description: 'الرصيد الافتتاحي', capital: 0, reserves: 0, retainedEarnings: 0, total: 0 },
            { description: 'صافي الربح للفترة', capital: 0, reserves: 0, retainedEarnings: netProfit, total: netProfit },
            { description: 'الرصيد الختامي', capital: 0, reserves: 0, retainedEarnings: netProfit, total: netProfit },
          ],
          openingBalance: { capital: 0, reserves: 0, retainedEarnings: 0, total: 0 },
          closingBalance: { capital: 0, reserves: 0, retainedEarnings: netProfit, total: netProfit },
        },
        cashFlow: {
          operating: [{ name: 'صافي الربح', amount: netProfit }],
          totalOperating: netProfit,
          investing: [],
          totalInvesting: 0,
          financing: [],
          totalFinancing: 0,
          netChange: netProfit,
          openingCash: 0,
          closingCash: totalCash,
        },
        zakatCalculation: {
          capital: 0,
          reserves: 0,
          retainedEarnings: 0,
          netProfit: netProfit,
          totalEquity: netProfit,
          fixedAssets: 0,
          prepaidExpenses: 0,
          prepaidRent: 0,
          zakatBase: netProfit,
          zakatRate: 2.5,
          zakatAmount: zakat,
          adjustments: [],
        },
      });

      setDataSource('system');
      toast.success('تم تحميل البيانات من النظام');
    } catch (error) {
      console.error('Error loading system data:', error);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Export Functions =====
  const exportBalanceSheet = (type: 'print' | 'excel' | 'pdf') => {
    const columns = [
      { header: 'البند', key: 'item' },
      { header: data.period.to ? data.period.to.substring(0, 4) + 'م' : '2024م', key: 'current' },
    ];
    
    const tableData = [
      { item: '=== الموجودات ===', current: '' },
      { item: 'الموجودات المتداولة', current: '' },
      ...data.balanceSheet.currentAssets.map(a => ({ item: a.name, current: a.amount.toLocaleString() })),
      { item: 'إجمالي الموجودات المتداولة', current: data.balanceSheet.currentAssets.reduce((s, a) => s + a.amount, 0).toLocaleString() },
      { item: 'الموجودات الغير متداولة', current: '' },
      ...data.balanceSheet.fixedAssets.map(a => ({ item: a.name, current: a.amount.toLocaleString() })),
      { item: 'إجمالي الموجودات الغير متداولة', current: data.balanceSheet.fixedAssets.reduce((s, a) => s + a.amount, 0).toLocaleString() },
      { item: 'مجموع الموجودات', current: data.balanceSheet.totalAssets.toLocaleString() },
      { item: '', current: '' },
      { item: '=== المطلوبات وحقوق الملكية ===', current: '' },
      { item: 'المطلوبات المتداولة', current: '' },
      ...data.balanceSheet.currentLiabilities.map(a => ({ item: a.name, current: a.amount.toLocaleString() })),
      { item: 'إجمالي المطلوبات المتداولة', current: data.balanceSheet.currentLiabilities.reduce((s, a) => s + a.amount, 0).toLocaleString() },
      { item: 'مجموع المطلوبات', current: data.balanceSheet.totalLiabilities.toLocaleString() },
      { item: 'حقوق الملكية', current: '' },
      ...data.balanceSheet.equity.map(a => ({ item: a.name, current: a.amount.toLocaleString() })),
      { item: 'مجموع حقوق الملكية', current: data.balanceSheet.totalEquity.toLocaleString() },
      { item: 'مجموع المطلوبات وحقوق الملكية', current: (data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquity).toLocaleString() },
    ];

    const summaryCards = [
      { label: 'إجمالي الموجودات', value: data.balanceSheet.totalAssets.toLocaleString() + ' ر.س' },
      { label: 'إجمالي المطلوبات', value: data.balanceSheet.totalLiabilities.toLocaleString() + ' ر.س' },
      { label: 'حقوق الملكية', value: data.balanceSheet.totalEquity.toLocaleString() + ' ر.س' },
    ];

    const period = data.period.to ? `كما في ${data.period.to}` : undefined;

    if (type === 'print') {
      printReport({ title: 'قائمة المركز المالي', subtitle: period, columns, data: tableData, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'قائمة المركز المالي', columns, data: tableData, fileName: 'balance-sheet', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'قائمة المركز المالي', subtitle: period, columns, data: tableData, fileName: 'balance-sheet', summaryCards });
    }
  };

  const exportIncomeStatement = (type: 'print' | 'excel' | 'pdf') => {
    const columns = [
      { header: 'البند', key: 'item' },
      { header: 'المبلغ (ر.س)', key: 'amount' },
    ];
    
    const tableData = [
      { item: 'الإيرادات', amount: data.incomeStatement.revenue.toLocaleString() },
      { item: 'تكلفة الإيرادات', amount: `(${data.incomeStatement.costOfRevenue.toLocaleString()})` },
      { item: 'إجمالي الربح', amount: data.incomeStatement.grossProfit.toLocaleString() },
      { item: '', amount: '' },
      { item: 'مصاريف عمومية وإدارية', amount: `(${data.incomeStatement.totalOperatingExpenses.toLocaleString()})` },
      ...data.incomeStatement.operatingExpenses.map(e => ({ item: `   - ${e.name}`, amount: `(${e.amount.toLocaleString()})` })),
      { item: 'ربح العمليات', amount: data.incomeStatement.operatingProfit.toLocaleString() },
      { item: 'الربح قبل الزكاة', amount: data.incomeStatement.profitBeforeZakat.toLocaleString() },
      { item: 'الزكاة', amount: `(${data.incomeStatement.zakat.toLocaleString()})` },
      { item: 'صافي الربح', amount: data.incomeStatement.netProfit.toLocaleString() },
    ];

    const summaryCards = [
      { label: 'الإيرادات', value: data.incomeStatement.revenue.toLocaleString() + ' ر.س' },
      { label: 'إجمالي الربح', value: data.incomeStatement.grossProfit.toLocaleString() + ' ر.س' },
      { label: 'صافي الربح', value: data.incomeStatement.netProfit.toLocaleString() + ' ر.س' },
    ];

    const period = data.period.from && data.period.to 
      ? `للسنة المنتهية في ${data.period.to}`
      : undefined;

    if (type === 'print') {
      printReport({ title: 'قائمة الدخل الشامل', subtitle: period, columns, data: tableData, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'قائمة الدخل الشامل', columns, data: tableData, fileName: 'income-statement', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'قائمة الدخل الشامل', subtitle: period, columns, data: tableData, fileName: 'income-statement', summaryCards });
    }
  };

  const exportEquityChanges = (type: 'print' | 'excel' | 'pdf') => {
    const columns = [
      { header: 'البيان', key: 'description' },
      { header: 'رأس المال', key: 'capital' },
      { header: 'احتياطي نظامي', key: 'reserves' },
      { header: 'أرباح مبقاة', key: 'retainedEarnings' },
      { header: 'الإجمالي', key: 'total' },
    ];
    
    const tableData = data.equityChanges.items.map(item => ({
      description: item.description,
      capital: item.capital.toLocaleString(),
      reserves: item.reserves.toLocaleString(),
      retainedEarnings: item.retainedEarnings.toLocaleString(),
      total: item.total.toLocaleString(),
    }));

    const period = data.period.from && data.period.to 
      ? `للسنة المنتهية في ${data.period.to}`
      : undefined;

    if (type === 'print') {
      printReport({ title: 'قائمة التغير في حقوق الملكية', subtitle: period, columns, data: tableData });
    } else if (type === 'excel') {
      exportToExcel({ title: 'قائمة التغير في حقوق الملكية', columns, data: tableData, fileName: 'equity-changes' });
    } else {
      exportToPdf({ title: 'قائمة التغير في حقوق الملكية', subtitle: period, columns, data: tableData, fileName: 'equity-changes' });
    }
  };

  const exportCashFlow = (type: 'print' | 'excel' | 'pdf') => {
    const columns = [
      { header: 'البند', key: 'item' },
      { header: 'المبلغ (ر.س)', key: 'amount' },
    ];
    
    const tableData = [
      { item: '=== التدفقات النقدية من الأنشطة التشغيلية ===', amount: '' },
      ...data.cashFlow.operating.map(o => ({ item: o.name, amount: o.amount.toLocaleString() })),
      { item: 'صافي التدفقات التشغيلية', amount: data.cashFlow.totalOperating.toLocaleString() },
      { item: '', amount: '' },
      { item: '=== التدفقات النقدية من الأنشطة الاستثمارية ===', amount: '' },
      ...data.cashFlow.investing.map(i => ({ item: i.name, amount: i.amount.toLocaleString() })),
      { item: 'صافي التدفقات الاستثمارية', amount: data.cashFlow.totalInvesting.toLocaleString() },
      { item: '', amount: '' },
      { item: '=== التدفقات النقدية من الأنشطة التمويلية ===', amount: '' },
      ...data.cashFlow.financing.map(f => ({ item: f.name, amount: f.amount.toLocaleString() })),
      { item: 'صافي التدفقات التمويلية', amount: data.cashFlow.totalFinancing.toLocaleString() },
      { item: '', amount: '' },
      { item: 'صافي التغير في النقد', amount: data.cashFlow.netChange.toLocaleString() },
      { item: 'النقد في بداية الفترة', amount: data.cashFlow.openingCash.toLocaleString() },
      { item: 'النقد في نهاية الفترة', amount: data.cashFlow.closingCash.toLocaleString() },
    ];

    const period = data.period.from && data.period.to 
      ? `للسنة المنتهية في ${data.period.to}`
      : undefined;

    if (type === 'print') {
      printReport({ title: 'قائمة التدفق النقدي', subtitle: period, columns, data: tableData });
    } else if (type === 'excel') {
      exportToExcel({ title: 'قائمة التدفق النقدي', columns, data: tableData, fileName: 'cash-flow' });
    } else {
      exportToPdf({ title: 'قائمة التدفق النقدي', subtitle: period, columns, data: tableData, fileName: 'cash-flow' });
    }
  };

  // ===== Export Zakat Calculation =====
  const exportZakatCalculation = (type: 'print' | 'excel' | 'pdf') => {
    const columns = [
      { header: 'البند', key: 'item' },
      { header: 'المبلغ (ر.س)', key: 'amount' },
    ];
    
    const zk = data.zakatCalculation;
    const tableData = [
      { item: '=== مصادر الوعاء الزكوي ===', amount: '' },
      { item: 'رأس المال', amount: formatNumber(zk.capital) },
      { item: 'الاحتياطيات', amount: formatNumber(zk.reserves) },
      { item: 'الأرباح المحتجزة', amount: formatNumber(zk.retainedEarnings) },
      { item: 'صافي الربح للعام', amount: formatNumber(zk.netProfit) },
      { item: 'إجمالي حقوق الملكية', amount: formatNumber(zk.totalEquity) },
      { item: '', amount: '' },
      { item: '=== الحسميات من الوعاء ===', amount: '' },
      { item: 'الأصول الثابتة', amount: `(${formatNumber(zk.fixedAssets)})` },
      { item: 'مصروفات مدفوعة مقدماً', amount: `(${formatNumber(zk.prepaidExpenses)})` },
      { item: 'إيجار مدفوع مقدماً (11/12)', amount: `(${formatNumber(zk.prepaidRent * 11 / 12)})` },
      ...zk.adjustments.map(adj => ({ 
        item: adj.name, 
        amount: adj.type === 'deduct' ? `(${formatNumber(adj.amount)})` : formatNumber(adj.amount)
      })),
      { item: '', amount: '' },
      { item: 'الوعاء الزكوي', amount: formatNumber(zk.zakatBase) },
      { item: `نسبة الزكاة (${zk.zakatRate}%)`, amount: `${zk.zakatRate}%` },
      { item: 'مبلغ الزكاة المستحق', amount: formatNumber(zk.zakatAmount) },
    ];

    const summaryCards = [
      { label: 'الوعاء الزكوي', value: formatNumber(zk.zakatBase) + ' ر.س' },
      { label: 'نسبة الزكاة', value: zk.zakatRate + '%' },
      { label: 'الزكاة المستحقة', value: formatNumber(zk.zakatAmount) + ' ر.س' },
    ];

    const period = data.period.from && data.period.to 
      ? `للسنة المنتهية في ${data.period.to}`
      : undefined;

    if (type === 'print') {
      printReport({ title: 'حساب الوعاء الزكوي', subtitle: period, columns, data: tableData, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'حساب الوعاء الزكوي', columns, data: tableData, fileName: 'zakat-calculation', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'حساب الوعاء الزكوي', subtitle: period, columns, data: tableData, fileName: 'zakat-calculation', summaryCards });
    }
  };

  // ===== Export Actions Component =====
  const ExportActions = ({ onExport }: { onExport: (type: 'print' | 'excel' | 'pdf') => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('print')} className="gap-2 cursor-pointer">
          <Printer className="w-4 h-4" />
          طباعة
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4" />
          تصدير PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('excel')} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4" />
          تصدير Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ===== Format Number =====
  const formatNumber = (num: number) => num.toLocaleString('en-US');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">القوائم المالية الشاملة</h1>
          <p className="text-muted-foreground">قائمة المركز المالي، قائمة الدخل، التغيرات في حقوق الملكية، التدفقات النقدية</p>
        </div>
        
        <div className="flex items-center gap-2">
          {dataSource !== 'none' && (
            <Badge variant={dataSource === 'excel' ? 'default' : 'secondary'}>
              {dataSource === 'excel' ? (
                <><FileSpreadsheet className="w-3 h-3 mr-1" /> {fileName}</>
              ) : (
                <><Database className="w-3 h-3 mr-1" /> بيانات النظام</>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* Data Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            مصدر البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Excel */}
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all hover:border-primary/50",
                dataSource === 'excel' ? 'border-primary bg-primary/5' : 'border-border'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) parseExcelFile(file);
                }}
              />
              <div className="flex flex-col items-center gap-2 text-center">
                <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
                <p className="font-medium">رفع ملف Excel</p>
                <p className="text-sm text-muted-foreground">قوائم مالية من ملف Excel</p>
              </div>
            </div>

            {/* Load from System */}
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all hover:border-primary/50",
                dataSource === 'system' ? 'border-primary bg-primary/5' : 'border-border'
              )}
              onClick={loadSystemData}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Database className="w-10 h-10 text-muted-foreground" />
                <p className="font-medium">من بيانات النظام</p>
                <p className="text-sm text-muted-foreground">المبيعات والمشتريات والمصروفات</p>
              </div>
            </div>
          </div>

          {/* Date Range for System Data */}
          <div className="flex items-center gap-4">
            <Label>الفترة:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("justify-start text-right font-normal gap-2")}>
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "yyyy/MM/dd")} - {format(dateRange.to, "yyyy/MM/dd")}
                      </>
                    ) : (
                      format(dateRange.from, "yyyy/MM/dd")
                    )
                  ) : (
                    <span>اختر الفترة</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {dataSource !== 'none' && (
              <div className="flex items-center gap-2 mr-auto">
                <Label htmlFor="edit-mode">وضع التعديل</Label>
                <Switch id="edit-mode" checked={editMode} onCheckedChange={setEditMode} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Financial Statements Tabs */}
      {!isLoading && dataSource !== 'none' && (
        <Tabs defaultValue="balance-sheet" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max gap-1 p-1">
              <TabsTrigger value="balance-sheet" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
                <Building2 className="w-4 h-4" />
                قائمة المركز المالي
              </TabsTrigger>
              <TabsTrigger value="income" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
                <TrendingUp className="w-4 h-4" />
                قائمة الدخل الشامل
              </TabsTrigger>
              <TabsTrigger value="equity" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
                <Scale className="w-4 h-4" />
                التغير في حقوق الملكية
              </TabsTrigger>
              <TabsTrigger value="cash-flow" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
                <Wallet className="w-4 h-4" />
                التدفق النقدي
              </TabsTrigger>
              <TabsTrigger value="zakat" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
                <Calculator className="w-4 h-4" />
                حساب الزكاة
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Balance Sheet */}
          <TabsContent value="balance-sheet">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    قائمة المركز المالي
                    {data.period.to && <span className="text-sm font-normal text-muted-foreground">كما في {data.period.to}</span>}
                  </CardTitle>
                  <ExportActions onExport={exportBalanceSheet} />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">البند</TableHead>
                        <TableHead className="text-left w-32">المبلغ (ر.س)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Assets */}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={2} className="font-bold">الموجودات</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={2} className="font-medium pr-4">الموجودات المتداولة</TableCell>
                      </TableRow>
                      {data.balanceSheet.currentAssets.map((asset, idx) => (
                        <TableRow key={`ca-${idx}`}>
                          <TableCell className="pr-8">{asset.name}</TableCell>
                          <TableCell className="text-left font-mono">
                            {editMode ? (
                              <Input
                                type="number"
                                value={asset.amount}
                                onChange={(e) => {
                                  const newAssets = [...data.balanceSheet.currentAssets];
                                  newAssets[idx].amount = Number(e.target.value);
                                  setData({ ...data, balanceSheet: { ...data.balanceSheet, currentAssets: newAssets } });
                                }}
                                className="w-28 text-left"
                              />
                            ) : (
                              formatNumber(asset.amount)
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2">
                        <TableCell className="font-medium pr-4">إجمالي الموجودات المتداولة</TableCell>
                        <TableCell className="text-left font-mono font-bold">
                          {formatNumber(data.balanceSheet.currentAssets.reduce((s, a) => s + a.amount, 0))}
                        </TableCell>
                      </TableRow>
                      
                      {data.balanceSheet.fixedAssets.length > 0 && (
                        <>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={2} className="font-medium pr-4">الموجودات الغير متداولة</TableCell>
                          </TableRow>
                          {data.balanceSheet.fixedAssets.map((asset, idx) => (
                            <TableRow key={`fa-${idx}`}>
                              <TableCell className="pr-8">{asset.name}</TableCell>
                              <TableCell className="text-left font-mono">{formatNumber(asset.amount)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2">
                            <TableCell className="font-medium pr-4">إجمالي الموجودات الغير متداولة</TableCell>
                            <TableCell className="text-left font-mono font-bold">
                              {formatNumber(data.balanceSheet.fixedAssets.reduce((s, a) => s + a.amount, 0))}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                      
                      <TableRow className="bg-primary/10 border-t-2">
                        <TableCell className="font-bold">مجموع الموجودات</TableCell>
                        <TableCell className="text-left font-mono font-bold text-primary">
                          {formatNumber(data.balanceSheet.totalAssets)}
                        </TableCell>
                      </TableRow>

                      {/* Liabilities & Equity */}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={2} className="font-bold">المطلوبات وحقوق الملكية</TableCell>
                      </TableRow>
                      
                      {data.balanceSheet.currentLiabilities.length > 0 && (
                        <>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={2} className="font-medium pr-4">المطلوبات المتداولة</TableCell>
                          </TableRow>
                          {data.balanceSheet.currentLiabilities.map((liability, idx) => (
                            <TableRow key={`cl-${idx}`}>
                              <TableCell className="pr-8">{liability.name}</TableCell>
                              <TableCell className="text-left font-mono">{formatNumber(liability.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}

                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={2} className="font-medium pr-4">حقوق الملكية</TableCell>
                      </TableRow>
                      {data.balanceSheet.equity.map((eq, idx) => (
                        <TableRow key={`eq-${idx}`}>
                          <TableCell className="pr-8">{eq.name}</TableCell>
                          <TableCell className="text-left font-mono">
                            {editMode ? (
                              <Input
                                type="number"
                                value={eq.amount}
                                onChange={(e) => {
                                  const newEquity = [...data.balanceSheet.equity];
                                  newEquity[idx].amount = Number(e.target.value);
                                  setData({ ...data, balanceSheet: { ...data.balanceSheet, equity: newEquity } });
                                }}
                                className="w-28 text-left"
                              />
                            ) : (
                              formatNumber(eq.amount)
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2">
                        <TableCell className="font-medium pr-4">مجموع حقوق الملكية</TableCell>
                        <TableCell className="text-left font-mono font-bold">
                          {formatNumber(data.balanceSheet.totalEquity)}
                        </TableCell>
                      </TableRow>
                      
                      <TableRow className="bg-primary/10 border-t-2">
                        <TableCell className="font-bold">مجموع المطلوبات وحقوق الملكية</TableCell>
                        <TableCell className="text-left font-mono font-bold text-primary">
                          {formatNumber(data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquity)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income Statement */}
          <TabsContent value="income">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    قائمة الدخل الشامل
                    {data.period.to && <span className="text-sm font-normal text-muted-foreground">للسنة المنتهية في {data.period.to}</span>}
                  </CardTitle>
                  <ExportActions onExport={exportIncomeStatement} />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">البند</TableHead>
                      <TableHead className="text-left w-40">المبلغ (ر.س)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>الإيرادات</TableCell>
                      <TableCell className="text-left font-mono">
                        {editMode ? (
                          <Input
                            type="number"
                            value={data.incomeStatement.revenue}
                            onChange={(e) => setData({
                              ...data,
                              incomeStatement: { ...data.incomeStatement, revenue: Number(e.target.value) }
                            })}
                            className="w-32 text-left"
                          />
                        ) : (
                          formatNumber(data.incomeStatement.revenue)
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>تكلفة الإيرادات</TableCell>
                      <TableCell className="text-left font-mono text-destructive">
                        ({formatNumber(data.incomeStatement.costOfRevenue)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">إجمالي الربح</TableCell>
                      <TableCell className="text-left font-mono font-bold">
                        {formatNumber(data.incomeStatement.grossProfit)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>مصاريف عمومية وإدارية</TableCell>
                      <TableCell className="text-left font-mono text-destructive">
                        ({formatNumber(data.incomeStatement.totalOperatingExpenses)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">ربح العمليات</TableCell>
                      <TableCell className="text-left font-mono font-bold">
                        {formatNumber(data.incomeStatement.operatingProfit)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">الربح قبل الزكاة</TableCell>
                      <TableCell className="text-left font-mono font-bold">
                        {formatNumber(data.incomeStatement.profitBeforeZakat)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>الزكاة</TableCell>
                      <TableCell className="text-left font-mono text-destructive">
                        ({formatNumber(data.incomeStatement.zakat)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10">
                      <TableCell className="font-bold text-lg">صافي الربح</TableCell>
                      <TableCell className="text-left font-mono font-bold text-lg text-primary">
                        {formatNumber(data.incomeStatement.netProfit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equity Changes */}
          <TabsContent value="equity">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    قائمة التغير في حقوق الملكية
                  </CardTitle>
                  <ExportActions onExport={exportEquityChanges} />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">البيان</TableHead>
                      <TableHead className="text-center">رأس المال</TableHead>
                      <TableHead className="text-center">احتياطي نظامي</TableHead>
                      <TableHead className="text-center">أرباح مبقاة</TableHead>
                      <TableHead className="text-center">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.equityChanges.items.map((item, idx) => (
                      <TableRow key={idx} className={idx === data.equityChanges.items.length - 1 ? 'bg-primary/10 font-bold' : ''}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-center font-mono">{formatNumber(item.capital)}</TableCell>
                        <TableCell className="text-center font-mono">{formatNumber(item.reserves)}</TableCell>
                        <TableCell className="text-center font-mono">{formatNumber(item.retainedEarnings)}</TableCell>
                        <TableCell className="text-center font-mono">{formatNumber(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Flow */}
          <TabsContent value="cash-flow">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    قائمة التدفق النقدي
                  </CardTitle>
                  <ExportActions onExport={exportCashFlow} />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">البند</TableHead>
                      <TableHead className="text-left w-40">المبلغ (ر.س)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-bold">التدفقات النقدية من الأنشطة التشغيلية</TableCell>
                    </TableRow>
                    {data.cashFlow.operating.map((item, idx) => (
                      <TableRow key={`op-${idx}`}>
                        <TableCell className="pr-8">{item.name}</TableCell>
                        <TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t">
                      <TableCell className="font-medium">صافي التدفقات التشغيلية</TableCell>
                      <TableCell className="text-left font-mono font-bold">{formatNumber(data.cashFlow.totalOperating)}</TableCell>
                    </TableRow>

                    {data.cashFlow.investing.length > 0 && (
                      <>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={2} className="font-bold">التدفقات النقدية من الأنشطة الاستثمارية</TableCell>
                        </TableRow>
                        {data.cashFlow.investing.map((item, idx) => (
                          <TableRow key={`inv-${idx}`}>
                            <TableCell className="pr-8">{item.name}</TableCell>
                            <TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t">
                          <TableCell className="font-medium">صافي التدفقات الاستثمارية</TableCell>
                          <TableCell className="text-left font-mono font-bold">{formatNumber(data.cashFlow.totalInvesting)}</TableCell>
                        </TableRow>
                      </>
                    )}

                    {data.cashFlow.financing.length > 0 && (
                      <>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={2} className="font-bold">التدفقات النقدية من الأنشطة التمويلية</TableCell>
                        </TableRow>
                        {data.cashFlow.financing.map((item, idx) => (
                          <TableRow key={`fin-${idx}`}>
                            <TableCell className="pr-8">{item.name}</TableCell>
                            <TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t">
                          <TableCell className="font-medium">صافي التدفقات التمويلية</TableCell>
                          <TableCell className="text-left font-mono font-bold">{formatNumber(data.cashFlow.totalFinancing)}</TableCell>
                        </TableRow>
                      </>
                    )}

                    <TableRow className="bg-muted/50 border-t-2">
                      <TableCell className="font-bold">صافي التغير في النقد</TableCell>
                      <TableCell className="text-left font-mono font-bold">{formatNumber(data.cashFlow.netChange)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>النقد في بداية الفترة</TableCell>
                      <TableCell className="text-left font-mono">{formatNumber(data.cashFlow.openingCash)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10">
                      <TableCell className="font-bold">النقد في نهاية الفترة</TableCell>
                      <TableCell className="text-left font-mono font-bold text-primary">{formatNumber(data.cashFlow.closingCash)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zakat Calculation */}
          <TabsContent value="zakat">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    حساب الوعاء الزكوي
                    {data.period.to && <span className="text-sm font-normal text-muted-foreground">للسنة المنتهية في {data.period.to}</span>}
                  </CardTitle>
                  <ExportActions onExport={exportZakatCalculation} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Zakat Sources */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                      <TrendingUp className="w-5 h-5" />
                      مصادر الوعاء الزكوي
                    </h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>رأس المال</TableCell>
                          <TableCell className="text-left font-mono">
                            {editMode ? (
                              <Input
                                type="number"
                                value={data.zakatCalculation.capital}
                                onChange={(e) => setData({
                                  ...data,
                                  zakatCalculation: { ...data.zakatCalculation, capital: Number(e.target.value) }
                                })}
                                className="w-32 text-left"
                              />
                            ) : (
                              formatNumber(data.zakatCalculation.capital)
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>الاحتياطيات</TableCell>
                          <TableCell className="text-left font-mono">
                            {editMode ? (
                              <Input
                                type="number"
                                value={data.zakatCalculation.reserves}
                                onChange={(e) => setData({
                                  ...data,
                                  zakatCalculation: { ...data.zakatCalculation, reserves: Number(e.target.value) }
                                })}
                                className="w-32 text-left"
                              />
                            ) : (
                              formatNumber(data.zakatCalculation.reserves)
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>الأرباح المحتجزة</TableCell>
                          <TableCell className="text-left font-mono">
                            {editMode ? (
                              <Input
                                type="number"
                                value={data.zakatCalculation.retainedEarnings}
                                onChange={(e) => setData({
                                  ...data,
                                  zakatCalculation: { ...data.zakatCalculation, retainedEarnings: Number(e.target.value) }
                                })}
                                className="w-32 text-left"
                              />
                            ) : (
                              formatNumber(data.zakatCalculation.retainedEarnings)
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>صافي الربح للعام</TableCell>
                          <TableCell className="text-left font-mono">{formatNumber(data.zakatCalculation.netProfit)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-bold">إجمالي حقوق الملكية</TableCell>
                          <TableCell className="text-left font-mono font-bold">{formatNumber(data.zakatCalculation.totalEquity)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-destructive">
                      <Scale className="w-5 h-5" />
                      الحسميات من الوعاء
                    </h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>الأصول الثابتة</TableCell>
                          <TableCell className="text-left font-mono text-destructive">
                            {editMode ? (
                              <Input
                                type="number"
                                value={data.zakatCalculation.fixedAssets}
                                onChange={(e) => setData({
                                  ...data,
                                  zakatCalculation: { ...data.zakatCalculation, fixedAssets: Number(e.target.value) }
                                })}
                                className="w-32 text-left"
                              />
                            ) : (
                              `(${formatNumber(data.zakatCalculation.fixedAssets)})`
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>مصروفات مدفوعة مقدماً</TableCell>
                          <TableCell className="text-left font-mono text-destructive">
                            {editMode ? (
                              <Input
                                type="number"
                                value={data.zakatCalculation.prepaidExpenses}
                                onChange={(e) => setData({
                                  ...data,
                                  zakatCalculation: { ...data.zakatCalculation, prepaidExpenses: Number(e.target.value) }
                                })}
                                className="w-32 text-left"
                              />
                            ) : (
                              `(${formatNumber(data.zakatCalculation.prepaidExpenses)})`
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>إيجار مدفوع مقدماً (11/12)</TableCell>
                          <TableCell className="text-left font-mono text-destructive">
                            {editMode ? (
                              <Input
                                type="number"
                                value={data.zakatCalculation.prepaidRent}
                                onChange={(e) => setData({
                                  ...data,
                                  zakatCalculation: { ...data.zakatCalculation, prepaidRent: Number(e.target.value) }
                                })}
                                className="w-32 text-left"
                              />
                            ) : (
                              `(${formatNumber(Math.round(data.zakatCalculation.prepaidRent * 11 / 12))})`
                            )}
                          </TableCell>
                        </TableRow>
                        {data.zakatCalculation.adjustments.map((adj, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{adj.name}</TableCell>
                            <TableCell className={cn("text-left font-mono", adj.type === 'deduct' && 'text-destructive')}>
                              {adj.type === 'deduct' ? `(${formatNumber(adj.amount)})` : formatNumber(adj.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Zakat Result */}
                <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Table>
                    <TableBody>
                      <TableRow className="bg-primary/10">
                        <TableCell className="font-bold text-lg">الوعاء الزكوي</TableCell>
                        <TableCell className="text-left font-mono font-bold text-lg">
                          {editMode ? (
                            <Input
                              type="number"
                              value={data.zakatCalculation.zakatBase}
                              onChange={(e) => setData({
                                ...data,
                                zakatCalculation: { ...data.zakatCalculation, zakatBase: Number(e.target.value) }
                              })}
                              className="w-40 text-left"
                            />
                          ) : (
                            formatNumber(data.zakatCalculation.zakatBase)
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>نسبة الزكاة</TableCell>
                        <TableCell className="text-left font-mono">
                          {editMode ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={data.zakatCalculation.zakatRate}
                              onChange={(e) => setData({
                                ...data,
                                zakatCalculation: { ...data.zakatCalculation, zakatRate: Number(e.target.value) }
                              })}
                              className="w-24 text-left"
                            />
                          ) : (
                            `${data.zakatCalculation.zakatRate}%`
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-emerald-100/50 dark:bg-emerald-950/30">
                        <TableCell className="font-bold text-xl text-emerald-600 dark:text-emerald-400">الزكاة المستحقة</TableCell>
                        <TableCell className="text-left font-mono font-bold text-xl text-emerald-600 dark:text-emerald-400">
                          {editMode ? (
                            <Input
                              type="number"
                              value={data.zakatCalculation.zakatAmount}
                              onChange={(e) => setData({
                                ...data,
                                zakatCalculation: { ...data.zakatCalculation, zakatAmount: Number(e.target.value) }
                              })}
                              className="w-40 text-left"
                            />
                          ) : (
                            `${formatNumber(data.zakatCalculation.zakatAmount)} ر.س`
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Formula */}
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <p className="font-medium mb-1">معادلة حساب الوعاء الزكوي:</p>
                  <p className="font-mono text-xs">الوعاء الزكوي = (رأس المال + صافي الربح) - الأصول الثابتة - (11/12 من الإيجار المدفوع مقدماً)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
