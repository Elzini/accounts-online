// خدمة استيراد ميزان المراجعة وربط الحسابات تلقائياً
import { readExcelFile, sheetToJson } from '@/lib/excelUtils';

export interface TrialBalanceRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
  mappedType: AccountMappingType;
  isAutoMapped: boolean;
  isValid: boolean;
}

export type AccountMappingType = 
  | 'current_assets' | 'non_current_assets'
  | 'current_liabilities' | 'non_current_liabilities'
  | 'equity' | 'revenue' | 'expenses' | 'cogs'
  | 'unmapped';

export interface TrialBalanceValidation {
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  missingAccounts: string[];
  warnings: string[];
  errors: string[];
}

export interface ImportedTrialBalance {
  rows: TrialBalanceRow[];
  validation: TrialBalanceValidation;
  fileName: string;
  importDate: string;
}

// قواعد الربط التلقائي حسب رمز الحساب
const AUTO_MAPPING_RULES: { prefix: string; type: AccountMappingType; label: string }[] = [
  { prefix: '11', type: 'current_assets', label: 'أصول متداولة - نقد وبنوك' },
  { prefix: '12', type: 'current_assets', label: 'أصول متداولة - ذمم مدينة' },
  { prefix: '13', type: 'current_assets', label: 'أصول متداولة - مخزون' },
  { prefix: '14', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '15', type: 'non_current_assets', label: 'أصول غير متداولة - أصول ثابتة' },
  { prefix: '16', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '17', type: 'non_current_assets', label: 'أصول غير متداولة - استثمارات' },
  { prefix: '18', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '19', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '1', type: 'current_assets', label: 'أصول' },
  { prefix: '21', type: 'current_liabilities', label: 'مطلوبات متداولة' },
  { prefix: '22', type: 'current_liabilities', label: 'مطلوبات متداولة' },
  { prefix: '23', type: 'non_current_liabilities', label: 'مطلوبات غير متداولة' },
  { prefix: '24', type: 'non_current_liabilities', label: 'مطلوبات غير متداولة' },
  { prefix: '2', type: 'current_liabilities', label: 'مطلوبات' },
  { prefix: '31', type: 'equity', label: 'حقوق ملكية - رأس المال' },
  { prefix: '32', type: 'equity', label: 'حقوق ملكية - احتياطي' },
  { prefix: '33', type: 'equity', label: 'حقوق ملكية - أرباح محتجزة' },
  { prefix: '3', type: 'equity', label: 'حقوق ملكية' },
  { prefix: '41', type: 'revenue', label: 'إيرادات رئيسية' },
  { prefix: '42', type: 'revenue', label: 'إيرادات أخرى' },
  { prefix: '4', type: 'revenue', label: 'إيرادات' },
  { prefix: '51', type: 'cogs', label: 'تكلفة البضاعة المباعة' },
  { prefix: '52', type: 'expenses', label: 'مصروفات تشغيلية' },
  { prefix: '53', type: 'expenses', label: 'مصروفات إدارية' },
  { prefix: '54', type: 'expenses', label: 'مصروفات عمومية' },
  { prefix: '55', type: 'expenses', label: 'مصروفات أخرى' },
  { prefix: '5', type: 'expenses', label: 'مصروفات' },
  { prefix: '6', type: 'expenses', label: 'مصروفات' },
];

// ربط الحساب تلقائياً حسب الرمز
export function autoMapAccount(code: string, name: string): AccountMappingType {
  const cleanCode = code.trim();
  
  // ربط بالاسم إذا لم يتم الربط بالرمز
  const nameLower = name.toLowerCase();
  
  for (const rule of AUTO_MAPPING_RULES) {
    if (cleanCode.startsWith(rule.prefix)) {
      return rule.type;
    }
  }
  
  // محاولة الربط بالاسم
  if (nameLower.includes('نقد') || nameLower.includes('صندوق') || nameLower.includes('بنك')) return 'current_assets';
  if (nameLower.includes('مخزون') || nameLower.includes('بضاعة')) return 'current_assets';
  if (nameLower.includes('عملاء') || nameLower.includes('ذمم مدينة')) return 'current_assets';
  if (nameLower.includes('أصول ثابتة') || nameLower.includes('معدات') || nameLower.includes('آلات')) return 'non_current_assets';
  if (nameLower.includes('موردين') || nameLower.includes('دائنون') || nameLower.includes('ذمم دائنة')) return 'current_liabilities';
  if (nameLower.includes('قروض طويلة')) return 'non_current_liabilities';
  if (nameLower.includes('رأس المال') || nameLower.includes('رأسمال')) return 'equity';
  if (nameLower.includes('احتياطي')) return 'equity';
  if (nameLower.includes('أرباح محتجزة')) return 'equity';
  if (nameLower.includes('إيراد') || nameLower.includes('مبيعات')) return 'revenue';
  if (nameLower.includes('تكلفة المبيعات') || nameLower.includes('تكلفة البضاعة')) return 'cogs';
  if (nameLower.includes('مصروف') || nameLower.includes('إيجار') || nameLower.includes('رواتب')) return 'expenses';
  
  return 'unmapped';
}

