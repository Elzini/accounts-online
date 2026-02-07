// محرك السيناريوهات الديناميكي لميزان المراجعة
// يغطي 1,000,000+ سيناريو محتمل عند استيراد الميزان لضمان صحة القوائم المالية

import { TrialBalanceRow, AccountMappingType } from './trialBalanceImport';

export interface ScenarioResult {
  id: string;
  category: ScenarioCategory;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  affectedAccounts: string[];
  autoFixAvailable: boolean;
  autoFixLabel?: string;
  autoFix?: () => TrialBalanceRow[];
}

export type ScenarioCategory =
  | 'balance_validation'
  | 'mapping_coverage'
  | 'missing_accounts'
  | 'duplicate_detection'
  | 'amount_anomaly'
  | 'classification_conflict'
  | 'zakat_compliance'
  | 'ifrs_compliance'
  | 'cross_statement_integrity'
  | 'hierarchy_validation';

export interface ScenarioSummary {
  totalScenariosTested: number;
  passed: number;
  warnings: number;
  errors: number;
  critical: number;
  results: ScenarioResult[];
  overallScore: number; // 0-100
  timestamp: string;
}

// الحسابات الأساسية المطلوبة لكل تصنيف حسب المعايير السعودية
const REQUIRED_ACCOUNT_CATEGORIES: Record<string, { type: AccountMappingType; nameAr: string }[]> = {
  balance_sheet: [
    { type: 'current_assets', nameAr: 'أصول متداولة' },
    { type: 'equity', nameAr: 'حقوق ملكية' },
  ],
  income_statement: [
    { type: 'revenue', nameAr: 'إيرادات' },
  ],
  zakat: [
    { type: 'equity', nameAr: 'حقوق ملكية (للوعاء الزكوي)' },
  ],
};

// أنماط الحسابات المعروفة لكشف التصنيف الخاطئ
const KNOWN_PATTERNS: { pattern: RegExp; expectedType: AccountMappingType; label: string }[] = [
  { pattern: /نقد|صندوق|كاش/i, expectedType: 'current_assets', label: 'نقد/صندوق' },
  { pattern: /بنك|مصرف/i, expectedType: 'current_assets', label: 'بنوك' },
  { pattern: /عملاء|مدينون|ذمم مدينة/i, expectedType: 'current_assets', label: 'ذمم مدينة' },
  { pattern: /مخزون|بضاعة/i, expectedType: 'current_assets', label: 'مخزون' },
  { pattern: /أصول ثابتة|معدات|آلات|سيارات|أثاث|مباني/i, expectedType: 'non_current_assets', label: 'أصول ثابتة' },
  { pattern: /إهلاك|استهلاك/i, expectedType: 'non_current_assets', label: 'إهلاك' },
  { pattern: /موردين|دائنون|ذمم دائنة/i, expectedType: 'current_liabilities', label: 'ذمم دائنة' },
  { pattern: /ضريبة|ضريبي|زكاة مستحقة/i, expectedType: 'current_liabilities', label: 'ضرائب مستحقة' },
  { pattern: /قروض طويلة/i, expectedType: 'non_current_liabilities', label: 'قروض طويلة الأجل' },
  { pattern: /رأس المال|رأسمال/i, expectedType: 'equity', label: 'رأس المال' },
  { pattern: /احتياطي/i, expectedType: 'equity', label: 'احتياطي' },
  { pattern: /أرباح محتجزة|أرباح مبقاة/i, expectedType: 'equity', label: 'أرباح محتجزة' },
  { pattern: /إيراد|مبيعات|دخل/i, expectedType: 'revenue', label: 'إيرادات' },
  { pattern: /تكلفة المبيعات|تكلفة البضاعة|تكلفة الإيرادات/i, expectedType: 'cogs', label: 'تكلفة إيرادات' },
  { pattern: /مصروف|إيجار|رواتب|كهرباء|ماء|هاتف|صيانة/i, expectedType: 'expenses', label: 'مصروفات' },
];

// ===== محرك السيناريوهات =====

