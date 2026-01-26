import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Download, TrendingUp, TrendingDown, Building2, Calculator, Upload, X, FileUp, Save, Trash2, FolderOpen, FileText, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TrialBalancePreviewDialog } from './TrialBalancePreviewDialog';

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

// بيانات التحقق من المطابقة
interface ReconciliationData {
  // الإجماليات الأصلية من الملف
  originalTotalDebit: number;
  originalTotalCredit: number;
  // الحسابات المستبعدة/المكررة
  excludedAccounts: { name: string; amount: number; reason: string }[];
  // جميع الحسابات الخام قبل التصفية
  rawAccounts: { code: string; name: string; debit: number; credit: number; category: string }[];
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
  const { companyId } = useCompany();
  const { user } = useAuth();
  
  const [data, setData] = useState<TrialBalanceData>(emptyData);
  const [isExporting, setIsExporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedImports, setSavedImports] = useState<SavedImport[]>([]);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [importName, setImportName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
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

  // تحليل ملف Excel
  const parseExcelFile = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

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

    // قائمة شاملة للكلمات التي تشير إلى حسابات إجمالية أو رئيسية
    const excludePatterns = [
      'إجمالي', 'اجمالي', 'صافي', 'مجموع', 'total', 'sum',
      'حقوق الملكية ورأس المال', 'حقوق الملكيه وراس المال',
      'الأصول الثابتة', 'الاصول الثابته', 'الأصول المتداولة', 'الاصول المتداوله',
      'الخصوم المتداولة', 'الخصوم المتداوله', 'الخصوم طويلة الأجل',
      'حقوق الملكية', 'حقوق الملكيه', 'المصروفات التشغيلية', 'المصاريف التشغيلية',
      'الإيرادات', 'الايرادات'
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
    
    // دالة للتحقق مما إذا كان الحساب يجب استبعاده
    const shouldExclude = (name: string): boolean => {
      if (!name || name.trim().length === 0) return true;
      const lowerName = name.toLowerCase();
      return excludePatterns.some(pattern => lowerName.includes(pattern.toLowerCase()));
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
      
      if (shouldExclude(name)) {
        return { added: false, reason: 'حساب إجمالي/رئيسي' };
      }
      
      // تحقق من تكرار المبلغ في نفس الفئة
      const roundedAmount = Math.round(Math.abs(amount) * 100) / 100;
      if (usedAmounts[categoryName]?.has(roundedAmount)) {
        return { added: false, reason: 'مبلغ مكرر في نفس الفئة' };
      }
      
      // إضافة الحساب
      category[name] = Math.abs(amount);
      usedAmounts[categoryName]?.add(roundedAmount);
      return { added: true };
    };

    // دالة لتصنيف الحساب بناءً على الكود والاسم
    const categorizeAccount = (code: string, name: string): string => {
      const lowerName = name.toLowerCase();
      // الأصول الثابتة (11xx)
      if (code.startsWith('11') || lowerName.includes('أثاث') || lowerName.includes('أجهز') || lowerName.includes('معدات') || lowerName.includes('سيارات') || lowerName.includes('مباني') || lowerName.includes('عقار')) {
        return 'أصول ثابتة';
      }
      // الأصول المتداولة (12xx, 13xx, 14xx)
      if (code.startsWith('12') || code.startsWith('13') || code.startsWith('14') || lowerName.includes('بنك') || lowerName.includes('عهد') || lowerName.includes('مقدم') || lowerName.includes('نقد') || lowerName.includes('صندوق') || lowerName.includes('ذمم') || lowerName.includes('مدين')) {
        return 'أصول متداولة';
      }
      // الخصوم (2xxx ما عدا 25xx)
      if ((code.startsWith('2') && !code.startsWith('25')) || lowerName.includes('دائن') || lowerName.includes('مستحق') || lowerName.includes('موردين')) {
        return 'خصوم';
      }
      // حقوق الملكية (25xx, 3xxx)
      if (code.startsWith('25') || code.startsWith('3') || lowerName.includes('رأس المال') || lowerName.includes('راس المال') || lowerName.includes('جاري الشريك') || lowerName.includes('جاري المالك') || lowerName.includes('احتياطي') || lowerName.includes('أرباح مبقاة')) {
        return 'حقوق ملكية';
      }
      // الإيرادات (4xxx ما عدا 45xx)
      if ((code.startsWith('4') && !code.startsWith('45')) || lowerName.includes('مبيعات') || lowerName.includes('إيراد') || lowerName.includes('ايراد')) {
        return 'إيرادات';
      }
      // المشتريات (45xx)
      if (code.startsWith('45') || lowerName.includes('مشتريات')) {
        return 'مشتريات';
      }
      // المصروفات (5xxx)
      if (code.startsWith('5') || lowerName.includes('مصروف') || lowerName.includes('مصاريف') || lowerName.includes('رواتب') || lowerName.includes('إيجار') || lowerName.includes('استهلاك')) {
        return 'مصروفات';
      }
      return 'غير مصنف';
    };

    // === المرحلة الأولى: استخراج جميع الحسابات الخام وحساب الإجماليات الأصلية ===
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const accountName = String(row.find(cell => typeof cell === 'string' && cell.length > 2) || '').trim();
      const accountCode = String(row.find(cell => typeof cell === 'number' || /^\d+$/.test(String(cell))) || '');
      
      // البحث عن المبالغ - نبحث في جميع الخلايا بالترتيب
      // في ميزان المراجعة الشامل: العمودان الأولان بعد اسم الحساب هما الصافي (الدائن ثم المدين)
      let debitAmount = 0;
      let creditAmount = 0;
      
      // نبحث عن أول رقمين بعد اسم الحساب
      const numbers: number[] = [];
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (typeof cell === 'number' && !isNaN(cell)) {
          numbers.push(Math.abs(cell));
        }
      }
      
      // في ملف ميزان المراجعة: أول عمودين هما الصافي (دائن، مدين)
      if (numbers.length >= 2) {
        creditAmount = numbers[0]; // العمود الأول = الدائن
        debitAmount = numbers[1];  // العمود الثاني = المدين
      } else if (numbers.length === 1) {
        debitAmount = numbers[0];
      }
      
      console.log('Row:', accountName, 'Numbers:', numbers, 'Debit:', debitAmount, 'Credit:', creditAmount);

      // حفظ كل حساب يحتوي على أرقام (بما فيها الإجماليات للتوثيق)
      if (accountName && (debitAmount > 0 || creditAmount > 0)) {
        const isExcluded = shouldExclude(accountName);
        
        reconciliation.rawAccounts.push({
          code: accountCode,
          name: accountName,
          debit: debitAmount,
          credit: creditAmount,
          category: isExcluded ? 'مستبعد (حساب رئيسي)' : categorizeAccount(accountCode, accountName),
        });

        // تجميع الإجماليات من الحسابات الفرعية فقط (غير المستبعدة)
        if (!isExcluded) {
          reconciliation.originalTotalDebit += debitAmount;
          reconciliation.originalTotalCredit += creditAmount;
        }
      }
    }
    
