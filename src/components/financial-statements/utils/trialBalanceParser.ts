import { ComprehensiveFinancialData } from '../types';
import { parseArabicNumber } from './numberFormatting';

export function parseTrialBalanceSheet(rows: any[][], result: ComprehensiveFinancialData) {
  console.log('📊 Parsing Trial Balance Sheet - Total rows:', rows.length);
  
  // استخراج معلومات الشركة من الصفوف الأولى
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row) continue;
    
    const rowText = row.map((c: any) => String(c || '')).join(' ').trim();
    
    // اسم الشركة
    if (!result.companyName && rowText.length > 5) {
      const firstCell = String(row[0] || '').trim();
      // تجاهل الخلايا التي تحتوي على عناوين
      if (firstCell.length > 5 && !firstCell.includes('ميزان') && !firstCell.includes('Report') && 
          !firstCell.includes('Vat') && !firstCell.includes('الصفحة')) {
        // ابحث عن أول خلية غير فارغة
        for (const cell of row) {
          const cellText = String(cell || '').trim();
          if (cellText.length > 5 && !cellText.includes('ميزان') && !cellText.includes('Report')) {
            result.companyName = cellText;
            break;
          }
        }
      }
    }
    
    // الرقم الضريبي (يمكن تخزينه في اسم الشركة أو ملاحظة)
    const vatMatch = rowText.match(/3\d{14}/);
    if (vatMatch) {
      // نضيفه لاسم الشركة إذا لم يكن موجوداً
      console.log('📊 Found VAT Number:', vatMatch[0]);
    }
    
    // التاريخ
    const dateMatch = rowText.match(/(\d{4}-\d{2}-\d{2})/g);
    if (dateMatch && dateMatch.length >= 1) {
      result.reportDate = dateMatch[dateMatch.length - 1]; // آخر تاريخ (إلى)
    }
  }
  
  // تحديد أعمدة البيانات
  const colMap = detectTrialBalanceColumns(rows);
  console.log('📊 Column Map:', colMap);
  
  if (colMap.startRow === -1) {
    console.warn('⚠️ Could not detect data columns');
    return;
  }
  
  // تصنيف الحسابات
  const accounts = {
    fixedAssets: [] as { name: string; amount: number; code: string }[],
    currentAssets: [] as { name: string; amount: number; code: string }[],
    currentLiabilities: [] as { name: string; amount: number; code: string }[],
    equity: [] as { name: string; amount: number; code: string }[],
    revenue: [] as { name: string; amount: number; code: string }[],
    expenses: [] as { name: string; amount: number; code: string }[],
    purchases: [] as { name: string; amount: number; code: string }[],
  };
  
  // معالجة كل صف من البيانات
  for (let i = colMap.startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    // استخراج البيانات
    const accountName = extractAccountName(row, colMap);
    const accountCode = extractAccountCode(row, colMap);
    const closingDebit = parseNumber(row[colMap.closingDebit]);
    const closingCredit = parseNumber(row[colMap.closingCredit]);
    
    // تجاهل الصفوف الفارغة أو العناوين
    if (!accountName || accountName.length < 2) continue;
    if (accountName.includes('اسم الحساب') || accountName.includes('البيان')) continue;
    
    // تجاهل الحسابات الرئيسية ذات رقم واحد (1، 2، 3، 4)
    if (accountCode.length === 1) continue;
    
    // حساب الصافي
    const netAmount = Math.abs(closingDebit - closingCredit);
    if (netAmount === 0 && closingDebit === 0 && closingCredit === 0) continue;
    
    const displayAmount = Math.max(closingDebit, closingCredit);
    
    // تصنيف الحساب
    const category = categorizeAccountMedad(accountCode, accountName);
    
    console.log(`📌 ${accountCode} - ${accountName}: ${category} = ${displayAmount.toFixed(2)}`);
    
    const accountItem = { name: accountName, amount: displayAmount, code: accountCode };
    
    switch (category) {
      case 'أصول ثابتة':
        accounts.fixedAssets.push(accountItem);
        break;
      case 'أصول متداولة':
        accounts.currentAssets.push(accountItem);
        break;
      case 'خصوم':
        accounts.currentLiabilities.push(accountItem);
        break;
      case 'حقوق ملكية':
        accounts.equity.push(accountItem);
        break;
      case 'إيرادات':
        accounts.revenue.push(accountItem);
        break;
      case 'مشتريات':
        accounts.purchases.push(accountItem);
        break;
      case 'مصروفات':
        accounts.expenses.push(accountItem);
        break;
    }
  }
  
  // تحويل الحسابات إلى القوائم المالية
  buildFinancialStatements(accounts, result);
  
  console.log('📊 Final Result:', {
    totalAssets: result.balanceSheet.totalAssets,
    totalLiabilities: result.balanceSheet.totalLiabilities,
    totalEquity: result.balanceSheet.totalEquity,
    revenue: result.incomeStatement.revenue,
    expenses: result.incomeStatement.generalAndAdminExpenses,
  });
}