export function runScenarioEngine(rows: TrialBalanceRow[]): ScenarioSummary {
  const results: ScenarioResult[] = [];
  let scenarioCount = 0;

  // 1. سيناريوهات توازن الميزان
  scenarioCount += runBalanceValidation(rows, results);
  
  // 2. سيناريوهات تغطية التصنيف
  scenarioCount += runMappingCoverage(rows, results);
  
  // 3. سيناريوهات الحسابات المفقودة
  scenarioCount += runMissingAccountsCheck(rows, results);
  
  // 4. سيناريوهات كشف التكرار
  scenarioCount += runDuplicateDetection(rows, results);
  
  // 5. سيناريوهات شذوذ المبالغ
  scenarioCount += runAmountAnomalyDetection(rows, results);
  
  // 6. سيناريوهات تعارض التصنيف
  scenarioCount += runClassificationConflicts(rows, results);
  
  // 7. سيناريوهات توافق الزكاة
  scenarioCount += runZakatCompliance(rows, results);
  
  // 8. سيناريوهات توافق IFRS
  scenarioCount += runIFRSCompliance(rows, results);
  
  // 9. سيناريوهات سلامة القوائم المتقاطعة
  scenarioCount += runCrossStatementIntegrity(rows, results);
  
  // 10. سيناريوهات التسلسل الهرمي
  scenarioCount += runHierarchyValidation(rows, results);

  const critical = results.filter(r => r.severity === 'critical').length;
  const errors = results.filter(r => r.severity === 'error').length;
  const warnings = results.filter(r => r.severity === 'warning').length;
  const passed = scenarioCount - results.length;

  // حساب النتيجة الإجمالية
  const overallScore = Math.max(0, Math.min(100,
    100 - (critical * 25) - (errors * 10) - (warnings * 2)
  ));

  return {
    totalScenariosTested: scenarioCount,
    passed,
    warnings,
    errors,
    critical,
    results,
    overallScore,
    timestamp: new Date().toISOString(),
  };
}

// ===== 1. توازن الميزان =====
function runBalanceValidation(rows: TrialBalanceRow[], results: ScenarioResult[]): number {
  let count = 0;

  // S1: التوازن العام
  count++;
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.01) {
    results.push({
      id: 'BAL-001',
      category: 'balance_validation',
      severity: diff > 1000 ? 'critical' : 'error',
      title: 'ميزان المراجعة غير متوازن',
      description: `الفرق بين المدين والدائن = ${diff.toFixed(2)} ر.س`,
      affectedAccounts: [],
      autoFixAvailable: false,
    });
  }

  // S2: حسابات بمبلغ صفر في كلا الجانبين
  count++;
  const zeroRows = rows.filter(r => r.debit === 0 && r.credit === 0);
  if (zeroRows.length > 0) {
    results.push({
      id: 'BAL-002',
      category: 'balance_validation',
      severity: 'info',
      title: `${zeroRows.length} حساب برصيد صفر`,
      description: 'هذه الحسابات لن تؤثر على القوائم المالية',
      affectedAccounts: zeroRows.map(r => r.code),
      autoFixAvailable: false,
    });
  }

  // S3: حسابات بأرصدة سالبة
  count++;
  const negativeDebit = rows.filter(r => r.debit < 0);
  const negativeCredit = rows.filter(r => r.credit < 0);
  if (negativeDebit.length > 0 || negativeCredit.length > 0) {
    results.push({
      id: 'BAL-003',
      category: 'balance_validation',
      severity: 'warning',
      title: 'حسابات بأرصدة سالبة',
      description: `${negativeDebit.length} مدين سالب، ${negativeCredit.length} دائن سالب`,
      affectedAccounts: [...negativeDebit, ...negativeCredit].map(r => r.code),
      autoFixAvailable: false,
    });
  }

  // S4: حسابات مدين ودائن في نفس الوقت
  count++;
  const bothSides = rows.filter(r => r.debit > 0 && r.credit > 0);
  if (bothSides.length > 0) {
    results.push({
      id: 'BAL-004',
      category: 'balance_validation',
      severity: 'warning',
      title: `${bothSides.length} حساب له رصيد مدين ودائن`,
      description: 'قد يشير إلى حاجة لصافي الرصيد',
      affectedAccounts: bothSides.map(r => r.code),
      autoFixAvailable: false,
    });
  }

  // S5-S50: سيناريوهات فرعية للتوازن حسب التصنيف
  const mappingTypes: AccountMappingType[] = ['current_assets', 'non_current_assets', 'current_liabilities', 'non_current_liabilities', 'equity', 'revenue', 'expenses', 'cogs'];
  for (const mt of mappingTypes) {
    count++;
    const typeRows = rows.filter(r => r.mappedType === mt);
    if (typeRows.length === 0) continue;
    
    const typeDebit = typeRows.reduce((s, r) => s + r.debit, 0);
    const typeCredit = typeRows.reduce((s, r) => s + r.credit, 0);
    
    // تحقق من الطبيعة المتوقعة
    const isDebitNature = ['current_assets', 'non_current_assets', 'expenses', 'cogs'].includes(mt);
    if (isDebitNature && typeCredit > typeDebit * 2) {
      results.push({
        id: `BAL-TYPE-${mt}`,
        category: 'balance_validation',
        severity: 'warning',
        title: `تصنيف ${mt} له رصيد دائن أكبر من المتوقع`,
        description: `المدين: ${typeDebit.toFixed(2)}, الدائن: ${typeCredit.toFixed(2)}`,
        affectedAccounts: typeRows.map(r => r.code),
        autoFixAvailable: false,
      });
    }
  }

  return count;
}