// أسماء التصنيفات بالعربية
export const MAPPING_TYPE_LABELS: Record<AccountMappingType, string> = {
  current_assets: 'أصول متداولة',
  non_current_assets: 'أصول غير متداولة',
  current_liabilities: 'مطلوبات متداولة',
  non_current_liabilities: 'مطلوبات غير متداولة',
  equity: 'حقوق ملكية',
  revenue: 'إيرادات',
  expenses: 'مصروفات عمومية وإدارية',
  cogs: 'تكلفة الإيرادات',
  unmapped: 'غير مصنف',
};

// الأعمدة المحتملة لميزان المراجعة
const TB_COLUMN_MAPPINGS = {
  code: ['رمز الحساب', 'الرمز', 'الكود', 'رقم الحساب', 'code', 'account_code', 'Code', 'رقم', 'الرقم'],
  name: ['اسم الحساب', 'الحساب', 'البيان', 'الوصف', 'name', 'account_name', 'Name', 'اسم'],
  debit: ['مدين', 'مدين إجمالي', 'مجموع مدين', 'رصيد مدين', 'debit', 'Debit', 'المدين', 'مدين نهائي'],
  credit: ['دائن', 'دائن إجمالي', 'مجموع دائن', 'رصيد دائن', 'credit', 'Credit', 'الدائن', 'دائن نهائي'],
};

// الأعمدة المحتملة لعناوين الصفوف العلوية (الصف المدمج)
const TB_PARENT_HEADERS = {
  closing: ['الصافي', 'الختامي', 'الرصيد النهائي', 'صافي', 'الرصيد الصافي', 'net', 'closing', 'balance'],
  movement: ['الحركة', 'حركة', 'movement'],
  opening: ['الرصيد السابق', 'رصيد سابق', 'الافتتاحي', 'opening'],
};

function findValue(row: any, possibleKeys: string[]): string | null {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return String(row[key]).trim();
    }
  }
  return null;
}

function parseNumber(val: string | null | number): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^\d.\-,]/g, '').replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}

// البحث عن فهرس عمود بناءً على الاسم
function findColumnIndex(headerRow: any[], possibleNames: string[]): number {
  for (let i = 0; i < headerRow.length; i++) {
    const cellVal = String(headerRow[i] ?? '').trim();
    if (!cellVal) continue;
    for (const name of possibleNames) {
      if (cellVal === name || cellVal.includes(name)) {
        return i;
      }
    }
  }
  return -1;
}

// البحث عن آخر عمود مدين/دائن (الصافي) في حالة وجود أعمدة مكررة
function findLastColumnIndex(headerRow: any[], possibleNames: string[]): number {
  let lastIndex = -1;
  for (let i = 0; i < headerRow.length; i++) {
    const cellVal = String(headerRow[i] ?? '').trim();
    if (!cellVal) continue;
    for (const name of possibleNames) {
      if (cellVal === name || cellVal.includes(name)) {
        lastIndex = i;
      }
    }
  }
  return lastIndex;
}

// تحليل هيكل الأعمدة المعقد (أعمدة مدمجة متعددة الصفوف)
interface ColumnMapping {
  codeCol: number;
  nameCol: number;
  debitCol: number;
  creditCol: number;
  headerRowIndex: number;
  dataStartRow: number;
}

