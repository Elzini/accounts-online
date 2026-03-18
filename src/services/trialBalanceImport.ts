// خدمة استيراد ميزان المراجعة وربط الحسابات تلقائياً
import { readExcelFile, sheetToJson } from '@/lib/excelUtils';

export interface TrialBalanceRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
  movementDebit: number;
  movementCredit: number;
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
// الترتيب: 1=أصول، 2=خصوم وحقوق ملكية، 3=إيرادات، 4=مصروفات
const AUTO_MAPPING_RULES: { prefix: string; type: AccountMappingType; label: string }[] = [
  // === 1 - الأصول ===
  { prefix: '11', type: 'non_current_assets', label: 'أصول ثابتة (صافي الأصول الثابتة)' },
  { prefix: '12', type: 'current_assets', label: 'أصول متداولة (بنوك، عهد)' },
  { prefix: '13', type: 'current_assets', label: 'حسابات مدينة أخرى' },
  { prefix: '14', type: 'current_assets', label: 'أصول متداولة أخرى' },
  { prefix: '15', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '16', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '17', type: 'non_current_assets', label: 'استثمارات' },
  { prefix: '18', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '19', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '1', type: 'current_assets', label: 'أصول' },

  // === 2 - الخصوم وحقوق الملكية ===
  { prefix: '21', type: 'current_liabilities', label: 'خصوم متداولة' },
  { prefix: '22', type: 'current_liabilities', label: 'خصوم متداولة' },
  { prefix: '23', type: 'current_liabilities', label: 'أرصدة دائنة أخرى' },
  { prefix: '24', type: 'non_current_liabilities', label: 'خصوم غير متداولة' },
  { prefix: '25', type: 'equity', label: 'حقوق الملكية ورأس المال' },
  { prefix: '26', type: 'equity', label: 'حقوق ملكية' },
  { prefix: '2', type: 'current_liabilities', label: 'خصوم' },

  // === 3 - الإيرادات ===
  { prefix: '31', type: 'revenue', label: 'المبيعات' },
  { prefix: '32', type: 'revenue', label: 'إيرادات أخرى' },
  { prefix: '3', type: 'revenue', label: 'إيرادات' },

  // === 4 - المصروفات ===
  { prefix: '41', type: 'expenses', label: 'المصاريف العمومية والإدارية' },
  { prefix: '42', type: 'expenses', label: 'مصروفات أخرى' },
  { prefix: '43', type: 'expenses', label: 'مصروفات' },
  { prefix: '44', type: 'expenses', label: 'مصاريف التشغيل' },
  { prefix: '45', type: 'cogs', label: 'المشتريات' },
  { prefix: '46', type: 'expenses', label: 'مصروفات' },
  { prefix: '4', type: 'expenses', label: 'مصروفات' },

  // === دعم الترميز القديم (5xxx، 6xxx) ===
  { prefix: '51', type: 'cogs', label: 'تكلفة البضاعة المباعة' },
  { prefix: '52', type: 'expenses', label: 'مصروفات تشغيلية' },
  { prefix: '53', type: 'expenses', label: 'مصروفات إدارية' },
  { prefix: '54', type: 'expenses', label: 'مصروفات عمومية' },
  { prefix: '55', type: 'expenses', label: 'مصروفات أخرى' },
  { prefix: '5', type: 'expenses', label: 'مصروفات' },
  { prefix: '6', type: 'expenses', label: 'مصروفات' },
];