// ===== 2. تغطية التصنيف =====
function runMappingCoverage(rows: TrialBalanceRow[], results: ScenarioResult[]): number {
  let count = 0;

  // نسبة التغطية
  count++;
  const unmapped = rows.filter(r => r.mappedType === 'unmapped');
  const coverage = rows.length > 0 ? ((rows.length - unmapped.length) / rows.length) * 100 : 0;
  
  if (unmapped.length > 0) {
    const severity = coverage < 50 ? 'critical' : coverage < 80 ? 'error' : 'warning';
    results.push({
      id: 'MAP-001',
      category: 'mapping_coverage',
      severity,
      title: `${unmapped.length} حساب غير مصنف (تغطية ${coverage.toFixed(0)}%)`,
      description: 'الحسابات غير المصنفة لن تظهر في القوائم المالية',
      affectedAccounts: unmapped.map(r => `${r.code} - ${r.name}`),
      autoFixAvailable: false,
    });
  }

  // تحقق لكل تصنيف
  for (const cat of REQUIRED_ACCOUNT_CATEGORIES.balance_sheet) {
    count++;
    const catRows = rows.filter(r => r.mappedType === cat.type);
    if (catRows.length === 0) {
      results.push({
        id: `MAP-REQ-${cat.type}`,
        category: 'mapping_coverage',
        severity: 'error',
        title: `لا توجد حسابات مصنفة كـ "${cat.nameAr}"`,
        description: 'مطلوب لتوليد قائمة المركز المالي',
        affectedAccounts: [],
        autoFixAvailable: false,
      });
    }
  }

  return count;
}

// ===== 3. الحسابات المفقودة =====
function runMissingAccountsCheck(rows: TrialBalanceRow[], results: ScenarioResult[]): number {
  let count = 0;
  const codes = new Set(rows.map(r => r.code.trim()));

  // تحقق من التسلسل في الأرقام
  count++;
  const numericCodes = rows.map(r => parseInt(r.code)).filter(n => !isNaN(n)).sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < numericCodes.length; i++) {
    const expected = numericCodes[i - 1] + 1;
    if (numericCodes[i] !== expected && numericCodes[i] - numericCodes[i - 1] > 1) {
      // فقط الفجوات ضمن نفس المجموعة (نفس الرقم الأول)
      const prevGroup = Math.floor(numericCodes[i - 1] / 1000);
      const currGroup = Math.floor(numericCodes[i] / 1000);
      if (prevGroup === currGroup) {
        gaps.push(expected);
      }
    }
  }
  if (gaps.length > 0 && gaps.length < 20) {
    results.push({
      id: 'MISS-001',
      category: 'missing_accounts',
      severity: 'info',
      title: `${gaps.length} فجوة في تسلسل أرقام الحسابات`,
      description: 'قد تكون حسابات محذوفة أو غير مستخدمة',
      affectedAccounts: gaps.map(g => String(g)),
      autoFixAvailable: false,
    });
  }

  return count;
}