function detectColumnMapping(rawData: any[][]): ColumnMapping | null {
  // البحث في أول 10 صفوف عن صف العناوين
  const maxScanRows = Math.min(10, rawData.length);
  
  for (let rowIdx = 0; rowIdx < maxScanRows; rowIdx++) {
    const row = rawData[rowIdx];
    if (!row || row.length < 3) continue;
    
    const rowStr = row.map(c => String(c ?? '').trim());
    
    // البحث عن عمود الاسم - هذا هو المؤشر الأساسي لصف العناوين
    const nameCol = findColumnIndex(rowStr, TB_COLUMN_MAPPINGS.name);
    if (nameCol === -1) continue;
    
    // البحث عن عمود الرمز
    const codeCol = findColumnIndex(rowStr, TB_COLUMN_MAPPINGS.code);
    
    // البحث عن أعمدة المدين والدائن
    // في حالة ميزان المراجعة متعدد الأعمدة، نأخذ آخر مدين/دائن (الصافي)
    const debitIndices: number[] = [];
    const creditIndices: number[] = [];
    
    for (let i = 0; i < rowStr.length; i++) {
      const cell = rowStr[i];
      if (!cell) continue;
      
      for (const name of TB_COLUMN_MAPPINGS.debit) {
        if (cell === name || cell.includes(name)) {
          debitIndices.push(i);
          break;
        }
      }
      for (const name of TB_COLUMN_MAPPINGS.credit) {
        if (cell === name || cell.includes(name)) {
          creditIndices.push(i);
          break;
        }
      }
    }
    
    if (debitIndices.length === 0 || creditIndices.length === 0) continue;
    
    // تحديد أي أعمدة مدين/دائن نستخدم
    let debitCol: number;
    let creditCol: number;
    
    if (debitIndices.length >= 3 && creditIndices.length >= 3) {
      // 6 أعمدة: رصيد سابق + حركة + صافي → نأخذ آخر اثنين (الصافي)
      debitCol = debitIndices[debitIndices.length - 1];
      creditCol = creditIndices[creditIndices.length - 1];
    } else if (debitIndices.length === 2 && creditIndices.length === 2) {
      // 4 أعمدة → نأخذ آخر اثنين
      debitCol = debitIndices[1];
      creditCol = creditIndices[1];
    } else {
      // عمودين فقط → نأخذهم مباشرة
      debitCol = debitIndices[0];
      creditCol = creditIndices[0];
    }
    
    // التحقق من وجود صف عناوين أعلى (مدمج) - الصف السابق
    let hasParentHeaders = false;
    if (rowIdx > 0) {
      const prevRow = rawData[rowIdx - 1];
      if (prevRow) {
        const prevStr = prevRow.map(c => String(c ?? '').trim()).join(' ');
        for (const keywords of Object.values(TB_PARENT_HEADERS)) {
          for (const kw of keywords) {
            if (prevStr.includes(kw)) {
              hasParentHeaders = true;
              break;
            }
          }
          if (hasParentHeaders) break;
        }
      }
    }
    
    // إذا وجدنا الصف الأب، نحتاج تحديد أعمدة الصافي بدقة
    if (hasParentHeaders && rowIdx > 0) {
      const parentRow = rawData[rowIdx - 1].map((c: any) => String(c ?? '').trim());
      
      // البحث عن موقع "الصافي" في الصف الأب
      let closingStartCol = -1;
      for (let i = 0; i < parentRow.length; i++) {
        const cell = parentRow[i];
        if (!cell) continue;
        for (const kw of TB_PARENT_HEADERS.closing) {
          if (cell.includes(kw)) {
            closingStartCol = i;
            break;
          }
        }
        if (closingStartCol !== -1) break;
      }
      
      // إذا وجدنا عنوان "الصافي"، نبحث عن مدين/دائن تحته
      if (closingStartCol !== -1) {
        const subDebit = debitIndices.find(i => i >= closingStartCol);
        const subCredit = creditIndices.find(i => i >= closingStartCol);
        if (subDebit !== undefined) debitCol = subDebit;
        if (subCredit !== undefined) creditCol = subCredit;
      }
    }
    
    console.log(`📊 TB Column Detection: row=${rowIdx}, code=${codeCol}, name=${nameCol}, debit=${debitCol}, credit=${creditCol}, debitCols=${debitIndices}, creditCols=${creditIndices}`);
    
    return {
      codeCol: codeCol !== -1 ? codeCol : 0,
      nameCol,
      debitCol,
      creditCol,
      headerRowIndex: rowIdx,
      dataStartRow: rowIdx + 1,
    };
  }
  
  return null;
}