// قواعد الربط بالاسم العربي - مرتبة من الأكثر تحديداً إلى الأعم
const NAME_MAPPING_RULES: { keywords: string[]; type: AccountMappingType }[] = [
  // === أصول متداولة (Current Assets) ===
  { keywords: ['نقد', 'صندوق', 'كاش', 'خزينة', 'cash'], type: 'current_assets' },
  { keywords: ['بنك', 'مصرف', 'bank', 'حساب جاري'], type: 'current_assets' },
  { keywords: ['عملاء', 'ذمم مدينة', 'مدينون', 'حسابات مدينة', 'receivable'], type: 'current_assets' },
  { keywords: ['مخزون', 'بضاعة', 'بضائع', 'مواد', 'inventory', 'stock'], type: 'current_assets' },
  { keywords: ['مصاريف مدفوعة مقدما', 'مصروفات مقدمة', 'دفعات مقدمة', 'prepaid'], type: 'current_assets' },
  { keywords: ['أوراق قبض', 'شيكات محصلة', 'كمبيالات'], type: 'current_assets' },
  { keywords: ['أصول متداولة', 'الأصول المتداولة', 'current assets'], type: 'current_assets' },

  // === أصول غير متداولة (Non-Current Assets) ===
  { keywords: ['أصول ثابتة', 'الأصول الثابتة', 'صافي الأصول الثابتة', 'fixed assets'], type: 'non_current_assets' },
  { keywords: ['أثاث', 'الأثاث', 'مفروشات', 'تجهيزات', 'furniture'], type: 'non_current_assets' },
  { keywords: ['معدات', 'آلات', 'الات', 'اجهزه', 'أجهزة', 'ماكينات', 'equipment', 'machinery'], type: 'non_current_assets' },
  { keywords: ['سيارات', 'مركبات', 'وسائل نقل', 'vehicles'], type: 'non_current_assets' },
  { keywords: ['عقارات', 'مباني', 'أراضي', 'ارض', 'buildings', 'land'], type: 'non_current_assets' },
  { keywords: ['استهلاك', 'إهلاك', 'اهلاك', 'مجمع الاستهلاك', 'مجمع الإهلاك', 'depreciation'], type: 'non_current_assets' },
  { keywords: ['استثمارات طويلة', 'استثمارات', 'investments'], type: 'non_current_assets' },
  { keywords: ['أصول غير متداولة', 'الأصول غير المتداولة', 'non-current'], type: 'non_current_assets' },
  { keywords: ['شهرة', 'goodwill', 'أصول غير ملموسة', 'برامج', 'حقوق'], type: 'non_current_assets' },

  // === مطلوبات متداولة (Current Liabilities) ===
  { keywords: ['موردين', 'موردون', 'دائنون', 'ذمم دائنة', 'حسابات دائنة', 'payable'], type: 'current_liabilities' },
  { keywords: ['أوراق دفع', 'شيكات مستحقة'], type: 'current_liabilities' },
  { keywords: ['ضريبة القيمة المضافة', 'ضريبة مستحقة', 'vat', 'زكاة مستحقة'], type: 'current_liabilities' },
  { keywords: ['رواتب مستحقة', 'أجور مستحقة', 'مستحقات الموظفين'], type: 'current_liabilities' },
  { keywords: ['مصاريف مستحقة', 'مصروفات مستحقة', 'التزامات متداولة', 'accrued'], type: 'current_liabilities' },
  { keywords: ['إيرادات مقدمة', 'إيرادات مؤجلة', 'دفعات مقدمة من عملاء', 'unearned'], type: 'current_liabilities' },
  { keywords: ['قروض قصيرة', 'تسهيلات بنكية', 'سحب على المكشوف'], type: 'current_liabilities' },
  { keywords: ['مطلوبات متداولة', 'المطلوبات المتداولة', 'خصوم متداولة', 'current liabilities'], type: 'current_liabilities' },

  // === مطلوبات غير متداولة (Non-Current Liabilities) ===
  { keywords: ['قروض طويلة', 'قروض بنكية طويلة', 'تمويل طويل', 'long-term'], type: 'non_current_liabilities' },
  { keywords: ['مكافأة نهاية الخدمة', 'مكافآت نهاية', 'end of service'], type: 'non_current_liabilities' },
  { keywords: ['مطلوبات غير متداولة', 'المطلوبات غير المتداولة', 'خصوم غير متداولة'], type: 'non_current_liabilities' },

  // === حقوق ملكية (Equity) ===
  { keywords: ['رأس المال', 'رأسمال', 'رأس مال', 'capital'], type: 'equity' },
  { keywords: ['احتياطي', 'الاحتياطي', 'reserve'], type: 'equity' },
  { keywords: ['أرباح محتجزة', 'أرباح مبقاة', 'أرباح مرحلة', 'retained'], type: 'equity' },
  { keywords: ['جاري الشريك', 'جاري المالك', 'حساب المالك', 'جاري صاحب', 'مسحوبات'], type: 'equity' },
  { keywords: ['حقوق ملكية', 'حقوق المساهمين', 'حقوق الملاك', 'equity'], type: 'equity' },
  { keywords: ['أرباح العام', 'صافي الربح', 'صافي الخسارة', 'نتيجة النشاط', 'net income'], type: 'equity' },

  // === إيرادات (Revenue) ===
  { keywords: ['إيراد', 'ايراد', 'إيرادات', 'ايرادات', 'revenue', 'income'], type: 'revenue' },
  { keywords: ['مبيعات', 'المبيعات', 'sales'], type: 'revenue' },
  { keywords: ['خدمات', 'أتعاب', 'عمولات مكتسبة'], type: 'revenue' },
  { keywords: ['إيرادات أخرى', 'دخل آخر', 'other income'], type: 'revenue' },

  // === تكلفة الإيرادات (COGS) ===
  { keywords: ['تكلفة المبيعات', 'تكلفة البضاعة', 'تكلفة الإيرادات', 'تكلفة البضائع', 'cost of goods', 'cogs'], type: 'cogs' },
  { keywords: ['تكاليف مباشرة', 'مواد مباشرة', 'أجور مباشرة'], type: 'cogs' },

  // === مصروفات (Expenses) ===
  { keywords: ['مصروف', 'مصاريف', 'مصروفات', 'نفقات', 'expense'], type: 'expenses' },
  { keywords: ['رواتب', 'أجور', 'salaries', 'wages'], type: 'expenses' },
  { keywords: ['إيجار', 'ايجار', 'rent'], type: 'expenses' },
  { keywords: ['كهرباء', 'ماء', 'هاتف', 'اتصالات', 'utilities'], type: 'expenses' },
  { keywords: ['صيانة', 'إصلاح', 'maintenance'], type: 'expenses' },
  { keywords: ['تأمين', 'insurance'], type: 'expenses' },
  { keywords: ['دعاية', 'إعلان', 'تسويق', 'marketing'], type: 'expenses' },
  { keywords: ['مصاريف إدارية', 'مصاريف عمومية', 'مصاريف تشغيلية', 'operating'], type: 'expenses' },
  { keywords: ['فوائد', 'عمولات بنكية', 'مصاريف بنكية', 'interest'], type: 'expenses' },
  { keywords: ['ضيافة', 'سفر', 'انتقالات', 'بدلات'], type: 'expenses' },
];

