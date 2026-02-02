import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Users,
  Truck,
  Car,
  DollarSign,
  Calculator,
  RefreshCw,
  Download,
  FileText,
  Package
} from 'lucide-react';
import { readExcelFile, sheetToJson, ExcelWorkbook } from '@/lib/excelUtils';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportResult {
  type: string;
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

interface ParsedData {
  customers: any[];
  suppliers: any[];
  accounts: any[];
  journalEntries: any[];
  expenses: any[];
}

// مفاتيح الأعمدة المحتملة في ملفات مداد
const MEDAD_COLUMN_MAPPINGS = {
  customers: {
    name: ['اسم العميل', 'الاسم', 'العميل', 'customer_name', 'name'],
    phone: ['الجوال', 'الهاتف', 'رقم الجوال', 'phone', 'mobile'],
    idNumber: ['رقم الهوية', 'الهوية', 'السجل المدني', 'id_number'],
    address: ['العنوان', 'address'],
    registrationNumber: ['السجل التجاري', 'رقم السجل', 'registration_number'],
  },
  suppliers: {
    name: ['اسم المورد', 'المورد', 'الاسم', 'supplier_name', 'name'],
    phone: ['الجوال', 'الهاتف', 'رقم الجوال', 'phone', 'mobile'],
    idNumber: ['رقم الهوية', 'الهوية', 'id_number'],
    address: ['العنوان', 'address'],
    registrationNumber: ['السجل التجاري', 'رقم السجل', 'registration_number'],
  },
  accounts: {
    code: ['رمز الحساب', 'الرمز', 'الكود', 'account_code', 'code'],
    name: ['اسم الحساب', 'الحساب', 'account_name', 'name'],
    type: ['نوع الحساب', 'التصنيف', 'النوع', 'type'],
    balance: ['الرصيد', 'balance'],
  },
  expenses: {
    description: ['البيان', 'الوصف', 'description'],
    amount: ['المبلغ', 'القيمة', 'amount'],
    date: ['التاريخ', 'date'],
    category: ['التصنيف', 'الفئة', 'category'],
  },
};

export function MedadImportPage() {
  const { companyId } = useCompany();
  const { user } = useAuth();
  const { selectedFiscalYear } = useFiscalYear();
  
  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedData>({
    customers: [],
    suppliers: [],
    accounts: [],
    journalEntries: [],
    expenses: [],
  });
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // البحث عن قيمة العمود بناءً على المفاتيح المحتملة
  const findColumnValue = (row: any, possibleKeys: string[]): string | null => {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return String(row[key]).trim();
      }
    }
    return null;
  };

  // تحليل ملف Excel
  const parseExcelFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(10);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = await readExcelFile(arrayBuffer);
      
      setProgress(30);
      
      const result: ParsedData = {
        customers: [],
        suppliers: [],
        accounts: [],
        journalEntries: [],
        expenses: [],
      };
      
      // تحليل كل ورقة في الملف
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = sheet.jsonData;
        
        if (data.length === 0) continue;
        
        const sheetNameLower = sheetName.toLowerCase();
        
        // تحديد نوع البيانات بناءً على اسم الورقة أو محتواها
        if (sheetNameLower.includes('عميل') || sheetNameLower.includes('customer')) {
          result.customers = parseCustomers(data);
        } else if (sheetNameLower.includes('مورد') || sheetNameLower.includes('supplier')) {
          result.suppliers = parseSuppliers(data);
        } else if (sheetNameLower.includes('حساب') || sheetNameLower.includes('account') || sheetNameLower.includes('دليل')) {
          result.accounts = parseAccounts(data);
        } else if (sheetNameLower.includes('مصروف') || sheetNameLower.includes('expense')) {
          result.expenses = parseExpenses(data);
        } else if (sheetNameLower.includes('قيد') || sheetNameLower.includes('journal')) {
          result.journalEntries = parseJournalEntries(data);
        } else {
          // محاولة التعرف على نوع البيانات من المحتوى
          const detected = detectDataType(data);
          if (detected) {
            switch (detected) {
              case 'customers':
                result.customers = parseCustomers(data);
                break;
              case 'suppliers':
                result.suppliers = parseSuppliers(data);
                break;
              case 'accounts':
                result.accounts = parseAccounts(data);
                break;
              case 'expenses':
                result.expenses = parseExpenses(data);
                break;
            }
          }
        }
      }
      
      setProgress(70);
      setParsedData(result);
      setFileName(file.name);
      setActiveTab('preview');
      setProgress(100);
      
      toast.success('تم تحليل الملف بنجاح');
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('حدث خطأ أثناء تحليل الملف');
    } finally {
      setIsProcessing(false);
    }
  };

  // التعرف على نوع البيانات من المحتوى
  const detectDataType = (data: any[]): string | null => {
    if (data.length === 0) return null;
    
    const firstRow = data[0];
    const keys = Object.keys(firstRow).map(k => k.toLowerCase());
    
    if (keys.some(k => k.includes('عميل') || k.includes('customer'))) {
      return 'customers';
    }
    if (keys.some(k => k.includes('مورد') || k.includes('supplier'))) {
      return 'suppliers';
    }
    if (keys.some(k => k.includes('حساب') || k.includes('account') || k.includes('رمز'))) {
      return 'accounts';
    }
    if (keys.some(k => k.includes('مصروف') || k.includes('expense'))) {
      return 'expenses';
    }
    
    return null;
  };

  // تحليل بيانات العملاء
  const parseCustomers = (data: any[]): any[] => {
    return data.map((row, index) => ({
      rowIndex: index + 1,
      name: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.name) || '',
      phone: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.phone) || '',
      id_number: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.idNumber) || '',
      address: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.address) || '',
      registration_number: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.registrationNumber) || '',
      isValid: !!findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.name),
    })).filter(c => c.name);
  };

  // تحليل بيانات الموردين
  const parseSuppliers = (data: any[]): any[] => {
    return data.map((row, index) => ({
      rowIndex: index + 1,
      name: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.name) || '',
      phone: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.phone) || '',
      id_number: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.idNumber) || '',
      address: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.address) || '',
      registration_number: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.registrationNumber) || '',
      isValid: !!findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.name),
    })).filter(s => s.name);
  };

  // تحليل بيانات الحسابات
  const parseAccounts = (data: any[]): any[] => {
    return data.map((row, index) => {
      const code = findColumnValue(row, MEDAD_COLUMN_MAPPINGS.accounts.code) || '';
      const name = findColumnValue(row, MEDAD_COLUMN_MAPPINGS.accounts.name) || '';
      const typeRaw = findColumnValue(row, MEDAD_COLUMN_MAPPINGS.accounts.type) || '';
      
      // تحديد نوع الحساب
      let type = 'assets';
      if (code.startsWith('1')) type = 'assets';
      else if (code.startsWith('2')) type = 'liabilities';
      else if (code.startsWith('3')) type = 'equity';
      else if (code.startsWith('4')) type = 'revenue';
      else if (code.startsWith('5')) type = 'expenses';
      
      return {
        rowIndex: index + 1,
        code,
        name,
        type,
        isValid: !!code && !!name,
      };
    }).filter(a => a.code && a.name);
  };

  // تحليل بيانات المصروفات
  const parseExpenses = (data: any[]): any[] => {
    return data.map((row, index) => {
      const amountStr = findColumnValue(row, MEDAD_COLUMN_MAPPINGS.expenses.amount) || '0';
      const amount = parseFloat(amountStr.replace(/[^\d.-]/g, '')) || 0;
      
      return {
        rowIndex: index + 1,
        description: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.expenses.description) || '',
        amount,
        expense_date: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.expenses.date) || new Date().toISOString().split('T')[0],
        category: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.expenses.category) || '',
        isValid: !!findColumnValue(row, MEDAD_COLUMN_MAPPINGS.expenses.description) && amount > 0,
      };
    }).filter(e => e.description && e.amount > 0);
  };

  // تحليل القيود المحاسبية
  const parseJournalEntries = (data: any[]): any[] => {
    // يمكن تطويره لاحقاً
    return [];
  };

  // استيراد العملاء
  const importCustomers = async (): Promise<ImportResult> => {
    const result: ImportResult = {
      type: 'العملاء',
      total: parsedData.customers.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const customer of parsedData.customers) {
      try {
        const { error } = await supabase
          .from('customers')
          .insert({
            company_id: companyId,
            name: customer.name,
            phone: customer.phone || 'غير متوفر',
            id_number: customer.id_number || null,
            address: customer.address || null,
            registration_number: customer.registration_number || null,
          });

        if (error) {
          result.failed++;
          result.errors.push(`صف ${customer.rowIndex}: ${error.message}`);
        } else {
          result.success++;
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`صف ${customer.rowIndex}: ${err.message}`);
      }
    }

    return result;
  };

  // استيراد الموردين
  const importSuppliers = async (): Promise<ImportResult> => {
    const result: ImportResult = {
      type: 'الموردين',
      total: parsedData.suppliers.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const supplier of parsedData.suppliers) {
      try {
        const { error } = await supabase
          .from('suppliers')
          .insert({
            company_id: companyId,
            name: supplier.name,
            phone: supplier.phone || 'غير متوفر',
            id_number: supplier.id_number || null,
            address: supplier.address || null,
            registration_number: supplier.registration_number || null,
          });

        if (error) {
          result.failed++;
          result.errors.push(`صف ${supplier.rowIndex}: ${error.message}`);
        } else {
          result.success++;
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`صف ${supplier.rowIndex}: ${err.message}`);
      }
    }

    return result;
  };

  // استيراد الحسابات
  const importAccounts = async (): Promise<ImportResult> => {
    const result: ImportResult = {
      type: 'الحسابات',
      total: parsedData.accounts.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const account of parsedData.accounts) {
      try {
        // تحقق من وجود الحساب
        const { data: existing } = await supabase
          .from('account_categories')
          .select('id')
          .eq('company_id', companyId)
          .eq('code', account.code)
          .single();

        if (existing) {
          result.failed++;
          result.errors.push(`صف ${account.rowIndex}: الحساب ${account.code} موجود مسبقاً`);
          continue;
        }

        const { error } = await supabase
          .from('account_categories')
          .insert({
            company_id: companyId,
            code: account.code,
            name: account.name,
            type: account.type,
            is_system: false,
          });

        if (error) {
          result.failed++;
          result.errors.push(`صف ${account.rowIndex}: ${error.message}`);
        } else {
          result.success++;
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`صف ${account.rowIndex}: ${err.message}`);
      }
    }

    return result;
  };

  // استيراد المصروفات
  const importExpenses = async (): Promise<ImportResult> => {
    const result: ImportResult = {
      type: 'المصروفات',
      total: parsedData.expenses.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const expense of parsedData.expenses) {
      try {
        const { error } = await supabase
          .from('expenses')
          .insert({
            company_id: companyId,
            description: expense.description,
            amount: expense.amount,
            expense_date: expense.expense_date,
            fiscal_year_id: selectedFiscalYear?.id || null,
            created_by: user?.id,
          });

        if (error) {
          result.failed++;
          result.errors.push(`صف ${expense.rowIndex}: ${error.message}`);
        } else {
          result.success++;
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`صف ${expense.rowIndex}: ${err.message}`);
      }
    }

    return result;
  };

  // تنفيذ الاستيراد
  const executeImport = async () => {
    if (!companyId) {
      toast.error('يجب اختيار شركة أولاً');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    const results: ImportResult[] = [];

    try {
      let step = 0;
      const totalSteps = 4;

      if (parsedData.customers.length > 0) {
        results.push(await importCustomers());
        step++;
        setProgress((step / totalSteps) * 100);
      }

      if (parsedData.suppliers.length > 0) {
        results.push(await importSuppliers());
        step++;
        setProgress((step / totalSteps) * 100);
      }

      if (parsedData.accounts.length > 0) {
        results.push(await importAccounts());
        step++;
        setProgress((step / totalSteps) * 100);
      }

      if (parsedData.expenses.length > 0) {
        results.push(await importExpenses());
        step++;
        setProgress((step / totalSteps) * 100);
      }

      setImportResults(results);
      setActiveTab('results');
      
      const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
      
      if (totalFailed === 0) {
        toast.success(`تم استيراد ${totalSuccess} سجل بنجاح`);
      } else {
        toast.warning(`تم استيراد ${totalSuccess} سجل، فشل ${totalFailed} سجل`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('حدث خطأ أثناء الاستيراد');
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  // إعادة تعيين
  const reset = () => {
    setParsedData({
      customers: [],
      suppliers: [],
      accounts: [],
      journalEntries: [],
      expenses: [],
    });
    setImportResults([]);
    setFileName(null);
    setActiveTab('upload');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  const totalRecords = 
    parsedData.customers.length + 
    parsedData.suppliers.length + 
    parsedData.accounts.length + 
    parsedData.expenses.length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">استيراد بيانات مداد</h1>
          <p className="text-muted-foreground">
            استيراد البيانات من ملفات Excel المصدرة من برنامج مداد المحاسبي
          </p>
        </div>
        {fileName && (
          <Button variant="outline" onClick={reset} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            ملف جديد
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            رفع الملف
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!fileName} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            معاينة
          </TabsTrigger>
          <TabsTrigger value="results" disabled={importResults.length === 0} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            النتائج
          </TabsTrigger>
        </TabsList>

        {/* رفع الملف */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                رفع ملف Excel
              </CardTitle>
              <CardDescription>
                قم بتصدير البيانات من برنامج مداد كملف Excel ثم ارفعه هنا
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div 
                className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">اسحب الملف هنا أو انقر للاختيار</p>
                <p className="text-sm text-muted-foreground">
                  يدعم ملفات Excel (.xlsx, .xls) و CSV
                </p>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>جاري التحليل...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium">البيانات المدعومة:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>العملاء</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-green-500" />
                    <span>الموردين</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calculator className="w-4 h-4 text-purple-500" />
                    <span>دليل الحسابات</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-orange-500" />
                    <span>المصروفات</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">نصائح للتصدير من مداد:</p>
                    <ul className="mt-2 space-y-1 text-amber-700 dark:text-amber-300">
                      <li>• تأكد من تسمية الأوراق بأسماء واضحة (عملاء، موردين، حسابات)</li>
                      <li>• احتفظ بصف العناوين في أول صف</li>
                      <li>• تأكد من صحة تنسيق الأرقام والتواريخ</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* معاينة البيانات */}
        <TabsContent value="preview">
          <div className="space-y-4">
            {fileName && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium">{fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          تم العثور على {totalRecords} سجل
                        </p>
                      </div>
                    </div>
                    <Button onClick={executeImport} disabled={totalRecords === 0 || isProcessing} className="gap-2">
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          جاري الاستيراد...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          بدء الاستيراد
                        </>
                      )}
                    </Button>
                  </div>
                  {isProcessing && (
                    <Progress value={progress} className="mt-4" />
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* العملاء */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      العملاء
                    </span>
                    <Badge variant={parsedData.customers.length > 0 ? 'default' : 'secondary'}>
                      {parsedData.customers.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {parsedData.customers.length > 0 ? (
                    <div className="max-h-48 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-right">الاسم</th>
                            <th className="p-2 text-right">الهاتف</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.customers.slice(0, 10).map((c, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{c.name}</td>
                              <td className="p-2 text-muted-foreground">{c.phone || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsedData.customers.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          +{parsedData.customers.length - 10} آخرين
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      لم يتم العثور على بيانات عملاء
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* الموردين */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-green-500" />
                      الموردين
                    </span>
                    <Badge variant={parsedData.suppliers.length > 0 ? 'default' : 'secondary'}>
                      {parsedData.suppliers.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {parsedData.suppliers.length > 0 ? (
                    <div className="max-h-48 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-right">الاسم</th>
                            <th className="p-2 text-right">الهاتف</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.suppliers.slice(0, 10).map((s, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{s.name}</td>
                              <td className="p-2 text-muted-foreground">{s.phone || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsedData.suppliers.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          +{parsedData.suppliers.length - 10} آخرين
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      لم يتم العثور على بيانات موردين
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* الحسابات */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-purple-500" />
                      دليل الحسابات
                    </span>
                    <Badge variant={parsedData.accounts.length > 0 ? 'default' : 'secondary'}>
                      {parsedData.accounts.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {parsedData.accounts.length > 0 ? (
                    <div className="max-h-48 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-right">الكود</th>
                            <th className="p-2 text-right">الاسم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.accounts.slice(0, 10).map((a, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2 font-mono">{a.code}</td>
                              <td className="p-2">{a.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsedData.accounts.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          +{parsedData.accounts.length - 10} آخرين
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      لم يتم العثور على بيانات حسابات
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* المصروفات */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-orange-500" />
                      المصروفات
                    </span>
                    <Badge variant={parsedData.expenses.length > 0 ? 'default' : 'secondary'}>
                      {parsedData.expenses.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {parsedData.expenses.length > 0 ? (
                    <div className="max-h-48 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-right">البيان</th>
                            <th className="p-2 text-right">المبلغ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.expenses.slice(0, 10).map((e, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{e.description}</td>
                              <td className="p-2">{e.amount.toLocaleString()} ر.س</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsedData.expenses.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          +{parsedData.expenses.length - 10} آخرين
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      لم يتم العثور على بيانات مصروفات
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* النتائج */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                نتائج الاستيراد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {importResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{result.type}</h3>
                    <div className="flex items-center gap-2">
                      {result.success > 0 && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {result.success} نجاح
                        </Badge>
                      )}
                      {result.failed > 0 && (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          {result.failed} فشل
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Progress 
                    value={(result.success / result.total) * 100} 
                    className="h-2"
                  />
                  
                  {result.errors.length > 0 && (
                    <div className="mt-3 bg-red-50 dark:bg-red-950/30 rounded p-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        الأخطاء:
                      </p>
                      <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 max-h-32 overflow-auto">
                        {result.errors.slice(0, 10).map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                        {result.errors.length > 10 && (
                          <li className="text-muted-foreground">
                            +{result.errors.length - 10} أخطاء أخرى
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-center pt-4">
                <Button onClick={reset} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  استيراد ملف جديد
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