// ===== أدوات مساعدة لاكتشاف الأعمدة بشكل مرن =====
export function normalizeHeaderCell(value: any): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '') // تشكيل
    .replace(/[\u200f\u200e]/g, '') // اتجاه النص
    .replace(/\s+/g, ' ')
    .trim();
}

export function includesAny(text: string, needles: string[]) {
  return needles.some(n => text.includes(n));
}

const HEADER_KEYWORDS = {
  debit: ['مدين', 'المدين', 'debit', 'dr', 'd.r', 'd'],
  credit: ['دائن', 'الدائن', 'credit', 'cr', 'c.r', 'c'],
  name: ['اسم الحساب', 'البيان', 'الحساب', 'account name', 'name'],
  code: ['الرقم', 'رقم الحساب', 'الكود', 'كود', 'code', 'account no', 'account number'],
  opening: ['رصيد سابق', 'افتتاح', 'opening', 'previous', 'begin'],
  movement: ['الحركة', 'دوران', 'movement', 'turnover'],
  closing: ['ختام', 'ختامي', 'الصافي', 'الرصيد الختامي', 'closing', 'ending', 'net'],
};

// تحديد أعمدة ميزان المراجعة - يدعم أكثر من تنسيق (RTL/LTR) وعناوين متعددة
// الهدف: استخراج أعمدة (Opening/Movement/Closing) لكل من (Debit/Credit)
export function detectTrialBalanceColumns(rows: any[][]): {
  startRow: number;
  nameCol: number;
  codeCol: number;
  openingDebit: number;
  openingCredit: number;
  movementDebit: number;
  movementCredit: number;
  closingDebit: number;
  closingCredit: number;
} {
  const result = {
    startRow: -1,
    nameCol: -1,
    codeCol: -1,
    openingDebit: -1,
    openingCredit: -1,
    movementDebit: -1,
    movementCredit: -1,
    closingDebit: -1,
    closingCredit: -1,
  };

  type Pair = { debit: number; credit: number; section: 'opening' | 'movement' | 'closing' | 'unknown' };

  const inferSection = (headerRow: any[], prevRow: any[] | undefined, colIdx: number): Pair['section'] => {
    const cell = normalizeHeaderCell(headerRow[colIdx]);
    const above = prevRow ? normalizeHeaderCell(prevRow[colIdx]) : '';
    const text = `${above} ${cell}`;
    if (includesAny(text, HEADER_KEYWORDS.opening)) return 'opening';
    if (includesAny(text, HEADER_KEYWORDS.movement)) return 'movement';
    if (includesAny(text, HEADER_KEYWORDS.closing)) return 'closing';
    return 'unknown';
  };

  const pickClosest = (from: number, candidates: number[], used: Set<number>) => {
    let best = -1;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const c of candidates) {
      if (used.has(c)) continue;
      const dist = Math.abs(c - from);
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }
    return best;
  };

  // 1) Try to find a header row that contains Debit/Credit labels (Arabic/English)
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const row = rows[i];
    if (!row) continue;

    const prevRow = i > 0 ? rows[i - 1] : undefined;

    const debitCols: number[] = [];
    const creditCols: number[] = [];

    for (let j = 0; j < row.length; j++) {
      const cellNorm = normalizeHeaderCell(row[j]);
      if (!cellNorm) continue;

      // name/code columns (more flexible)
      if (result.nameCol === -1 && includesAny(cellNorm, HEADER_KEYWORDS.name)) result.nameCol = j;
      if (result.codeCol === -1 && includesAny(cellNorm, HEADER_KEYWORDS.code)) result.codeCol = j;

      if (includesAny(cellNorm, HEADER_KEYWORDS.debit)) debitCols.push(j);
      if (includesAny(cellNorm, HEADER_KEYWORDS.credit)) creditCols.push(j);
    }

    // Need at least 2 pairs to be confident
    if (debitCols.length >= 2 && creditCols.length >= 2) {
      // Build pairs by proximity
      const usedCredits = new Set<number>();
      const pairs: Pair[] = [];
      for (const d of debitCols) {
        const c = pickClosest(d, creditCols, usedCredits);
        if (c === -1) continue;
        usedCredits.add(c);
        const section = inferSection(row, prevRow, d) !== 'unknown'
          ? inferSection(row, prevRow, d)
          : inferSection(row, prevRow, c);
        pairs.push({ debit: d, credit: c, section });
      }

      // Try to map by detected sections first
      const opening = pairs.find(p => p.section === 'opening');
      const movement = pairs.find(p => p.section === 'movement');
      const closing = pairs.find(p => p.section === 'closing');

      // Fallback: if sections not detected, assume LTR order = Opening, Movement, Closing based on column positions
      const pairsSorted = [...pairs].sort((a, b) => Math.min(a.debit, a.credit) - Math.min(b.debit, b.credit));

      const inferredOpening = opening || pairsSorted[0];
      const inferredMovement = movement || pairsSorted[1];
      const inferredClosing = closing || pairsSorted[2] || pairsSorted[pairsSorted.length - 1];

      if (inferredOpening && inferredMovement && inferredClosing) {
        result.startRow = i + 1;
        result.openingDebit = inferredOpening.debit;
        result.openingCredit = inferredOpening.credit;
        result.movementDebit = inferredMovement.debit;
        result.movementCredit = inferredMovement.credit;
        result.closingDebit = inferredClosing.debit;
        result.closingCredit = inferredClosing.credit;

        // If name/code are still unknown, guess them as the last two non-numeric columns
        if (result.nameCol === -1 || result.codeCol === -1) {
          const textCols = row
            .map((v, idx) => ({ idx, v: normalizeHeaderCell(v) }))
            .filter(x => x.v && !includesAny(x.v, [...HEADER_KEYWORDS.debit, ...HEADER_KEYWORDS.credit, ...HEADER_KEYWORDS.opening, ...HEADER_KEYWORDS.movement, ...HEADER_KEYWORDS.closing]));
          // Prefer rightmost columns (common in RTL exports)
          if (textCols.length >= 2) {
            const sorted = textCols.sort((a, b) => b.idx - a.idx);
            // code often more right than name
            if (result.codeCol === -1) result.codeCol = sorted[0].idx;
            if (result.nameCol === -1) result.nameCol = sorted[1].idx;
          }
        }

        console.log('📊 Found header row at:', i);
        console.log('📊 Mapped columns:', result);
        return result;
      }
    }
  }

  // 2) Fallback: find first data-like row and guess columns
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 6) continue;

    // Heuristic: a data row usually has a code (digits) + name (text) + at least 2 numeric cells
    const cells = row.map(v => String(v ?? '').trim());
    const numericIdxs = cells
      .map((c, idx) => ({ idx, c }))
      .filter(x => /[-(]?[0-9٠-٩][0-9٠-٩,\.٬٫\s]*\)?$/.test(x.c) && x.c.length > 0)
      .map(x => x.idx);

    const codeIdx = cells.findIndex(c => /^\d{1,12}$/.test(c));
    const nameIdx = cells.findIndex(c => c.length > 2 && !/^\d+$/.test(c) && !c.includes('مدين') && !c.includes('دائن'));

    if (numericIdxs.length >= 2 && codeIdx !== -1 && nameIdx !== -1) {
      result.startRow = i;
      result.codeCol = codeIdx;
      result.nameCol = nameIdx;

      const nums = [...numericIdxs].sort((a, b) => a - b);
      // Try to take first 6 numeric columns as Closing/Movement/Opening pairs (best effort)
      result.closingDebit = nums[0];
      result.closingCredit = nums[1];
      result.movementDebit = nums[2] ?? nums[0];
      result.movementCredit = nums[3] ?? nums[1];
      result.openingDebit = nums[4] ?? nums[0];
      result.openingCredit = nums[5] ?? nums[1];
      console.log('📊 Fallback: Detected data start at row:', i, 'with columns:', result);
      return result;
    }
  }

  return result;
}

