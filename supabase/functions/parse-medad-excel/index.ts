/**
 * Edge Function: parse-medad-excel
 * Offloads the heavy 1400-line Medad Excel parser from the UI thread.
 * Receives serialized workbook data (sheet arrays) and returns parsed financial data.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============ Utility Functions ============

function parseArabicNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  let str = String(value).trim();
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  arabicNumerals.forEach((ar, en) => { str = str.replace(new RegExp(ar, 'g'), String(en)); });
  const isNegative = str.includes('(') || str.includes('-');
  const numStr = str.replace(/[^\d.]/g, '');
  const num = parseFloat(numStr);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

function extractAmountFromRow(row: any[]): number {
  for (let i = row.length - 1; i >= 0; i--) {
    const val = parseArabicNumber(row[i]);
    if (val !== 0) return val;
  }
  return 0;
}

function extractAccountNameFromRow(row: any[]): string {
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    if (cell && typeof cell === 'string') {
      const trimmed = cell.trim();
      if (trimmed.length > 2 && !/^\d+$/.test(trimmed)) return trimmed;
    }
  }
  return '';
}

function parseNumber(value: any): number {
  if (typeof value === 'number' && !isNaN(value)) return Math.abs(value);
  if (typeof value !== 'string') return 0;
  const str = value.trim();
  if (!str) return 0;
  const negative = str.includes('(') && str.includes(')');
  const cleaned = str.replace(/[()]/g, '').replace(/,/g, '').replace(/٬/g, '').replace(/٫/g, '.').replace(/\s/g, '').replace(/[٠-٩]/g, (d: string) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.abs(negative ? -num : num);
}

// ============ Column Detection ============

function normalizeHeaderCell(value: any): string {
  return String(value ?? '').toLowerCase().replace(/[\u064B-\u0652]/g, '').replace(/[\u200f\u200e]/g, '').replace(/\s+/g, ' ').trim();
}

function includesAny(text: string, needles: string[]) {
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

const MEDAD_SHEET_NAMES = {
  cover: ['الغلاف', 'الفهرس', 'cover', 'index'],
  balanceSheet: ['المركز المالي', 'الميزانية', 'balance sheet', 'قائمة المركز'],
  incomeStatement: ['الدخل', 'قائمة الدخل', 'income statement', 'الأرباح والخسائر'],
  equityChanges: ['التغيرات', 'حقوق الملكية', 'equity changes', 'قائمة التغير'],
  cashFlow: ['التدفق', 'التدفقات النقدية', 'cash flow'],
  policies: ['السياسات', 'policies'],
  notes: ['النقد وأرصدة', 'ممتلكات ومعدات', 'الدائنون', 'مخصص الزكاة', 'المخصصات ورأس المال', 'تكلفة الإيرادات', 'مصاريف ادارية'],
};

// ============ Empty Data Template ============

function createEmptyFinancialData(): any {
  return {
    companyName: '', companyType: 'شركة ذات مسئولية محدودة', reportDate: '', currency: 'ريال سعودي',
    balanceSheet: {
      currentAssets: [], totalCurrentAssets: 0, nonCurrentAssets: [], totalNonCurrentAssets: 0, totalAssets: 0,
      currentLiabilities: [], totalCurrentLiabilities: 0, nonCurrentLiabilities: [], totalNonCurrentLiabilities: 0, totalLiabilities: 0,
      equity: [], totalEquity: 0, totalLiabilitiesAndEquity: 0,
    },
    incomeStatement: {
      revenue: 0, costOfRevenue: 0, grossProfit: 0, sellingAndMarketingExpenses: 0, generalAndAdminExpenses: 0,
      operatingProfit: 0, financingCost: 0, gainsLossesFromDisposals: 0, profitBeforeZakat: 0, zakat: 0,
      netProfit: 0, otherComprehensiveIncome: 0, totalComprehensiveIncome: 0,
    },
    equityChanges: { periods: [] },
    cashFlow: {
      operatingActivities: { profitBeforeZakat: 0, adjustmentsToReconcile: [], changesInWorkingCapital: [], zakatPaid: 0, employeeBenefitsPaid: 0, netOperatingCashFlow: 0 },
      investingActivities: [], netInvestingCashFlow: 0, financingActivities: [], netFinancingCashFlow: 0,
      netChangeInCash: 0, openingCashBalance: 0, closingCashBalance: 0,
    },
    notes: {},
  };
}

// ============ Trial Balance Detection ============

type ColMap = { startRow: number; nameCol: number; codeCol: number; openingDebit: number; openingCredit: number; movementDebit: number; movementCredit: number; closingDebit: number; closingCredit: number };

function detectTrialBalanceColumns(rows: any[][]): ColMap {
  const result: ColMap = { startRow: -1, nameCol: -1, codeCol: -1, openingDebit: -1, openingCredit: -1, movementDebit: -1, movementCredit: -1, closingDebit: -1, closingCredit: -1 };

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
    let best = -1; let bestDist = Number.POSITIVE_INFINITY;
    for (const c of candidates) { if (used.has(c)) continue; const dist = Math.abs(c - from); if (dist < bestDist) { bestDist = dist; best = c; } }
    return best;
  };

  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const row = rows[i]; if (!row) continue;
    const prevRow = i > 0 ? rows[i - 1] : undefined;
    const debitCols: number[] = []; const creditCols: number[] = [];
    for (let j = 0; j < row.length; j++) {
      const cellNorm = normalizeHeaderCell(row[j]); if (!cellNorm) continue;
      if (result.nameCol === -1 && includesAny(cellNorm, HEADER_KEYWORDS.name)) result.nameCol = j;
      if (result.codeCol === -1 && includesAny(cellNorm, HEADER_KEYWORDS.code)) result.codeCol = j;
      if (includesAny(cellNorm, HEADER_KEYWORDS.debit)) debitCols.push(j);
      if (includesAny(cellNorm, HEADER_KEYWORDS.credit)) creditCols.push(j);
    }
    if (debitCols.length >= 2 && creditCols.length >= 2) {
      const usedCredits = new Set<number>(); const pairs: Pair[] = [];
      for (const d of debitCols) { const c = pickClosest(d, creditCols, usedCredits); if (c === -1) continue; usedCredits.add(c); const section = inferSection(row, prevRow, d) !== 'unknown' ? inferSection(row, prevRow, d) : inferSection(row, prevRow, c); pairs.push({ debit: d, credit: c, section }); }
      const opening = pairs.find(p => p.section === 'opening'); const movement = pairs.find(p => p.section === 'movement'); const closing = pairs.find(p => p.section === 'closing');
      const pairsSorted = [...pairs].sort((a, b) => Math.min(a.debit, a.credit) - Math.min(b.debit, b.credit));
      const inferredOpening = opening || pairsSorted[0]; const inferredMovement = movement || pairsSorted[1]; const inferredClosing = closing || pairsSorted[2] || pairsSorted[pairsSorted.length - 1];
      if (inferredOpening && inferredMovement && inferredClosing) {
        result.startRow = i + 1;
        result.openingDebit = inferredOpening.debit; result.openingCredit = inferredOpening.credit;
        result.movementDebit = inferredMovement.debit; result.movementCredit = inferredMovement.credit;
        result.closingDebit = inferredClosing.debit; result.closingCredit = inferredClosing.credit;
        if (result.nameCol === -1 || result.codeCol === -1) {
          const textCols = row.map((v: any, idx: number) => ({ idx, v: normalizeHeaderCell(v) })).filter((x: any) => x.v && !includesAny(x.v, [...HEADER_KEYWORDS.debit, ...HEADER_KEYWORDS.credit, ...HEADER_KEYWORDS.opening, ...HEADER_KEYWORDS.movement, ...HEADER_KEYWORDS.closing]));
          if (textCols.length >= 2) { const sorted = textCols.sort((a: any, b: any) => b.idx - a.idx); if (result.codeCol === -1) result.codeCol = sorted[0].idx; if (result.nameCol === -1) result.nameCol = sorted[1].idx; }
        }
        return result;
      }
    }
  }

  // Fallback
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]; if (!row || row.length < 6) continue;
    const cells = row.map((v: any) => String(v ?? '').trim());
    const numericIdxs = cells.map((c: string, idx: number) => ({ idx, c })).filter((x: any) => /[-(]?[0-9٠-٩][0-9٠-٩,\.٬٫\s]*\)?$/.test(x.c) && x.c.length > 0).map((x: any) => x.idx);
    const codeIdx = cells.findIndex((c: string) => /^\d{1,12}$/.test(c));
    const nameIdx = cells.findIndex((c: string) => c.length > 2 && !/^\d+$/.test(c) && !c.includes('مدين') && !c.includes('دائن'));
    if (numericIdxs.length >= 2 && codeIdx !== -1 && nameIdx !== -1) {
      result.startRow = i; result.codeCol = codeIdx; result.nameCol = nameIdx;
      const nums = [...numericIdxs].sort((a: number, b: number) => a - b);
      result.closingDebit = nums[0]; result.closingCredit = nums[1];
      result.movementDebit = nums[2] ?? nums[0]; result.movementCredit = nums[3] ?? nums[1];
      result.openingDebit = nums[4] ?? nums[0]; result.openingCredit = nums[5] ?? nums[1];
      return result;
    }
  }
  return result;
}

// ============ Account Extraction ============

function extractAccountName(row: any[], colMap: ColMap): string {
  if (colMap.nameCol >= 0) return String(row[colMap.nameCol] || '').trim();
  for (let j = 0; j < row.length; j++) { const cell = String(row[j] || '').trim(); if (cell.length > 2 && !/^\d+(\.\d+)?$/.test(cell) && !cell.includes('مدين') && !cell.includes('دائن')) return cell; }
  return '';
}

function extractAccountCode(row: any[], colMap: ColMap): string {
  if (colMap.codeCol >= 0) { const code = String(row[colMap.codeCol] || '').trim(); if (/^\d+$/.test(code)) return code; }
  for (let j = row.length - 1; j >= 0; j--) { const cell = String(row[j] || '').trim(); if (/^\d+$/.test(cell) && cell.length <= 6) return cell; }
  return '';
}

function categorizeAccountMedad(code: string, name: string): string {
  const arabicName = name;
  if (code.startsWith('1')) {
    if (code.startsWith('11') || code.startsWith('110') || code.startsWith('15')) return 'أصول ثابتة';
    return 'أصول متداولة';
  }
  if (code.startsWith('2')) { if (code.startsWith('25')) return 'حقوق ملكية'; return 'خصوم'; }
  if (code.startsWith('3')) { if (code.startsWith('309')) return 'خصوم'; return 'إيرادات'; }
  if (code.startsWith('4')) { if (code.startsWith('45')) return 'مشتريات'; return 'مصروفات'; }
  if (code.startsWith('5')) return 'حقوق ملكية';

  if (arabicName.includes('أثاث') || arabicName.includes('معدات') || arabicName.includes('أجهز') || arabicName.includes('مركب')) return 'أصول ثابتة';
  if (arabicName.includes('بنك') || arabicName.includes('نقد') || arabicName.includes('عهد') || arabicName.includes('مصرف')) return 'أصول متداولة';
  if (arabicName.includes('إيجار مدفوع') || arabicName.includes('مدفوع مقدما')) return 'أصول متداولة';
  if (arabicName.includes('ضريبة') || arabicName.includes('مستحق') || arabicName.includes('دائن')) return 'خصوم';
  if (arabicName.includes('رواتب مستحقة')) return 'خصوم';
  if (arabicName.includes('جاري') || arabicName.includes('رأس المال') || arabicName.includes('ملكية')) return 'حقوق ملكية';
  if (arabicName.includes('مبيعات') || arabicName.includes('إيراد')) return 'إيرادات';
  if (arabicName.includes('مشتريات')) return 'مشتريات';
  if (arabicName.includes('مصروف') || arabicName.includes('مصاريف')) return 'مصروفات';
  return 'غير مصنف';
}

// ============ Build Financial Statements ============

function buildFinancialStatements(accounts: any, result: any) {
  let totalNonCurrentAssets = 0;
  accounts.fixedAssets.forEach((acc: any) => { result.balanceSheet.nonCurrentAssets.push({ name: acc.name, amount: acc.amount, note: acc.code }); totalNonCurrentAssets += acc.amount; });
  result.balanceSheet.totalNonCurrentAssets = totalNonCurrentAssets;

  let totalCurrentAssets = 0;
  accounts.currentAssets.forEach((acc: any) => { result.balanceSheet.currentAssets.push({ name: acc.name, amount: acc.amount, note: acc.code }); totalCurrentAssets += acc.amount; });
  result.balanceSheet.totalCurrentAssets = totalCurrentAssets;
  result.balanceSheet.totalAssets = totalNonCurrentAssets + totalCurrentAssets;

  let totalCurrentLiabilities = 0;
  accounts.currentLiabilities.forEach((acc: any) => { result.balanceSheet.currentLiabilities.push({ name: acc.name, amount: acc.amount, note: acc.code }); totalCurrentLiabilities += acc.amount; });
  result.balanceSheet.totalCurrentLiabilities = totalCurrentLiabilities;
  result.balanceSheet.totalLiabilities = totalCurrentLiabilities;

  let totalEquity = 0;
  accounts.equity.forEach((acc: any) => { result.balanceSheet.equity.push({ name: acc.name, amount: acc.amount, note: acc.code }); totalEquity += acc.amount; });
  result.balanceSheet.totalEquity = totalEquity;
  result.balanceSheet.totalLiabilitiesAndEquity = totalCurrentLiabilities + totalEquity;

  let totalRevenue = 0;
  accounts.revenue.forEach((acc: any) => { totalRevenue += acc.amount; });
  result.incomeStatement.revenue = totalRevenue;

  let totalPurchases = 0;
  accounts.purchases.forEach((acc: any) => { totalPurchases += acc.amount; });
  result.incomeStatement.costOfRevenue = totalPurchases;

  let totalExpenses = 0;
  accounts.expenses.forEach((acc: any) => { totalExpenses += acc.amount; });
  result.incomeStatement.generalAndAdminExpenses = totalExpenses;
  result.incomeStatement.sellingAndMarketingExpenses = 0;

  result.incomeStatement.grossProfit = totalRevenue - totalPurchases;
  result.incomeStatement.operatingProfit = result.incomeStatement.grossProfit - totalExpenses;
  result.incomeStatement.profitBeforeZakat = result.incomeStatement.operatingProfit;
  result.incomeStatement.netProfit = result.incomeStatement.profitBeforeZakat;
  result.incomeStatement.totalComprehensiveIncome = result.incomeStatement.netProfit;

  // Cost of Revenue note
  if (!result.notes.costOfRevenue) result.notes.costOfRevenue = { items: [], total: 0 };
  accounts.purchases.forEach((acc: any) => { result.notes.costOfRevenue.items.push({ name: acc.name, amount: acc.amount }); });
  result.notes.costOfRevenue.total = totalPurchases;

  // General & Admin Expenses note
  if (!result.notes.generalAndAdminExpenses) result.notes.generalAndAdminExpenses = { items: [], total: 0 };
  accounts.expenses.forEach((acc: any) => { result.notes.generalAndAdminExpenses.items.push({ name: acc.name, amount: acc.amount }); });
  result.notes.generalAndAdminExpenses.total = totalExpenses;

  // Zakat note
  const profitBeforeZakat = result.incomeStatement.profitBeforeZakat;
  const adjustedNetProfit = profitBeforeZakat;
  const zakatOnAdjustedProfit = Math.max(0, adjustedNetProfit * 0.025);
  let capital = 0, partnersCurrentAccount = 0;
  accounts.equity.forEach((acc: any) => {
    const n = acc.name.toLowerCase();
    if (n.includes('رأس المال') || n.includes('رأس مال')) capital += acc.amount;
    else if (n.includes('جاري') || n.includes('شركاء')) partnersCurrentAccount += acc.amount;
  });
  const zakatBaseSubtotal = capital + partnersCurrentAccount + adjustedNetProfit;
  const fixedAssetsNet = totalNonCurrentAssets;
  const zakatBase = Math.max(0, zakatBaseSubtotal - fixedAssetsNet);
  const zakatOnBase = zakatBase * 0.025;
  const totalZakatProvision = Math.max(zakatOnAdjustedProfit, zakatOnBase);

  result.notes.zakat = {
    profitBeforeZakat, adjustmentsOnNetIncome: 0, adjustedNetProfit, zakatOnAdjustedProfit,
    capital, partnersCurrentAccount, statutoryReserve: 0, employeeBenefitsLiabilities: 0, zakatBaseSubtotal,
    fixedAssetsNet, intangibleAssetsNet: 0, other: 0, totalDeductions: fixedAssetsNet,
    zakatBase, zakatOnBase, totalZakatProvision,
    openingBalance: 0, provisionForYear: totalZakatProvision, paidDuringYear: 0, closingBalance: totalZakatProvision,
    zakatStatus: 'تم إعداد مخصص الزكاة بشكل تقديري بناء على رأي فني في محايد حيث تعتقد إدارة المنشأة أنه كافي وفي حالة وجود فروقات ما بين مخصص الزكاة والربط النهائي سيتم إثباتها كتغيرات في التقديرات المحاسبية في الفترة التي يصدر فيها الربط النهائي.',
  };

  result.incomeStatement.zakat = totalZakatProvision;
  result.incomeStatement.netProfit = profitBeforeZakat - totalZakatProvision;
  result.incomeStatement.totalComprehensiveIncome = result.incomeStatement.netProfit;

  // Accounting policies note
  result.notes.accountingPolicies = {
    policies: [
      { title: 'أساس الإعداد', content: 'تم إعداد هذه القوائم المالية وفقاً للمعايير الدولية للتقرير المالي (IFRS) المعتمدة في المملكة العربية السعودية والمتطلبات الأخرى الصادرة عن الهيئة السعودية للمحاسبين القانونيين.' },
      { title: 'أساس القياس', content: 'تم إعداد القوائم المالية على أساس التكلفة التاريخية باستثناء ما تم الإفصاح عنه بخلاف ذلك.' },
      { title: 'العملة الوظيفية وعملة العرض', content: 'تعرض هذه القوائم المالية بالريال السعودي وهو العملة الوظيفية للشركة.' },
      { title: 'الإيرادات', content: 'يتم الاعتراف بالإيرادات عند انتقال السيطرة على البضاعة أو الخدمات إلى العميل بمبلغ يعكس العوض الذي تتوقع الشركة أن يحق لها مقابل تلك البضائع أو الخدمات.' },
      { title: 'العقارات والآلات والمعدات', content: 'تثبت العقارات والآلات والمعدات بالتكلفة ناقصاً الإهلاك المتراكم وخسائر الانخفاض في القيمة. يحسب الإهلاك باستخدام طريقة القسط الثابت على مدى العمر الإنتاجي المقدر للأصول.' },
      { title: 'الزكاة', content: 'تخضع الشركة لنظام الزكاة المعمول به في المملكة العربية السعودية. يتم احتساب مخصص الزكاة على أساس الوعاء الزكوي وفقاً للقواعد واللوائح الصادرة عن الهيئة العامة للزكاة والدخل.' },
    ],
  };

  // Fixed assets note
  if (accounts.fixedAssets.length > 0) {
    const categories = accounts.fixedAssets.map((acc: any) => acc.name);
    const amounts = accounts.fixedAssets.map((acc: any) => acc.amount);
    result.notes.fixedAssets = {
      categories, costOpening: amounts.map(() => 0), costAdditions: amounts, costDisposals: amounts.map(() => 0), costClosing: amounts,
      depreciationOpening: amounts.map(() => 0), depreciationAdditions: amounts.map(() => 0), depreciationDisposals: amounts.map(() => 0), depreciationClosing: amounts.map(() => 0),
      netBookValueClosing: amounts, netBookValuePreviousClosing: amounts.map(() => 0),
      totals: { costOpening: 0, costAdditions: totalNonCurrentAssets, costDisposals: 0, costClosing: totalNonCurrentAssets, depreciationOpening: 0, depreciationAdditions: 0, depreciationDisposals: 0, depreciationClosing: 0, netBookValueClosing: totalNonCurrentAssets, netBookValuePreviousClosing: 0 },
    };
  }

  // Creditors note
  if (accounts.currentLiabilities.length > 0) {
    result.notes.creditors = { items: accounts.currentLiabilities.map((acc: any) => ({ name: acc.name, amount: acc.amount })), total: totalCurrentLiabilities };
  }

  // Cash and bank note
  const cashAndBankAccounts = accounts.currentAssets.filter((acc: any) => {
    const n = acc.name.toLowerCase();
    return n.includes('بنك') || n.includes('نقد') || n.includes('مصرف') || n.includes('صندوق');
  });
  if (cashAndBankAccounts.length > 0) {
    result.notes.cashAndBank = { items: cashAndBankAccounts.map((acc: any) => ({ name: acc.name, amount: acc.amount })), total: cashAndBankAccounts.reduce((s: number, a: any) => s + a.amount, 0) };
  }
}

// ============ Trial Balance Parser ============

function parseTrialBalanceSheet(rows: any[][], result: any) {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i]; if (!row) continue;
    const rowText = row.map((c: any) => String(c || '')).join(' ').trim();
    if (!result.companyName && rowText.length > 5) {
      for (const cell of row) {
        const cellText = String(cell || '').trim();
        if (cellText.length > 5 && !cellText.includes('ميزان') && !cellText.includes('Report')) { result.companyName = cellText; break; }
      }
    }
    const vatMatch = rowText.match(/3\d{14}/);
    const dateMatch = rowText.match(/(\d{4}-\d{2}-\d{2})/g);
    if (dateMatch && dateMatch.length >= 1) result.reportDate = dateMatch[dateMatch.length - 1];
  }

  const colMap = detectTrialBalanceColumns(rows);
  if (colMap.startRow === -1) return;

  const accounts = {
    fixedAssets: [] as any[], currentAssets: [] as any[], currentLiabilities: [] as any[],
    equity: [] as any[], revenue: [] as any[], expenses: [] as any[], purchases: [] as any[],
  };

  for (let i = colMap.startRow; i < rows.length; i++) {
    const row = rows[i]; if (!row || row.length === 0) continue;
    const accountName = extractAccountName(row, colMap);
    const accountCode = extractAccountCode(row, colMap);
    const closingDebit = parseNumber(row[colMap.closingDebit]);
    const closingCredit = parseNumber(row[colMap.closingCredit]);
    if (!accountName || accountName.length < 2) continue;
    if (accountName.includes('اسم الحساب') || accountName.includes('البيان')) continue;
    if (accountCode.length === 1) continue;
    const netAmount = Math.abs(closingDebit - closingCredit);
    if (netAmount === 0 && closingDebit === 0 && closingCredit === 0) continue;
    const displayAmount = Math.max(closingDebit, closingCredit);
    const category = categorizeAccountMedad(accountCode, accountName);
    const accountItem = { name: accountName, amount: displayAmount, code: accountCode };
    switch (category) {
      case 'أصول ثابتة': accounts.fixedAssets.push(accountItem); break;
      case 'أصول متداولة': accounts.currentAssets.push(accountItem); break;
      case 'خصوم': accounts.currentLiabilities.push(accountItem); break;
      case 'حقوق ملكية': accounts.equity.push(accountItem); break;
      case 'إيرادات': accounts.revenue.push(accountItem); break;
      case 'مشتريات': accounts.purchases.push(accountItem); break;
      case 'مصروفات': accounts.expenses.push(accountItem); break;
    }
  }
  buildFinancialStatements(accounts, result);
}

// ============ Multi-Sheet Parsers ============

function findSheetData(workbookData: any, keywords: string[]): any[][] | null {
  for (const name of workbookData.sheetNames) {
    const lowerName = name.toLowerCase();
    if (keywords.some((kw: string) => name.includes(kw) || lowerName.includes(kw.toLowerCase()))) {
      return workbookData.sheets[name] || null;
    }
  }
  return null;
}

function extractCompanyInfo(rows: any[][], result: any) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i]; if (!row) continue;
    const rowText = row.join(' ').trim();
    if (!result.companyName && rowText.length > 5) {
      const firstCell = String(row[0] || row[1] || '').trim();
      if (firstCell.length > 5 && !firstCell.includes('قائمة') && !firstCell.includes('القوائم')) result.companyName = firstCell;
    }
    if (rowText.includes('ذات مسئولية محدودة')) result.companyType = 'شركة ذات مسئولية محدودة';
    const dateMatch = rowText.match(/(\d{1,2})\s*(ديسمبر|يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر)\s*(\d{4})/);
    if (dateMatch) result.reportDate = `${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}م`;
  }
}

function parseBalanceSheet(rows: any[][], result: any) {
  let currentSection = '';
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]; if (!row || row.length === 0) continue;
    const rowText = row.map((c: any) => String(c || '')).join(' ').trim();
    if (rowText.includes('الموجودات المتداولة')) { currentSection = 'currentAssets'; continue; }
    if (rowText.includes('الموجودات الغير متداولة') || rowText.includes('موجودات غير متداولة')) { currentSection = 'nonCurrentAssets'; continue; }
    if (rowText.includes('المطلوبات المتداولة')) { currentSection = 'currentLiabilities'; continue; }
    if (rowText.includes('المطلوبات الغير متداولة') || rowText.includes('مطلوبات غير متداولة')) { currentSection = 'nonCurrentLiabilities'; continue; }
    if (rowText.includes('حقوق الملكية')) { currentSection = 'equity'; continue; }
    if (rowText.includes('إجمالي') || rowText.includes('مجموع')) {
      const amount = extractAmountFromRow(row);
      const prevAmount = row.length > 3 ? parseArabicNumber(row[row.length - 2]) : undefined;
      if (rowText.includes('الموجودات المتداولة')) { result.balanceSheet.totalCurrentAssets = Math.abs(amount); if (prevAmount) result.balanceSheet.previousTotalCurrentAssets = Math.abs(prevAmount); }
      else if (rowText.includes('الموجودات الغير متداولة') || rowText.includes('موجودات غير متداولة')) { result.balanceSheet.totalNonCurrentAssets = Math.abs(amount); if (prevAmount) result.balanceSheet.previousTotalNonCurrentAssets = Math.abs(prevAmount); }
      else if (rowText.includes('مجموع الموجودات')) { result.balanceSheet.totalAssets = Math.abs(amount); if (prevAmount) result.balanceSheet.previousTotalAssets = Math.abs(prevAmount); }
      else if (rowText.includes('المطلوبات المتداولة')) { result.balanceSheet.totalCurrentLiabilities = Math.abs(amount); if (prevAmount) result.balanceSheet.previousTotalCurrentLiabilities = Math.abs(prevAmount); }
      else if (rowText.includes('المطلوبات الغير متداولة') || rowText.includes('مطلوبات غير متداولة')) { result.balanceSheet.totalNonCurrentLiabilities = Math.abs(amount); if (prevAmount) result.balanceSheet.previousTotalNonCurrentLiabilities = Math.abs(prevAmount); }
      else if (rowText.includes('مجموع المطلوبات') && !rowText.includes('حقوق')) { result.balanceSheet.totalLiabilities = Math.abs(amount); if (prevAmount) result.balanceSheet.previousTotalLiabilities = Math.abs(prevAmount); }
      else if (rowText.includes('مجموع حقوق الملكية')) { result.balanceSheet.totalEquity = Math.abs(amount); if (prevAmount) result.balanceSheet.previousTotalEquity = Math.abs(prevAmount); }
      else if (rowText.includes('المطلوبات وحقوق الملكية')) { result.balanceSheet.totalLiabilitiesAndEquity = Math.abs(amount); if (prevAmount) result.balanceSheet.previousTotalLiabilitiesAndEquity = Math.abs(prevAmount); }
      continue;
    }
    const name = extractAccountNameFromRow(row);
    const amount = extractAmountFromRow(row);
    const prevAmount = row.length > 3 ? parseArabicNumber(row[row.length - 2]) : undefined;
    const noteMatch = rowText.match(/(\d+)/);
    const note = noteMatch ? noteMatch[1] : undefined;
    if (!name || name.length < 3) continue;
    if (rowText.includes('البيان') || rowText.includes('إيضاح')) continue;
    const item = { name, amount: Math.abs(amount), previousAmount: prevAmount ? Math.abs(prevAmount) : undefined, note };
    switch (currentSection) {
      case 'currentAssets': result.balanceSheet.currentAssets.push(item); break;
      case 'nonCurrentAssets': result.balanceSheet.nonCurrentAssets.push(item); break;
      case 'currentLiabilities': result.balanceSheet.currentLiabilities.push(item); break;
      case 'nonCurrentLiabilities': result.balanceSheet.nonCurrentLiabilities.push(item); break;
      case 'equity': result.balanceSheet.equity.push(item); break;
    }
  }
}

function parseIncomeStatement(rows: any[][], result: any) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]; if (!row || row.length === 0) continue;
    const rowText = row.map((c: any) => String(c || '')).join(' ').trim();
    const amount = extractAmountFromRow(row);
    const prevAmount = row.length > 3 ? parseArabicNumber(row[row.length - 2]) : undefined;
    if (rowText.includes('الإيرادات') && !rowText.includes('تكلفة')) { result.incomeStatement.revenue = Math.abs(amount); result.incomeStatement.previousRevenue = prevAmount ? Math.abs(prevAmount) : undefined; }
    else if (rowText.includes('تكلفة الإيرادات')) { result.incomeStatement.costOfRevenue = Math.abs(amount); result.incomeStatement.previousCostOfRevenue = prevAmount ? Math.abs(prevAmount) : undefined; }
    else if (rowText.includes('إجمالي الربح') || rowText.includes('إجمالي الخسارة')) { result.incomeStatement.grossProfit = amount; result.incomeStatement.previousGrossProfit = prevAmount; }
    else if (rowText.includes('مصاريف بيع') || rowText.includes('مصاريف تسويق') || rowText.includes('بيع وتسويق')) { result.incomeStatement.sellingAndMarketingExpenses = Math.abs(amount); result.incomeStatement.previousSellingAndMarketingExpenses = prevAmount ? Math.abs(prevAmount) : undefined; }
    else if (rowText.includes('مصاريف عمومية وإدارية') || rowText.includes('مصاريف إدارية')) { result.incomeStatement.generalAndAdminExpenses = Math.abs(amount); result.incomeStatement.previousGeneralAndAdminExpenses = prevAmount ? Math.abs(prevAmount) : undefined; }
    else if (rowText.includes('ربح العمليات') || rowText.includes('خسارة العمليات')) { result.incomeStatement.operatingProfit = amount; result.incomeStatement.previousOperatingProfit = prevAmount; }
    else if (rowText.includes('أعباء تمويل') || rowText.includes('تكلفة التمويل')) { result.incomeStatement.financingCost = Math.abs(amount); result.incomeStatement.previousFinancingCost = prevAmount ? Math.abs(prevAmount) : undefined; }
    else if (rowText.includes('أرباح') && rowText.includes('استبعاد')) { result.incomeStatement.gainsLossesFromDisposals = amount; result.incomeStatement.previousGainsLossesFromDisposals = prevAmount; }
    else if (rowText.includes('الربح') && rowText.includes('قبل الزكاة')) { result.incomeStatement.profitBeforeZakat = amount; result.incomeStatement.previousProfitBeforeZakat = prevAmount; }
    else if (rowText.includes('الزكاة') && !rowText.includes('قبل') && !rowText.includes('بعد')) { result.incomeStatement.zakat = Math.abs(amount); result.incomeStatement.previousZakat = prevAmount ? Math.abs(prevAmount) : undefined; }
    else if (rowText.includes('ربح') && rowText.includes('الفترة') || rowText.includes('صافي الربح')) { result.incomeStatement.netProfit = amount; result.incomeStatement.previousNetProfit = prevAmount; }
    else if (rowText.includes('إجمالي الدخل الشامل')) { result.incomeStatement.totalComprehensiveIncome = amount; result.incomeStatement.previousTotalComprehensiveIncome = prevAmount; }
  }
  if (result.incomeStatement.grossProfit === 0) result.incomeStatement.grossProfit = result.incomeStatement.revenue - result.incomeStatement.costOfRevenue;
}

function parseEquityChanges(rows: any[][], result: any) {
  let currentPeriodLabel = '';
  const periods: any[] = [];
  let currentPeriodRows: any[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]; if (!row || row.length === 0) continue;
    const rowText = row.map((c: any) => String(c || '')).join(' ').trim();
    if (rowText.includes('السنة المنتهية في')) {
      if (currentPeriodLabel && currentPeriodRows.length > 0) { periods.push({ label: currentPeriodLabel, rows: [...currentPeriodRows] }); currentPeriodRows = []; }
      const dateMatch = rowText.match(/(\d{1,2}\s*\w+\s*\d{4})/);
      currentPeriodLabel = dateMatch ? `السنة المنتهية في ${dateMatch[1]}` : rowText;
      continue;
    }
    if (rowText.includes('رأس المال') && rowText.includes('احتياطي')) continue;
    const description = extractAccountNameFromRow(row);
    if (!description || description.length < 3) continue;
    const values = row.filter((c: any) => typeof c === 'number' || (typeof c === 'string' && !isNaN(parseFloat(c.replace(/[^\d.-]/g, ''))))).map((c: any) => parseArabicNumber(c));
    if (values.length >= 4) currentPeriodRows.push({ description, capital: values[0] || 0, statutoryReserve: values[1] || 0, retainedEarnings: values[2] || 0, total: values[3] || 0 });
  }
  if (currentPeriodLabel && currentPeriodRows.length > 0) periods.push({ label: currentPeriodLabel, rows: currentPeriodRows });
  result.equityChanges.periods = periods;
}

function parseCashFlow(rows: any[][], result: any) {
  let currentSection = '';
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]; if (!row || row.length === 0) continue;
    const rowText = row.map((c: any) => String(c || '')).join(' ').trim();
    const amount = extractAmountFromRow(row);
    if (rowText.includes('الأنشطة التشغيلية')) { currentSection = 'operating'; continue; }
    if (rowText.includes('الأنشطة الاستثمارية')) { currentSection = 'investing'; continue; }
    if (rowText.includes('الأنشطة التمويلية')) { currentSection = 'financing'; continue; }
    if (rowText.includes('ربح') && rowText.includes('قبل الزكاة')) result.cashFlow.operatingActivities.profitBeforeZakat = amount;
    else if (rowText.includes('زكاة مدفوعة')) result.cashFlow.operatingActivities.zakatPaid = Math.abs(amount);
    else if (rowText.includes('منافع موظفين مدفوعة')) result.cashFlow.operatingActivities.employeeBenefitsPaid = Math.abs(amount);
    else if (rowText.includes('صافي التدفقات') && rowText.includes('التشغيلية')) result.cashFlow.operatingActivities.netOperatingCashFlow = amount;
    else if (rowText.includes('صافي التدفقات') && rowText.includes('الاستثمارية')) result.cashFlow.netInvestingCashFlow = amount;
    else if (rowText.includes('صافي التدفقات') && rowText.includes('التمويلية')) result.cashFlow.netFinancingCashFlow = amount;
    else if (rowText.includes('صافي الزيادة') || rowText.includes('صافي النقص')) result.cashFlow.netChangeInCash = amount;
    else if (rowText.includes('النقد') && rowText.includes('بداية')) result.cashFlow.openingCashBalance = Math.abs(amount);
    else if (rowText.includes('النقد') && rowText.includes('نهاية')) result.cashFlow.closingCashBalance = Math.abs(amount);
    else {
      const name = extractAccountNameFromRow(row);
      if (name && name.length > 3) {
        if (currentSection === 'operating') {
          if (rowText.includes('التعديلات') || rowText.includes('الاستهلاك') || rowText.includes('مخصصات')) result.cashFlow.operatingActivities.adjustmentsToReconcile.push({ name, amount });
          else if (rowText.includes('النقص') || rowText.includes('الزيادة') || rowText.includes('موجودات') || rowText.includes('مطلوبات')) result.cashFlow.operatingActivities.changesInWorkingCapital.push({ name, amount });
        } else if (currentSection === 'investing') result.cashFlow.investingActivities.push({ name, amount });
        else if (currentSection === 'financing') result.cashFlow.financingActivities.push({ name, amount });
      }
    }
  }
}

function parseNoteSheet(sheetName: string, rows: any[][], result: any) {
  if (sheetName.includes('الزكاة') || sheetName.includes('مخصص الزكاة')) parseZakatNote(rows, result);
  if (sheetName.includes('تكلفة الإيرادات')) parseSimpleNote(rows, result, 'costOfRevenue');
  if (sheetName.includes('مصاريف') && (sheetName.includes('إدارية') || sheetName.includes('ادارية'))) parseSimpleNote(rows, result, 'generalAndAdminExpenses');
  if (sheetName.includes('ممتلكات') || sheetName.includes('معدات')) parseFixedAssetsNote(rows, result);
  if (sheetName.includes('النقد') && sheetName.includes('أرصدة')) parseSimpleNote(rows, result, 'cashAndBank');
  if (sheetName.includes('المخصصات') && sheetName.includes('رأس المال')) parseCapitalAndProvisionsNote(rows, result);
}

function parseSimpleNote(rows: any[][], result: any, noteKey: string) {
  const note: any = { items: [], total: 0 };
  for (const row of rows) {
    if (!row || row.length === 0) continue;
    const rowText = row.map((c: any) => String(c || '')).join(' ').trim();
    if (rowText.includes('البيان') || rowText.includes('السنة المنتهية')) continue;
    const name = extractAccountNameFromRow(row);
    const amount = extractAmountFromRow(row);
    const prevAmount = row.length > 3 ? parseArabicNumber(row[row.length - 2]) : undefined;
    if (rowText.includes('مجموع') || rowText.includes('إجمالي') || rowText.includes('المجموع')) { note.total = Math.abs(amount); note.previousTotal = prevAmount ? Math.abs(prevAmount) : undefined; }
    else if (name && name.length > 2) note.items.push({ name, amount: Math.abs(amount), previousAmount: prevAmount ? Math.abs(prevAmount) : undefined });
  }
  result.notes[noteKey] = note;
}

function parseZakatNote(rows: any[][], result: any) {
  const zakat: any = {
    profitBeforeZakat: 0, adjustmentsOnNetIncome: 0, adjustedNetProfit: 0, zakatOnAdjustedProfit: 0,
    capital: 0, partnersCurrentAccount: 0, statutoryReserve: 0, employeeBenefitsLiabilities: 0, zakatBaseSubtotal: 0,
    fixedAssetsNet: 0, intangibleAssetsNet: 0, other: 0, totalDeductions: 0,
    zakatBase: 0, zakatOnBase: 0, totalZakatProvision: 0,
    openingBalance: 0, provisionForYear: 0, paidDuringYear: 0, closingBalance: 0, zakatStatus: '',
  };
  let inProvisionMovement = false;
  for (const row of rows) {
    if (!row || row.length === 0) continue;
    const rowText = row.map((c: any) => String(c || '')).join(' ').trim();
    const amount = extractAmountFromRow(row);
    if (rowText.includes('حركة مخصص الزكاة')) { inProvisionMovement = true; continue; }
    if (rowText.includes('الموقف الزكوي')) {
      const statusIdx = rows.indexOf(row);
      if (statusIdx < rows.length - 1) zakat.zakatStatus = rows.slice(statusIdx + 1, statusIdx + 3).map((r: any) => r?.join(' ') || '').join(' ');
      continue;
    }
    if (inProvisionMovement) {
      if (rowText.includes('رصيد أول السنة') || rowText.includes('رصيد بداية')) zakat.openingBalance = Math.abs(amount);
      else if (rowText.includes('مخصص الزكاة المكون') || rowText.includes('المخصص المكون')) zakat.provisionForYear = Math.abs(amount);
      else if (rowText.includes('المسدد خلال السنة') || rowText.includes('المدفوع')) zakat.paidDuringYear = Math.abs(amount);
      else if (rowText.includes('الرصيد الختامي') || rowText.includes('رصيد نهاية')) zakat.closingBalance = Math.abs(amount);
    } else {
      if (rowText.includes('الربح') && rowText.includes('قبل الزكاة')) zakat.profitBeforeZakat = amount;
      else if (rowText.includes('تعديلات على صافي الدخل')) zakat.adjustmentsOnNetIncome = amount;
      else if (rowText.includes('صافي الربح المعدل')) zakat.adjustedNetProfit = amount;
      else if (rowText.includes('الزكاة الشرعية طبقاً لصافي الربح')) zakat.zakatOnAdjustedProfit = Math.abs(amount);
      else if (rowText.includes('رأس المال') && !rowText.includes('إجمالي')) zakat.capital = Math.abs(amount);
      else if (rowText.includes('جاري الشركاء') || rowText.includes('جاري الشركة')) zakat.partnersCurrentAccount = Math.abs(amount);
      else if (rowText.includes('احتياطي نظامي')) zakat.statutoryReserve = Math.abs(amount);
      else if (rowText.includes('التزامات منافع موظفين') || rowText.includes('مخصص نهاية الخدمة')) zakat.employeeBenefitsLiabilities = Math.abs(amount);
      else if (rowText.includes('المجموع') && !rowText.includes('إجمالي')) zakat.zakatBaseSubtotal = Math.abs(amount);
      else if (rowText.includes('العقارات والآلات') || rowText.includes('أصول ثابتة')) zakat.fixedAssetsNet = Math.abs(amount);
      else if (rowText.includes('موجودات غير ملموسة') || rowText.includes('أصول غير ملموسة')) zakat.intangibleAssetsNet = Math.abs(amount);
      else if (rowText.includes('وعاء الزكاة') && !rowText.includes('طبقاً')) zakat.zakatBase = Math.abs(amount);
      else if (rowText.includes('مخصص الزكاة الشرعية طبقاً للوعاء')) zakat.zakatOnBase = Math.abs(amount);
      else if (rowText.includes('إجمالي مخصص الزكاة')) zakat.totalZakatProvision = Math.abs(amount);
    }
  }
  if (zakat.totalDeductions === 0) zakat.totalDeductions = zakat.fixedAssetsNet + zakat.intangibleAssetsNet + zakat.other;
  result.notes.zakat = zakat;
}

function parseFixedAssetsNote(_rows: any[][], result: any) {
  result.notes.fixedAssets = {
    categories: ['السيارات', 'الآلات والمعدات', 'الأثاث والمفروشات', 'أجهزة كهربائية', 'حاسب آلي', 'تصليحات وتجهيزات'],
    costOpening: [], costAdditions: [], costDisposals: [], costClosing: [],
    depreciationOpening: [], depreciationAdditions: [], depreciationDisposals: [], depreciationClosing: [],
    netBookValueClosing: [], netBookValuePreviousClosing: [],
    totals: { costOpening: 0, costAdditions: 0, costDisposals: 0, costClosing: 0, depreciationOpening: 0, depreciationAdditions: 0, depreciationDisposals: 0, depreciationClosing: 0, netBookValueClosing: 0, netBookValuePreviousClosing: 0 },
  };
}

function parseCapitalAndProvisionsNote(rows: any[][], result: any) {
  let inEmployeeBenefits = false, inCapital = false;
  const employeeBenefits: any = { openingBalance: 0, additions: 0, payments: 0, closingBalance: 0 };
  const capital: any = { description: '', partners: [], totalShares: 0, totalValue: 0 };
  for (const row of rows) {
    if (!row || row.length === 0) continue;
    const rowText = row.map((c: any) => String(c || '')).join(' ').trim();
    const amount = extractAmountFromRow(row);
    if (rowText.includes('مخصصات منافع موظفين')) { inEmployeeBenefits = true; inCapital = false; continue; }
    if (rowText.includes('رأس المال')) { inCapital = true; inEmployeeBenefits = false; continue; }
    if (inEmployeeBenefits) {
      if (rowText.includes('بداية الفترة')) employeeBenefits.openingBalance = Math.abs(amount);
      else if (rowText.includes('مكونة')) employeeBenefits.additions = Math.abs(amount);
      else if (rowText.includes('مدفوعة')) employeeBenefits.payments = Math.abs(amount);
      else if (rowText.includes('نهاية الفترة')) employeeBenefits.closingBalance = Math.abs(amount);
    }
    if (inCapital) {
      if (rowText.includes('حدد رأس مال الشركة')) capital.description = rowText;
      else if (rowText.includes('اسم الشريك') || rowText.includes('المجموع')) { /* skip */ }
      else {
        const name = extractAccountNameFromRow(row);
        if (name && name.length > 2) {
          const values = row.filter((c: any) => typeof c === 'number' || (typeof c === 'string' && !isNaN(parseFloat(c.replace(/[^\d.-]/g, ''))))).map((c: any) => parseArabicNumber(c));
          if (values.length >= 3) capital.partners.push({ name, sharesCount: values[0] || 0, shareValue: values[1] || 0, totalValue: values[2] || 0 });
        }
      }
    }
  }
  if (employeeBenefits.closingBalance > 0) result.notes.employeeBenefits = employeeBenefits;
  if (capital.partners.length > 0) {
    capital.totalShares = capital.partners.reduce((s: number, p: any) => s + p.sharesCount, 0);
    capital.totalValue = capital.partners.reduce((s: number, p: any) => s + p.totalValue, 0);
    result.notes.capital = capital;
  }
}