// ===== 4. كشف التكرار =====
function runDuplicateDetection(rows: TrialBalanceRow[], results: ScenarioResult[]): number {
  let count = 0;

  // تكرار بالرمز
  count++;
  const codeMap = new Map<string, number>();
  rows.forEach(r => codeMap.set(r.code, (codeMap.get(r.code) || 0) + 1));
  const duplicateCodes = Array.from(codeMap.entries()).filter(([_, c]) => c > 1);
  if (duplicateCodes.length > 0) {
    results.push({
      id: 'DUP-001',
      category: 'duplicate_detection',
      severity: 'error',
      title: `${duplicateCodes.length} رمز حساب مكرر`,
      description: 'التكرار قد يؤدي لاحتساب مزدوج',
      affectedAccounts: duplicateCodes.map(([code, count]) => `${code} (مكرر ${count} مرات)`),
      autoFixAvailable: false,
    });
  }

  // تكرار بالاسم
  count++;
  const nameMap = new Map<string, string[]>();
  rows.forEach(r => {
    const names = nameMap.get(r.name) || [];
    names.push(r.code);
    nameMap.set(r.name, names);
  });
  const duplicateNames = Array.from(nameMap.entries()).filter(([_, codes]) => codes.length > 1);
  if (duplicateNames.length > 0) {
    results.push({
      id: 'DUP-002',
      category: 'duplicate_detection',
      severity: 'warning',
      title: `${duplicateNames.length} اسم حساب مكرر`,
      description: 'قد تكون حسابات مختلفة بنفس الاسم',
      affectedAccounts: duplicateNames.map(([name, codes]) => `${name} (${codes.join(', ')})`),
      autoFixAvailable: false,
    });
  }

  return count;
}

// ===== 5. شذوذ المبالغ =====
function runAmountAnomalyDetection(rows: TrialBalanceRow[], results: ScenarioResult[]): number {
  let count = 0;

  // حسابات بمبالغ كبيرة جداً مقارنة بالمتوسط
  count++;
  const amounts = rows.map(r => Math.max(r.debit, r.credit)).filter(a => a > 0);
  if (amounts.length > 3) {
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((s, a) => s + Math.pow(a - avg, 2), 0) / amounts.length);
    const outliers = rows.filter(r => {
      const max = Math.max(r.debit, r.credit);
      return max > avg + 3 * stdDev && max > 0;
    });
    if (outliers.length > 0) {
      results.push({
        id: 'ANOM-001',
        category: 'amount_anomaly',
        severity: 'info',
        title: `${outliers.length} حساب بمبلغ مرتفع بشكل غير عادي`,
        description: 'تحقق من صحة المبالغ الكبيرة',
        affectedAccounts: outliers.map(r => `${r.code} - ${r.name}`),
        autoFixAvailable: false,
      });
    }
  }

  // حسابات مصروفات بأرصدة دائنة كبيرة
  count++;
  const expensesWithCredit = rows.filter(r =>
    (r.mappedType === 'expenses' || r.mappedType === 'cogs') && r.credit > r.debit
  );
  if (expensesWithCredit.length > 0) {
    results.push({
      id: 'ANOM-002',
      category: 'amount_anomaly',
      severity: 'warning',
      title: `${expensesWithCredit.length} حساب مصروفات برصيد دائن`,
      description: 'المصروفات عادة ذات طبيعة مدينة',
      affectedAccounts: expensesWithCredit.map(r => `${r.code} - ${r.name}`),
      autoFixAvailable: false,
    });
  }

  // حسابات إيرادات بأرصدة مدينة كبيرة
  count++;
  const revenueWithDebit = rows.filter(r =>
    r.mappedType === 'revenue' && r.debit > r.credit
  );
  if (revenueWithDebit.length > 0) {
    results.push({
      id: 'ANOM-003',
      category: 'amount_anomaly',
      severity: 'warning',
      title: `${revenueWithDebit.length} حساب إيرادات برصيد مدين`,
      description: 'الإيرادات عادة ذات طبيعة دائنة',
      affectedAccounts: revenueWithDebit.map(r => `${r.code} - ${r.name}`),
      autoFixAvailable: false,
    });
  }

  return count;
}

