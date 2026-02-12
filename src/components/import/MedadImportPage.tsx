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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, direction } = useLanguage();
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
      
      toast.success(t.medad_parsing_success);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(t.medad_parsing_error);
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
      type: t.medad_customers,
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
      type: t.medad_suppliers,
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
      type: t.medad_accounts,
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
      type: t.medad_expenses,
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
        toast.success(t.medad_import_success.replace('{count}', String(totalSuccess)));
      } else {
        toast.warning(t.medad_import_warning.replace('{success}', String(totalSuccess)).replace('{failed}', String(totalFailed)));
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(t.medad_import_error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.medad_title}</h1>
          <p className="text-muted-foreground">{t.medad_subtitle}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upload" disabled={isProcessing}>{t.medad_upload_btn}</TabsTrigger>
              <TabsTrigger value="preview" disabled={!fileName || isProcessing}>{t.medad_preview}</TabsTrigger>
              <TabsTrigger value="results" disabled={importResults.length === 0 || isProcessing}>{t.medad_results}</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) parseExcelFile(file);
                  }}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{t.medad_drag_drop}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t.medad_supported_formats}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-50/50 border-blue-100">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <span className="font-medium">{t.medad_customers}</span>
                  </CardContent>
                </Card>
                <Card className="bg-green-50/50 border-green-100">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Truck className="w-8 h-8 text-green-600" />
                    <span className="font-medium">{t.medad_suppliers}</span>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50/50 border-purple-100">
                  <CardContent className="p-4 flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-purple-600" />
                    <span className="font-medium">{t.medad_accounts}</span>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50/50 border-orange-100">
                  <CardContent className="p-4 flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-orange-600" />
                    <span className="font-medium">{t.medad_expenses}</span>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  {t.medad_tips}
                </h4>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  <li>{t.medad_tip_1}</li>
                  <li>{t.medad_tip_2}</li>
                  <li>{t.medad_tip_3}</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{fileName}</h3>
                  <Button onClick={executeImport} disabled={isProcessing}>
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin ml-2" /> : <Download className="w-4 h-4 ml-2" />}
                    {t.medad_upload_btn}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground">{t.medad_customers}</p>
                    <p className="text-2xl font-bold">{parsedData.customers.length}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground">{t.medad_suppliers}</p>
                    <p className="text-2xl font-bold">{parsedData.suppliers.length}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground">{t.medad_accounts}</p>
                    <p className="text-2xl font-bold">{parsedData.accounts.length}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground">{t.medad_expenses}</p>
                    <p className="text-2xl font-bold">{parsedData.expenses.length}</p>
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>جاري المعالجة...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results">
              <div className="space-y-6">
                {importResults.map((result, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{result.type}</span>
                        <Badge variant={result.failed > 0 ? 'destructive' : 'default'}>
                          {result.failed > 0 ? 'مكتمل مع أخطاء' : 'ناجح'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        إجمالي: {result.total} | نجاح: {result.success} | فشل: {result.failed}
                      </CardDescription>
                    </CardHeader>
                    {result.errors.length > 0 && (
                      <CardContent>
                        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm max-h-40 overflow-y-auto">
                          <ul className="list-disc list-inside space-y-1">
                            {result.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
                
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => {
                    setParsedData({ customers: [], suppliers: [], accounts: [], journalEntries: [], expenses: [] });
                    setImportResults([]);
                    setFileName(null);
                    setActiveTab('upload');
                  }}>
                    استيراد ملف آخر
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
