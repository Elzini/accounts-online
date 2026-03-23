/**
 * Medad Import - Logic Hook
 * Extracted from MedadImportPage.tsx (677 lines)
 */
import { useState, useRef } from 'react';
import { readExcelFile } from '@/lib/excelUtils';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { supabase } from '@/hooks/modules/useMiscServices';
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

export function useMedadImport() {
  const { t } = useLanguage();
  const { companyId } = useCompany();
  const { user } = useAuth();
  const { selectedFiscalYear } = useFiscalYear();

  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedData>({
    customers: [], suppliers: [], accounts: [], journalEntries: [], expenses: [],
  });
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const findColumnValue = (row: any, possibleKeys: string[]): string | null => {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') return String(row[key]).trim();
    }
    return null;
  };

  const detectDataType = (data: any[]): string | null => {
    if (data.length === 0) return null;
    const keys = Object.keys(data[0]).map(k => k.toLowerCase());
    if (keys.some(k => k.includes('عميل') || k.includes('customer'))) return 'customers';
    if (keys.some(k => k.includes('مورد') || k.includes('supplier'))) return 'suppliers';
    if (keys.some(k => k.includes('حساب') || k.includes('account') || k.includes('رمز'))) return 'accounts';
    if (keys.some(k => k.includes('مصروف') || k.includes('expense'))) return 'expenses';
    return null;
  };

  const parseCustomers = (data: any[]) => data.map((row, i) => ({
    rowIndex: i + 1,
    name: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.name) || '',
    phone: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.phone) || '',
    id_number: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.idNumber) || '',
    address: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.address) || '',
    registration_number: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.registrationNumber) || '',
    isValid: !!findColumnValue(row, MEDAD_COLUMN_MAPPINGS.customers.name),
  })).filter(c => c.name);

  const parseSuppliers = (data: any[]) => data.map((row, i) => ({
    rowIndex: i + 1,
    name: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.name) || '',
    phone: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.phone) || '',
    id_number: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.idNumber) || '',
    address: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.address) || '',
    registration_number: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.registrationNumber) || '',
    isValid: !!findColumnValue(row, MEDAD_COLUMN_MAPPINGS.suppliers.name),
  })).filter(s => s.name);

  const parseAccounts = (data: any[]) => data.map((row, i) => {
    const code = findColumnValue(row, MEDAD_COLUMN_MAPPINGS.accounts.code) || '';
    const name = findColumnValue(row, MEDAD_COLUMN_MAPPINGS.accounts.name) || '';
    let type = 'assets';
    if (code.startsWith('1')) type = 'assets';
    else if (code.startsWith('2')) type = 'liabilities';
    else if (code.startsWith('3')) type = 'equity';
    else if (code.startsWith('4')) type = 'revenue';
    else if (code.startsWith('5')) type = 'expenses';
    return { rowIndex: i + 1, code, name, type, isValid: !!code && !!name };
  }).filter(a => a.code && a.name);

  const parseExpenses = (data: any[]) => data.map((row, i) => {
    const amountStr = findColumnValue(row, MEDAD_COLUMN_MAPPINGS.expenses.amount) || '0';
    const amount = parseFloat(amountStr.replace(/[^\d.-]/g, '')) || 0;
    return {
      rowIndex: i + 1,
      description: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.expenses.description) || '',
      amount,
      expense_date: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.expenses.date) || new Date().toISOString().split('T')[0],
      category: findColumnValue(row, MEDAD_COLUMN_MAPPINGS.expenses.category) || '',
      isValid: !!findColumnValue(row, MEDAD_COLUMN_MAPPINGS.expenses.description) && amount > 0,
    };
  }).filter(e => e.description && e.amount > 0);

  const parseExcelFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(10);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = await readExcelFile(arrayBuffer);
      setProgress(30);

      const result: ParsedData = { customers: [], suppliers: [], accounts: [], journalEntries: [], expenses: [] };

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = sheet.jsonData;
        if (data.length === 0) continue;
        const sheetNameLower = sheetName.toLowerCase();

        if (sheetNameLower.includes('عميل') || sheetNameLower.includes('customer')) result.customers = parseCustomers(data);
        else if (sheetNameLower.includes('مورد') || sheetNameLower.includes('supplier')) result.suppliers = parseSuppliers(data);
        else if (sheetNameLower.includes('حساب') || sheetNameLower.includes('account') || sheetNameLower.includes('دليل')) result.accounts = parseAccounts(data);
        else if (sheetNameLower.includes('مصروف') || sheetNameLower.includes('expense')) result.expenses = parseExpenses(data);
        else if (sheetNameLower.includes('قيد') || sheetNameLower.includes('journal')) { /* future */ }
        else {
          const detected = detectDataType(data);
          if (detected === 'customers') result.customers = parseCustomers(data);
          else if (detected === 'suppliers') result.suppliers = parseSuppliers(data);
          else if (detected === 'accounts') result.accounts = parseAccounts(data);
          else if (detected === 'expenses') result.expenses = parseExpenses(data);
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

  const importCustomers = async (): Promise<ImportResult> => {
    const result: ImportResult = { type: t.medad_customers, total: parsedData.customers.length, success: 0, failed: 0, errors: [] };
    for (const customer of parsedData.customers) {
      try {
        const { error } = await supabase.from('customers').insert({
          company_id: companyId, name: customer.name, phone: customer.phone || 'غير متوفر',
          id_number: customer.id_number || null, address: customer.address || null,
          registration_number: customer.registration_number || null,
        });
        if (error) { result.failed++; result.errors.push(`صف ${customer.rowIndex}: ${error.message}`); }
        else result.success++;
      } catch (err: any) { result.failed++; result.errors.push(`صف ${customer.rowIndex}: ${err.message}`); }
    }
    return result;
  };

  const importSuppliers = async (): Promise<ImportResult> => {
    const result: ImportResult = { type: t.medad_suppliers, total: parsedData.suppliers.length, success: 0, failed: 0, errors: [] };
    for (const supplier of parsedData.suppliers) {
      try {
        const { error } = await supabase.from('suppliers').insert({
          company_id: companyId, name: supplier.name, phone: supplier.phone || 'غير متوفر',
          id_number: supplier.id_number || null, address: supplier.address || null,
          registration_number: supplier.registration_number || null,
        });
        if (error) { result.failed++; result.errors.push(`صف ${supplier.rowIndex}: ${error.message}`); }
        else result.success++;
      } catch (err: any) { result.failed++; result.errors.push(`صف ${supplier.rowIndex}: ${err.message}`); }
    }
    return result;
  };

  const importAccounts = async (): Promise<ImportResult> => {
    const result: ImportResult = { type: t.medad_accounts, total: parsedData.accounts.length, success: 0, failed: 0, errors: [] };
    for (const account of parsedData.accounts) {
      try {
        const { data: existing } = await supabase.from('account_categories').select('id').eq('company_id', companyId).eq('code', account.code).single();
        if (existing) { result.failed++; result.errors.push(`صف ${account.rowIndex}: الحساب ${account.code} موجود مسبقاً`); continue; }
        const { error } = await supabase.from('account_categories').insert({ company_id: companyId, code: account.code, name: account.name, type: account.type, is_system: false });
        if (error) { result.failed++; result.errors.push(`صف ${account.rowIndex}: ${error.message}`); }
        else result.success++;
      } catch (err: any) { result.failed++; result.errors.push(`صف ${account.rowIndex}: ${err.message}`); }
    }
    return result;
  };

  const importExpenses = async (): Promise<ImportResult> => {
    const result: ImportResult = { type: t.medad_expenses, total: parsedData.expenses.length, success: 0, failed: 0, errors: [] };
    for (const expense of parsedData.expenses) {
      try {
        const { error } = await supabase.from('expenses').insert({
          company_id: companyId, description: expense.description, amount: expense.amount,
          expense_date: expense.expense_date, fiscal_year_id: selectedFiscalYear?.id || null, created_by: user?.id,
        });
        if (error) { result.failed++; result.errors.push(`صف ${expense.rowIndex}: ${error.message}`); }
        else result.success++;
      } catch (err: any) { result.failed++; result.errors.push(`صف ${expense.rowIndex}: ${err.message}`); }
    }
    return result;
  };

  const executeImport = async () => {
    if (!companyId) { toast.error('يجب اختيار شركة أولاً'); return; }
    setIsProcessing(true);
    setProgress(0);
    const results: ImportResult[] = [];
    try {
      let step = 0;
      const totalSteps = 4;
      if (parsedData.customers.length > 0) { results.push(await importCustomers()); step++; setProgress((step / totalSteps) * 100); }
      if (parsedData.suppliers.length > 0) { results.push(await importSuppliers()); step++; setProgress((step / totalSteps) * 100); }
      if (parsedData.accounts.length > 0) { results.push(await importAccounts()); step++; setProgress((step / totalSteps) * 100); }
      if (parsedData.expenses.length > 0) { results.push(await importExpenses()); step++; setProgress((step / totalSteps) * 100); }

      setImportResults(results);
      setActiveTab('results');
      const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
      if (totalFailed === 0) toast.success(t.medad_import_success.replace('{count}', String(totalSuccess)));
      else toast.warning(t.medad_import_warning.replace('{success}', String(totalSuccess)).replace('{failed}', String(totalFailed)));
    } catch (error) {
      console.error('Import error:', error);
      toast.error(t.medad_import_error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setParsedData({ customers: [], suppliers: [], accounts: [], journalEntries: [], expenses: [] });
    setImportResults([]);
    setFileName(null);
    setActiveTab('upload');
  };

  return {
    activeTab, setActiveTab, isProcessing, progress, parsedData,
    importResults, fileName, fileInputRef,
    parseExcelFile, executeImport, resetAll,
  };
}