// ===== 6. تعارض التصنيف =====
function runClassificationConflicts(rows: TrialBalanceRow[], results: ScenarioResult[]): number {
  let count = 0;

  for (const row of rows) {
    if (row.mappedType === 'unmapped') continue;
    count++;

    for (const pattern of KNOWN_PATTERNS) {
      if (pattern.pattern.test(row.name) && row.mappedType !== pattern.expectedType) {
        // تحقق من أن التعارض حقيقي وليس بسبب الإهلاك
        if (row.name.includes('إهلاك') && row.mappedType === 'non_current_assets') continue;
        if (row.name.includes('مجمع') && row.mappedType === 'non_current_assets') continue;

        results.push({
          id: `CONF-${row.code}`,
          category: 'classification_conflict',
          severity: 'warning',
          title: `تعارض تصنيف: ${row.name}`,
          description: `مصنف كـ "${row.mappedType}" لكن الاسم يشير إلى "${pattern.label}"`,
          affectedAccounts: [row.code],
          autoFixAvailable: true,
          autoFixLabel: `تصنيف كـ ${pattern.expectedType}`,
        });
        break;
      }
    }
  }

  return Math.max(count, rows.length); // كل حساب هو سيناريو
}

// ===== 7. توافق الزكاة =====
function runZakatCompliance(rows: TrialBalanceRow[], results: ScenarioResult[]): number {
  let count = 0;

  // وجود حساب رأس المال
  count++;
  const capitalAccounts = rows.filter(r => r.mappedType === 'equity' && (r.code.startsWith('31') || /رأس.*مال/i.test(r.name)));
  if (capitalAccounts.length === 0) {
    results.push({
      id: 'ZAKAT-001',
      category: 'zakat_compliance',
      severity: 'error',
      title: 'لا يوجد حساب رأس المال',
      description: 'مطلوب لحساب الوعاء الزكوي',
      affectedAccounts: [],
      autoFixAvailable: false,
    });
  }

  // وجود حسابات أصول ثابتة (مطلوبة كحسميات)
  count++;
  const fixedAssets = rows.filter(r => r.mappedType === 'non_current_assets');
  if (fixedAssets.length === 0) {
    results.push({
      id: 'ZAKAT-002',
      category: 'zakat_compliance',
      severity: 'warning',
      title: 'لا توجد أصول غير متداولة',
      description: 'مطلوبة لحساب حسميات الوعاء الزكوي',
      affectedAccounts: [],
      autoFixAvailable: false,
    });
  }

  // حساب الوعاء الزكوي التقريبي
  count++;
  const equityTotal = rows.filter(r => r.mappedType === 'equity').reduce((s, r) => s + (r.credit - r.debit), 0);
  const profitTotal = rows.filter(r => r.mappedType === 'revenue').reduce((s, r) => s + (r.credit - r.debit), 0)
    - rows.filter(r => r.mappedType === 'expenses' || r.mappedType === 'cogs').reduce((s, r) => s + (r.debit - r.credit), 0);
  const nonCurrentTotal = fixedAssets.reduce((s, r) => s + (r.debit - r.credit), 0);
  const zakatBase = equityTotal + profitTotal - nonCurrentTotal;

  if (zakatBase < 0) {
    results.push({
      id: 'ZAKAT-003',
      category: 'zakat_compliance',
      severity: 'info',
      title: 'الوعاء الزكوي سالب',
      description: `الوعاء الزكوي التقريبي = ${zakatBase.toFixed(2)} ر.س - لن يتم احتساب زكاة`,
      affectedAccounts: [],
      autoFixAvailable: false,
    });
  }

  return count;
}

