import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Download, TrendingUp, TrendingDown, Building2, Calculator, Upload, X, FileUp, Save, Trash2, FolderOpen, FileText, Eye, Sparkles, Image, Database, Loader2, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { read, utils } from '@/lib/excelUtils';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TrialBalancePreviewDialog } from './TrialBalancePreviewDialog';
import { getSystemTrialBalance } from '@/services/systemFinancialData';
import { TrialBalanceFormulaEditor } from './trial-balance/TrialBalanceFormulaEditor';
import { useSales } from '@/hooks/useDatabase';
import { useExpenses } from '@/hooks/useExpenses';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';

interface TrialBalanceData {
  companyName: string;
  vatNumber: string;
  period: { from: string; to: string };
  fixedAssets: { [key: string]: number };
  currentAssets: { [key: string]: number };
  liabilities: { [key: string]: number };
  equity: { [key: string]: number };
  revenue: { [key: string]: number };
  expenses: { [key: string]: number };
  purchases: number;
}

// بيانات الحساب الكاملة (6 أعمدة)
interface AccountData {
  code: string;
  name: string;
  // الرصيد السابق
  openingDebit: number;
  openingCredit: number;
  // الحركة
  movementDebit: number;
  movementCredit: number;
  // الصافي
  closingDebit: number;
  closingCredit: number;
  category: string;
}

// بيانات التحقق من المطابقة
interface ReconciliationData {
  // الإجماليات الأصلية من الملف
  originalTotalDebit: number;
  originalTotalCredit: number;
  // الحسابات المستبعدة/المكررة
  excludedAccounts: { name: string; amount: number; reason: string }[];
  // جميع الحسابات الخام قبل التصفية (مع كل الأعمدة)
  rawAccounts: AccountData[];
}

// البيانات الفارغة (الافتراضية)
const emptyData: TrialBalanceData = {
  companyName: '',
  vatNumber: '',
  period: { from: '', to: '' },
  fixedAssets: {},
  currentAssets: {},
  liabilities: {},
  equity: {},
  revenue: {},
  expenses: {},
  purchases: 0,
};

interface SavedImport {
  id: string;
  name: string;
  file_name: string | null;
  period_from: string | null;
  period_to: string | null;
  created_at: string;
}