// تحليل ملف ميزان المراجعة (Excel أو CSV)
export async function parseTrialBalanceFile(file: File): Promise<ImportedTrialBalance> {
  const rows: TrialBalanceRow[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (file.name.endsWith('.csv')) {
    // تحليل CSV
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    if (lines.length < 2) {
      throw new Error('الملف فارغ أو لا يحتوي على بيانات كافية');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const rowObj: any = {};
      headers.forEach((h, idx) => { rowObj[h] = values[idx] || ''; });
      
      const code = findValue(rowObj, TB_COLUMN_MAPPINGS.code);
      const name = findValue(rowObj, TB_COLUMN_MAPPINGS.name);
      
      if (!code || !name) continue;
      
      const debit = parseNumber(findValue(rowObj, TB_COLUMN_MAPPINGS.debit));
      const credit = parseNumber(findValue(rowObj, TB_COLUMN_MAPPINGS.credit));
      const mappedType = autoMapAccount(code, name);
      
      rows.push({
        code,
        name,
        debit,
        credit,
        mappedType,
        isAutoMapped: mappedType !== 'unmapped',
        isValid: true,
      });
    }
  } else {
    // تحليل Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = await readExcelFile(arrayBuffer);
    
    // البحث عن ورقة ميزان المراجعة
    let targetSheet = workbook.Sheets[workbook.SheetNames[0]];
    for (const sheetName of workbook.SheetNames) {
      const nameLower = sheetName.toLowerCase();
      if (nameLower.includes('ميزان') || nameLower.includes('trial') || nameLower.includes('balance')) {
        targetSheet = workbook.Sheets[sheetName];
        break;
      }
    }
    
    const rawData = targetSheet.data;
    
    // محاولة التحليل الذكي أولاً (للهياكل المعقدة مثل أعمدة مدمجة)
    const colMapping = detectColumnMapping(rawData);
    
    if (colMapping) {
      console.log('📊 Using smart column detection:', colMapping);
      
      for (let i = colMapping.dataStartRow; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length < 3) continue;
        
        const codeVal = row[colMapping.codeCol];
        const nameVal = row[colMapping.nameCol];
        const debitVal = row[colMapping.debitCol];
        const creditVal = row[colMapping.creditCol];
        
        const code = String(codeVal ?? '').trim();
        const name = String(nameVal ?? '').trim();
        
        // تجاهل صفوف العناوين والإجماليات والصفوف الفارغة
        if (!code && !name) continue;
        if (!code || isNaN(Number(code))) {
          // قد يكون عنوان قسم - تجاهل
          if (!name || name.includes('إجمالي') || name.includes('المجموع') || name.includes('الرقم')) continue;
          // إذا كان هناك اسم بدون رقم، تجاهل إلا إذا كان حساب فعلي
          continue;
        }
        
        const debit = parseNumber(debitVal);
        const credit = parseNumber(creditVal);
        
        // تجاهل الصفوف التي ليس فيها أي قيمة
        if (debit === 0 && credit === 0) {
          // تحقق من وجود قيم في أي عمود آخر
          const hasAnyValue = row.some((cell: any, idx: number) => {
            if (idx === colMapping.codeCol || idx === colMapping.nameCol) return false;
            return parseNumber(cell) !== 0;
          });
          if (!hasAnyValue) continue;
        }
        
        const mappedType = autoMapAccount(code, name);
        
        rows.push({
          code,
          name,
          debit,
          credit,
          mappedType,
          isAutoMapped: mappedType !== 'unmapped',
          isValid: true,
        });
      }
    } else {
      // الطريقة التقليدية: استخدام jsonData (الصف الأول كعناوين)
      console.log('📊 Falling back to jsonData parsing');
      const data = targetSheet.jsonData;
      
      for (const row of data) {
        const code = findValue(row, TB_COLUMN_MAPPINGS.code);
        const name = findValue(row, TB_COLUMN_MAPPINGS.name);
        
        if (!code || !name) continue;
        
        const debit = parseNumber(findValue(row, TB_COLUMN_MAPPINGS.debit));
        const credit = parseNumber(findValue(row, TB_COLUMN_MAPPINGS.credit));
        const mappedType = autoMapAccount(code, name);
        
        rows.push({
          code,
          name,
          debit,
          credit,
          mappedType,
          isAutoMapped: mappedType !== 'unmapped',
          isValid: true,
        });
      }
    }
  }
  
  if (rows.length === 0) {
    throw new Error('لم يتم العثور على بيانات في الملف. تأكد من أن الأعمدة تحتوي على: رمز الحساب، اسم الحساب، مدين، دائن');
  }
  
  // إضافة تحذيرات للحسابات غير المصنفة
  const unmappedRows = rows.filter(r => r.mappedType === 'unmapped');
  if (unmappedRows.length > 0) {
    warnings.push(`${unmappedRows.length} حساب غير مصنف تلقائياً - يرجى تصنيفها يدوياً`);
  }
  
  // التحقق من توازن الميزان
  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;
  
  if (!isBalanced) {
    errors.push(`ميزان المراجعة غير متوازن: الفرق = ${difference.toFixed(2)}`);
  }
  
  const validation: TrialBalanceValidation = {
    isBalanced,
    totalDebit,
    totalCredit,
    difference,
    missingAccounts: [],
    warnings,
    errors,
  };
  
  return {
    rows,
    validation,
    fileName: file.name,
    importDate: new Date().toISOString(),
  };
}