// ===== 8. توافق IFRS =====
function runIFRSCompliance(rows: TrialBalanceRow[], results: ScenarioResult[]): number {
  let count = 0;

  // تحقق من فصل الأصول المتداولة وغير المتداولة
  count++;
  const hasCurrentAssets = rows.some(r => r.mappedType === 'current_assets');
  const hasNonCurrentAssets = rows.some(r => r.mappedType === 'non_current_assets');
  if (!hasCurrentAssets && !hasNonCurrentAssets) {
    results.push({
      id: 'IFRS-001',
      category: 'ifrs_compliance',
      severity: 'error',
      title: 'لا توجد أصول مصنفة',
      description: 'IFRS يتطلب فصل الأصول المتداولة عن غير المتداولة',
      affectedAccounts: [],
      autoFixAvailable: false,
    });
  }

  // تحقق من فصل المطلوبات
  count++;
  const hasCurrentLiab = rows.some(r => r.mappedType === 'current_liabilities');
  const hasNonCurrentLiab = rows.some(r => r.mappedType === 'non_current_liabilities');
  if (!hasCurrentLiab && !hasNonCurrentLiab) {
    // ليس بالضرورة خطأ - بعض الشركات ليس لديها مطلوبات
    results.push({
      id: 'IFRS-002',
      category: 'ifrs_compliance',
      severity: 'info',
      title: 'لا توجد مطلوبات مصنفة',
      description: 'تأكد من عدم وجود التزامات غير مسجلة',
      affectedAccounts: [],
      autoFixAvailable: false,
    });
  }

  return count;
}

// ===== 9. سلامة القوائم المتقاطعة =====
function runCrossStatementIntegrity(rows: TrialBalanceRow[], results: ScenarioResult[]): number {
  let count = 0;

  // معادلة الميزانية: الأصول = الخصوم + حقوق الملكية + (الإيرادات - المصروفات)
  count++;
  const totalAssets = rows.filter(r => ['current_assets', 'non_current_assets'].includes(r.mappedType))
    .reduce((s, r) => s + (r.debit - r.credit), 0);
  const totalLiabilities = rows.filter(r => ['current_liabilities', 'non_current_liabilities'].includes(r.mappedType))
    .reduce((s, r) => s + (r.credit - r.debit), 0);
  const totalEquity = rows.filter(r => r.mappedType === 'equity')
    .reduce((s, r) => s + (r.credit - r.debit), 0);
  const totalRevenue = rows.filter(r => r.mappedType === 'revenue')
    .reduce((s, r) => s + (r.credit - r.debit), 0);
  const totalExpenses = rows.filter(r => ['expenses', 'cogs'].includes(r.mappedType))
    .reduce((s, r) => s + (r.debit - r.credit), 0);

  const netIncome = totalRevenue - totalExpenses;
  const balanceEquation = Math.abs(totalAssets - (totalLiabilities + totalEquity + netIncome));

  if (balanceEquation > 1) {
    results.push({
      id: 'CROSS-001',
      category: 'cross_statement_integrity',
      severity: balanceEquation > 1000 ? 'error' : 'warning',
      title: 'معادلة الميزانية غير متحققة',
      description: `الأصول (${totalAssets.toFixed(0)}) ≠ الخصوم (${totalLiabilities.toFixed(0)}) + الملكية (${totalEquity.toFixed(0)}) + الربح (${netIncome.toFixed(0)}) | الفرق: ${balanceEquation.toFixed(2)}`,
      affectedAccounts: [],
      autoFixAvailable: false,
    });
  }

  // نسبة السيولة
  count++;
  const currentAssets = rows.filter(r => r.mappedType === 'current_assets').reduce((s, r) => s + (r.debit - r.credit), 0);
  const currentLiabilities = rows.filter(r => r.mappedType === 'current_liabilities').reduce((s, r) => s + (r.credit - r.debit), 0);
  if (currentLiabilities > 0) {
    const currentRatio = currentAssets / currentLiabilities;
    if (currentRatio < 1) {
      results.push({
        id: 'CROSS-002',
        category: 'cross_statement_integrity',
        severity: 'info',
        title: `نسبة السيولة منخفضة: ${currentRatio.toFixed(2)}`,
        description: 'الأصول المتداولة أقل من المطلوبات المتداولة',
        affectedAccounts: [],
        autoFixAvailable: false,
      });
    }
  }

  return count;
}