// ربط الحساب تلقائياً حسب الرمز ثم الاسم
export function autoMapAccount(code: string, name: string): AccountMappingType {
  const cleanCode = code.trim();
  
  // 1) ربط بالرمز (الأكواد الرقمية فقط)
  if (/^\d/.test(cleanCode)) {
    for (const rule of AUTO_MAPPING_RULES) {
      if (cleanCode.startsWith(rule.prefix)) {
        return rule.type;
      }
    }
  }
  
  // 2) ربط بالاسم - بحث شامل
  const nameNormalized = name.trim();
  
  for (const rule of NAME_MAPPING_RULES) {
    for (const keyword of rule.keywords) {
      if (nameNormalized.includes(keyword)) {
        return rule.type;
      }
    }
  }

  // 3) محاولة أخيرة: الكلمة الجذرية "أصول" بدون تحديد نوع
  if (nameNormalized === 'الأصول' || nameNormalized === 'أصول') {
    return 'current_assets'; // عنوان عام للأصول - نصنفه كأصول متداولة كافتراض
  }
  if (nameNormalized === 'الخصوم' || nameNormalized === 'المطلوبات' || nameNormalized === 'الالتزامات') {
    return 'current_liabilities';
  }
  
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

// تطبيع النص العربي: توحيد ة/ه، إ/أ/آ→ا، حذف التشكيل
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // حذف التشكيل
    .replace(/ة/g, 'ه')                     // ة → ه
    .replace(/[إأآ]/g, 'ا')                  // إ/أ/آ → ا
    .trim();
}

// مطابقة نص مع قائمة أسماء محتملة مع تطبيع عربي
function matchesArabicPattern(cellText: string, patterns: string[]): boolean {
  const normalizedCell = normalizeArabic(cellText);
  for (const pattern of patterns) {
    const normalizedPattern = normalizeArabic(pattern);
    if (normalizedCell === normalizedPattern || normalizedCell.includes(normalizedPattern)) {
      return true;
    }
  }
  return false;
}

// الأعمدة المحتملة لميزان المراجعة
const TB_COLUMN_MAPPINGS = {
  code: ['رمز الحساب', 'الرمز', 'الكود', 'رقم الحساب', 'code', 'account_code', 'Code', 'رقم', 'الرقم', 'كود', 'رمز', 'م', 'ر', 'رقم حساب', 'Account Code', 'Account No', 'Acc Code', 'No'],
  name: ['اسم الحساب', 'الحساب', 'البيان', 'الوصف', 'name', 'account_name', 'Name', 'اسم', 'حساب', 'وصف', 'Account Name', 'Account', 'Description', 'بيان الحساب', 'اسم', 'المسمى'],
  debit: ['مدين', 'مدين إجمالي', 'مجموع مدين', 'رصيد مدين', 'debit', 'Debit', 'المدين', 'مدين نهائي', 'Debit Balance', 'Dr', 'مدينة', 'مدينه'],
  credit: ['دائن', 'دائن إجمالي', 'مجموع دائن', 'رصيد دائن', 'credit', 'Credit', 'الدائن', 'دائن نهائي', 'Credit Balance', 'Cr', 'دائنة', 'دائنه'],
  movementDebit: ['حركة مدينة', 'حركة مدين', 'مدين الحركة', 'حركه مدينه', 'حركه مدين', 'Movement Debit', 'Dr Movement'],
  movementCredit: ['حركة دائنة', 'حركة دائن', 'دائن الحركة', 'حركه دائنه', 'حركه دائن', 'Movement Credit', 'Cr Movement'],
};

// الأعمدة المحتملة لعناوين الصفوف العلوية (الصف المدمج)
const TB_PARENT_HEADERS = {
  closing: ['الصافي', 'الختامي', 'الرصيد النهائي', 'صافي', 'الرصيد الصافي', 'net', 'closing', 'balance', 'الرصيد'],
  movement: ['الحركة', 'حركة', 'movement'],
  opening: ['الرصيد السابق', 'رصيد سابق', 'الافتتاحي', 'opening'],
};

function findValue(row: any, possibleKeys: string[]): string | null {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return String(row[key]).trim();
    }
  }
  // Fallback: partial match on keys
  const rowKeys = Object.keys(row);
  for (const possibleKey of possibleKeys) {
    for (const rowKey of rowKeys) {
      if (rowKey.includes(possibleKey) || possibleKey.includes(rowKey)) {
        if (row[rowKey] !== undefined && row[rowKey] !== null && row[rowKey] !== '') {
          return String(row[rowKey]).trim();
        }
      }
    }
  }
  return null;
}