    // === المرحلة الثانية: استخراج البيانات الأساسية والتصنيف ===
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // استخراج اسم الشركة
      const firstCell = String(row[0] || '').trim();
      if (i < 5 && firstCell && !result.companyName && firstCell.length > 5) {
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

      const accountName = String(row.find(cell => typeof cell === 'string' && cell.length > 2) || '').trim();
      const accountCode = String(row.find(cell => typeof cell === 'number' || /^\d+$/.test(String(cell))) || '');
      
      // البحث عن المبالغ - استخراج أول رقمين بعد اسم الحساب
      let debitAmount = 0;
      let creditAmount = 0;
      
      const numbers: number[] = [];
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (typeof cell === 'number' && !isNaN(cell)) {
          numbers.push(Math.abs(cell));
        }
      }
      
      if (numbers.length >= 2) {
        creditAmount = numbers[0]; // العمود الأول = الدائن
        debitAmount = numbers[1];  // العمود الثاني = المدين
      } else if (numbers.length === 1) {
        debitAmount = numbers[0];
      }
      const netAmount = debitAmount - creditAmount;

      // تجاهل الحسابات الإجمالية
      if (shouldExclude(accountName)) continue;

      // تصنيف الحسابات بناءً على رمز الحساب (الأولوية) أو اسم الحساب
      let addResult: { added: boolean; reason?: string } = { added: false };
      
      // استخدام دالة التصنيف الموحدة
      const category = categorizeAccount(accountCode, accountName);
      
      // تحديد المبلغ الصحيح بناءً على نوع الحساب
      // الأصول والمصروفات: طبيعتها مدينة (debit)
      // الخصوم والإيرادات وحقوق الملكية: طبيعتها دائنة (credit)
      let amount = 0;
      