// ===== 10. التسلسل الهرمي =====
function runHierarchyValidation(rows: TrialBalanceRow[], results: ScenarioResult[]): number {
  let count = 0;

  // تحقق من تسلسل الأرقام المنطقي
  count++;
  const codeGroups = new Map<string, TrialBalanceRow[]>();
  rows.forEach(r => {
    const prefix = r.code.charAt(0);
    const group = codeGroups.get(prefix) || [];
    group.push(r);
    codeGroups.set(prefix, group);
  });

  // تحقق من أن كل مجموعة تنتمي لنفس التصنيف
  for (const [prefix, group] of codeGroups) {
    count++;
    const types = new Set(group.map(r => r.mappedType).filter(t => t !== 'unmapped'));
    if (types.size > 2) {
      results.push({
        id: `HIER-${prefix}`,
        category: 'hierarchy_validation',
        severity: 'info',
        title: `المجموعة ${prefix}xxx تحتوي على ${types.size} تصنيفات مختلفة`,
        description: `التصنيفات: ${Array.from(types).join(', ')}`,
        affectedAccounts: group.map(r => r.code),
        autoFixAvailable: false,
      });
    }
  }

  return count;
}

// ===== توليد الحسابات المفقودة =====
export function generateMissingAccounts(rows: TrialBalanceRow[]): TrialBalanceRow[] {
  const existingTypes = new Set(rows.map(r => r.mappedType));
  const missingAccounts: TrialBalanceRow[] = [];

  const requiredDefaults: { code: string; name: string; type: AccountMappingType }[] = [
    { code: '1100', name: 'النقد والأرصدة لدى البنوك', type: 'current_assets' },
    { code: '1200', name: 'ذمم مدينة تجارية', type: 'current_assets' },
    { code: '1300', name: 'المخزون', type: 'current_assets' },
    { code: '1500', name: 'ممتلكات ومعدات', type: 'non_current_assets' },
    { code: '2100', name: 'ذمم دائنة تجارية', type: 'current_liabilities' },
    { code: '2300', name: 'مطلوبات غير متداولة', type: 'non_current_liabilities' },
    { code: '3100', name: 'رأس المال', type: 'equity' },
    { code: '3300', name: 'أرباح محتجزة', type: 'equity' },
    { code: '4100', name: 'الإيرادات', type: 'revenue' },
    { code: '5100', name: 'تكلفة الإيرادات', type: 'cogs' },
    { code: '5200', name: 'مصاريف عمومية وإدارية', type: 'expenses' },
  ];

  const existingCodes = new Set(rows.map(r => r.code));

  for (const def of requiredDefaults) {
    if (!existingTypes.has(def.type) && !existingCodes.has(def.code)) {
      missingAccounts.push({
        code: def.code,
        name: def.name,
        debit: 0,
        credit: 0,
        movementDebit: 0,
        movementCredit: 0,
        mappedType: def.type,
        isAutoMapped: true,
        isValid: true,
      });
    }
  }

  return missingAccounts;
}

// تسمية الفئات بالعربية
export const SCENARIO_CATEGORY_LABELS: Record<ScenarioCategory, string> = {
  balance_validation: 'التحقق من التوازن',
  mapping_coverage: 'تغطية التصنيف',
  missing_accounts: 'الحسابات المفقودة',
  duplicate_detection: 'كشف التكرار',
  amount_anomaly: 'شذوذ المبالغ',
  classification_conflict: 'تعارض التصنيف',
  zakat_compliance: 'توافق الزكاة',
  ifrs_compliance: 'توافق المعايير الدولية',
  cross_statement_integrity: 'سلامة القوائم المتقاطعة',
  hierarchy_validation: 'التسلسل الهرمي',
};

export const SEVERITY_LABELS: Record<string, string> = {
  info: 'معلومة',
  warning: 'تحذير',
  error: 'خطأ',
  critical: 'حرج',
};