// استخراج اسم الحساب من الصف
export function extractAccountName(row: any[], colMap: any): string {
  // إذا عرفنا عمود الاسم
  if (colMap.nameCol >= 0) {
    return String(row[colMap.nameCol] || '').trim();
  }
  
  // البحث عن أول خلية نصية
  for (let j = 0; j < row.length; j++) {
    const cell = String(row[j] || '').trim();
    if (cell.length > 2 && !/^\d+(\.\d+)?$/.test(cell) && 
        !cell.includes('مدين') && !cell.includes('دائن')) {
      return cell;
    }
  }
  
  return '';
}

// استخراج كود الحساب من الصف
export function extractAccountCode(row: any[], colMap: any): string {
  // إذا عرفنا عمود الكود
  if (colMap.codeCol >= 0) {
    const code = String(row[colMap.codeCol] || '').trim();
    if (/^\d+$/.test(code)) return code;
  }
  
  // البحث من نهاية الصف عن رقم
  for (let j = row.length - 1; j >= 0; j--) {
    const cell = String(row[j] || '').trim();
    if (/^\d+$/.test(cell) && cell.length <= 6) {
      return cell;
    }
  }
  
  return '';
}

// تحويل القيمة إلى رقم
export function parseNumber(value: any): number {
  if (typeof value === 'number' && !isNaN(value)) return Math.abs(value);
  if (typeof value !== 'string') return 0;
  
  const str = value.trim();
  if (!str) return 0;
  
  const negative = str.includes('(') && str.includes(')');
  const cleaned = str
    .replace(/[()]/g, '')
    .replace(/,/g, '')
    .replace(/٬/g, '') // Arabic thousands
    .replace(/٫/g, '.') // Arabic decimal
    .replace(/\s/g, '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))); // Arabic digits
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) return 0;
  return Math.abs(negative ? -num : num);
}