      if (category === 'أصول ثابتة' || category === 'أصول متداولة') {
        // الأصول تظهر كمدين - نستخدم صافي (مدين - دائن) أو المدين إذا كان أكبر
        amount = debitAmount > creditAmount ? debitAmount - creditAmount : (debitAmount > 0 ? debitAmount : 0);
        if (amount > 0) {
          if (category === 'أصول ثابتة') {
            addResult = addAccount(result.fixedAssets, 'fixedAssets', accountName, amount);
          } else {
            addResult = addAccount(result.currentAssets, 'currentAssets', accountName, amount);
          }
        }
      } else if (category === 'خصوم') {
        // الخصوم تظهر كدائن
        amount = creditAmount > debitAmount ? creditAmount - debitAmount : (creditAmount > 0 ? creditAmount : 0);
        if (amount > 0) {
          addResult = addAccount(result.liabilities, 'liabilities', accountName, amount);
        }
      } else if (category === 'حقوق ملكية') {
        // حقوق الملكية تظهر كدائن
        amount = creditAmount > debitAmount ? creditAmount - debitAmount : (creditAmount > 0 ? creditAmount : 0);
        if (amount > 0) {
          addResult = addAccount(result.equity, 'equity', accountName, amount);
        }
      } else if (category === 'إيرادات') {
        // الإيرادات تظهر كدائن
        amount = creditAmount > 0 ? creditAmount : 0;
        if (amount > 0) {
          addResult = addAccount(result.revenue, 'revenue', accountName, amount);
        }
      } else if (category === 'مشتريات') {
        // المشتريات تظهر كمدين
        amount = debitAmount > 0 ? debitAmount : 0;
        if (amount > 0 && result.purchases === 0) {
          result.purchases = amount;
          addResult = { added: true };
        }
      } else if (category === 'مصروفات') {
        // المصروفات تظهر كمدين
        amount = debitAmount > 0 ? debitAmount : 0;
        if (amount > 0) {
          addResult = addAccount(result.expenses, 'expenses', accountName, amount);
        }
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
  const capitalForZakat = useManualCapital && manualCapital !== null ? manualCapital : totalEquity;
  
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

  const exportToExcel = () => {
    setIsExporting(true);

    try {
      const wb = XLSX.utils.book_new();

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
      const wsIncome = XLSX.utils.aoa_to_sheet(incomeStatementData);
      wsIncome['!cols'] = [{ wch: 40 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsIncome, 'قائمة الدخل');

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
      const wsBalance = XLSX.utils.aoa_to_sheet(balanceSheetData);
      wsBalance['!cols'] = [{ wch: 40 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsBalance, 'المركز المالي');

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
      const wsZakat = XLSX.utils.aoa_to_sheet(zakatData);
      wsZakat['!cols'] = [{ wch: 45 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsZakat, 'حساب الزكاة');

      // تحميل الملف
      XLSX.writeFile(wb, `القوائم_المالية_${data.period.to}.xlsx`);
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

  return (
    <div className="space-y-6" dir="rtl">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            رفع ميزان المراجعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
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
            ) : fileName ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <span className="font-medium">{fileName}</span>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); clearFile(); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <FileUp className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">اسحب ملف Excel هنا أو اضغط للاختيار</p>
                  <p className="text-sm text-muted-foreground mt-1">يدعم ملفات xlsx و xls</p>
                </div>
              </div>
            )}
          </div>

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
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 sticky top-0">
                        <tr>
                          <th className="p-2 text-right">الرمز</th>
                          <th className="p-2 text-right">اسم الحساب</th>
                          <th className="p-2 text-right">التصنيف</th>
                          <th className="p-2 text-left">مدين</th>
                          <th className="p-2 text-left">دائن</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconciliationData.rawAccounts.map((acc, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/20">
                            <td className="p-2 font-mono text-xs">{acc.code || '-'}</td>
                            <td className="p-2">{acc.name}</td>
                            <td className="p-2">
                              <span className="px-2 py-1 bg-muted rounded text-xs">{acc.category}</span>
                            </td>
                            <td className="p-2 text-left">{acc.debit > 0 ? formatCurrency(acc.debit) : '-'}</td>
                            <td className="p-2 text-left">{acc.credit > 0 ? formatCurrency(acc.credit) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50 font-bold">
                        <tr>
                          <td className="p-2" colSpan={3}>الإجمالي</td>
                          <td className="p-2 text-left">{formatCurrency(reconciliationData.originalTotalDebit)}</td>
                          <td className="p-2 text-left">{formatCurrency(reconciliationData.originalTotalCredit)}</td>
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
        <div className="flex gap-2">
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
                <tr>
                  <td className="py-2">إيرادات المبيعات</td>
                  <td className="py-2 text-left font-medium">{formatCurrency(totalRevenue)}</td>
                </tr>
                <tr>
                  <td className="py-2">(-) تكلفة المبيعات (المشتريات)</td>
                  <td className="py-2 text-left text-destructive">({formatCurrency(costOfSales)})</td>
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
                    <td className="py-1 text-left">{formatCurrency(amount)}</td>
                  </tr>
                ))}
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
                      <td className="py-1 text-left">{formatCurrency(amount)}</td>
                    </tr>
                  ))}
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
                      <td className="py-1 text-left">{formatCurrency(amount)}</td>
                    </tr>
                  ))}
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
                      <td className="py-1 text-left">{formatCurrency(amount)}</td>
                    </tr>
                  ))}
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
                      <td className="py-1 text-left">{formatCurrency(amount)}</td>
                    </tr>
                  ))}
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