function parseNumber(val: string | null | number): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  // Handle parentheses as negative: (1,234) => -1234
  let str = String(val).trim();
  const isNegative = str.startsWith('(') && str.endsWith(')');
  if (isNegative) str = str.slice(1, -1);
  const cleaned = str.replace(/[^\d.\-,]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned) || 0;
  return isNegative ? -num : num;
}

// البحث عن فهرس عمود بناءً على الاسم (تطابق جزئي أيضاً)
function findColumnIndex(headerRow: any[], possibleNames: string[]): number {
  // First pass: exact match
  for (let i = 0; i < headerRow.length; i++) {
    const cellVal = String(headerRow[i] ?? '').trim();
    if (!cellVal) continue;
    for (const name of possibleNames) {
      if (cellVal === name) {
        return i;
      }
    }
  }
  // Second pass: cell includes keyword (but cell must be short like a header, not a data cell)
  for (let i = 0; i < headerRow.length; i++) {
    const cellVal = String(headerRow[i] ?? '').trim();
    if (!cellVal || cellVal.length > 30) continue; // skip long values (likely data, not headers)
    for (const name of possibleNames) {
      if (cellVal.includes(name)) {
        return i;
      }
    }
  }
  // Third pass: keyword includes cell (only for very short cell values that are clearly abbreviations)
  for (let i = 0; i < headerRow.length; i++) {
    const cellVal = String(headerRow[i] ?? '').trim();
    if (!cellVal || cellVal.length > 5 || cellVal.length < 1) continue; // only very short abbreviations like "م", "ر"
    for (const name of possibleNames) {
      if (name.includes(cellVal) && name.length <= 10) {
        return i;
      }
    }
  }
  return -1;
}

// التحقق من أن الصف يبدو كصف عناوين وليس صف بيانات
function isLikelyHeaderRow(rowStr: string[]): boolean {
  const nonEmptyCells = rowStr.filter(c => c && c.trim().length > 0);
  if (nonEmptyCells.length < 2) return false;
  
  // صفوف العناوين تتميز بأن خلاياها قصيرة (أقل من 30 حرف عادة)
  const longCells = nonEmptyCells.filter(c => c.length > 30);
  if (longCells.length > nonEmptyCells.length * 0.3) return false;
  
  // صفوف البيانات تحتوي على أرقام مالية كثيرة
  const numericCells = nonEmptyCells.filter(c => /^[\d,.\-()]+$/.test(c.replace(/\s/g, '')));
  if (numericCells.length > nonEmptyCells.length * 0.5) return false;
  
  return true;
}