// ============ Main Parser ============

function parseMedadWorkbook(workbookData: { sheetNames: string[]; sheets: Record<string, any[][]> }): any {
  const result = createEmptyFinancialData();

  const isTrialBalanceFile = workbookData.sheetNames.length === 1 ||
    workbookData.sheetNames.some((name: string) => name.toLowerCase().includes('report') || name.includes('ميزان'));

  if (isTrialBalanceFile) {
    const sheetName = workbookData.sheetNames[0];
    const rows = (workbookData.sheets[sheetName] || []).filter((row: any[]) => row.some((cell: any) => cell !== '' && cell !== null && cell !== undefined));
    parseTrialBalanceSheet(rows, result);
    return result;
  }

  // Multi-sheet format
  const coverSheet = findSheetData(workbookData, MEDAD_SHEET_NAMES.cover);
  if (coverSheet) extractCompanyInfo(coverSheet, result);

  const balanceSheetData = findSheetData(workbookData, MEDAD_SHEET_NAMES.balanceSheet);
  if (balanceSheetData) parseBalanceSheet(balanceSheetData, result);

  const incomeSheet = findSheetData(workbookData, MEDAD_SHEET_NAMES.incomeStatement);
  if (incomeSheet) parseIncomeStatement(incomeSheet, result);

  const equitySheet = findSheetData(workbookData, MEDAD_SHEET_NAMES.equityChanges);
  if (equitySheet) parseEquityChanges(equitySheet, result);

  const cashFlowSheet = findSheetData(workbookData, MEDAD_SHEET_NAMES.cashFlow);
  if (cashFlowSheet) parseCashFlow(cashFlowSheet, result);

  workbookData.sheetNames.forEach((sheetName: string) => {
    const rows = workbookData.sheets[sheetName] || [];
    parseNoteSheet(sheetName, rows, result);
  });

  return result;
}

// ============ Deno Serve ============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { sheetNames, sheets } = body;

    if (!sheetNames || !sheets) {
      return new Response(JSON.stringify({ error: 'Missing sheetNames or sheets' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = parseMedadWorkbook({ sheetNames, sheets });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