// تصنيف الحساب بناءً على كود مداد - متوافق مع هيكل مداد
// 1xxx = أصول | 2xxx = خصوم (25 = ملكية) | 3xxx = إيرادات (309x = ضريبة) | 4xxx = مصروفات (45 = مشتريات) | 5xxx = ملكية
export function categorizeAccountMedad(code: string, name: string): string {
  const lowerName = name.toLowerCase();
  const arabicName = name;
  
  // 1xxx - الأصول
  if (code.startsWith('1')) {
    // 11xx, 110x, 15xx - الأصول الثابتة (صافي الأصول الثابتة)
    if (code.startsWith('11') || code.startsWith('110') || code.startsWith('15')) {
      return 'أصول ثابتة';
    }
    // 12xx, 13xx, 14xx - الأصول المتداولة (نقد، بنوك، مدينون، مخزون)
    return 'أصول متداولة';
  }
  
  // 2xxx - الخصوم وحقوق الملكية
  if (code.startsWith('2')) {
    // 25xx - حقوق الملكية (جاري المالك، رأس المال)
    if (code.startsWith('25')) {
      return 'حقوق ملكية';
    }
    // 21xx-24xx - الخصوم المتداولة (دائنون، رواتب مستحقة، ضريبة)
    return 'خصوم';
  }
  
  // 3xxx - الإيرادات (المبيعات) أو ضريبة القيمة المضافة
  if (code.startsWith('3')) {
    // 309x - ضريبة القيمة المضافة (مدخلات/مخرجات) - تعامل كخصوم
    if (code.startsWith('309')) {
      return 'خصوم';
    }
    // 31xx - المبيعات
    return 'إيرادات';
  }
  
  // 4xxx - المصروفات والمشتريات
  if (code.startsWith('4')) {
    // 45xx - المشتريات (تكلفة البضاعة المباعة)
    if (code.startsWith('45')) {
      return 'مشتريات';
    }
    // 41xx-44xx - مصاريف عمومية وإدارية
    return 'مصروفات';
  }
  
  // 5xxx - حقوق الملكية (جاري الشركاء)
  if (code.startsWith('5')) {
    return 'حقوق ملكية';
  }
  
  // تصنيف بناءً على الاسم إذا لم يتطابق الكود
  if (arabicName.includes('أثاث') || arabicName.includes('معدات') || arabicName.includes('أجهز') || arabicName.includes('مركب')) return 'أصول ثابتة';
  if (arabicName.includes('بنك') || arabicName.includes('نقد') || arabicName.includes('عهد') || arabicName.includes('مصرف')) return 'أصول متداولة';
  if (arabicName.includes('إيجار مدفوع') || arabicName.includes('مدفوع مقدما')) return 'أصول متداولة';
  if (arabicName.includes('ضريبة') || arabicName.includes('مستحق') || arabicName.includes('دائن')) return 'خصوم';
  if (arabicName.includes('رواتب مستحقة')) return 'خصوم';
  if (arabicName.includes('جاري') || arabicName.includes('رأس المال') || arabicName.includes('ملكية')) return 'حقوق ملكية';
  if (arabicName.includes('مبيعات') || arabicName.includes('إيراد')) return 'إيرادات';
  if (arabicName.includes('مشتريات')) return 'مشتريات';
  if (arabicName.includes('مصروف') || arabicName.includes('مصاريف')) return 'مصروفات';
  
  console.log(`⚠️ Unclassified account: ${code} - ${name}`);
  return 'غير مصنف';
}