export function TrialBalanceAnalysisPage() {
  const { companyId, company } = useCompany();
  const { user } = useAuth();
  const { selectedFiscalYear } = useFiscalYear();
  const { filterByFiscalYear } = useFiscalYearFilter();
  
  // جلب بيانات المبيعات والمصاريف لمقارنة الأرباح
  const { data: sales = [] } = useSales();
  const { data: expenses = [] } = useExpenses();
  
  const [data, setData] = useState<TrialBalanceData>(emptyData);
  const [isExporting, setIsExporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedImports, setSavedImports] = useState<SavedImport[]>([]);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [importName, setImportName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isCalculatingFromSystem, setIsCalculatingFromSystem] = useState(false);
  const [isFixingCogs, setIsFixingCogs] = useState(false);
  
  // حقول إدخال يدوية لحساب الزكاة بدقة
  const [manualCapital, setManualCapital] = useState<number | null>(null);
  const [useManualCapital, setUseManualCapital] = useState(false);

  // بيانات التحقق من المطابقة
  const emptyReconciliation: ReconciliationData = {
    originalTotalDebit: 0,
    originalTotalCredit: 0,
    excludedAccounts: [],
    rawAccounts: [],
  };
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData>(emptyReconciliation);
  const [showReconciliation, setShowReconciliation] = useState(false);
  
  // إجماليات يدوية للمقارنة
  const [manualTotalDebit, setManualTotalDebit] = useState<number | null>(null);
  const [manualTotalCredit, setManualTotalCredit] = useState<number | null>(null);
  const [useManualTotals, setUseManualTotals] = useState(false);
  
  // وضع التعديل اليدوي للقوائم المالية
  const [editMode, setEditMode] = useState(false);
  
  // حساب صافي الربح من تقرير الأرباح (المبيعات - المصاريف)
  const profitReportData = useMemo(() => {
    const filteredSales = filterByFiscalYear(sales, 'sale_date');
    const filteredExpenses = filterByFiscalYear(expenses, 'expense_date');
    
    // الربح الإجمالي من جدول المبيعات
    const totalGrossProfit = filteredSales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0);
    
    // مصاريف السيارات المباعة
    const soldCarIds = filteredSales.map(s => s.car_id);
    const carExpenses = filteredExpenses
      .filter(exp => exp.car_id && soldCarIds.includes(exp.car_id))
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    
    // المصاريف العامة (غير مرتبطة بسيارات)
    const generalExpenses = filteredExpenses
      .filter(exp => !exp.car_id)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    
    // صافي الربح حسب تقرير الأرباح
    const netProfit = totalGrossProfit - carExpenses - generalExpenses;
    
    return {
      totalGrossProfit,
      carExpenses,
      generalExpenses,
      netProfit,
    };
  }, [sales, expenses, filterByFiscalYear]);
  
  // إصلاح القيود الناقصة
  const handleFixMissingCogs = async () => {
    if (!companyId) return;
    
    setIsFixingCogs(true);
    try {
      const { data: result, error } = await supabase.rpc('fix_missing_cogs_entries');
      
      if (error) throw error;
      
      const fixedCount = result?.filter((r: any) => r.fixed).length || 0;
      if (fixedCount > 0) {
        toast.success(`تم إصلاح ${fixedCount} قيد محاسبي`);
        // إعادة حساب من النظام
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

  // حساب من بيانات النظام
  const handleCalculateFromSystem = async () => {
    if (!companyId) {
      toast.error('يرجى اختيار الشركة أولاً');
      return;
    }

    setIsCalculatingFromSystem(true);
    try {
      const startDate = selectedFiscalYear?.start_date;
      const endDate = selectedFiscalYear?.end_date;
      
      const systemData = await getSystemTrialBalance(companyId, startDate, endDate);

      // تحويل البيانات إلى تنسيق TrialBalanceData
      const result: TrialBalanceData = {
        companyName: company?.name || '',
        vatNumber: '',
        period: { 
          from: startDate || '', 
          to: endDate || '' 
        },
        fixedAssets: {},
        currentAssets: {},
        liabilities: {},
        equity: {},
        revenue: {},
        expenses: {},
        purchases: 0,
      };

      // تحويل الحسابات إلى التصنيفات المناسبة من القيود المحاسبية
      systemData.accounts.forEach(acc => {
        const balance = acc.closingDebit - acc.closingCredit;
        const absBalance = Math.abs(balance);
        if (absBalance === 0) return;

        // تصنيف الحسابات بناءً على النوع
        switch (acc.type) {
          case 'assets':
            if (acc.code.startsWith('11') || acc.code.startsWith('12') || acc.code.startsWith('13')) {
              result.currentAssets[acc.name] = balance > 0 ? balance : 0;
            } else {
              result.fixedAssets[acc.name] = balance > 0 ? balance : 0;
            }
            break;
          case 'liabilities':
            result.liabilities[acc.name] = balance < 0 ? Math.abs(balance) : balance;
            break;
          case 'equity':
            result.equity[acc.name] = balance < 0 ? Math.abs(balance) : balance;
            break;
          case 'revenue':
            result.revenue[acc.name] = balance < 0 ? Math.abs(balance) : balance;
            break;
          case 'expenses':
            // تكلفة البضاعة المباعة من حساب 5101 (مسجلة من القيود الآلية)
            if (acc.code.startsWith('51') || acc.name.includes('تكلفة') || acc.name.includes('مشتريات')) {
              result.purchases += balance > 0 ? balance : 0;
            } else {
              result.expenses[acc.name] = balance > 0 ? balance : 0;
            }
            break;
        }
      });

      // بناء بيانات ميزان المراجعة الشامل مع الحسابات الرئيسية من قاعدة البيانات
      // جلب جميع الحسابات (بما فيها الرئيسية التي ليس لها حركة مباشرة)
      const { data: allDbAccounts } = await supabase
        .from('account_categories')
        .select('id, code, name, type, parent_id')
        .eq('company_id', companyId)
        .order('code', { ascending: true });

      const dbAccounts = allDbAccounts || [];
      
      // تحديد الحسابات الفرعية (التي لها حركة فعلية)
      const leafAccountCodes = new Set(systemData.accounts.map(a => a.code));
      
      // تحديد الحسابات الرئيسية (التي لديها أطفال)
      const parentIds = new Set(dbAccounts.filter(a => a.parent_id).map(a => a.parent_id));
      
      // بناء خريطة الحسابات بالـ ID
      const accountByIdMap = new Map(dbAccounts.map(a => [a.id, a]));
      
      // بناء الحسابات الفرعية مع بياناتها
      const leafAccounts: AccountData[] = systemData.accounts.map(acc => ({
        code: acc.code,
        name: acc.name,
        openingDebit: acc.openingDebit,
        openingCredit: acc.openingCredit,
        movementDebit: acc.movementDebit,
        movementCredit: acc.movementCredit,
        closingDebit: acc.closingDebit,
        closingCredit: acc.closingCredit,
        category: categorizeAccountByCode(acc.code, acc.name),
      }));

      // بناء الحسابات الرئيسية من قاعدة البيانات (بتجميع أرصدة الأبناء)
      const parentMap = new Map<string, AccountData>();
      
      // لكل حساب فرعي له حركة، صعّد الأرصدة لجميع الآباء
      systemData.accounts.forEach(acc => {
        // ابحث عن الحساب في قاعدة البيانات
        const dbAcc = dbAccounts.find(a => a.code === acc.code);
        if (!dbAcc) return;
        
        // صعّد لكل أب في السلسلة
        let currentParentId = dbAcc.parent_id;
        while (currentParentId) {
          const parentAcc = accountByIdMap.get(currentParentId);
          if (!parentAcc) break;
          
          const existing = parentMap.get(parentAcc.code);
          if (existing) {
            existing.openingDebit += acc.openingDebit;
            existing.openingCredit += acc.openingCredit;
            existing.movementDebit += acc.movementDebit;
            existing.movementCredit += acc.movementCredit;
          } else {
            parentMap.set(parentAcc.code, {
              code: parentAcc.code,
              name: parentAcc.name,
              openingDebit: acc.openingDebit,
              openingCredit: acc.openingCredit,
              movementDebit: acc.movementDebit,
              movementCredit: acc.movementCredit,
              closingDebit: 0,
              closingCredit: 0,
              category: 'حساب رئيسي',
            });
          }
          
          currentParentId = parentAcc.parent_id;
        }
      });

      // دمج الحسابات الرئيسية والفرعية وترتيبها
      const allAccounts = [...leafAccounts];
      parentMap.forEach((parentAcc) => {
        // حساب صافي الرصيد للحساب الرئيسي
        const netBalance = (parentAcc.openingDebit + parentAcc.movementDebit) - (parentAcc.openingCredit + parentAcc.movementCredit);
        parentAcc.closingDebit = netBalance > 0 ? netBalance : 0;
        parentAcc.closingCredit = netBalance < 0 ? Math.abs(netBalance) : 0;
        allAccounts.push(parentAcc);
      });
      
      // ترتيب شجري: حسب الكود كنص لضمان ظهور الأب ثم أبناءه (1, 11, 110, 1102...)
      allAccounts.sort((a, b) => a.code.localeCompare(b.code));

      setData(result);
      setReconciliationData({
        originalTotalDebit: systemData.totals.closingDebit,
        originalTotalCredit: systemData.totals.closingCredit,
        excludedAccounts: [],
        rawAccounts: allAccounts,
      });
      setFileName('بيانات النظام');
      
      toast.success(`تم حساب ميزان المراجعة من النظام (${systemData.accounts.length} حساب)`);
    } catch (error) {
      console.error('Error calculating from system:', error);
      toast.error('فشل حساب ميزان المراجعة من النظام');
    } finally {
      setIsCalculatingFromSystem(false);
    }
  };

  // جلب الملفات المحفوظة
  useEffect(() => {
    if (companyId) {
      fetchSavedImports();
    }
  }, [companyId]);

  const fetchSavedImports = async () => {
    if (!companyId) return;
    
    const { data: imports, error } = await supabase
      .from('trial_balance_imports')
      .select('id, name, file_name, period_from, period_to, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (!error && imports) {
      setSavedImports(imports);
    }
  };

  // حفظ البيانات
  const handleSave = async () => {
    if (!companyId || !user?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!importName.trim()) {
      toast.error('يرجى إدخال اسم للحفظ');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('trial_balance_imports')
        .insert({
          company_id: companyId,
          name: importName.trim(),
          file_name: fileName,
          period_from: data.period.from || null,
          period_to: data.period.to || null,
          vat_number: data.vatNumber || null,
          data: data as any,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('تم حفظ البيانات بنجاح');
      setImportName('');
      fetchSavedImports();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('فشل حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  // تحميل بيانات محفوظة
  const loadSavedImport = async (importId: string) => {
    const { data: importData, error } = await supabase
      .from('trial_balance_imports')
      .select('*')
      .eq('id', importId)
      .single();

    if (error || !importData) {
      toast.error('فشل تحميل البيانات');
      return;
    }

    setData(importData.data as unknown as TrialBalanceData);
    setFileName(importData.file_name);
    setSelectedImportId(importId);
    toast.success('تم تحميل البيانات');
  };

  // حذف بيانات محفوظة
  const deleteSavedImport = async (importId: string) => {
    const { error } = await supabase
      .from('trial_balance_imports')
      .delete()
      .eq('id', importId);

    if (error) {
      toast.error('فشل الحذف');
      return;
    }

    toast.success('تم الحذف');
    if (selectedImportId === importId) {
      setSelectedImportId(null);
      setData(emptyData);
      setFileName(null);
    }
    fetchSavedImports();
  };

  // معالجة الصورة/سكرين شوت بالذكاء الاصطناعي
  const processImageWithAI = async (file: File) => {
    setIsAiProcessing(true);
    try {
      // تحويل الصورة إلى Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // إزالة prefix (data:image/png;base64,)
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      toast.info('جاري تحليل الصورة بالذكاء الاصطناعي...');

      // إرسال للـ Edge Function
      const { data: response, error } = await supabase.functions.invoke('parse-trial-balance', {
        body: { 
          imageBase64: base64,
          fileType: file.type.includes('pdf') ? 'pdf' : 'image'
        }
      });

      if (error) {
        throw error;
      }

      if (!response.success) {
        throw new Error(response.error || 'فشل التحليل');
      }

      const accounts = response.accounts as Array<{
        accountCode: string;
        accountName: string;
        openingDebit: number;
        openingCredit: number;
        movementDebit: number;
        movementCredit: number;
        closingDebit: number;
        closingCredit: number;
      }>;

      console.log('AI extracted accounts:', accounts);

      if (accounts.length === 0) {
        toast.error('لم يتم العثور على حسابات في الصورة');
        return;
      }

      // تحويل الحسابات المستخرجة إلى تنسيق النظام
      const rawAccounts: AccountData[] = accounts.map(acc => ({
        code: acc.accountCode,
        name: acc.accountName,
        openingDebit: acc.openingDebit,
        openingCredit: acc.openingCredit,
        movementDebit: acc.movementDebit,
        movementCredit: acc.movementCredit,
        closingDebit: acc.closingDebit,
        closingCredit: acc.closingCredit,
        category: categorizeAccountByCode(acc.accountCode, acc.accountName),
      }));

      // تصنيف الحسابات
      const result: TrialBalanceData = {
        companyName: '',
        vatNumber: '',
        period: { from: '', to: '' },
        fixedAssets: {},
        currentAssets: {},
        liabilities: {},
        equity: {},
        revenue: {},
        expenses: {},
        purchases: 0,
      };

      rawAccounts.forEach(acc => {
        const balance = (acc.closingDebit || 0) - (acc.closingCredit || 0);
        const absBalance = Math.abs(balance);
        if (absBalance === 0) return;

        switch (acc.category) {
          case 'أصول ثابتة':
            result.fixedAssets[acc.name] = absBalance;
            break;
          case 'أصول متداولة':
            result.currentAssets[acc.name] = absBalance;
            break;
          case 'خصوم':
            result.liabilities[acc.name] = absBalance;
            break;
          case 'حقوق ملكية':
            result.equity[acc.name] = absBalance;
            break;
          case 'إيرادات':
            result.revenue[acc.name] = absBalance;
            break;
          case 'مصروفات':
            result.expenses[acc.name] = absBalance;
            break;
        }
      });

      // حساب الإجماليات
      let totalDebit = 0;
      let totalCredit = 0;
      rawAccounts.forEach(acc => {
        totalDebit += acc.closingDebit || 0;
        totalCredit += acc.closingCredit || 0;
      });

      setData(result);
      setReconciliationData({
        originalTotalDebit: totalDebit,
        originalTotalCredit: totalCredit,
        excludedAccounts: [],
        rawAccounts,
      });
      setFileName(file.name + ' (AI)');
      
      toast.success(`تم استخراج ${accounts.length} حساب بنجاح!`);
    } catch (error: any) {
      console.error('AI processing error:', error);
      toast.error('فشل التحليل بالذكاء الاصطناعي: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsAiProcessing(false);
    }
  };

  // دالة تصنيف الحساب (متوافقة مع مداد ERP)
  // هيكل مداد: 1=أصول، 2=خصوم+حقوق ملكية، 3=إيرادات، 4=مصروفات/مشتريات
  const categorizeAccountByCode = (code: string, name: string): string => {
    const lowerName = name.toLowerCase();
    
    // تصنيف بناءً على كود الحساب في مداد
    if (code.startsWith('1')) {
      // 11xx, 15xx - أصول ثابتة
      if (code.startsWith('11') || code.startsWith('110') || code.startsWith('15')) {
        return 'أصول ثابتة';
      }
      // 12xx, 13xx, 14xx - أصول متداولة
      return 'أصول متداولة';
    }
    
    if (code.startsWith('2')) {
      // 25xx - حقوق ملكية
      if (code.startsWith('25')) return 'حقوق ملكية';
      // باقي 2xxx - خصوم
      return 'خصوم';
    }
    
    // 3xxx - إيرادات
    if (code.startsWith('3')) return 'إيرادات';
    
    // 4xxx - مصروفات
    if (code.startsWith('4')) return 'مصروفات';
    
    // 5xxx, 6xxx - مصروفات إضافية
    if (code.startsWith('5') || code.startsWith('6')) return 'مصروفات';
    
    // تصنيف بناءً على الاسم
    if (lowerName.includes('أثاث') || lowerName.includes('معدات') || lowerName.includes('مباني') || lowerName.includes('أجهز')) return 'أصول ثابتة';
    if (lowerName.includes('بنك') || lowerName.includes('نقد') || lowerName.includes('صندوق') || lowerName.includes('عملاء') || lowerName.includes('عهد') || lowerName.includes('مدفوع مقدم')) return 'أصول متداولة';
    if (lowerName.includes('موردين') || lowerName.includes('دائن') || lowerName.includes('ضريبة') || lowerName.includes('مستحق')) return 'خصوم';
    if (lowerName.includes('رأس المال') || lowerName.includes('جاري') || lowerName.includes('أرباح محتجزة') || lowerName.includes('حقوق')) return 'حقوق ملكية';
    if (lowerName.includes('مبيعات') || lowerName.includes('إيراد')) return 'إيرادات';
    if (lowerName.includes('مصروف') || lowerName.includes('مصاريف') || lowerName.includes('رواتب') || lowerName.includes('إيجار')) return 'مصروفات';
    
    return 'أصول متداولة'; // افتراضي
  };

  // معالجة رفع الصورة
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // التحقق من نوع الملف
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('يرجى رفع صورة أو ملف PDF');
      return;
    }
    
    processImageWithAI(file);
    
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // تحليل ملف Excel
  const parseExcelFile = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = await read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // IMPORTANT: defval keeps empty cells so column positions don't shift
        const jsonData = utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
        }) as any[][];

        console.log('Excel rows count:', jsonData.length);
        
        // استخراج البيانات من ميزان المراجعة
        const { data: parsedData, reconciliation } = parseTrialBalance(jsonData);
        
        console.log('Parsed data:', parsedData);
        console.log('Reconciliation:', reconciliation);
        
        setData(parsedData);
        setReconciliationData(reconciliation);
        setFileName(file.name);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('حدث خطأ في قراءة الملف. تأكد من أنه ملف Excel صالح.');
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // تحليل بيانات ميزان المراجعة مع بيانات التحقق
  const parseTrialBalance = (rows: any[][]): { data: TrialBalanceData; reconciliation: ReconciliationData } => {
    const result: TrialBalanceData = {
      companyName: '',
      vatNumber: '',
      period: { from: '', to: '' },
      fixedAssets: {},
      currentAssets: {},
      liabilities: {},
      equity: {},
      revenue: {},
      expenses: {},
      purchases: 0,
    };

    const reconciliation: ReconciliationData = {
      originalTotalDebit: 0,
      originalTotalCredit: 0,
      excludedAccounts: [],
      rawAccounts: [],
    };

    // === منطق جديد: تحديد الحسابات الرئيسية من أرقام الحسابات ===
    // الحسابات الرئيسية = أكواد قصيرة (1-2 رقم مثل 1، 11، 2، 21)
    // الحسابات الفرعية = أكواد أطول (3+ أرقام مثل 1101، 2101)
    
    // أنماط العناوين والإجماليات النصية (للاستبعاد)
    const headerPatterns = [
      'إجمالي', 'اجمالي', 'مجموع', 'صافي', 'total',
      'أولاً', 'ثانياً', 'ثالثاً', 'رابعاً'
    ];

    // تتبع المبالغ المستخدمة في كل فئة لتجنب التكرار
    const usedAmounts: { [category: string]: Set<number> } = {
      fixedAssets: new Set(),
      currentAssets: new Set(),
      liabilities: new Set(),
      equity: new Set(),
      revenue: new Set(),
      expenses: new Set(),
    };
    
    // دالة لتحديد نوع الحساب بناءً على رقم الحساب
    const getAccountType = (code: string): 'main' | 'sub' | 'none' => {
      if (!code || !/^\d+$/.test(code)) return 'none';
      
      const codeLength = code.length;
      // الحسابات الرئيسية: 1-2 رقم (مثل 1، 11، 2، 21)
      if (codeLength <= 2) return 'main';
      // الحسابات الفرعية: 3+ أرقام (مثل 1101، 2101، 11011)
      return 'sub';
    };
   
    // دالة للتحقق من الحساب الرئيسي بناءً على رقم الحساب
    const isMainAccount = (code: string): boolean => {
      return getAccountType(code) === 'main';
    };
    
    // دالة للتحقق من الحساب الفرعي
    const isSubAccount = (code: string): boolean => {
      return getAccountType(code) === 'sub';
    };
   
    // دالة للتحقق من عناوين الأقسام والإجماليات (بدون رقم حساب)
    const isSectionHeader = (name: string, code: string): boolean => {
      // إذا لا يوجد رقم حساب، نتحقق من النص
      if (!code || !/^\d+$/.test(code)) {
        if (!name || name.trim().length === 0) return true;
        const trimmedName = name.trim();
        
        // استبعاد الأسماء التي تنتهي بـ ":"
        if (trimmedName.endsWith(':')) return true;
        
        // استبعاد الإجماليات والعناوين النصية
        const lowerName = trimmedName.toLowerCase();
        return headerPatterns.some(pattern => lowerName.includes(pattern.toLowerCase()));
      }
      return false;
    };

    // دالة لإضافة حساب مع التحقق الصارم من التكرار
    const addAccount = (
      category: { [key: string]: number }, 
      categoryName: string,
      name: string, 
      amount: number
    ): { added: boolean; reason?: string } => {
      // تحقق أساسي
      if (!name || amount === 0) {
        return { added: false, reason: 'مبلغ صفر' };
      }
      
      // لا نتحقق من العنوان هنا، ستتم الفلترة قبل الاستدعاء
      
      // تحقق من وجود حساب بنفس الاسم
      if (category[name] !== undefined) {
        console.log(`❌ استبعاد: ${name} - ${amount.toFixed(2)} - سبب: حساب مكرر بنفس الاسم`);
        return { added: false, reason: 'حساب مكرر بنفس الاسم' };
      }
      
      // لا نتحقق من تكرار المبلغ - فقط الاسم
      
      // إضافة الحساب
      const finalAmount = Math.abs(amount);
      category[name] = finalAmount;
      
      const roundedAmount = Math.round(finalAmount * 100) / 100;
      usedAmounts[categoryName]?.add(roundedAmount);
      
      console.log(`✅ تم إضافة: ${name} -> ${finalAmount.toFixed(2)} في فئة: ${categoryName}`);
      return { added: true };
    };

    // دالة لتصنيف الحساب بناءً على الكود والاسم - متوافق مع مداد ERP
    // هيكل مداد: 1=أصول، 2=خصوم+حقوق ملكية، 3=إيرادات، 4=مصروفات/مشتريات
    const categorizeAccount = (code: string, name: string): string => {
      const lowerName = name.toLowerCase();
      const trimmedName = name.trim();
      
      // === تصنيف بناءً على كود الحساب في مداد ===
      
      // 1xxx - الأصول
      if (code.startsWith('1')) {
        // 11xx - الأصول الثابتة (صافي الأصول الثابتة، أثاث، أجهزة)
        if (code.startsWith('11') || code.startsWith('110') || code.startsWith('15')) {
          return 'أصول ثابتة';
        }
        // 12xx, 13xx, 14xx - الأصول المتداولة (بنوك، عهد، إيجار مدفوع مقدماً)
        return 'أصول متداولة';
      }
      
      // 2xxx - الخصوم وحقوق الملكية
      if (code.startsWith('2')) {
        // 25xx - حقوق الملكية (جاري المالك، جاري الشريك)
        if (code.startsWith('25')) {
          return 'حقوق ملكية';
        }
        // 21xx, 22xx, 23xx, 24xx - الخصوم (رواتب مستحقة، ضريبة القيمة المضافة)
        return 'خصوم';
      }
      
      // 3xxx - الإيرادات (المبيعات)
      if (code.startsWith('3')) {
        return 'إيرادات';
      }
      
      // 4xxx - المصروفات والمشتريات
      if (code.startsWith('4')) {
        // 45xx - المشتريات (تكلفة البضاعة المباعة)
        if (code.startsWith('45')) {
          return 'مشتريات';
        }
        // 41xx - المصاريف العمومية والإدارية
        // 44xx - مصاريف التشغيل
        return 'مصروفات';
      }
      
      // 5xxx - مصروفات إضافية (في بعض الأنظمة)
      if (code.startsWith('5') || code.startsWith('6')) {
        return 'مصروفات';
      }
      
      // === تصنيف بناءً على اسم الحساب (fallback) ===
      
      // الأصول الثابتة
      if (lowerName.includes('أثاث') || lowerName.includes('أجهز') || 
          lowerName.includes('معدات') || lowerName.includes('سيارات') || 
          lowerName.includes('مباني') || lowerName.includes('عقار') ||
          lowerName.includes('صافي الأصول الثابتة') ||
          lowerName.includes('مجمع استهلاك') || lowerName.includes('مجمع الاستهلاك')) {
        return 'أصول ثابتة';
      }
      
      // الأصول المتداولة
      if (lowerName.includes('بنك') || lowerName.includes('مصرف') ||
          lowerName.includes('عهد') || lowerName.includes('عهدة') ||
          lowerName.includes('مدفوع مقدم') || lowerName.includes('إيجار مدفوع') ||
          lowerName.includes('ايجار مدفوع') ||
          lowerName.includes('نقد') || lowerName.includes('صندوق') || 
          lowerName.includes('ذمم مدين') || lowerName.includes('حسابات مدينة') ||
          lowerName.includes('مخزون') || lowerName.includes('بضاعة') ||
          lowerName.includes('عملاء') || lowerName.includes('زبائن') ||
          lowerName.includes('اطراف ذات علاقه') || lowerName.includes('أطراف ذات علاقة')) {
        return 'أصول متداولة';
      }
      
      // حقوق الملكية
      if (lowerName.includes('رأس المال') || lowerName.includes('راس المال') || 
          lowerName.includes('جاري الشريك') || lowerName.includes('جاري المالك') || 
          lowerName.includes('جاري فلاح') || lowerName.includes('جاري شريك') ||
          lowerName.includes('حقوق الملكية') || lowerName.includes('حقوق ملكية') ||
          lowerName.includes('احتياطي') || lowerName.includes('أرباح محتجزة') ||
          lowerName.includes('أرباح مبقاة') || lowerName.includes('أرباح مرحلة')) {
        return 'حقوق ملكية';
      }
      
      // الخصوم
      if (lowerName.includes('دائن') || lowerName.includes('دائنة') || 
          lowerName.includes('رواتب مستحق') || lowerName.includes('مستحقة') ||
          lowerName.includes('موردين') || lowerName.includes('موردون') ||
          lowerName.includes('ضريبة') || lowerName.includes('ضرائب') ||
          lowerName.includes('ضريبة المخرجات') || lowerName.includes('ضريبة المدخلات') ||
          lowerName.includes('قرض') || lowerName.includes('دائنون') ||
          lowerName.includes('مصاريف مستحقة') || lowerName.includes('التزام') ||
          lowerName.includes('أرصدة دائنة')) {
        return 'خصوم';
      }
      
      // الإيرادات
      if (lowerName.includes('مبيعات') || lowerName.includes('إيراد') || 
          lowerName.includes('ايراد') || lowerName.includes('الإيرادات')) {
        return 'إيرادات';
      }
      
      // المشتريات
      if (lowerName.includes('مشتريات') || lowerName.includes('تكلفة البضاعة')) {
        return 'مشتريات';
      }
      
      // المصروفات
      if (lowerName.includes('مصروف') || lowerName.includes('مصاريف') || 
          lowerName.includes('رواتب') && !lowerName.includes('مستحق') ||
          lowerName.includes('إيجار') || lowerName.includes('ايجار') ||
          lowerName.includes('نظاف') || lowerName.includes('ضيافة') ||
          lowerName.includes('لوازم مكتبية') || lowerName.includes('متنوعة') ||
          lowerName.includes('استهلاك') || lowerName.includes('صيانة')) {
        return 'مصروفات';
      }
      
      console.log('⚠️ غير مصنف:', name, 'Code:', code);
      return 'غير مصنف';
    };

    // === المرحلة الأولى: استخراج جميع الحسابات الخام وحساب الإجماليات الأصلية ===
    // نحدد الأعمدة من ترويسة الجدول حتى لا نعتمد على ترتيب ثابت.
    type ColumnMap = {
      headerRowIndex: number;
      nameCol?: number;
      codeCol?: number;
      openingDebit?: number;
      openingCredit?: number;
      movementDebit?: number;
      movementCredit?: number;
      closingDebit?: number;
      closingCredit?: number;
    };

    const normalize = (v: any) => String(v ?? '').trim();

    const parseCellNumber = (v: any): number => {
      if (typeof v === 'number' && !isNaN(v)) return v;
      if (typeof v !== 'string') return 0;
      const s = v.trim();
      if (!s) return 0;
      const negative = s.includes('(') && s.includes(')');
      const cleaned = s
        .replace(/[()]/g, '')
        .replace(/,/g, '')
        .replace(/\s/g, '')
        .replace(/[^ -\u007F\d.-]/g, '');
      const num = parseFloat(cleaned);
      if (isNaN(num)) return 0;
      return negative ? -num : num;
    };

    const detectColumnMap = (allRows: any[][]): ColumnMap => {
      const maxScan = Math.min(allRows.length, 40);

      const isOpeningLabel = (t: string) =>
        t.includes('الرصيد السابق') || t.includes('رصيد سابق') || t.includes('افتتاح') || t.includes('بداية');
      const isMovementLabel = (t: string) =>
        t.includes('الحركة') || t.includes('حركة') || t.includes('دوران') || t.includes('المتغير');
      const isClosingLabel = (t: string) =>
        t.includes('الصافي') || t.includes('الختامي') || t.includes('الرصيد الختامي') || t.includes('نهاية') || t.includes('ختامي');

      const map: ColumnMap = { headerRowIndex: 0 };

      // سجّل أول 5 صفوف للتصحيح
      console.log('🔍 أول 10 صفوف في الملف:');
      for (let i = 0; i < Math.min(allRows.length, 10); i++) {
        console.log(`  Row ${i}:`, allRows[i]);
      }

      // 1) ابحث عن صف فيه العناوين الرئيسية (الرصيد السابق/الحركة/الصافي أو مدين/دائن)
      for (let i = 0; i < maxScan; i++) {
        const row = allRows[i];
        if (!row) continue;
        const joined = row.map(normalize).join(' ');
        
        // طريقة 1: بحث عن الأقسام الثلاثة
        if ((joined.includes('الرصيد') || joined.includes('افتتاح') || joined.includes('سابق')) && 
            joined.includes('الحركة') && 
            (joined.includes('الصافي') || joined.includes('الختامي') || joined.includes('ختامي'))) {
          map.headerRowIndex = i;
          console.log(`📌 وُجد صف الترويسة (طريقة 1) في الصف: ${i}`);
          break;
        }
        
        // طريقة 2: بحث عن مدين/دائن متعدد (على الأقل 4 أعمدة رقمية)
        const debitCount = row.filter((c: any) => normalize(c) === 'مدين').length;
        const creditCount = row.filter((c: any) => normalize(c) === 'دائن').length;
        if (debitCount >= 2 && creditCount >= 2) {
          map.headerRowIndex = i;
          console.log(`📌 وُجد صف الترويسة (طريقة 2: مدين/دائن) في الصف: ${i}`);
          break;
        }
      }

      const headerRow = allRows[map.headerRowIndex] || [];
      const subHeaderRow = allRows[map.headerRowIndex + 1] || [];
      
      console.log('📊 صف الترويسة الرئيسي:', headerRow);
      console.log('📊 صف الترويسة الفرعي:', subHeaderRow);

      // 2) اكتشف أعمدة الاسم/الكود من الترويسة
      const nameKeywords = ['اسم الحساب', 'الحساب', 'البيان', 'account', 'description'];
      const codeKeywords = ['رقم الحساب', 'الرمز', 'كود', 'code', 'رقم'];

      const findColByKeywords = (rowA: any[], rowB: any[], keywords: string[]) => {
        const maxCols = Math.max(rowA.length, rowB.length);
        for (let c = 0; c < maxCols; c++) {
          const t = (normalize(rowA[c]) + ' ' + normalize(rowB[c])).toLowerCase();
          if (keywords.some(k => t.includes(k.toLowerCase()))) return c;
        }
        return undefined;
      };

      map.nameCol = findColByKeywords(headerRow, subHeaderRow, nameKeywords);
      map.codeCol = findColByKeywords(headerRow, subHeaderRow, codeKeywords);

      // 3) ابني خريطة أعمدة المدين/الدائن لكل قسم بالاعتماد على صفين (merged headers)
      const maxCols = Math.max(headerRow.length, subHeaderRow.length);
      let currentSection = '';
      
      for (let c = 0; c < maxCols; c++) {
        const sectionCell = normalize(headerRow[c]);
        if (sectionCell) currentSection = sectionCell;
        const dc = normalize(subHeaderRow[c]);
        const isDebit = dc === 'مدين' || dc.includes('مدين');
        const isCredit = dc === 'دائن' || dc.includes('دائن');

        if (!isDebit && !isCredit) continue;

        // تحقق من القسم الحالي
        if (isOpeningLabel(currentSection)) {
          if (isDebit && map.openingDebit === undefined) map.openingDebit = c;
          if (isCredit && map.openingCredit === undefined) map.openingCredit = c;
        } else if (isMovementLabel(currentSection)) {
          if (isDebit && map.movementDebit === undefined) map.movementDebit = c;
          if (isCredit && map.movementCredit === undefined) map.movementCredit = c;
        } else if (isClosingLabel(currentSection)) {
          if (isDebit && map.closingDebit === undefined) map.closingDebit = c;
          if (isCredit && map.closingCredit === undefined) map.closingCredit = c;
        }
      }

      // 4) Fallback: إذا لم نجد الأعمدة، نفترض ترتيب ثابت بناءً على عدد أعمدة مدين/دائن
      const allDebitCols: number[] = [];
      const allCreditCols: number[] = [];
      for (let c = 0; c < maxCols; c++) {
        const dc = normalize(subHeaderRow[c]);
        if (dc === 'مدين' || dc.includes('مدين')) allDebitCols.push(c);
        if (dc === 'دائن' || dc.includes('دائن')) allCreditCols.push(c);
      }
      
      console.log('📍 أعمدة المدين:', allDebitCols);
      console.log('📍 أعمدة الدائن:', allCreditCols);

      // إذا وجدنا 3 أعمدة مدين و3 دائن، نفترض: سابق، حركة، صافي
      if (allDebitCols.length >= 3 && allCreditCols.length >= 3) {
        if (map.openingDebit === undefined) map.openingDebit = allDebitCols[0];
        if (map.openingCredit === undefined) map.openingCredit = allCreditCols[0];
        if (map.movementDebit === undefined) map.movementDebit = allDebitCols[1];
        if (map.movementCredit === undefined) map.movementCredit = allCreditCols[1];
        if (map.closingDebit === undefined) map.closingDebit = allDebitCols[2];
        if (map.closingCredit === undefined) map.closingCredit = allCreditCols[2];
      } else if (allDebitCols.length >= 2 && allCreditCols.length >= 2) {
        // عمودين فقط: حركة + صافي أو سابق + صافي
        if (map.closingDebit === undefined) map.closingDebit = allDebitCols[allDebitCols.length - 1];
        if (map.closingCredit === undefined) map.closingCredit = allCreditCols[allCreditCols.length - 1];
        if (map.openingDebit === undefined) map.openingDebit = allDebitCols[0];
        if (map.openingCredit === undefined) map.openingCredit = allCreditCols[0];
      } else if (allDebitCols.length >= 1 && allCreditCols.length >= 1) {
        // عمود واحد فقط
        if (map.closingDebit === undefined) map.closingDebit = allDebitCols[0];
        if (map.closingCredit === undefined) map.closingCredit = allCreditCols[0];
      }

      console.log('🧭 Trial Balance column map:', map);
      return map;
    };

    const colMap = detectColumnMap(rows);
    const startDataRow = Math.max(0, (colMap.headerRowIndex || 0) + 2);
    
    console.log(`📈 بدء قراءة البيانات من الصف: ${startDataRow}`);
    console.log(`📈 إجمالي الصفوف: ${rows.length}`);

    for (let i = startDataRow; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // اسم الحساب وكوده (حسب الترويسة إن أمكن)
      let accountName = '';
      let accountCode = '';

      if (colMap.nameCol !== undefined) {
        accountName = normalize(row[colMap.nameCol]);
      }
      if (colMap.codeCol !== undefined) {
        const codeCandidate = normalize(row[colMap.codeCol]);
        if (/^\d+$/.test(codeCandidate)) accountCode = codeCandidate;
      }

      // fallback: ابحث عن اسم نصي وعن كود رقمي في الصف
      if (!accountName) {
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          const s = normalize(cell);
          if (s.length > 2 && !/^\d+(\.\d+)?$/.test(s) && !s.includes('مدين') && !s.includes('دائن')) {
            accountName = s;
            break;
          }
        }
      }
      if (!accountCode) {
        for (let j = row.length - 1; j >= 0; j--) {
          const s = normalize(row[j]);
          if (/^\d+$/.test(s)) {
            accountCode = s;
            break;
          }
        }
      }

      const openingDebit = Math.abs(parseCellNumber(colMap.openingDebit !== undefined ? row[colMap.openingDebit] : 0));
      const openingCredit = Math.abs(parseCellNumber(colMap.openingCredit !== undefined ? row[colMap.openingCredit] : 0));
      const movementDebit = Math.abs(parseCellNumber(colMap.movementDebit !== undefined ? row[colMap.movementDebit] : 0));
      const movementCredit = Math.abs(parseCellNumber(colMap.movementCredit !== undefined ? row[colMap.movementCredit] : 0));
      const closingDebit = Math.abs(parseCellNumber(colMap.closingDebit !== undefined ? row[colMap.closingDebit] : 0));
      const closingCredit = Math.abs(parseCellNumber(colMap.closingCredit !== undefined ? row[colMap.closingCredit] : 0));

      const hasAnyValue =
        openingDebit > 0 || openingCredit > 0 || movementDebit > 0 || movementCredit > 0 || closingDebit > 0 || closingCredit > 0;

      if (!accountName || !hasAnyValue) continue;

      const isHeader = isSectionHeader(accountName, accountCode);
      const isMain = isMainAccount(accountCode);
      const isSub = isSubAccount(accountCode);

      let accountCategory = 'غير مصنف';
      if (isHeader) {
        accountCategory = 'عنوان قسم';
      } else if (isMain) {
        accountCategory = 'حساب رئيسي';
      } else if (isSub) {
        accountCategory = categorizeAccount(accountCode, accountName);
      }

      reconciliation.rawAccounts.push({
        code: accountCode,
        name: accountName,
        openingDebit,
        openingCredit,
        movementDebit,
        movementCredit,
        closingDebit,
        closingCredit,
        category: accountCategory,
      });

      // إجماليات الملف (من الصافي فقط)
      if (accountCode.length >= 3 && /^\d+$/.test(accountCode) && !isHeader) {
        reconciliation.originalTotalDebit += closingDebit;
        reconciliation.originalTotalCredit += closingCredit;
      }
    }
    
    console.log(`📊 إجمالي الحسابات الفرعية: مدين: ${reconciliation.originalTotalDebit.toFixed(2)} | دائن: ${reconciliation.originalTotalCredit.toFixed(2)}`);
    
    // === المرحلة الثانية: استخراج البيانات الأساسية (من الصفوف الأولى) ===
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // استخراج اسم الشركة
      const firstCell = String(row[0] || '').trim();
      if (firstCell && !result.companyName && firstCell.length > 5) {
        result.companyName = firstCell;
      }

      // البحث عن الرقم الضريبي
      const rowStr = row.join(' ');
      const vatMatch = rowStr.match(/3\d{14}/);
      if (vatMatch) {
        result.vatNumber = vatMatch[0];
      }

      // البحث عن التاريخ
      const dateMatch = rowStr.match(/(\d{4}-\d{2}-\d{2})/g);
      if (dateMatch && dateMatch.length >= 2) {
        result.period.from = dateMatch[0];
        result.period.to = dateMatch[1];
      }
    }

    // === المرحلة الثالثة: تصنيف الحسابات من البيانات المستخرجة ===
    for (const existingData of reconciliation.rawAccounts) {
      const accountName = existingData.name;
      const accountCode = existingData.code;
      
      const debitAmount = existingData.closingDebit;
      const creditAmount = existingData.closingCredit;
      const netAmount = debitAmount - creditAmount;

      // تسجيل تفصيلي لكل حساب
      const isHeader = isSectionHeader(accountName, accountCode);
      const isMain = isMainAccount(accountCode);
      const isSub = isSubAccount(accountCode);
      
      console.log('=== معالجة الحساب ===');
      console.log('اسم الحساب:', accountName);
      console.log('كود الحساب:', accountCode);
      console.log('مدين:', debitAmount);
      console.log('دائن:', creditAmount);
      console.log('الصافي:', netAmount);
      console.log('نوع الحساب:', isMain ? 'رئيسي' : (isSub ? 'فرعي' : 'عنوان'));
      
      // نعالج الحسابات ذات المستوى الثاني (2 رقم) للقوائم المالية
      // مثل: 11 (أصول ثابتة)، 12 (أصول متداولة)، 23 (خصوم)، 25 (حقوق ملكية)، 31 (مبيعات)، 41، 44، 45 (مصروفات)
      if (isHeader) {
        console.log('⏭️ تجاهل: عنوان قسم');
        continue;
      }
      
      // نستخدم الحسابات ذات رقمين (المستوى الثاني) أو أكثر للتفاصيل
      // ونتجاهل الحسابات ذات رقم واحد (1، 2، 3، 4) لأنها إجماليات
      if (accountCode.length === 1) {
        console.log('⏭️ تجاهل: إجمالي رئيسي');
        continue;
      }
      
      // نتجاهل الحسابات التي ليس لها كود صحيح
      if (!accountCode || !/^\d+$/.test(accountCode)) {
        console.log('⏭️ تجاهل: بدون كود');
        continue;
      }

      // تصنيف الحسابات بناءً على رمز الحساب (الأولوية) أو اسم الحساب
      let addResult: { added: boolean; reason?: string } = { added: false };
      
      // استخدام دالة التصنيف الموحدة
      const category = categorizeAccount(accountCode, accountName);
      
      // تحديد المبلغ الصحيح بناءً على نوع الحساب
      // في ميزان المراجعة الشامل، الحسابات الرئيسية تعرض صافي الرصيد
      // نستخدم أكبر قيمة (مدين أو دائن) لأن الحسابات الرئيسية عادة تعرض قيمة واحدة
      let amount = 0;
      
      // للحسابات الرئيسية: نستخدم القيمة الأكبر مباشرة
      const maxAmount = Math.max(debitAmount, creditAmount);
      
      if (category === 'أصول ثابتة' || category === 'أصول متداولة') {
        // الأصول: نستخدم القيمة الأكبر
        amount = maxAmount;
        console.log(`🔵 أصول: ${accountName} | مدين: ${debitAmount} | دائن: ${creditAmount} | القيمة: ${amount}`);
        if (amount > 0) {
          if (category === 'أصول ثابتة') {
            addResult = addAccount(result.fixedAssets, 'fixedAssets', accountName, amount);
          } else {
            addResult = addAccount(result.currentAssets, 'currentAssets', accountName, amount);
          }
        }
      } else if (category === 'خصوم') {
        // الخصوم: نستخدم القيمة الأكبر
        amount = maxAmount;
        console.log(`🔴 خصوم: ${accountName} | مدين: ${debitAmount} | دائن: ${creditAmount} | القيمة: ${amount}`);
        if (amount > 0) {
          addResult = addAccount(result.liabilities, 'liabilities', accountName, amount);
        }
      } else if (category === 'حقوق ملكية') {
        // حقوق الملكية: نستخدم القيمة الأكبر
        amount = maxAmount;
        console.log(`🟡 حقوق ملكية: ${accountName} | مدين: ${debitAmount} | دائن: ${creditAmount} | القيمة: ${amount}`);
        if (amount > 0) {
          addResult = addAccount(result.equity, 'equity', accountName, amount);
        }
      } else if (category === 'إيرادات') {
        // الإيرادات: نستخدم القيمة الأكبر
        amount = maxAmount;
        console.log(`🟢 إيرادات: ${accountName} | مدين: ${debitAmount} | دائن: ${creditAmount} | القيمة: ${amount}`);
        if (amount > 0) {
          addResult = addAccount(result.revenue, 'revenue', accountName, amount);
        }
      } else if (category === 'مشتريات') {
        // المشتريات: نستخدم القيمة الأكبر
        amount = maxAmount;
        console.log(`🟣 مشتريات: ${accountName} | مدين: ${debitAmount} | دائن: ${creditAmount} | القيمة: ${amount}`);
        if (amount > 0 && result.purchases === 0) {
          result.purchases = amount;
          addResult = { added: true };
        }
      } else if (category === 'مصروفات') {
        // المصروفات: نستخدم القيمة الأكبر
        amount = maxAmount;
        console.log(`🟤 مصروفات: ${accountName} | مدين: ${debitAmount} | دائن: ${creditAmount} | القيمة: ${amount}`);
        if (amount > 0) {
          addResult = addAccount(result.expenses, 'expenses', accountName, amount);
        }
      } else {
        console.log(`⚪ غير مصنف: ${accountName} | Code: ${accountCode} | مدين: ${debitAmount} | دائن: ${creditAmount}`);
      }

      // تسجيل الحسابات المستبعدة
      if (!addResult.added && addResult.reason && (debitAmount > 0 || creditAmount > 0)) {
        reconciliation.excludedAccounts.push({
          name: accountName,
          amount: Math.max(debitAmount, creditAmount),
          reason: addResult.reason,
        });
      }
    }

    // إذا لم يتم العثور على أي بيانات، استخدم البيانات الافتراضية
    const hasAnyData = 
      Object.keys(result.fixedAssets).length > 0 ||
      Object.keys(result.currentAssets).length > 0 ||
      Object.keys(result.liabilities).length > 0 ||
      Object.keys(result.equity).length > 0 ||
      Object.keys(result.revenue).length > 0 ||
      Object.keys(result.expenses).length > 0 ||
      result.purchases > 0 ||
      reconciliation.rawAccounts.length > 0;
      
    if (!hasAnyData) {
      console.log('No data found, returning empty');
      return { data: emptyData, reconciliation: emptyReconciliation };
    }

    return { data: result, reconciliation };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      parseExcelFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const clearFile = () => {
    setData(emptyData);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // حسابات القوائم المالية
  const totalFixedAssets = Object.values(data.fixedAssets).reduce((sum, val) => sum + val, 0);
  const totalCurrentAssets = Object.values(data.currentAssets).reduce((sum, val) => sum + val, 0);
  const totalAssets = totalFixedAssets + totalCurrentAssets;

  const totalLiabilities = Object.values(data.liabilities).reduce((sum, val) => sum + val, 0);
  const totalEquity = Object.values(data.equity).reduce((sum, val) => sum + val, 0);

  const totalRevenue = Object.values(data.revenue).reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(data.expenses).reduce((sum, val) => sum + val, 0);
  const costOfSales = data.purchases;
  const grossProfit = totalRevenue - costOfSales;
  const netIncome = grossProfit - totalExpenses;

  const adjustedEquity = totalEquity + netIncome;
  const totalLiabilitiesAndEquity = totalLiabilities + adjustedEquity;

  // حساب الزكاة - طريقة صافي الأصول
  // رأس المال المستخدم في الحساب (يدوي أو من الملف)
 // نستخدم القيمة اليدوية إذا كان الخيار مفعّلاً وتم إدخال قيمة
 const capitalForZakat = (useManualCapital && manualCapital !== null) ? manualCapital : totalEquity;
  
  // الوعاء الزكوي = رأس المال + صافي الربح - الأصول الثابتة - الإيجار المدفوع مقدماً طويل الأجل
  const prepaidRent = data.currentAssets['إيجار مدفوع مقدماً'] || data.currentAssets['ايجار مدفوع مقدما'] || data.currentAssets['ايجار مدفوع مقدماً'] || data.currentAssets['إيجار مدفوع مقدما'] || 0;
  const prepaidRentLongTerm = prepaidRent * (11/12); // الجزء طويل الأجل
  const zakatBase = capitalForZakat + netIncome - totalFixedAssets - prepaidRentLongTerm;
  const zakatDue = zakatBase > 0 ? zakatBase * 0.025 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // دوال تعديل القيم يدوياً
  const updateValue = (
    category: 'fixedAssets' | 'currentAssets' | 'liabilities' | 'equity' | 'revenue' | 'expenses',
    name: string,
    newValue: number
  ) => {
    setData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [name]: newValue
      }
    }));
  };

  const updatePurchases = (newValue: number) => {
    setData(prev => ({ ...prev, purchases: newValue }));
  };

  const addNewAccount = (
    category: 'fixedAssets' | 'currentAssets' | 'liabilities' | 'equity' | 'revenue' | 'expenses'
  ) => {
    const name = prompt('أدخل اسم الحساب الجديد:');
    if (name && name.trim()) {
      setData(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [name.trim()]: 0
        }
      }));
    }
  };

  const deleteAccount = (
    category: 'fixedAssets' | 'currentAssets' | 'liabilities' | 'equity' | 'revenue' | 'expenses',
    name: string
  ) => {
    setData(prev => {
      const newCategory = { ...prev[category] };
      delete newCategory[name];
      return { ...prev, [category]: newCategory };
    });
  };

  // دوال تعديل ميزان المراجعة الشامل
  const updateTrialBalanceAccount = (
    index: number,
    field: keyof AccountData,
    value: string | number
  ) => {
    setReconciliationData(prev => {
      const filteredAccounts = prev.rawAccounts.filter(
        acc => acc.category !== 'عنوان قسم' && acc.category !== 'حساب رئيسي'
      );
      const actualIndex = prev.rawAccounts.findIndex(
        acc => acc === filteredAccounts[index]
      );
      
      if (actualIndex === -1) return prev;
      
      const newAccounts = [...prev.rawAccounts];
      newAccounts[actualIndex] = {
        ...newAccounts[actualIndex],
        [field]: value
      };
      
      // إعادة حساب الإجماليات
      const newTotalDebit = newAccounts
        .filter(acc => acc.category !== 'عنوان قسم' && acc.category !== 'حساب رئيسي')
        .reduce((sum, acc) => sum + (acc.closingDebit || 0), 0);
      const newTotalCredit = newAccounts
        .filter(acc => acc.category !== 'عنوان قسم' && acc.category !== 'حساب رئيسي')
        .reduce((sum, acc) => sum + (acc.closingCredit || 0), 0);
      
      return {
        ...prev,
        rawAccounts: newAccounts,
        originalTotalDebit: newTotalDebit,
        originalTotalCredit: newTotalCredit
      };
    });
  };

  const addNewTrialBalanceAccount = () => {
    const name = prompt('أدخل اسم الحساب الجديد:');
    if (name && name.trim()) {
      setReconciliationData(prev => ({
        ...prev,
        rawAccounts: [
          ...prev.rawAccounts,
          {
            code: '',
            name: name.trim(),
            openingDebit: 0,
            openingCredit: 0,
            movementDebit: 0,
            movementCredit: 0,
            closingDebit: 0,
            closingCredit: 0,
            category: 'حساب فرعي'
          }
        ]
      }));
    }
  };

  const deleteTrialBalanceAccount = (index: number) => {
    setReconciliationData(prev => {
      const filteredAccounts = prev.rawAccounts.filter(
        acc => acc.category !== 'عنوان قسم' && acc.category !== 'حساب رئيسي'
      );
      const actualIndex = prev.rawAccounts.findIndex(
        acc => acc === filteredAccounts[index]
      );
      
      if (actualIndex === -1) return prev;
      
      const newAccounts = prev.rawAccounts.filter((_, i) => i !== actualIndex);
      
      // إعادة حساب الإجماليات
      const newTotalDebit = newAccounts
        .filter(acc => acc.category !== 'عنوان قسم' && acc.category !== 'حساب رئيسي')
        .reduce((sum, acc) => sum + (acc.closingDebit || 0), 0);
      const newTotalCredit = newAccounts
        .filter(acc => acc.category !== 'عنوان قسم' && acc.category !== 'حساب رئيسي')
        .reduce((sum, acc) => sum + (acc.closingCredit || 0), 0);
      
      return {
        ...prev,
        rawAccounts: newAccounts,
        originalTotalDebit: newTotalDebit,
        originalTotalCredit: newTotalCredit
      };
    });
  };

  // حساب إجماليات ميزان المراجعة - كل الأعمدة
  const filteredAccounts = reconciliationData.rawAccounts
    .filter(acc => acc.category !== 'عنوان قسم' && acc.category !== 'حساب رئيسي');
  
  const calculatedTotals = {
    openingDebit: filteredAccounts.reduce((sum, acc) => sum + (acc.openingDebit || 0), 0),
    openingCredit: filteredAccounts.reduce((sum, acc) => sum + (acc.openingCredit || 0), 0),
    movementDebit: filteredAccounts.reduce((sum, acc) => sum + (acc.movementDebit || 0), 0),
    movementCredit: filteredAccounts.reduce((sum, acc) => sum + (acc.movementCredit || 0), 0),
    closingDebit: filteredAccounts.reduce((sum, acc) => sum + (acc.closingDebit || 0), 0),
    closingCredit: filteredAccounts.reduce((sum, acc) => sum + (acc.closingCredit || 0), 0),
  };
  
  const calculatedTotalDebit = calculatedTotals.closingDebit;
  const calculatedTotalCredit = calculatedTotals.closingCredit;

  // مكون لعرض قيمة قابلة للتعديل
  const EditableValue = ({ 
    value, 
    onChange, 
    category, 
    name 
  }: { 
    value: number; 
    onChange: (val: number) => void;
    category?: string;
    name?: string;
  }) => {
    if (!editMode) {
      return <span>{formatCurrency(value)}</span>;
    }
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-28 h-7 text-left text-sm"
          step="0.01"
        />
        {category && name && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-destructive"
            onClick={() => deleteAccount(category as any, name)}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  };

  const exportToExcel = async () => {
    setIsExporting(true);

    try {
      const wb = utils.book_new();

      // Sheet 1: قائمة الدخل
      const incomeStatementData = [
        [data.companyName],
        ['قائمة الدخل'],
        [`للسنة المنتهية في ${data.period.to}`],
        [''],
        ['البند', 'المبلغ (ر.س)'],
        ['إيرادات المبيعات', totalRevenue],
        ['(-) تكلفة المبيعات (المشتريات)', -costOfSales],
        ['مجمل الربح / (الخسارة)', grossProfit],
        [''],
        ['المصاريف التشغيلية:'],
        ...Object.entries(data.expenses).map(([name, amount]) => [name, amount]),
        ['إجمالي المصاريف التشغيلية', -totalExpenses],
        [''],
        ['صافي الربح / (الخسارة)', netIncome],
      ];
      const wsIncome = utils.aoa_to_sheet(incomeStatementData);
      utils.book_append_sheet(wb, wsIncome, 'قائمة الدخل');

      // Sheet 2: قائمة المركز المالي
      const balanceSheetData = [
        [data.companyName],
        ['قائمة المركز المالي (الميزانية العمومية)'],
        [`في ${data.period.to}`],
        [''],
        ['الأصول', 'المبلغ (ر.س)'],
        ['الأصول الثابتة:'],
        ...Object.entries(data.fixedAssets).map(([name, amount]) => [name, amount]),
        ['إجمالي الأصول الثابتة', totalFixedAssets],
        [''],
        ['الأصول المتداولة:'],
        ...Object.entries(data.currentAssets).map(([name, amount]) => [name, amount]),
        ['إجمالي الأصول المتداولة', totalCurrentAssets],
        [''],
        ['إجمالي الأصول', totalAssets],
        [''],
        ['الخصوم وحقوق الملكية', 'المبلغ (ر.س)'],
        ['الخصوم المتداولة:'],
        ...Object.entries(data.liabilities).map(([name, amount]) => [name, amount]),
        ['إجمالي الخصوم المتداولة', totalLiabilities],
        [''],
        ['حقوق الملكية:'],
        ...Object.entries(data.equity).map(([name, amount]) => [name, amount]),
        ['صافي الربح / (الخسارة) للفترة', netIncome],
        ['إجمالي حقوق الملكية', adjustedEquity],
        [''],
        ['إجمالي الخصوم وحقوق الملكية', totalLiabilitiesAndEquity],
      ];
      const wsBalance = utils.aoa_to_sheet(balanceSheetData);
      utils.book_append_sheet(wb, wsBalance, 'المركز المالي');

      // Sheet 3: حساب الزكاة
      const zakatData = [
        [data.companyName],
        ['حساب الزكاة الشرعية'],
        [`للسنة المنتهية في ${data.period.to}`],
        [''],
        ['البند', 'المبلغ (ر.س)'],
        ['الوعاء الزكوي:'],
        ['(+) رأس المال المستثمر', totalEquity],
        ['(+/-) صافي الربح / الخسارة', netIncome],
        ['إجمالي مصادر التمويل', totalEquity + netIncome],
        [''],
        ['الحسميات:'],
        ['(-) الأصول الثابتة', -totalFixedAssets],
        ['(-) الإيجار المدفوع مقدماً (طويل الأجل)', -(prepaidRent * 11/12)],
        [''],
        ['الوعاء الزكوي المعدل', zakatBase],
        [''],
        ['نسبة الزكاة', '2.5%'],
        ['الزكاة المستحقة', zakatDue],
      ];
      const wsZakat = utils.aoa_to_sheet(zakatData);
      utils.book_append_sheet(wb, wsZakat, 'حساب الزكاة');

      // تحميل الملف
      const { writeFile } = await import('@/lib/excelUtils');
      await writeFile(wb, `القوائم_المالية_${data.period.to}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  // تصدير PDF
  const exportToPdf = async () => {
    if (!reportRef.current) return;
    
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      // إضافة الصفحة الأولى
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);
      
      // إضافة صفحات إضافية إذا لزم الأمر
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
      }
      
      pdf.save(`تحليل_ميزان_المراجعة_${data.period.to || new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('تم تصدير PDF بنجاح');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('فشل تصدير PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // تصدير ميزان المراجعة فقط إلى Excel
  const exportTrialBalanceToExcel = async () => {
    if (!reconciliationData.rawAccounts.length) {
      toast.error('لا توجد بيانات لتصديرها');
      return;
    }

    try {
      const wb = utils.book_new();

      const headerRows = [
        [data.companyName || company?.name || 'الشركة'],
        ['ميزان المراجعة الشامل (رصيد سابق + حركة + صافي)'],
        [data.period.from && data.period.to ? `الفترة من ${data.period.from} إلى ${data.period.to}` : ''],
        [''],
        ['الرمز', 'اسم الحساب', 'رصيد سابق - مدين', 'رصيد سابق - دائن', 'الحركة - مدين', 'الحركة - دائن', 'الصافي - مدين', 'الصافي - دائن'],
      ];

      const dataRows = reconciliationData.rawAccounts.map(acc => [
        acc.code || '',
        acc.name,
        acc.openingDebit > 0 ? acc.openingDebit : '',
        acc.openingCredit > 0 ? acc.openingCredit : '',
        acc.movementDebit > 0 ? acc.movementDebit : '',
        acc.movementCredit > 0 ? acc.movementCredit : '',
        acc.closingDebit > 0 ? acc.closingDebit : '',
        acc.closingCredit > 0 ? acc.closingCredit : '',
      ]);

      // صف الإجمالي
      const totalsRow = [
        '', 'الإجمالي',
        calculatedTotals.openingDebit || '',
        calculatedTotals.openingCredit || '',
        calculatedTotals.movementDebit || '',
        calculatedTotals.movementCredit || '',
        calculatedTotals.closingDebit || '',
        calculatedTotals.closingCredit || '',
      ];

      const allRows = [...headerRows, ...dataRows, totalsRow];
      const ws = utils.aoa_to_sheet(allRows);

      ws['!cols'] = [
        { wch: 12 }, { wch: 35 },
        { wch: 18 }, { wch: 18 },
        { wch: 18 }, { wch: 18 },
        { wch: 18 }, { wch: 18 },
      ];

      utils.book_append_sheet(wb, ws, 'ميزان المراجعة');

      const { writeFile } = await import('@/lib/excelUtils');
      await writeFile(wb, `ميزان_المراجعة_${data.period.to || new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('تم تصدير ميزان المراجعة بنجاح');
    } catch (error) {
      console.error('Error exporting trial balance:', error);
      toast.error('فشل تصدير ميزان المراجعة');
    }
  };

  // تصدير ميزان المراجعة إلى PDF
  const exportTrialBalanceToPdf = async () => {
    if (!reconciliationData.rawAccounts.length) {
      toast.error('لا توجد بيانات لتصديرها');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      doc.setR2L(true);
      const pageWidth = doc.internal.pageSize.getWidth();
      const mg = 10;

      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(data.companyName || company?.name || 'الشركة', pageWidth - mg, 14, { align: 'right' });
      doc.setFontSize(11);
      doc.text('ميزان المراجعة الشامل (رصيد سابق + حركة + صافي)', pageWidth - mg, 24, { align: 'right' });

      if (data.period.from && data.period.to) {
        doc.setFontSize(9);
        doc.text(`الفترة من ${data.period.from} إلى ${data.period.to}`, mg, 14, { align: 'left' });
      }

      const tableHeaders = ['الرمز', 'اسم الحساب', 'مدين', 'دائن', 'مدين', 'دائن', 'مدين', 'دائن'];
      const tableData = reconciliationData.rawAccounts.map(acc => [
        acc.code || '-',
        acc.name,
        acc.openingDebit > 0 ? formatCurrency(acc.openingDebit) : '-',
        acc.openingCredit > 0 ? formatCurrency(acc.openingCredit) : '-',
        acc.movementDebit > 0 ? formatCurrency(acc.movementDebit) : '-',
        acc.movementCredit > 0 ? formatCurrency(acc.movementCredit) : '-',
        acc.closingDebit > 0 ? formatCurrency(acc.closingDebit) : '-',
        acc.closingCredit > 0 ? formatCurrency(acc.closingCredit) : '-',
      ]);

      tableData.push([
        '', 'الإجمالي',
        formatCurrency(calculatedTotals.openingDebit),
        formatCurrency(calculatedTotals.openingCredit),
        formatCurrency(calculatedTotals.movementDebit),
        formatCurrency(calculatedTotals.movementCredit),
        formatCurrency(calculatedTotals.closingDebit),
        formatCurrency(calculatedTotals.closingCredit),
      ]);

      (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 35,
        margin: { left: mg, right: mg },
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 3, halign: 'center', valign: 'middle' },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        didParseCell: (cellData: any) => {
          if (cellData.row.index === tableData.length - 1) {
            cellData.cell.styles.fillColor = [219, 234, 254];
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fontSize = 9;
          }
        },
      });

      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`صفحة ${i} من ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      }

      doc.save(`ميزان_المراجعة_${data.period.to || new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('تم تصدير PDF بنجاح');
    } catch (error) {
      console.error('Error exporting trial balance PDF:', error);
      toast.error('فشل تصدير PDF');
    }
  };

  // طباعة ميزان المراجعة
  const printTrialBalance = () => {
    if (!reconciliationData.rawAccounts.length) {
      toast.error('لا توجد بيانات للطباعة');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = reconciliationData.rawAccounts.map(acc => {
      const code = acc.code || '';
      const isParent = acc.category === 'عنوان قسم' || acc.category === 'حساب رئيسي';
      const indent = code.length <= 1 ? 0 : code.length <= 2 ? 15 : code.length <= 3 ? 30 : 45;
      return `<tr style="${isParent ? 'font-weight:bold;background:#f0f4ff;' : ''}">
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;font-family:monospace;padding-right:${indent + 8}px">${escapeHtml(code)}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;padding-right:${indent + 8}px">${escapeHtml(acc.name)}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${acc.openingDebit > 0 ? formatCurrency(acc.openingDebit) : '-'}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${acc.openingCredit > 0 ? formatCurrency(acc.openingCredit) : '-'}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${acc.movementDebit > 0 ? formatCurrency(acc.movementDebit) : '-'}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${acc.movementCredit > 0 ? formatCurrency(acc.movementCredit) : '-'}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${acc.closingDebit > 0 ? formatCurrency(acc.closingDebit) : '-'}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${acc.closingCredit > 0 ? formatCurrency(acc.closingCredit) : '-'}</td>
      </tr>`;
    }).join('');

    printWindow.document.write(`<!DOCTYPE html><html dir="rtl"><head>
      <meta charset="UTF-8"><title>ميزان المراجعة</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #3b82f6; color: white; padding: 6px; border: 1px solid #ddd; }
        .header { text-align: center; margin-bottom: 20px; }
        .totals-row td { font-weight: bold; background: #dbeafe; font-size: 12px; }
        @media print { body { margin: 5mm; } }
      </style>
    </head><body>
      <div class="header">
        <h2>${escapeHtml(data.companyName || company?.name || 'الشركة')}</h2>
        <p>ميزان المراجعة الشامل (رصيد سابق + حركة + صافي)</p>
        ${data.period.from && data.period.to ? `<p style="font-size:12px">الفترة من ${data.period.from} إلى ${data.period.to}</p>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            <th rowspan="2">الرمز</th><th rowspan="2">اسم الحساب</th>
            <th colspan="2" style="background:#7c3aed">الرصيد السابق</th>
            <th colspan="2" style="background:#2563eb">الحركة</th>
            <th colspan="2" style="background:#d97706">الصافي</th>
          </tr>
          <tr>
            <th style="background:#8b5cf6">مدين</th><th style="background:#8b5cf6">دائن</th>
            <th style="background:#3b82f6">مدين</th><th style="background:#3b82f6">دائن</th>
            <th style="background:#f59e0b">مدين</th><th style="background:#f59e0b">دائن</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="2" style="text-align:center;border:1px solid #ddd;padding:6px">الإجمالي</td>
            <td style="text-align:center;border:1px solid #ddd;padding:6px">${formatCurrency(calculatedTotals.openingDebit)}</td>
            <td style="text-align:center;border:1px solid #ddd;padding:6px">${formatCurrency(calculatedTotals.openingCredit)}</td>
            <td style="text-align:center;border:1px solid #ddd;padding:6px">${formatCurrency(calculatedTotals.movementDebit)}</td>
            <td style="text-align:center;border:1px solid #ddd;padding:6px">${formatCurrency(calculatedTotals.movementCredit)}</td>
            <td style="text-align:center;border:1px solid #ddd;padding:6px">${formatCurrency(calculatedTotals.closingDebit)}</td>
            <td style="text-align:center;border:1px solid #ddd;padding:6px">${formatCurrency(calculatedTotals.closingCredit)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="text-align:center;font-size:10px;color:#999;margin-top:20px">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
    </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            تحليل ميزان المراجعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* حساب من النظام */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-gradient-to-br from-green-500/5 to-transparent"
              onClick={handleCalculateFromSystem}
            >
              {isCalculatingFromSystem ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground">جاري الحساب من النظام...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Database className="w-10 h-10 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-600 dark:text-green-400">حساب من النظام</p>
                    <p className="text-xs text-muted-foreground">من قيود اليومية المسجلة</p>
                  </div>
                </div>
              )}
            </div>

            {/* رفع ملف Excel */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">جاري تحليل الملف...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileUp className="w-10 h-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">رفع ملف Excel</p>
                    <p className="text-xs text-muted-foreground">xlsx, xls</p>
                  </div>
                </div>
              )}
            </div>

            {/* رفع صورة/سكرين شوت للتحليل بالذكاء الاصطناعي */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-gradient-to-br from-primary/5 to-transparent"
              onClick={() => imageInputRef.current?.click()}
            >
              <Input
                ref={imageInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleImageUpload}
                className="hidden"
              />
              {isAiProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">جاري التحليل بالذكاء الاصطناعي...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Image className="w-8 h-8 text-primary" />
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">رفع صورة أو سكرين شوت</p>
                    <p className="text-xs text-muted-foreground">تحليل ذكي بالـ AI</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* المصدر المحدد */}
          {fileName && (
            <div className="mt-4 flex items-center justify-center gap-3 p-3 bg-muted/50 rounded-lg">
              {fileName === 'بيانات النظام' ? (
                <Database className="w-6 h-6 text-green-600" />
              ) : (
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              )}
              <span className="font-medium">{fileName}</span>
              {selectedFiscalYear && fileName === 'بيانات النظام' && (
                <span className="text-xs text-muted-foreground">({selectedFiscalYear.name})</span>
              )}
              <Button variant="ghost" size="sm" onClick={clearFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Save Section */}
          {fileName && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <Input
                placeholder="اسم الحفظ (مثال: ميزان 2025)"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSave} disabled={isSaving || !importName.trim()} className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          )}

          {/* Saved Imports */}
          {savedImports.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                الملفات المحفوظة:
              </p>
              <div className="flex flex-wrap gap-2">
                {savedImports.map((imp) => (
                  <div
                    key={imp.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedImportId === imp.id ? 'bg-primary/10 border-primary' : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <span
                      onClick={() => loadSavedImport(imp.id)}
                      className="text-sm font-medium"
                    >
                      {imp.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteSavedImport(imp.id); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* قسم التحقق من المطابقة */}
      {fileName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                التحقق من مطابقة ميزان المراجعة
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReconciliation(!showReconciliation)}
              >
                {showReconciliation ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* إجماليات الملف المستخرجة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground">إجمالي المدين (من الملف)</p>
                <p className="text-xl font-bold">{formatCurrency(reconciliationData.originalTotalDebit)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground">إجمالي الدائن (من الملف)</p>
                <p className="text-xl font-bold">{formatCurrency(reconciliationData.originalTotalCredit)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground">عدد الحسابات المستخرجة</p>
                <p className="text-xl font-bold">{reconciliationData.rawAccounts.length}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground">الحسابات المستبعدة (مكررة)</p>
                <p className="text-xl font-bold text-orange-600">{reconciliationData.excludedAccounts.length}</p>
              </div>
            </div>

            {/* إدخال الإجماليات يدوياً للمقارنة */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="useManualTotals"
                  checked={useManualTotals}
                  onChange={(e) => setUseManualTotals(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="useManualTotals" className="font-medium">
                  إدخال إجماليات ميزان المراجعة يدوياً للمقارنة
                </label>
              </div>
              {useManualTotals && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm whitespace-nowrap">إجمالي المدين:</label>
                    <Input
                      type="number"
                      placeholder="من ملف الميزان"
                      value={manualTotalDebit ?? ''}
                      onChange={(e) => setManualTotalDebit(e.target.value ? parseFloat(e.target.value) : null)}
                      className="max-w-[180px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm whitespace-nowrap">إجمالي الدائن:</label>
                    <Input
                      type="number"
                      placeholder="من ملف الميزان"
                      value={manualTotalCredit ?? ''}
                      onChange={(e) => setManualTotalCredit(e.target.value ? parseFloat(e.target.value) : null)}
                      className="max-w-[180px]"
                    />
                  </div>
                </div>
              )}
              {useManualTotals && manualTotalDebit !== null && manualTotalCredit !== null && (
                <div className="mt-4 p-3 rounded-lg border">
                  <p className="font-medium mb-2">نتيجة المقارنة:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">فرق المدين:</p>
                      <p className={`font-bold ${Math.abs(manualTotalDebit - reconciliationData.originalTotalDebit) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(manualTotalDebit - reconciliationData.originalTotalDebit)}
                        {Math.abs(manualTotalDebit - reconciliationData.originalTotalDebit) < 1 && ' ✓ متطابق'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">فرق الدائن:</p>
                      <p className={`font-bold ${Math.abs(manualTotalCredit - reconciliationData.originalTotalCredit) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(manualTotalCredit - reconciliationData.originalTotalCredit)}
                        {Math.abs(manualTotalCredit - reconciliationData.originalTotalCredit) < 1 && ' ✓ متطابق'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* جدول المقارنة التفصيلي */}
            {showReconciliation && (
              <>
                {/* جميع الحسابات المستخرجة */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 p-3 border-b">
                    <h4 className="font-semibold">جميع الحسابات المستخرجة من الملف ({reconciliationData.rawAccounts.length})</h4>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 sticky top-0 z-10">
                        <tr>
                          <th className="p-2 text-center border bg-muted/60 w-20" rowSpan={2}>الرمز</th>
                          <th className="p-2 text-center border bg-muted/60" rowSpan={2}>اسم الحساب</th>
                          <th className="p-2 text-center border bg-purple-100 dark:bg-purple-900/20" colSpan={2}>الرصيد السابق</th>
                          <th className="p-2 text-center border bg-blue-100 dark:bg-blue-900/20" colSpan={2}>الحركة</th>
                          <th className="p-2 text-center border bg-amber-100 dark:bg-amber-900/20" colSpan={2}>الصافي</th>
                        </tr>
                        <tr>
                          <th className="p-1 text-center text-xs border bg-purple-50 dark:bg-purple-900/10">مدين</th>
                          <th className="p-1 text-center text-xs border bg-purple-50 dark:bg-purple-900/10">دائن</th>
                          <th className="p-1 text-center text-xs border bg-blue-50 dark:bg-blue-900/10">مدين</th>
                          <th className="p-1 text-center text-xs border bg-blue-50 dark:bg-blue-900/10">دائن</th>
                          <th className="p-1 text-center text-xs border bg-amber-50 dark:bg-amber-900/10">مدين</th>
                          <th className="p-1 text-center text-xs border bg-amber-50 dark:bg-amber-900/10">دائن</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconciliationData.rawAccounts.map((acc, idx) => {
                          const code = acc.code || '';
                          const firstDigit = code.charAt(0);
                          const isParent = acc.category === 'عنوان قسم' || acc.category === 'حساب رئيسي';
                          const typeColors: Record<string, string> = {
                            '1': 'bg-amber-50/70 dark:bg-amber-950/20',
                            '2': 'bg-rose-50/70 dark:bg-rose-950/20',
                            '3': 'bg-emerald-50/70 dark:bg-emerald-950/20',
                            '4': 'bg-orange-50/70 dark:bg-orange-950/20',
                            '5': 'bg-orange-50/70 dark:bg-orange-950/20',
                          };
                          const isEquity = code.startsWith('25');
                          const rowColor = isEquity ? 'bg-indigo-50/70 dark:bg-indigo-950/20' : (typeColors[firstDigit] || '');
                          const parentStyle = isParent ? 'font-bold border-y-2 border-muted' : '';
                          const indent = code.length <= 1 ? 0 : code.length <= 2 ? 20 : code.length <= 3 ? 40 : 60;

                          return (
                            <tr key={idx} className={`border-b ${rowColor} ${parentStyle}`}>
                              <td className="p-2 font-mono text-center border font-semibold" style={{ paddingRight: `${indent + 8}px` }}>
                                {code || '-'}
                              </td>
                              <td className={`p-2 border ${isParent ? 'font-bold' : ''}`} style={{ paddingRight: `${indent + 8}px` }}>
                                {acc.name}
                              </td>
                              <td className="p-2 text-center border tabular-nums">{acc.openingDebit > 0 ? formatCurrency(acc.openingDebit) : ''}</td>
                              <td className="p-2 text-center border tabular-nums">{acc.openingCredit > 0 ? formatCurrency(acc.openingCredit) : ''}</td>
                              <td className="p-2 text-center border tabular-nums">{acc.movementDebit > 0 ? formatCurrency(acc.movementDebit) : ''}</td>
                              <td className="p-2 text-center border tabular-nums">{acc.movementCredit > 0 ? formatCurrency(acc.movementCredit) : ''}</td>
                              <td className="p-2 text-center border tabular-nums">{acc.closingDebit > 0 ? formatCurrency(acc.closingDebit) : ''}</td>
                              <td className="p-2 text-center border tabular-nums">{acc.closingCredit > 0 ? formatCurrency(acc.closingCredit) : ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-primary/10 font-bold text-base border-t-4 border-primary">
                        <tr>
                          <td className="p-2 text-center border" colSpan={2}>الإجمالي</td>
                          <td className="p-2 text-center border tabular-nums" colSpan={2}>-</td>
                          <td className="p-2 text-center border tabular-nums" colSpan={2}>-</td>
                          <td className="p-2 text-center border tabular-nums">{formatCurrency(reconciliationData.originalTotalDebit)}</td>
                          <td className="p-2 text-center border tabular-nums">{formatCurrency(reconciliationData.originalTotalCredit)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* الحسابات المستبعدة */}
                {reconciliationData.excludedAccounts.length > 0 && (
                  <div className="border rounded-lg overflow-hidden border-orange-200 dark:border-orange-800">
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-3 border-b border-orange-200 dark:border-orange-800">
                      <h4 className="font-semibold text-orange-700 dark:text-orange-400">
                        الحسابات المستبعدة/المكررة ({reconciliationData.excludedAccounts.length})
                      </h4>
                      <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                        هذه الحسابات لم تُضاف للقوائم المالية لتجنب التكرار
                      </p>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-orange-50/50 dark:bg-orange-950/10 sticky top-0">
                          <tr>
                            <th className="p-2 text-right">اسم الحساب</th>
                            <th className="p-2 text-left">المبلغ</th>
                            <th className="p-2 text-right">سبب الاستبعاد</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reconciliationData.excludedAccounts.map((acc, idx) => (
                            <tr key={idx} className="border-b hover:bg-orange-50/30 dark:hover:bg-orange-950/10">
                              <td className="p-2">{acc.name}</td>
                              <td className="p-2 text-left">{formatCurrency(acc.amount)}</td>
                              <td className="p-2">
                                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs">
                                  {acc.reason}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ملخص التحقق */}
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <h4 className="font-semibold mb-3">ملخص التحقق من القوائم المالية:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">إجمالي الأصول</p>
                      <p className="font-bold">{formatCurrency(totalAssets)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">إجمالي الخصوم + حقوق الملكية</p>
                      <p className="font-bold">{formatCurrency(totalLiabilitiesAndEquity)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الفرق</p>
                      <p className={`font-bold ${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totalAssets - totalLiabilitiesAndEquity)}
                        {Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1 && ' ✓'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">حالة التوازن</p>
                      <p className={`font-bold ${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1 ? '✓ متوازن' : '✗ غير متوازن'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{data.companyName}</h1>
          <p className="text-muted-foreground">القوائم المالية للسنة المنتهية في {data.period.to}</p>
          {data.vatNumber && <p className="text-sm text-muted-foreground">الرقم الضريبي: {data.vatNumber}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => setEditMode(!editMode)} 
            variant={editMode ? "default" : "outline"} 
            className="gap-2"
          >
            {editMode ? (
              <>
                <Save className="w-4 h-4" />
                إنهاء التعديل
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                تعديل القيم
              </>
            )}
          </Button>
          <TrialBalanceFormulaEditor 
            currentValues={{
              total_sales: totalRevenue,
              gross_profit_from_sales: grossProfit,
              car_expenses: 0,
              payroll_total: 0,
              rent_expenses: 0,
              general_expenses: totalExpenses,
              capital: totalEquity,
              fixed_assets_net: totalFixedAssets,
              net_profit: netIncome,
              zakat_base: zakatBase,
              zakat_provision: zakatDue,
            }}
          />
          <Button onClick={() => setShowPreview(true)} variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            معاينة
          </Button>
          <Button onClick={exportToPdf} disabled={isExportingPdf} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            {isExportingPdf ? 'جاري التصدير...' : 'تصدير PDF'}
          </Button>
          <Button onClick={exportToExcel} disabled={isExporting} className="gap-2">
            <Download className="w-4 h-4" />
            {isExporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
        </div>
      </div>

      {/* Report Content - للتصدير */}
      <div ref={reportRef} className="space-y-6 bg-background">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">صافي الربح/الخسارة</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(netIncome)}
                </p>
              </div>
              {netIncome >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600/20" />
              ) : (
                <TrendingDown className="w-8 h-8 text-destructive/20" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأصول</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAssets)}</p>
              </div>
              <Building2 className="w-8 h-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الزكاة المستحقة</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(zakatDue)}</p>
              </div>
              <Calculator className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول ميزان المراجعة الكامل - 6 أعمدة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              ميزان المراجعة الشامل (رصيد سابق + حركة + صافي)
            </div>
            {editMode && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addNewTrialBalanceAccount}
                className="text-xs gap-1"
              >
                + إضافة حساب
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-center py-2 px-2 font-semibold w-24" rowSpan={2}>الرمز</th>
                  <th className="text-right py-2 px-2 font-semibold" rowSpan={2}>اسم الحساب</th>
                  <th className="text-center py-2 px-2 font-semibold border-x" colSpan={2}>الرصيد السابق</th>
                  <th className="text-center py-2 px-2 font-semibold border-x" colSpan={2}>الحركة</th>
                  <th className="text-center py-2 px-2 font-semibold" colSpan={2}>الصافي</th>
                  {editMode && <th className="py-2 px-2" rowSpan={2}></th>}
                </tr>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-1 px-2 text-xs border-x">مدين</th>
                  <th className="text-left py-1 px-2 text-xs border-x">دائن</th>
                  <th className="text-left py-1 px-2 text-xs border-x">مدين</th>
                  <th className="text-left py-1 px-2 text-xs border-x">دائن</th>
                  <th className="text-left py-1 px-2 text-xs">مدين</th>
                  <th className="text-left py-1 px-2 text-xs">دائن</th>
                </tr>
              </thead>
              <tbody>
                {reconciliationData.rawAccounts
                  .map((acc, idx) => {
                    const code = acc.code || '';
                    const isParent = acc.category === 'حساب رئيسي' || acc.category === 'عنوان قسم' || (code.length <= 3 && code.length >= 1);
                    const firstDigit = code.charAt(0);
                    const typeColors: Record<string, string> = {
                      '1': 'bg-amber-50/70 dark:bg-amber-950/20',
                      '2': 'bg-rose-50/70 dark:bg-rose-950/20',
                      '3': 'bg-indigo-50/70 dark:bg-indigo-950/20',
                      '4': 'bg-emerald-50/70 dark:bg-emerald-950/20',
                      '5': 'bg-orange-50/70 dark:bg-orange-950/20',
                    };
                    const rowColor = isParent ? (typeColors[firstDigit] || '') : '';
                    const indent = code.length <= 1 ? 0 : code.length <= 2 ? 16 : code.length <= 3 ? 32 : code.length <= 4 ? 48 : 64;

                    return (
                      <tr key={idx} className={`border-b ${rowColor} ${isParent ? 'font-bold border-y-2 border-muted' : 'hover:bg-muted/20'}`}>
                        <td className="py-2 px-2 font-mono text-center font-semibold text-xs">
                          {code || '-'}
                        </td>
                        <td className={`py-2 px-2 ${isParent ? 'font-bold' : ''}`} style={{ paddingRight: `${indent + 8}px` }}>
                          {editMode && !isParent ? (
                            <Input
                              value={acc.name}
                              onChange={(e) => updateTrialBalanceAccount(idx, 'name', e.target.value)}
                              className="h-7 text-sm min-w-[120px]"
                            />
                          ) : acc.name}
                        </td>
                        <td className="py-2 px-2 text-left border-x tabular-nums">
                          {editMode && !isParent ? (
                            <Input type="number" value={acc.openingDebit || ''} onChange={(e) => updateTrialBalanceAccount(idx, 'openingDebit', parseFloat(e.target.value) || 0)} className="h-7 text-sm w-24 text-left" step="0.01" />
                          ) : (acc.openingDebit > 0 ? formatCurrency(acc.openingDebit) : '-')}
                        </td>
                        <td className="py-2 px-2 text-left border-x tabular-nums">
                          {editMode && !isParent ? (
                            <Input type="number" value={acc.openingCredit || ''} onChange={(e) => updateTrialBalanceAccount(idx, 'openingCredit', parseFloat(e.target.value) || 0)} className="h-7 text-sm w-24 text-left" step="0.01" />
                          ) : (acc.openingCredit > 0 ? formatCurrency(acc.openingCredit) : '-')}
                        </td>
                        <td className="py-2 px-2 text-left border-x tabular-nums">
                          {editMode && !isParent ? (
                            <Input type="number" value={acc.movementDebit || ''} onChange={(e) => updateTrialBalanceAccount(idx, 'movementDebit', parseFloat(e.target.value) || 0)} className="h-7 text-sm w-24 text-left" step="0.01" />
                          ) : (acc.movementDebit > 0 ? formatCurrency(acc.movementDebit) : '-')}
                        </td>
                        <td className="py-2 px-2 text-left border-x tabular-nums">
                          {editMode && !isParent ? (
                            <Input type="number" value={acc.movementCredit || ''} onChange={(e) => updateTrialBalanceAccount(idx, 'movementCredit', parseFloat(e.target.value) || 0)} className="h-7 text-sm w-24 text-left" step="0.01" />
                          ) : (acc.movementCredit > 0 ? formatCurrency(acc.movementCredit) : '-')}
                        </td>
                        <td className="py-2 px-2 text-left tabular-nums">
                          {editMode && !isParent ? (
                            <Input type="number" value={acc.closingDebit || ''} onChange={(e) => updateTrialBalanceAccount(idx, 'closingDebit', parseFloat(e.target.value) || 0)} className="h-7 text-sm w-24 text-left" step="0.01" />
                          ) : (acc.closingDebit > 0 ? formatCurrency(acc.closingDebit) : '-')}
                        </td>
                        <td className="py-2 px-2 text-left tabular-nums">
                          {editMode && !isParent ? (
                            <Input type="number" value={acc.closingCredit || ''} onChange={(e) => updateTrialBalanceAccount(idx, 'closingCredit', parseFloat(e.target.value) || 0)} className="h-7 text-sm w-24 text-left" step="0.01" />
                          ) : (acc.closingCredit > 0 ? formatCurrency(acc.closingCredit) : '-')}
                        </td>
                        {editMode && (
                          <td className="py-2 px-1">
                            {!isParent && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteTrialBalanceAccount(idx)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                <tr className="border-t-4 border-primary bg-primary/10 font-bold text-base">
                  <td className="py-3 px-2 text-center" colSpan={2}>الإجمالي</td>
                  <td className="py-3 px-2 text-left border-x tabular-nums">{formatCurrency(calculatedTotals.openingDebit)}</td>
                  <td className="py-3 px-2 text-left border-x tabular-nums">{formatCurrency(calculatedTotals.openingCredit)}</td>
                  <td className="py-3 px-2 text-left border-x tabular-nums">{formatCurrency(calculatedTotals.movementDebit)}</td>
                  <td className="py-3 px-2 text-left border-x tabular-nums">{formatCurrency(calculatedTotals.movementCredit)}</td>
                  <td className="py-3 px-2 text-left tabular-nums">{formatCurrency(calculatedTotals.closingDebit)}</td>
                  <td className="py-3 px-2 text-left tabular-nums">{formatCurrency(calculatedTotals.closingCredit)}</td>
                  {editMode && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Income Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            قائمة الدخل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 font-semibold">البند</th>
                  <th className="text-left py-2 font-semibold">المبلغ (ر.س)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.revenue).map(([name, amount]) => (
                  <tr key={name}>
                    <td className="py-2">- {name}</td>
                    <td className="py-2 text-left font-medium">
                      <EditableValue 
                        value={amount} 
                        onChange={(val) => updateValue('revenue', name, val)}
                        category="revenue"
                        name={name}
                      />
                    </td>
                  </tr>
                ))}
                {editMode && (
                  <tr>
                    <td colSpan={2} className="py-1">
                      <Button variant="ghost" size="sm" onClick={() => addNewAccount('revenue')} className="text-xs">
                        + إضافة إيراد
                      </Button>
                    </td>
                  </tr>
                )}
                <tr className="border-t bg-muted/30">
                  <td className="py-2 font-semibold">إجمالي الإيرادات</td>
                  <td className="py-2 text-left font-medium">{formatCurrency(totalRevenue)}</td>
                </tr>
                <tr>
                  <td className="py-2">(-) تكلفة المبيعات (المشتريات)</td>
                  <td className="py-2 text-left text-destructive">
                    {editMode ? (
                      <Input
                        type="number"
                        value={costOfSales}
                        onChange={(e) => updatePurchases(parseFloat(e.target.value) || 0)}
                        className="w-28 h-7 text-left text-sm"
                        step="0.01"
                      />
                    ) : (
                      <>({formatCurrency(costOfSales)})</>
                    )}
                  </td>
                </tr>
                <tr className="border-t bg-muted/50">
                  <td className="py-2 font-semibold">مجمل الربح / (الخسارة)</td>
                  <td className={`py-2 text-left font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatCurrency(grossProfit)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pt-4 font-semibold" colSpan={2}>المصاريف التشغيلية:</td>
                </tr>
                {Object.entries(data.expenses).map(([name, amount]) => (
                  <tr key={name}>
                    <td className="py-1 pr-4">- {name}</td>
                    <td className="py-1 text-left">
                      <EditableValue 
                        value={amount} 
                        onChange={(val) => updateValue('expenses', name, val)}
                        category="expenses"
                        name={name}
                      />
                    </td>
                  </tr>
                ))}
                {editMode && (
                  <tr>
                    <td colSpan={2} className="py-1">
                      <Button variant="ghost" size="sm" onClick={() => addNewAccount('expenses')} className="text-xs">
                        + إضافة مصروف
                      </Button>
                    </td>
                  </tr>
                )}
                <tr className="border-t">
                  <td className="py-2">إجمالي المصاريف التشغيلية</td>
                  <td className="py-2 text-left text-destructive">({formatCurrency(totalExpenses)})</td>
                </tr>
                <tr className="border-t-2 bg-primary/5">
                  <td className="py-3 font-bold text-lg">صافي الربح / (الخسارة)</td>
                  <td className={`py-3 text-left font-bold text-lg ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatCurrency(netIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* قسم تسوية الأرباح - مقارنة بين القيود وتقرير الأرباح */}
      <Card className="border-2 border-amber-200 dark:border-amber-800">
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
              {isFixingCogs ? 'جاري الإصلاح...' : 'إصلاح القيود الناقصة'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الربح من القيود المحاسبية */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                صافي الربح من القيود المحاسبية
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>إجمالي الإيرادات (حساب 41xx)</span>
                  <span className="font-medium">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>(-) تكلفة المبيعات (حساب 5101)</span>
                  <span>({formatCurrency(costOfSales)})</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span>مجمل الربح</span>
                  <span className="font-medium">{formatCurrency(grossProfit)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>(-) المصاريف التشغيلية</span>
                  <span>({formatCurrency(totalExpenses)})</span>
                </div>
                <div className="flex justify-between border-t-2 pt-2 font-bold text-lg">
                  <span>صافي الربح</span>
                  <span className={netIncome >= 0 ? 'text-green-600' : 'text-destructive'}>
                    {formatCurrency(netIncome)}
                  </span>
                </div>
              </div>
            </div>

            {/* الربح من تقرير الأرباح */}
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                صافي الربح من تقرير الأرباح (المبيعات)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>إجمالي الربح (سعر البيع - سعر الشراء)</span>
                  <span className="font-medium">{formatCurrency(profitReportData.totalGrossProfit)}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>(-) مصاريف السيارات المباعة</span>
                  <span>({formatCurrency(profitReportData.carExpenses)})</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>(-) المصاريف العامة</span>
                  <span>({formatCurrency(profitReportData.generalExpenses)})</span>
                </div>
                <div className="flex justify-between border-t-2 pt-2 font-bold text-lg">
                  <span>صافي الربح</span>
                  <span className={profitReportData.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}>
                    {formatCurrency(profitReportData.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* نتيجة المقارنة */}
          <div className="mt-4 p-4 rounded-lg border-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Math.abs(netIncome - profitReportData.netProfit) < 1 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-600">الأرقام متطابقة ✓</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-600">يوجد فرق بين المصدرين</span>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">الفرق</p>
                <p className={`text-xl font-bold ${Math.abs(netIncome - profitReportData.netProfit) < 1 ? 'text-green-600' : 'text-amber-600'}`}>
                  {formatCurrency(netIncome - profitReportData.netProfit)}
                </p>
              </div>
            </div>
            
            {Math.abs(netIncome - profitReportData.netProfit) >= 1 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200">
                <p className="text-sm font-medium mb-2">الأسباب المحتملة للفرق:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• قيود مبيعات ناقصة لتكلفة البضاعة المباعة (COGS) - اضغط "إصلاح القيود"</li>
                  <li>• الرواتب المُسجلة في المحاسبة وغير مشمولة في تقرير الأرباح</li>
                  <li>• المصاريف المقدمة (الإيجار) المُستحقة في الفترة</li>
                  <li>• قيود تسوية يدوية أو إهلاك أصول</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            قائمة المركز المالي (الميزانية العمومية)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الأصول */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-primary">الأصول</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-2 font-semibold" colSpan={2}>الأصول الثابتة:</td>
                  </tr>
                  {Object.entries(data.fixedAssets).map(([name, amount]) => (
                    <tr key={name}>
                      <td className="py-1 pr-4">- {name}</td>
                      <td className="py-1 text-left">
                        <EditableValue 
                          value={amount} 
                          onChange={(val) => updateValue('fixedAssets', name, val)}
                          category="fixedAssets"
                          name={name}
                        />
                      </td>
                    </tr>
                  ))}
                  {editMode && (
                    <tr>
                      <td colSpan={2} className="py-1">
                        <Button variant="ghost" size="sm" onClick={() => addNewAccount('fixedAssets')} className="text-xs">
                          + إضافة أصل ثابت
                        </Button>
                      </td>
                    </tr>
                  )}
                  <tr className="border-t bg-muted/30">
                    <td className="py-2">إجمالي الأصول الثابتة</td>
                    <td className="py-2 text-left font-medium">{formatCurrency(totalFixedAssets)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pt-4 font-semibold" colSpan={2}>الأصول المتداولة:</td>
                  </tr>
                  {Object.entries(data.currentAssets).map(([name, amount]) => (
                    <tr key={name}>
                      <td className="py-1 pr-4">- {name}</td>
                      <td className="py-1 text-left">
                        <EditableValue 
                          value={amount} 
                          onChange={(val) => updateValue('currentAssets', name, val)}
                          category="currentAssets"
                          name={name}
                        />
                      </td>
                    </tr>
                  ))}
                  {editMode && (
                    <tr>
                      <td colSpan={2} className="py-1">
                        <Button variant="ghost" size="sm" onClick={() => addNewAccount('currentAssets')} className="text-xs">
                          + إضافة أصل متداول
                        </Button>
                      </td>
                    </tr>
                  )}
                  <tr className="border-t bg-muted/30">
                    <td className="py-2">إجمالي الأصول المتداولة</td>
                    <td className="py-2 text-left font-medium">{formatCurrency(totalCurrentAssets)}</td>
                  </tr>
                  <tr className="border-t-2 bg-primary/10">
                    <td className="py-3 font-bold">إجمالي الأصول</td>
                    <td className="py-3 text-left font-bold">{formatCurrency(totalAssets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* الخصوم وحقوق الملكية */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-primary">الخصوم وحقوق الملكية</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-2 font-semibold" colSpan={2}>الخصوم المتداولة:</td>
                  </tr>
                  {Object.entries(data.liabilities).map(([name, amount]) => (
                    <tr key={name}>
                      <td className="py-1 pr-4">- {name}</td>
                      <td className="py-1 text-left">
                        <EditableValue 
                          value={amount} 
                          onChange={(val) => updateValue('liabilities', name, val)}
                          category="liabilities"
                          name={name}
                        />
                      </td>
                    </tr>
                  ))}
                  {editMode && (
                    <tr>
                      <td colSpan={2} className="py-1">
                        <Button variant="ghost" size="sm" onClick={() => addNewAccount('liabilities')} className="text-xs">
                          + إضافة خصم
                        </Button>
                      </td>
                    </tr>
                  )}
                  <tr className="border-t bg-muted/30">
                    <td className="py-2">إجمالي الخصوم المتداولة</td>
                    <td className="py-2 text-left font-medium">{formatCurrency(totalLiabilities)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pt-4 font-semibold" colSpan={2}>حقوق الملكية:</td>
                  </tr>
                  {Object.entries(data.equity).map(([name, amount]) => (
                    <tr key={name}>
                      <td className="py-1 pr-4">- {name}</td>
                      <td className="py-1 text-left">
                        <EditableValue 
                          value={amount} 
                          onChange={(val) => updateValue('equity', name, val)}
                          category="equity"
                          name={name}
                        />
                      </td>
                    </tr>
                  ))}
                  {editMode && (
                    <tr>
                      <td colSpan={2} className="py-1">
                        <Button variant="ghost" size="sm" onClick={() => addNewAccount('equity')} className="text-xs">
                          + إضافة حقوق ملكية
                        </Button>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1 pr-4">- صافي الربح / (الخسارة)</td>
                    <td className={`py-1 text-left ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {formatCurrency(netIncome)}
                    </td>
                  </tr>
                  <tr className="border-t bg-muted/30">
                    <td className="py-2">إجمالي حقوق الملكية</td>
                    <td className="py-2 text-left font-medium">{formatCurrency(adjustedEquity)}</td>
                  </tr>
                  <tr className="border-t-2 bg-primary/10">
                    <td className="py-3 font-bold">إجمالي الخصوم وحقوق الملكية</td>
                    <td className="py-3 text-left font-bold">{formatCurrency(totalLiabilitiesAndEquity)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zakat Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              حساب الزكاة الشرعية
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* إدخال رأس المال يدوياً */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useManualCapital"
                  checked={useManualCapital}
                  onChange={(e) => setUseManualCapital(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="useManualCapital" className="text-sm font-medium">
                  إدخال رأس المال يدوياً
                </label>
              </div>
              {useManualCapital && (
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">رأس المال:</label>
                  <Input
                    type="number"
                    placeholder="أدخل رأس المال"
                    value={manualCapital ?? ''}
                    onChange={(e) => setManualCapital(e.target.value ? parseFloat(e.target.value) : null)}
                    className="max-w-[200px]"
                  />
                  <span className="text-sm text-muted-foreground">ر.س</span>
                </div>
              )}
            </div>
            {useManualCapital && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 استخدم هذا الخيار إذا كان رأس المال في ملف الميزان غير دقيق أو ناقص
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm max-w-2xl">
              <tbody>
                <tr>
                  <td className="py-2 font-semibold" colSpan={2}>الوعاء الزكوي:</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">
                    (+) رأس المال المستثمر
                    {useManualCapital && <span className="text-xs text-primary mr-2">(يدوي)</span>}
                  </td>
                  <td className="py-1 text-left">{formatCurrency(capitalForZakat)}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">(+/-) صافي الربح / الخسارة</td>
                  <td className={`py-1 text-left ${netIncome >= 0 ? '' : 'text-destructive'}`}>
                    {formatCurrency(netIncome)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="py-2">إجمالي مصادر التمويل</td>
                  <td className="py-2 text-left font-medium">
                    {formatCurrency(capitalForZakat + netIncome)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pt-4 font-semibold" colSpan={2}>الحسميات:</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">(-) الأصول الثابتة</td>
                  <td className="py-1 text-left text-destructive">({formatCurrency(totalFixedAssets)})</td>
                </tr>
                {prepaidRent > 0 && (
                  <tr>
                    <td className="py-1 pr-4">(-) الإيجار المدفوع مقدماً (طويل الأجل - 11/12)</td>
                    <td className="py-1 text-left text-destructive">
                      ({formatCurrency(prepaidRentLongTerm)})
                    </td>
                  </tr>
                )}
                <tr className="border-t bg-muted/50">
                  <td className="py-2 font-semibold">الوعاء الزكوي المعدل</td>
                  <td className={`py-2 text-left font-bold ${zakatBase >= 0 ? '' : 'text-destructive'}`}>
                    {formatCurrency(zakatBase)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2">نسبة الزكاة</td>
                  <td className="py-2 text-left">2.5%</td>
                </tr>
                <tr className="border-t-2 bg-accent">
                  <td className="py-3 font-bold text-lg">الزكاة المستحقة</td>
                  <td className="py-3 text-left font-bold text-lg text-primary">
                    {formatCurrency(zakatDue)}
                  </td>
                </tr>
              </tbody>
            </table>
            
            {/* ملخص الحساب */}
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border text-sm">
              <p className="font-medium mb-2">📊 ملخص حساب الزكاة:</p>
              <p className="text-muted-foreground">
                الوعاء = {formatCurrency(capitalForZakat)} (رأس المال) + {formatCurrency(netIncome)} (صافي الربح) - {formatCurrency(totalFixedAssets)} (أصول ثابتة) - {formatCurrency(prepaidRentLongTerm)} (إيجار مقدم) = {formatCurrency(zakatBase)}
              </p>
            </div>
            
            {zakatBase <= 0 && (
              <div className="mt-4 p-4 bg-accent rounded-lg border border-border">
                <p className="text-foreground font-medium">
                  ⚠️ ملاحظة: الوعاء الزكوي سالب، وبالتالي لا تستحق زكاة على هذه الفترة.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Preview Dialog */}
      <TrialBalancePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        data={data}
        calculations={{
          totalRevenue,
          costOfSales,
          grossProfit,
          totalExpenses,
          netIncome,
          totalFixedAssets,
          totalCurrentAssets,
          totalAssets,
          totalLiabilities,
          totalEquity,
          adjustedEquity,
          totalLiabilitiesAndEquity,
          capitalForZakat,
          zakatBase,
          zakatDue,
          prepaidRentLongTerm,
        }}
      />
    </div>
  );
}