// توليد القوائم المالية من ميزان المراجعة المستورد
export function generateFinancialStatementsFromTB(
  rows: TrialBalanceRow[],
  companyName: string,
  reportDate: string
) {
  // تصنيف الحسابات
  const getNetBalance = (row: TrialBalanceRow) => {
    if (['current_liabilities', 'non_current_liabilities', 'equity', 'revenue'].includes(row.mappedType)) {
      return row.credit - row.debit;
    }
    return row.debit - row.credit;
  };
  
  const currentAssets = rows.filter(r => r.mappedType === 'current_assets');
  const nonCurrentAssets = rows.filter(r => r.mappedType === 'non_current_assets');
  const currentLiabilities = rows.filter(r => r.mappedType === 'current_liabilities');
  const nonCurrentLiabilities = rows.filter(r => r.mappedType === 'non_current_liabilities');
  const equityRows = rows.filter(r => r.mappedType === 'equity');
  const revenueRows = rows.filter(r => r.mappedType === 'revenue');
  const cogsRows = rows.filter(r => r.mappedType === 'cogs');
  const expenseRows = rows.filter(r => r.mappedType === 'expenses');

  // قائمة المركز المالي
  const currentAssetsItems = currentAssets.map(r => ({ name: r.name, amount: getNetBalance(r) })).filter(a => a.amount !== 0);
  const nonCurrentAssetsItems = nonCurrentAssets.map(r => ({ name: r.name, amount: getNetBalance(r) })).filter(a => a.amount !== 0);
  const currentLiabilitiesItems = currentLiabilities.map(r => ({ name: r.name, amount: getNetBalance(r) })).filter(a => a.amount !== 0);
  const nonCurrentLiabilitiesItems = nonCurrentLiabilities.map(r => ({ name: r.name, amount: getNetBalance(r) })).filter(a => a.amount !== 0);
  const equityItems = equityRows.map(r => ({ name: r.name, amount: getNetBalance(r) })).filter(a => a.amount !== 0);

  const totalCurrentAssets = currentAssetsItems.reduce((s, a) => s + a.amount, 0);
  const totalNonCurrentAssets = nonCurrentAssetsItems.reduce((s, a) => s + a.amount, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = currentLiabilitiesItems.reduce((s, l) => s + l.amount, 0);
  const totalNonCurrentLiabilities = nonCurrentLiabilitiesItems.reduce((s, l) => s + l.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  // قائمة الدخل
  const totalRevenue = revenueRows.reduce((s, r) => s + getNetBalance(r), 0);
  const costOfRevenue = cogsRows.reduce((s, r) => s + Math.abs(getNetBalance(r)), 0);
  const grossProfit = totalRevenue - costOfRevenue;
  const generalAndAdminExpenses = expenseRows.reduce((s, r) => s + Math.abs(getNetBalance(r)), 0);
  const operatingProfit = grossProfit - generalAndAdminExpenses;
  const profitBeforeZakat = operatingProfit;

  // الزكاة
  const capitalAccount = equityRows.find(r => r.code.startsWith('31'));
  const capitalValue = capitalAccount ? getNetBalance(capitalAccount) : 0;
  const totalEquityFromAccounts = equityItems.reduce((s, e) => s + e.amount, 0);
  const zakatBase = Math.max(0, totalEquityFromAccounts + profitBeforeZakat - totalNonCurrentAssets);
  const zakat = zakatBase > 0 ? zakatBase * 0.025 : 0;
  const netProfit = profitBeforeZakat - zakat;
  const totalEquity = totalEquityFromAccounts + netProfit;

  // النقد والبنوك
  const cashAccounts = currentAssets.filter(r =>
    r.code.startsWith('11') || r.name.includes('نقد') || r.name.includes('بنك') || r.name.includes('صندوق')
  );

  return {
    companyName,
    companyType: 'مؤسسة فردية',
    reportDate,
    currency: 'ريال سعودي',
    balanceSheet: {
      currentAssets: currentAssetsItems,
      totalCurrentAssets,
      nonCurrentAssets: nonCurrentAssetsItems,
      totalNonCurrentAssets,
      totalAssets,
      currentLiabilities: currentLiabilitiesItems,
      totalCurrentLiabilities,
      nonCurrentLiabilities: nonCurrentLiabilitiesItems,
      totalNonCurrentLiabilities,
      totalLiabilities,
      equity: [...equityItems, { name: 'صافي ربح السنة', amount: netProfit }].filter(e => e.amount !== 0),
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    },
    incomeStatement: {
      revenue: totalRevenue,
      costOfRevenue,
      grossProfit,
      generalAndAdminExpenses,
      operatingProfit,
      financingCost: 0,
      gainsLossesFromDisposals: 0,
      profitBeforeZakat,
      zakat,
      netProfit,
      otherComprehensiveIncome: 0,
      totalComprehensiveIncome: netProfit,
    },
    equityChanges: {
      periods: [{
        label: 'السنة الحالية',
        rows: [
          { description: 'الرصيد في بداية السنة', capital: capitalValue, statutoryReserve: 0, retainedEarnings: 0, total: capitalValue },
          { description: 'صافي الربح للسنة', capital: 0, statutoryReserve: 0, retainedEarnings: netProfit, total: netProfit },
          { description: 'الرصيد في نهاية السنة', capital: capitalValue, statutoryReserve: 0, retainedEarnings: netProfit, total: totalEquity },
        ],
      }],
    },
    cashFlow: {
      operatingActivities: {
        profitBeforeZakat,
        adjustmentsToReconcile: [],
        changesInWorkingCapital: [],
        zakatPaid: 0,
        employeeBenefitsPaid: 0,
        netOperatingCashFlow: netProfit,
      },
      investingActivities: [],
      netInvestingCashFlow: 0,
      financingActivities: [],
      netFinancingCashFlow: 0,
      netChangeInCash: netProfit,
      openingCashBalance: 0,
      closingCashBalance: cashAccounts.reduce((s, r) => s + (r.debit - r.credit), 0),
    },
    notes: {
      cashAndBank: {
        items: cashAccounts.map(r => ({ name: r.name, amount: r.debit - r.credit })).filter(a => a.amount !== 0),
        total: cashAccounts.reduce((s, r) => s + (r.debit - r.credit), 0),
      },
      costOfRevenue: {
        items: cogsRows.map(r => ({ name: r.name, amount: Math.abs(getNetBalance(r)) })).filter(a => a.amount !== 0),
        total: costOfRevenue,
      },
      generalAndAdminExpenses: {
        items: expenseRows.map(r => ({ name: r.name, amount: Math.abs(getNetBalance(r)) })).filter(a => a.amount !== 0),
        total: generalAndAdminExpenses,
      },
      creditors: {
        items: [...currentLiabilitiesItems, ...nonCurrentLiabilitiesItems],
        total: totalLiabilities,
      },
      capital: capitalAccount ? {
        description: 'رأس مال الشركة',
        partners: [{ name: 'رأس المال', sharesCount: 1, shareValue: capitalValue, totalValue: capitalValue }],
        totalShares: 1,
        totalValue: capitalValue,
      } : undefined,
      zakat: {
        profitBeforeZakat,
        adjustmentsOnNetIncome: 0,
        adjustedNetProfit: profitBeforeZakat,
        zakatOnAdjustedProfit: profitBeforeZakat * 0.025,
        capital: capitalValue,
        partnersCurrentAccount: 0,
        statutoryReserve: 0,
        employeeBenefitsLiabilities: 0,
        zakatBaseSubtotal: totalEquityFromAccounts + profitBeforeZakat,
        fixedAssetsNet: totalNonCurrentAssets,
        intangibleAssetsNet: 0,
        prepaidRentLongTerm: 0,
        other: 0,
        totalDeductions: totalNonCurrentAssets,
        zakatBase,
        zakatOnBase: zakat,
        totalZakatProvision: zakat,
        openingBalance: 0,
        provisionForYear: zakat,
        paidDuringYear: 0,
        closingBalance: zakat,
        zakatStatus: 'تم احتساب مخصص الزكاة بطريقة صافي الأصول',
      },
    },
  };
}