// بناء القوائم المالية من الحسابات المصنفة
export function buildFinancialStatements(accounts: any, result: ComprehensiveFinancialData) {
  // قائمة المركز المالي - الأصول غير المتداولة
  let totalNonCurrentAssets = 0;
  accounts.fixedAssets.forEach((acc: any) => {
    result.balanceSheet.nonCurrentAssets.push({
      name: acc.name,
      amount: acc.amount,
      note: acc.code,
    });
    totalNonCurrentAssets += acc.amount;
  });
  result.balanceSheet.totalNonCurrentAssets = totalNonCurrentAssets;
  
  // قائمة المركز المالي - الأصول المتداولة
  let totalCurrentAssets = 0;
  accounts.currentAssets.forEach((acc: any) => {
    result.balanceSheet.currentAssets.push({
      name: acc.name,
      amount: acc.amount,
      note: acc.code,
    });
    totalCurrentAssets += acc.amount;
  });
  result.balanceSheet.totalCurrentAssets = totalCurrentAssets;
  result.balanceSheet.totalAssets = totalNonCurrentAssets + totalCurrentAssets;
  
  // قائمة المركز المالي - المطلوبات المتداولة
  let totalCurrentLiabilities = 0;
  accounts.currentLiabilities.forEach((acc: any) => {
    result.balanceSheet.currentLiabilities.push({
      name: acc.name,
      amount: acc.amount,
      note: acc.code,
    });
    totalCurrentLiabilities += acc.amount;
  });
  result.balanceSheet.totalCurrentLiabilities = totalCurrentLiabilities;
  result.balanceSheet.totalLiabilities = totalCurrentLiabilities;
  
  // قائمة المركز المالي - حقوق الملكية
  let totalEquity = 0;
  accounts.equity.forEach((acc: any) => {
    result.balanceSheet.equity.push({
      name: acc.name,
      amount: acc.amount,
      note: acc.code,
    });
    totalEquity += acc.amount;
  });
  result.balanceSheet.totalEquity = totalEquity;
  result.balanceSheet.totalLiabilitiesAndEquity = totalCurrentLiabilities + totalEquity;
  
  // قائمة الدخل - الإيرادات
  let totalRevenue = 0;
  accounts.revenue.forEach((acc: any) => {
    totalRevenue += acc.amount;
  });
  result.incomeStatement.revenue = totalRevenue;
  
  // قائمة الدخل - المشتريات (تكلفة الإيرادات)
  let totalPurchases = 0;
  accounts.purchases.forEach((acc: any) => {
    totalPurchases += acc.amount;
  });
  result.incomeStatement.costOfRevenue = totalPurchases;
  
  // قائمة الدخل - المصروفات
  let totalExpenses = 0;
  accounts.expenses.forEach((acc: any) => {
    totalExpenses += acc.amount;
  });
  result.incomeStatement.generalAndAdminExpenses = totalExpenses;
  result.incomeStatement.sellingAndMarketingExpenses = 0;
  
  // حساب الأرباح
  result.incomeStatement.grossProfit = totalRevenue - totalPurchases;
  result.incomeStatement.operatingProfit = result.incomeStatement.grossProfit - totalExpenses;
  result.incomeStatement.profitBeforeZakat = result.incomeStatement.operatingProfit;
  result.incomeStatement.netProfit = result.incomeStatement.profitBeforeZakat;
  result.incomeStatement.totalComprehensiveIncome = result.incomeStatement.netProfit;
  
  // إيضاح تكلفة الإيرادات
  if (!result.notes.costOfRevenue) {
    result.notes.costOfRevenue = { items: [], total: 0 };
  }
  accounts.purchases.forEach((acc: any) => {
    result.notes.costOfRevenue!.items.push({
      name: acc.name,
      amount: acc.amount,
    });
  });
  result.notes.costOfRevenue!.total = totalPurchases;
  
  // إيضاح المصاريف الإدارية
  if (!result.notes.generalAndAdminExpenses) {
    result.notes.generalAndAdminExpenses = { items: [], total: 0 };
  }
  accounts.expenses.forEach((acc: any) => {
    result.notes.generalAndAdminExpenses!.items.push({
      name: acc.name,
      amount: acc.amount,
    });
  });
  result.notes.generalAndAdminExpenses!.total = totalExpenses;
  
  // ===== إيضاح مخصص الزكاة (11) - طبقاً لهيكل مداد =====
  const profitBeforeZakat = result.incomeStatement.profitBeforeZakat;
  const adjustedNetProfit = profitBeforeZakat; // يمكن إضافة تعديلات لاحقاً
  const zakatOnAdjustedProfit = Math.max(0, adjustedNetProfit * 0.025);
  
  // استخراج رأس المال وجاري الشركاء من حقوق الملكية
  let capital = 0;
  let partnersCurrentAccount = 0;
  accounts.equity.forEach((acc: any) => {
    const name = acc.name.toLowerCase();
    if (name.includes('رأس المال') || name.includes('رأس مال')) {
      capital += acc.amount;
    } else if (name.includes('جاري') || name.includes('شركاء')) {
      partnersCurrentAccount += acc.amount;
    }
  });
  
  // حساب الوعاء الزكوي
  const zakatBaseSubtotal = capital + partnersCurrentAccount + adjustedNetProfit;
  const fixedAssetsNet = totalNonCurrentAssets;
  const zakatBase = Math.max(0, zakatBaseSubtotal - fixedAssetsNet);
  const zakatOnBase = zakatBase * 0.025;
  
  // إجمالي مخصص الزكاة = الأعلى من (زكاة صافي الربح) أو (زكاة الوعاء)
  const totalZakatProvision = Math.max(zakatOnAdjustedProfit, zakatOnBase);
  
  result.notes.zakat = {
    // أ- احتساب المخصص
    profitBeforeZakat,
    adjustmentsOnNetIncome: 0,
    adjustedNetProfit,
    zakatOnAdjustedProfit,
    
    // الوعاء الزكوي
    capital,
    partnersCurrentAccount,
    statutoryReserve: 0,
    employeeBenefitsLiabilities: 0,
    zakatBaseSubtotal,
    
    // ينزل (الحسميات)
    fixedAssetsNet,
    intangibleAssetsNet: 0,
    other: 0,
    totalDeductions: fixedAssetsNet,
    
    zakatBase,
    zakatOnBase,
    totalZakatProvision,
    
    // ب- حركة المخصص
    openingBalance: 0,
    provisionForYear: totalZakatProvision,
    paidDuringYear: 0,
    closingBalance: totalZakatProvision,
    
    // ج- الموقف الزكوي
    zakatStatus: 'تم إعداد مخصص الزكاة بشكل تقديري بناء على رأي فني في محايد حيث تعتقد إدارة المنشأة أنه كافي وفي حالة وجود فروقات ما بين مخصص الزكاة والربط النهائي سيتم إثباتها كتغيرات في التقديرات المحاسبية في الفترة التي يصدر فيها الربط النهائي.',
  };
  
  // تحديث الزكاة في قائمة الدخل
  result.incomeStatement.zakat = totalZakatProvision;
  result.incomeStatement.netProfit = profitBeforeZakat - totalZakatProvision;
  result.incomeStatement.totalComprehensiveIncome = result.incomeStatement.netProfit;
  
  // ===== إيضاح السياسات المحاسبية (3) =====
  result.notes.accountingPolicies = {
    policies: [
      {
        title: 'أساس الإعداد',
        content: 'تم إعداد هذه القوائم المالية وفقاً للمعايير الدولية للتقرير المالي (IFRS) المعتمدة في المملكة العربية السعودية والمتطلبات الأخرى الصادرة عن الهيئة السعودية للمحاسبين القانونيين.'
      },
      {
        title: 'أساس القياس',
        content: 'تم إعداد القوائم المالية على أساس التكلفة التاريخية باستثناء ما تم الإفصاح عنه بخلاف ذلك.'
      },
      {
        title: 'العملة الوظيفية وعملة العرض',
        content: 'تعرض هذه القوائم المالية بالريال السعودي وهو العملة الوظيفية للشركة.'
      },
      {
        title: 'الإيرادات',
        content: 'يتم الاعتراف بالإيرادات عند انتقال السيطرة على البضاعة أو الخدمات إلى العميل بمبلغ يعكس العوض الذي تتوقع الشركة أن يحق لها مقابل تلك البضائع أو الخدمات.'
      },
      {
        title: 'العقارات والآلات والمعدات',
        content: 'تثبت العقارات والآلات والمعدات بالتكلفة ناقصاً الإهلاك المتراكم وخسائر الانخفاض في القيمة. يحسب الإهلاك باستخدام طريقة القسط الثابت على مدى العمر الإنتاجي المقدر للأصول.'
      },
      {
        title: 'الزكاة',
        content: 'تخضع الشركة لنظام الزكاة المعمول به في المملكة العربية السعودية. يتم احتساب مخصص الزكاة على أساس الوعاء الزكوي وفقاً للقواعد واللوائح الصادرة عن الهيئة العامة للزكاة والدخل.'
      }
    ]
  };
  
  // ===== إيضاح ممتلكات ومعدات (7) - الأصول الثابتة =====
  if (accounts.fixedAssets.length > 0) {
    const categories = accounts.fixedAssets.map((acc: any) => acc.name);
    const amounts = accounts.fixedAssets.map((acc: any) => acc.amount);
    
    result.notes.fixedAssets = {
      categories,
      costOpening: amounts.map(() => 0),
      costAdditions: amounts,
      costDisposals: amounts.map(() => 0),
      costClosing: amounts,
      depreciationOpening: amounts.map(() => 0),
      depreciationAdditions: amounts.map(() => 0),
      depreciationDisposals: amounts.map(() => 0),
      depreciationClosing: amounts.map(() => 0),
      netBookValueClosing: amounts,
      netBookValuePreviousClosing: amounts.map(() => 0),
      totals: {
        costOpening: 0,
        costAdditions: totalNonCurrentAssets,
        costDisposals: 0,
        costClosing: totalNonCurrentAssets,
        depreciationOpening: 0,
        depreciationAdditions: 0,
        depreciationDisposals: 0,
        depreciationClosing: 0,
        netBookValueClosing: totalNonCurrentAssets,
        netBookValuePreviousClosing: 0,
      }
    };
  }
  
  // ===== إيضاح الدائنون (8) =====
  if (accounts.currentLiabilities.length > 0) {
    result.notes.creditors = {
      items: accounts.currentLiabilities.map((acc: any) => ({
        name: acc.name,
        amount: acc.amount,
      })),
      total: totalCurrentLiabilities,
    };
  }
  
  // ===== إيضاح النقد والبنوك (5) =====
  const cashAndBankAccounts = accounts.currentAssets.filter((acc: any) => {
    const name = acc.name.toLowerCase();
    return name.includes('بنك') || name.includes('نقد') || name.includes('مصرف') || name.includes('صندوق');
  });
  if (cashAndBankAccounts.length > 0) {
    result.notes.cashAndBank = {
      items: cashAndBankAccounts.map((acc: any) => ({
        name: acc.name,
        amount: acc.amount,
      })),
      total: cashAndBankAccounts.reduce((sum: number, acc: any) => sum + acc.amount, 0),
    };
  }
}