// البحث عن آخر عمود مدين/دائن (الصافي) في حالة وجود أعمدة مكررة
function findLastColumnIndex(headerRow: any[], possibleNames: string[]): number {
  let lastIndex = -1;
  for (let i = 0; i < headerRow.length; i++) {
    const cellVal = String(headerRow[i] ?? '').trim();
    if (!cellVal) continue;
    for (const name of possibleNames) {
      if (cellVal === name || cellVal.includes(name) || name.includes(cellVal)) {
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
  movementDebitCol: number;
  movementCreditCol: number;
  headerRowIndex: number;
  dataStartRow: number;
}

// فحص إذا كان النص يبدو كرقم حساب (أرقام مع نقاط أو شرطات أو أرقام فقط)
function looksLikeAccountCode(val: string): boolean {
  if (!val) return false;
  const cleaned = val.trim();
  // Pure numbers
  if (/^\d+$/.test(cleaned)) return true;
  // Numbers with dots/dashes: 1.1.1 or 1-1-1
  if (/^[\d.\-/]+$/.test(cleaned) && /\d/.test(cleaned)) return true;
  return false;
}

// فحص إذا كان النص يبدو كاسم حساب (نص عربي أو إنجليزي)
function looksLikeAccountName(val: string): boolean {
  if (!val || val.length < 2) return false;
  // Contains Arabic characters
  if (/[\u0600-\u06FF]/.test(val)) return true;
  // Contains multiple letters
  if (/[a-zA-Z]{2,}/.test(val)) return true;
  return false;
}

// فحص إذا كان النص يبدو كرقم مالي
function looksLikeFinancialNumber(val: any): boolean {
  if (typeof val === 'number') return true;
  if (!val) return false;
  const str = String(val).trim();
  if (str === '' || str === '-' || str === '0') return true;
  // Has digits and optional commas/dots/parentheses
  return /[\d]/.test(str);
}

// التحقق من أن عمود الأكواد يحتوي فعلاً على أرقام حسابات في البيانات
function validateCodeColumn(rawData: any[][], codeCol: number, dataStartRow: number): boolean {
  let validCount = 0;
  const checkRows = Math.min(dataStartRow + 10, rawData.length);
  for (let i = dataStartRow; i < checkRows; i++) {
    const row = rawData[i];
    if (!row) continue;
    const val = String(row[codeCol] ?? '').trim();
    if (val && looksLikeAccountCode(val)) validCount++;
  }
  return validCount >= 2;
}

// البحث عن عمود الأكواد الحقيقي من البيانات (ليس من العناوين)
function findCodeColumnFromData(rawData: any[][], dataStartRow: number, excludeCols: number[]): number {
  const checkRows = Math.min(dataStartRow + 15, rawData.length);
  const maxCols = Math.max(...rawData.slice(dataStartRow, checkRows).map(r => r?.length ?? 0));
  
  let bestCol = -1;
  let bestScore = 0;
  
  for (let col = 0; col < maxCols; col++) {
    if (excludeCols.includes(col)) continue;
    
    let codeCount = 0;
    let totalNonEmpty = 0;
    
    for (let row = dataStartRow; row < checkRows; row++) {
      const val = String(rawData[row]?.[col] ?? '').trim();
      if (!val) continue;
      totalNonEmpty++;
      if (looksLikeAccountCode(val)) codeCount++;
    }
    
    if (codeCount > bestScore && codeCount >= 2) {
      bestScore = codeCount;
      bestCol = col;
    }
  }
  
  return bestCol;
}

// بحث عن أعمدة المدين والدائن في صف معين (مع استبعاد أعمدة الحركة)
function findDebitCreditInRow(rowStr: string[]): { debitIndices: number[]; creditIndices: number[]; movDebitIndices: number[]; movCreditIndices: number[] } {
  const debitIndices: number[] = [];
  const creditIndices: number[] = [];
  const movDebitIndices: number[] = [];
  const movCreditIndices: number[] = [];
  
  for (let i = 0; i < rowStr.length; i++) {
    const cell = rowStr[i];
    if (!cell) continue;
    
    // فحص أعمدة الحركة أولاً باستخدام التطبيع العربي (أولوية أعلى)
    let isMovement = false;
    if (matchesArabicPattern(cell, TB_COLUMN_MAPPINGS.movementDebit)) {
      movDebitIndices.push(i);
      isMovement = true;
    }
    if (!isMovement && matchesArabicPattern(cell, TB_COLUMN_MAPPINGS.movementCredit)) {
      movCreditIndices.push(i);
      isMovement = true;
    }
    
    // إذا كان عمود حركة، لا نضيفه كعمود رصيد
    if (isMovement) continue;
    
    if (matchesArabicPattern(cell, TB_COLUMN_MAPPINGS.debit)) {
      debitIndices.push(i);
    }
    if (matchesArabicPattern(cell, TB_COLUMN_MAPPINGS.credit)) {
      creditIndices.push(i);
    }
  }
  
  return { debitIndices, creditIndices, movDebitIndices, movCreditIndices };
}

// تحديد أي أعمدة مدين/دائن نستخدم بناءً على عددها وموقع الصافي
function resolveDebitCreditColumns(
  debitIndices: number[],
  creditIndices: number[],
  parentRow?: string[]
): { debitCol: number; creditCol: number } {
  // === القاعدة الأساسية: الرصيد النهائي دائماً في آخر (أيمن) الأعمدة ===
  // بغض النظر عن عدد الأعمدة أو ترتيبها، نأخذ الأخير دائماً
  let debitCol = debitIndices[debitIndices.length - 1];
  let creditCol = creditIndices[creditIndices.length - 1];
  
  // التحقق من وجود صف عناوين أعلى (مدمج) لتحديد أعمدة الصافي بدقة أكبر
  if (parentRow) {
    let closingStartCol = -1;
    for (let i = 0; i < parentRow.length; i++) {
      const cell = parentRow[i];
      if (!cell) continue;
      const normalizedCell = normalizeArabic(cell);
      for (const kw of TB_PARENT_HEADERS.closing) {
        if (normalizedCell.includes(normalizeArabic(kw))) {
          closingStartCol = i;
          break;
        }
      }
      if (closingStartCol !== -1) break;
    }
    
    if (closingStartCol !== -1) {
      const subDebit = debitIndices.find(i => i >= closingStartCol);
      const subCredit = creditIndices.find(i => i >= closingStartCol);
      if (subDebit !== undefined) debitCol = subDebit;
      if (subCredit !== undefined) creditCol = subCredit;
    }
  }
  
  console.log(`📊 resolveDebitCreditColumns: debitIndices=${JSON.stringify(debitIndices)}, creditIndices=${JSON.stringify(creditIndices)} → debit=${debitCol}, credit=${creditCol}`);
  
  return { debitCol, creditCol };
}

function detectColumnMapping(rawData: any[][]): ColumnMapping | null {
  const maxScanRows = Math.min(15, rawData.length);
  
  console.log('📊 TB Parser: Scanning first rows for headers...');
  for (let i = 0; i < Math.min(8, rawData.length); i++) {
    console.log(`📊 Row ${i}:`, JSON.stringify(rawData[i]?.map((c: any) => String(c ?? '').trim().substring(0, 30))));
  }
  
  for (let rowIdx = 0; rowIdx < maxScanRows; rowIdx++) {
    const row = rawData[rowIdx];
    if (!row || row.length < 2) continue;
    
    const rowStr = row.map((c: any) => String(c ?? '').trim());
    
    // تخطي الصفوف التي تبدو كصفوف بيانات وليست عناوين
    if (!isLikelyHeaderRow(rowStr)) continue;
    
    // البحث عن عمود الاسم - هذا هو المؤشر الأساسي لصف العناوين
    const nameCol = findColumnIndex(rowStr, TB_COLUMN_MAPPINGS.name);
    if (nameCol === -1) continue;
    
    // البحث عن عمود الرمز من العناوين
    let codeCol = findColumnIndex(rowStr, TB_COLUMN_MAPPINGS.code);
    
    // البحث عن أعمدة المدين والدائن في الصف الحالي
    let { debitIndices, creditIndices, movDebitIndices, movCreditIndices } = findDebitCreditInRow(rowStr);
    
    // === المعالجة الجديدة: إذا لم نجد مدين/دائن في نفس الصف ===
    let subHeaderRowIdx = rowIdx;
    if (debitIndices.length === 0 || creditIndices.length === 0) {
      const nextRowIdx = rowIdx + 1;
      if (nextRowIdx < rawData.length) {
        const nextRow = rawData[nextRowIdx];
        if (nextRow) {
          const nextRowStr = nextRow.map((c: any) => String(c ?? '').trim());
          const nextResult = findDebitCreditInRow(nextRowStr);
          if (nextResult.debitIndices.length > 0 && nextResult.creditIndices.length > 0) {
            console.log(`📊 Found debit/credit sub-headers in next row ${nextRowIdx}`);
            debitIndices = nextResult.debitIndices;
            creditIndices = nextResult.creditIndices;
            // دمج أعمدة الحركة من الصف الفرعي أيضاً
            if (nextResult.movDebitIndices.length > 0) movDebitIndices = nextResult.movDebitIndices;
            if (nextResult.movCreditIndices.length > 0) movCreditIndices = nextResult.movCreditIndices;
            subHeaderRowIdx = nextRowIdx;
          }
        }
      }
    }
    
    if (debitIndices.length === 0 || creditIndices.length === 0) continue;
    
    // تحديد أي أعمدة مدين/دائن نستخدم
    const parentRowData = subHeaderRowIdx > 0 
      ? rawData[subHeaderRowIdx - 1]?.map((c: any) => String(c ?? '').trim())
      : (rowIdx > 0 ? rawData[rowIdx - 1]?.map((c: any) => String(c ?? '').trim()) : undefined);
    
    const { debitCol, creditCol } = resolveDebitCreditColumns(debitIndices, creditIndices, parentRowData);
    
    // === البحث عن أعمدة الحركة ===
    let movementDebitCol = -1;
    let movementCreditCol = -1;
    
    // أولاً: استخدام أعمدة الحركة المكتشفة من findDebitCreditInRow (الأدق)
    if (movDebitIndices.length > 0) {
      movementDebitCol = movDebitIndices[0];
    }
    if (movCreditIndices.length > 0) {
      movementCreditCol = movCreditIndices[0];
    }
    
    // ثانياً: البحث بأسماء أعمدة الحركة المخصصة
    if (movementDebitCol === -1 || movementCreditCol === -1) {
      const searchRow = subHeaderRowIdx !== rowIdx ? rawData[subHeaderRowIdx]?.map((c: any) => String(c ?? '').trim()) : rowStr;
      if (searchRow) {
        if (movementDebitCol === -1) movementDebitCol = findColumnIndex(searchRow, TB_COLUMN_MAPPINGS.movementDebit);
        if (movementCreditCol === -1) movementCreditCol = findColumnIndex(searchRow, TB_COLUMN_MAPPINGS.movementCredit);
      }
    }
    
    // ثالثاً: إذا كان لدينا أعمدة حركة في الصف الأب (merged headers)
    if (movementDebitCol === -1 && parentRowData) {
      for (let i = 0; i < parentRowData.length; i++) {
        const cell = parentRowData[i];
        if (!cell) continue;
        const normalizedCell = normalizeArabic(cell);
        for (const kw of TB_PARENT_HEADERS.movement) {
          if (normalizedCell.includes(normalizeArabic(kw))) {
            const movDebit = debitIndices.find(idx => idx >= i && idx < debitCol);
            const movCredit = creditIndices.find(idx => idx >= i && idx < creditCol);
            if (movDebit !== undefined) movementDebitCol = movDebit;
            if (movCredit !== undefined) movementCreditCol = movCredit;
            break;
          }
        }
      }
    }
    
    console.log(`📊 Final columns: debit=${debitCol}, credit=${creditCol}, movDebit=${movementDebitCol}, movCredit=${movementCreditCol}`);
    
    // === Sanity check: تأكد أن الأعمدة المكتشفة منطقية ===
    const maxReasonableCol = 20; // ميزان المراجعة لا يتجاوز عادة 20 عمود
    if (nameCol > maxReasonableCol || debitCol > maxReasonableCol || creditCol > maxReasonableCol) {
      console.log(`📊 Skipping row ${rowIdx}: column indices too high (name=${nameCol}, debit=${debitCol}, credit=${creditCol})`);
      continue;
    }
    
    const dataStartRow = subHeaderRowIdx + 1;
    
    // === التحقق الذكي: هل عمود الأكواد يحتوي فعلاً على أرقام حسابات؟ ===
    const resolvedCodeCol = codeCol !== -1 ? codeCol : 0;
    if (!validateCodeColumn(rawData, resolvedCodeCol, dataStartRow)) {
      console.log(`📊 Code column ${resolvedCodeCol} failed validation. Scanning data for real code column...`);
      const realCodeCol = findCodeColumnFromData(rawData, dataStartRow, [nameCol, debitCol, creditCol]);
      if (realCodeCol !== -1) {
        codeCol = realCodeCol;
        console.log(`📊 Found real code column at index ${realCodeCol}`);
      } else {
        console.log(`📊 Could not find code column from data, will use name-based mapping`);
      }
    } else {
      if (codeCol === -1) codeCol = 0;
    }
    
    console.log(`📊 TB Column Detection: row=${rowIdx}, subRow=${subHeaderRowIdx}, code=${codeCol}, name=${nameCol}, debit=${debitCol}, credit=${creditCol}, movDebit=${movementDebitCol}, movCredit=${movementCreditCol}`);
    
    return {
      codeCol: codeCol !== -1 ? codeCol : -1,
      nameCol,
      debitCol,
      creditCol,
      movementDebitCol,
      movementCreditCol,
      headerRowIndex: rowIdx,
      dataStartRow,
    };
  }
  
  // === AGGRESSIVE FALLBACK: Auto-detect structure from data patterns ===
  console.log('📊 TB Parser: Header detection failed. Trying aggressive auto-detection...');
  return autoDetectColumns(rawData);
}

// كشف الأعمدة تلقائياً من بنية البيانات بدون الاعتماد على أسماء الأعمدة
function autoDetectColumns(rawData: any[][]): ColumnMapping | null {
  // نبحث عن أول صف يحتوي على بيانات تبدو كحسابات
  for (let startRow = 0; startRow < Math.min(15, rawData.length); startRow++) {
    const row = rawData[startRow];
    if (!row || row.length < 3) continue;
    
    // نبحث عن نمط: رقم حساب + اسم حساب + أرقام مالية
    let codeCol = -1;
    let nameCol = -1;
    const numericCols: number[] = [];
    
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] ?? '').trim();
      if (!val) continue;
      
      if (codeCol === -1 && looksLikeAccountCode(val)) {
        codeCol = c;
      } else if (nameCol === -1 && looksLikeAccountName(val) && val.length > 3) {
        nameCol = c;
      } else if (looksLikeFinancialNumber(row[c]) && typeof row[c] === 'number') {
        numericCols.push(c);
      }
    }
    
    if (codeCol === -1 || nameCol === -1 || numericCols.length < 2) continue;
    
    // تحقق من أن الصفوف التالية لها نفس النمط
    let matchingRows = 0;
    for (let checkRow = startRow; checkRow < Math.min(startRow + 5, rawData.length); checkRow++) {
      const r = rawData[checkRow];
      if (!r) continue;
      const cVal = String(r[codeCol] ?? '').trim();
      const nVal = String(r[nameCol] ?? '').trim();
      if (looksLikeAccountCode(cVal) && looksLikeAccountName(nVal)) {
        matchingRows++;
      }
    }
    
    if (matchingRows >= 2) {
      // آخر عمودين رقميين = مدين/دائن
      const debitCol = numericCols[numericCols.length - 2] ?? numericCols[0];
      const creditCol = numericCols[numericCols.length - 1] ?? numericCols[1];
      
      // هل الصف السابق هو صف عناوين؟
      const headerRowIndex = startRow > 0 ? startRow - 1 : startRow;
      
      console.log(`📊 TB Auto-detect SUCCESS: startRow=${startRow}, code=${codeCol}, name=${nameCol}, debit=${debitCol}, credit=${creditCol}, numericCols=${numericCols}`);
      
      return {
        codeCol,
        nameCol,
        debitCol,
        creditCol,
        movementDebitCol: numericCols.length >= 4 ? numericCols[numericCols.length - 4] ?? -1 : -1,
        movementCreditCol: numericCols.length >= 4 ? numericCols[numericCols.length - 3] ?? -1 : -1,
        headerRowIndex,
        dataStartRow: startRow,
      };
    }
  }
  
  console.log('📊 TB Auto-detect FAILED: Could not identify column structure');
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
      const movementDebit = parseNumber(findValue(rowObj, TB_COLUMN_MAPPINGS.movementDebit));
      const movementCredit = parseNumber(findValue(rowObj, TB_COLUMN_MAPPINGS.movementCredit));
      const mappedType = autoMapAccount(code, name);
      
      rows.push({
        code,
        name,
        debit,
        credit,
        movementDebit,
        movementCredit,
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
      
      const hasCodeCol = colMapping.codeCol !== -1;
      
      for (let i = colMapping.dataStartRow; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length < 2) continue;
        
        // قراءة الكود - إذا لم يتم تحديد عمود الأكواد، نبحث في الصف عن رقم حساب
        let code = '';
        if (hasCodeCol) {
          code = String(row[colMapping.codeCol] ?? '').trim();
        }
        
        // إذا لم نجد كود من العمود المحدد، نبحث في جميع الأعمدة الأخرى
        if (!code || !looksLikeAccountCode(code)) {
          const excludeCols = [colMapping.nameCol, colMapping.debitCol, colMapping.creditCol];
          for (let c = 0; c < row.length; c++) {
            if (excludeCols.includes(c)) continue;
            const val = String(row[c] ?? '').trim();
            if (val && looksLikeAccountCode(val)) {
              code = val;
              break;
            }
          }
        }
        
        const nameVal = row[colMapping.nameCol];
        const debitVal = row[colMapping.debitCol];
        const creditVal = row[colMapping.creditCol];
        
        const name = String(nameVal ?? '').trim();
        
        // تجاهل الصفوف الفارغة تماماً
        if (!code && !name) continue;
        
        // تجاهل صفوف الإجماليات والعناوين
        const skipKeywords = ['إجمالي', 'المجموع', 'الإجمالي', 'مجموع', 'total', 'Total', 'المجاميع'];
        if (skipKeywords.some(kw => name.includes(kw) || code.includes(kw))) continue;
        
        const hasValidCode = looksLikeAccountCode(code);
        const hasValidName = name.length >= 2;
        
        if (!hasValidCode && !hasValidName) continue;
        if (!hasValidCode && hasValidName) {
          const debit = parseNumber(debitVal);
          const credit = parseNumber(creditVal);
          if (debit === 0 && credit === 0) continue;
        }
        
        const debit = parseNumber(debitVal);
        const credit = parseNumber(creditVal);
        
        // قراءة أعمدة الحركة إن وجدت
        const movementDebit = colMapping.movementDebitCol !== -1 ? parseNumber(row[colMapping.movementDebitCol]) : 0;
        const movementCredit = colMapping.movementCreditCol !== -1 ? parseNumber(row[colMapping.movementCreditCol]) : 0;
        
        const mappedType = autoMapAccount(code || '0', name);
        
        rows.push({
          code: code || `AUTO-${i}`,
          name,
          debit,
          credit,
          movementDebit,
          movementCredit,
          mappedType,
          isAutoMapped: mappedType !== 'unmapped',
          isValid: true,
        });
      }
    } else {
      // الطريقة التقليدية: استخدام jsonData (الصف الأول كعناوين)
      console.log('📊 Falling back to jsonData parsing');
      console.log('📊 jsonData keys sample:', targetSheet.jsonData.length > 0 ? Object.keys(targetSheet.jsonData[0]) : 'empty');
      console.log('📊 rawData rows:', rawData.length, 'jsonData rows:', targetSheet.jsonData.length);
      
      const data = targetSheet.jsonData;
      
      for (const row of data) {
        const code = findValue(row, TB_COLUMN_MAPPINGS.code);
        const name = findValue(row, TB_COLUMN_MAPPINGS.name);
        
        if (!name) continue; // نحتاج اسم على الأقل
        
        const debit = parseNumber(findValue(row, TB_COLUMN_MAPPINGS.debit));
        const credit = parseNumber(findValue(row, TB_COLUMN_MAPPINGS.credit));
        const movementDebit = parseNumber(findValue(row, TB_COLUMN_MAPPINGS.movementDebit));
        const movementCredit = parseNumber(findValue(row, TB_COLUMN_MAPPINGS.movementCredit));
        
        // تجاهل الإجماليات
        if (name.includes('إجمالي') || name.includes('المجموع')) continue;
        
        const mappedType = autoMapAccount(code || '0', name);
        
        rows.push({
          code: code || 'N/A',
          name,
          debit,
          credit,
          movementDebit,
          movementCredit,
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
  
  // التحقق من توازن الميزان - نجمع فقط الحسابات الفرعية (leaf accounts)
  // لأن الحسابات الرئيسية (parent accounts) تحتوي على مجموع حساباتها الفرعية
  // وجمعها مع الفرعية يؤدي إلى حساب مزدوج (double counting)
  const allCodes = rows.map(r => r.code.replace(/^AUTO-\d+$/, ''));
  const leafRows = rows.filter(r => {
    const code = r.code;
    if (!code || /^AUTO-\d+$/.test(code)) return true; // حسابات بدون كود تعتبر فرعية
    // الحساب رئيسي إذا كان كود حساب آخر يبدأ بنفس الكود وأطول منه
    const isParent = allCodes.some(otherCode => 
      otherCode !== code && 
      otherCode.length > code.length && 
      otherCode.startsWith(code)
    );
    return !isParent;
  });
  
  const totalDebit = leafRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = leafRows.reduce((sum, r) => sum + r.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;
  
  if (!isBalanced) {
    errors.push(`ميزان المراجعة غير متوازن: الفرق = ${difference.toFixed(2)}`);
  }
  
  // تحذير إذا تم استبعاد حسابات رئيسية
  const parentCount = rows.length - leafRows.length;
  if (parentCount > 0) {
    warnings.push(`تم استبعاد ${parentCount} حساب رئيسي (عنوان) من حساب التوازن لتجنب الحساب المزدوج`);
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
      sellingAndMarketingExpenses: 0,
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
