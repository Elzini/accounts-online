// خدمة التحقق المحاسبي الشامل - حارس صحة النظام المالي
import { supabase } from '@/integrations/supabase/client';

export interface AccountingCheckResult {
  checkId: string;
  checkName: string;
  category: 'journal' | 'vat' | 'reconciliation' | 'trial_balance';
  status: 'pass' | 'fail' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
  details: any;
  issuesCount: number;
  recommendations: string[];
}

export interface SystemHealthReport {
  companyId: string;
  companyName: string;
  reportDate: string;
  overallScore: number; // 0-100
  overallStatus: 'healthy' | 'warning' | 'critical';
  checks: AccountingCheckResult[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}

// ========== 1. حارس القيود المحاسبية ==========

// فحص توازن كل قيد (مدين = دائن)
export async function checkJournalBalance(companyId: string): Promise<AccountingCheckResult> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, entry_number, entry_date, is_posted, description')
    .eq('company_id', companyId)
    .eq('is_posted', true)
    .order('entry_date', { ascending: false })
    .limit(500);

  const imbalanced: any[] = [];

  if (entries) {
    for (const entry of entries) {
      const { data: lines } = await supabase
        .from('journal_entry_lines')
        .select('debit, credit')
        .eq('journal_entry_id', entry.id);

      if (lines) {
        const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
        const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
        const diff = Math.round((totalDebit - totalCredit) * 100) / 100;

        if (Math.abs(diff) > 0.01) {
          imbalanced.push({
            entryNumber: entry.entry_number,
            date: entry.entry_date,
            description: entry.description,
            totalDebit: Math.round(totalDebit * 100) / 100,
            totalCredit: Math.round(totalCredit * 100) / 100,
            difference: diff,
          });
        }
      }
    }
  }

  return {
    checkId: 'journal_balance',
    checkName: 'توازن القيود المحاسبية (مدين = دائن)',
    category: 'journal',
    status: imbalanced.length === 0 ? 'pass' : 'fail',
    severity: imbalanced.length > 0 ? 'critical' : 'low',
    summary: imbalanced.length === 0
      ? `جميع القيود متوازنة (${entries?.length || 0} قيد)`
      : `${imbalanced.length} قيد غير متوازن من أصل ${entries?.length || 0}`,
    details: { totalEntries: entries?.length || 0, imbalanced },
    issuesCount: imbalanced.length,
    recommendations: imbalanced.length > 0
      ? ['مراجعة القيود غير المتوازنة وتصحيحها فوراً', 'التأكد من عدم وجود أخطاء في الإدخال اليدوي']
      : [],
  };
}

// فحص ارتباط الحسابات - كل سطر قيد يشير لحساب فعلي
export async function checkAccountLinks(companyId: string): Promise<AccountingCheckResult> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_posted', true)
    .limit(300);

  const orphaned: any[] = [];

  if (entries) {
    const entryIds = entries.map(e => e.id);
    const { data: lines } = await supabase
      .from('journal_entry_lines')
      .select('id, account_id, journal_entry_id, debit, credit')
      .in('journal_entry_id', entryIds.slice(0, 100));

    if (lines) {
      const accountIds = [...new Set(lines.map(l => l.account_id))];
      const { data: accounts } = await supabase
        .from('account_categories')
        .select('id, company_id, name')
        .in('id', accountIds);

      const validAccountIds = new Set((accounts || []).filter(a => a.company_id === companyId).map(a => a.id));
      const foreignAccounts = (accounts || []).filter(a => a.company_id !== companyId);

      lines.forEach(line => {
        if (!validAccountIds.has(line.account_id)) {
          orphaned.push({
            lineId: line.id,
            accountId: line.account_id,
            journalEntryId: line.journal_entry_id,
            amount: Number(line.debit) || Number(line.credit) || 0,
          });
        }
      });

      if (foreignAccounts.length > 0) {
        return {
          checkId: 'account_links',
          checkName: 'ارتباط الحسابات بالشركة',
          category: 'journal',
          status: 'fail',
          severity: 'critical',
          summary: `${foreignAccounts.length} حساب تابع لشركة أخرى مستخدم في القيود`,
          details: { foreignAccounts: foreignAccounts.map(a => a.name), orphaned },
          issuesCount: foreignAccounts.length,
          recommendations: ['فحص تداخل البيانات بين الشركات فوراً', 'مراجعة سياسات العزل'],
        };
      }
    }
  }

  return {
    checkId: 'account_links',
    checkName: 'ارتباط الحسابات بالشركة',
    category: 'journal',
    status: orphaned.length === 0 ? 'pass' : 'warning',
    severity: orphaned.length > 0 ? 'high' : 'low',
    summary: orphaned.length === 0 ? 'جميع الحسابات مرتبطة بالشركة بشكل صحيح' : `${orphaned.length} سطر قيد بحساب غير مرتبط`,
    details: { orphaned },
    issuesCount: orphaned.length,
    recommendations: orphaned.length > 0 ? ['مراجعة ربط الحسابات في القيود المشار إليها'] : [],
  };
}

// فحص رصيد ميزان المراجعة = صفر
export async function checkTrialBalanceZero(companyId: string): Promise<AccountingCheckResult> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_posted', true);

  if (!entries || entries.length === 0) {
    return {
      checkId: 'trial_balance_zero',
      checkName: 'صافي ميزان المراجعة = صفر',
      category: 'trial_balance',
      status: 'pass',
      severity: 'low',
      summary: 'لا توجد قيود مرحلة',
      details: {},
      issuesCount: 0,
      recommendations: [],
    };
  }

  const entryIds = entries.map(e => e.id);
  let totalDebit = 0;
  let totalCredit = 0;

  // جلب على دفعات
  for (let i = 0; i < entryIds.length; i += 100) {
    const batch = entryIds.slice(i, i + 100);
    const { data: lines } = await supabase
      .from('journal_entry_lines')
      .select('debit, credit')
      .in('journal_entry_id', batch);

    if (lines) {
      lines.forEach(l => {
        totalDebit += Number(l.debit) || 0;
        totalCredit += Number(l.credit) || 0;
      });
    }
  }

  const diff = Math.round((totalDebit - totalCredit) * 100) / 100;

  return {
    checkId: 'trial_balance_zero',
    checkName: 'صافي ميزان المراجعة = صفر',
    category: 'trial_balance',
    status: Math.abs(diff) <= 0.01 ? 'pass' : 'fail',
    severity: Math.abs(diff) > 0.01 ? 'critical' : 'low',
    summary: Math.abs(diff) <= 0.01
      ? `ميزان المراجعة متوازن (مدين: ${totalDebit.toLocaleString()} | دائن: ${totalCredit.toLocaleString()})`
      : `فرق في ميزان المراجعة: ${diff.toLocaleString()} ريال`,
    details: { totalDebit, totalCredit, difference: diff, entriesCount: entries.length },
    issuesCount: Math.abs(diff) > 0.01 ? 1 : 0,
    recommendations: Math.abs(diff) > 0.01
      ? ['مراجعة القيود المحاسبية لاكتشاف مصدر الفرق', 'التأكد من عدم وجود قيود يدوية غير متوازنة']
      : [],
  };
}

// فحص تسلسل أرقام القيود
export async function checkEntrySequence(companyId: string): Promise<AccountingCheckResult> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('entry_number, entry_date')
    .eq('company_id', companyId)
    .eq('is_posted', true)
    .order('entry_number', { ascending: true })
    .limit(500);

  const gaps: any[] = [];
  const duplicates: any[] = [];

  if (entries && entries.length > 1) {
    const seenNumbers = new Map<number, number>();

    entries.forEach((e, i) => {
      const num = Number(e.entry_number);
      if (seenNumbers.has(num)) {
        duplicates.push({ entryNumber: num, date: e.entry_date });
      }
      seenNumbers.set(num, (seenNumbers.get(num) || 0) + 1);

      if (i > 0) {
        const prevNum = Number(entries[i - 1].entry_number);
        if (num - prevNum > 1) {
          gaps.push({ from: prevNum, to: num, missing: num - prevNum - 1 });
        }
      }
    });
  }

  const issues = gaps.length + duplicates.length;

  return {
    checkId: 'entry_sequence',
    checkName: 'تسلسل أرقام القيود',
    category: 'journal',
    status: issues === 0 ? 'pass' : 'warning',
    severity: duplicates.length > 0 ? 'high' : 'medium',
    summary: issues === 0
      ? `التسلسل سليم (${entries?.length || 0} قيد)`
      : `${gaps.length} فجوة + ${duplicates.length} تكرار في أرقام القيود`,
    details: { totalEntries: entries?.length || 0, gaps, duplicates },
    issuesCount: issues,
    recommendations: [
      ...(gaps.length > 0 ? ['مراجعة الفجوات في تسلسل القيود - قد تشير لقيود محذوفة'] : []),
      ...(duplicates.length > 0 ? ['إصلاح أرقام القيود المكررة لضمان التدقيق السليم'] : []),
    ],
  };
}

// ========== 2. مدقق ضريبة القيمة المضافة ==========

export async function checkVATAccuracy(companyId: string): Promise<AccountingCheckResult> {
  // حسابات الضريبة: 2201 مخرجات، 2202 مدخلات
  const { data: accounts } = await supabase
    .from('account_categories')
    .select('id, code, name, type')
    .eq('company_id', companyId)
    .or('code.like.2201%,code.like.2202%,code.like.2203%');

  if (!accounts || accounts.length === 0) {
    return {
      checkId: 'vat_accuracy',
      checkName: 'دقة حسابات ضريبة القيمة المضافة',
      category: 'vat',
      status: 'warning',
      severity: 'medium',
      summary: 'لم يتم العثور على حسابات ضريبة القيمة المضافة',
      details: { message: 'لا توجد حسابات ضريبة (2201/2202/2203) في دليل الحسابات' },
      issuesCount: 1,
      recommendations: ['إضافة حسابات ضريبة المخرجات (2201) والمدخلات (2202) والتسوية (2203)'],
    };
  }

  // جلب أرصدة حسابات الضريبة من القيود
  const accountIds = accounts.map(a => a.id);
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_posted', true);

  let vatOutput = 0; // ضريبة المخرجات (دائنة عادة)
  let vatInput = 0;  // ضريبة المدخلات (مدينة عادة)

  if (entries) {
    const entryIds = entries.map(e => e.id);
    for (let i = 0; i < entryIds.length; i += 100) {
      const batch = entryIds.slice(i, i + 100);
      const { data: lines } = await supabase
        .from('journal_entry_lines')
        .select('account_id, debit, credit')
        .in('journal_entry_id', batch)
        .in('account_id', accountIds);

      if (lines) {
        lines.forEach(l => {
          const account = accounts.find(a => a.id === l.account_id);
          if (account?.code?.startsWith('2201')) {
            vatOutput += (Number(l.credit) || 0) - (Number(l.debit) || 0);
          } else if (account?.code?.startsWith('2202')) {
            vatInput += (Number(l.debit) || 0) - (Number(l.credit) || 0);
          }
        });
      }
    }
  }

  // مقارنة مع الفواتير
  const { data: salesInvoices } = await supabase
    .from('invoices')
    .select('total_amount, tax_amount, status')
    .eq('company_id', companyId)
    .eq('invoice_type', 'sale')
    .in('status', ['issued', 'paid']);

  const { data: purchaseInvoices } = await supabase
    .from('invoices')
    .select('total_amount, tax_amount, status')
    .eq('company_id', companyId)
    .eq('invoice_type', 'purchase')
    .in('status', ['issued', 'paid']);

  // أيضاً مبيعات السيارات
  const { data: carSales } = await supabase
    .from('sales')
    .select('vat_amount, status')
    .eq('company_id', companyId)
    .in('status', ['approved', 'completed']);

  const invoiceSalesVAT = (salesInvoices || []).reduce((s, i) => s + (Number(i.tax_amount) || 0), 0);
  const carSalesVAT = (carSales || []).reduce((s, i) => s + (Number(i.vat_amount) || 0), 0);
  const totalExpectedOutput = invoiceSalesVAT + carSalesVAT;
  const totalExpectedInput = (purchaseInvoices || []).reduce((s, i) => s + (Number(i.tax_amount) || 0), 0);

  const outputDiff = Math.round((vatOutput - totalExpectedOutput) * 100) / 100;
  const inputDiff = Math.round((vatInput - totalExpectedInput) * 100) / 100;
  const hasDiscrepancy = Math.abs(outputDiff) > 1 || Math.abs(inputDiff) > 1;

  const netVAT = vatOutput - vatInput;

  return {
    checkId: 'vat_accuracy',
    checkName: 'دقة حسابات ضريبة القيمة المضافة',
    category: 'vat',
    status: hasDiscrepancy ? 'warning' : 'pass',
    severity: hasDiscrepancy ? 'high' : 'low',
    summary: hasDiscrepancy
      ? `فرق في الضريبة: مخرجات ${outputDiff.toLocaleString()} | مدخلات ${inputDiff.toLocaleString()}`
      : `الضريبة متطابقة | صافي: ${netVAT.toLocaleString()} ريال`,
    details: {
      vatOutput: Math.round(vatOutput * 100) / 100,
      vatInput: Math.round(vatInput * 100) / 100,
      netVAT: Math.round(netVAT * 100) / 100,
      expectedOutput: totalExpectedOutput,
      expectedInput: totalExpectedInput,
      outputDifference: outputDiff,
      inputDifference: inputDiff,
      salesInvoicesCount: (salesInvoices?.length || 0) + (carSales?.length || 0),
      purchaseInvoicesCount: purchaseInvoices?.length || 0,
    },
    issuesCount: hasDiscrepancy ? 1 : 0,
    recommendations: hasDiscrepancy
      ? [
          'مراجعة فواتير المبيعات والمشتريات للتأكد من ترحيل الضريبة بشكل صحيح',
          'التأكد من استخدام الحسابات الصحيحة (2201/2202) في القيود الضريبية',
          'مقارنة أرصدة الضريبة مع الإقرار الضريبي',
        ]
      : [],
  };
}

// ========== 3. محرك التسوية التلقائي ==========

// مقارنة أرصدة العملاء
export async function checkCustomerReconciliation(companyId: string): Promise<AccountingCheckResult> {
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, balance')
    .eq('company_id', companyId)
    .limit(100);

  const discrepancies: any[] = [];

  if (customers) {
    // جلب حسابات العملاء من دليل الحسابات (1201 - ذمم مدينة)
    const { data: receivableAccounts } = await supabase
      .from('account_categories')
      .select('id, code, name')
      .eq('company_id', companyId)
      .like('code', '1201%');

    // حساب رصيد كل عميل من الفواتير
    for (const customer of customers) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, paid_amount, status')
        .eq('company_id', companyId)
        .eq('customer_id', customer.id)
        .in('status', ['issued', 'partially_paid']);

      const invoiceBalance = (invoices || []).reduce((s, i) =>
        s + ((Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0)), 0);

      // أيضاً مبيعات السيارات
      const { data: sales } = await supabase
        .from('sales')
        .select('selling_price, total_paid, status')
        .eq('company_id', companyId)
        .eq('customer_id', customer.id)
        .in('status', ['approved', 'completed']);

      const salesBalance = (sales || []).reduce((s, sale) =>
        s + ((Number(sale.selling_price) || 0) - (Number(sale.total_paid) || 0)), 0);

      const expectedBalance = Math.round((invoiceBalance + salesBalance) * 100) / 100;
      const actualBalance = Math.round((Number(customer.balance) || 0) * 100) / 100;
      const diff = Math.round((actualBalance - expectedBalance) * 100) / 100;

      if (Math.abs(diff) > 1) {
        discrepancies.push({
          customerName: customer.name,
          recordedBalance: actualBalance,
          calculatedBalance: expectedBalance,
          difference: diff,
        });
      }
    }
  }

  return {
    checkId: 'customer_reconciliation',
    checkName: 'تسوية أرصدة العملاء',
    category: 'reconciliation',
    status: discrepancies.length === 0 ? 'pass' : 'warning',
    severity: discrepancies.length > 3 ? 'high' : 'medium',
    summary: discrepancies.length === 0
      ? `أرصدة ${customers?.length || 0} عميل متطابقة`
      : `${discrepancies.length} عميل بفروقات في الأرصدة`,
    details: { totalCustomers: customers?.length || 0, discrepancies },
    issuesCount: discrepancies.length,
    recommendations: discrepancies.length > 0
      ? ['مراجعة سندات القبض المسجلة لكل عميل', 'التأكد من مطابقة المدفوعات مع الفواتير']
      : [],
  };
}

// مقارنة أرصدة الموردين
export async function checkSupplierReconciliation(companyId: string): Promise<AccountingCheckResult> {
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, balance')
    .eq('company_id', companyId)
    .limit(100);

  const discrepancies: any[] = [];

  if (suppliers) {
    for (const supplier of suppliers) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, paid_amount, status')
        .eq('company_id', companyId)
        .eq('supplier_id', supplier.id)
        .in('status', ['issued', 'partially_paid']);

      const expectedBalance = (invoices || []).reduce((s, i) =>
        s + ((Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0)), 0);

      const actualBalance = Number(supplier.balance) || 0;
      const diff = Math.round((actualBalance - expectedBalance) * 100) / 100;

      if (Math.abs(diff) > 1) {
        discrepancies.push({
          supplierName: supplier.name,
          recordedBalance: actualBalance,
          calculatedBalance: Math.round(expectedBalance * 100) / 100,
          difference: diff,
        });
      }
    }
  }

  return {
    checkId: 'supplier_reconciliation',
    checkName: 'تسوية أرصدة الموردين',
    category: 'reconciliation',
    status: discrepancies.length === 0 ? 'pass' : 'warning',
    severity: discrepancies.length > 3 ? 'high' : 'medium',
    summary: discrepancies.length === 0
      ? `أرصدة ${suppliers?.length || 0} مورد متطابقة`
      : `${discrepancies.length} مورد بفروقات في الأرصدة`,
    details: { totalSuppliers: suppliers?.length || 0, discrepancies },
    issuesCount: discrepancies.length,
    recommendations: discrepancies.length > 0
      ? ['مراجعة سندات الصرف للموردين ذوي الفروقات', 'مطابقة كشوف حساب الموردين']
      : [],
  };
}

// ========== 4. تقرير صحة النظام الشامل ==========

export async function runFullAccountingHealthCheck(
  companyId: string,
  companyName: string = ''
): Promise<SystemHealthReport> {
  const checks = await Promise.all([
    checkJournalBalance(companyId),
    checkAccountLinks(companyId),
    checkTrialBalanceZero(companyId),
    checkEntrySequence(companyId),
    checkVATAccuracy(companyId),
    checkCustomerReconciliation(companyId),
    checkSupplierReconciliation(companyId),
  ]);

  const passed = checks.filter(c => c.status === 'pass').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  const failed = checks.filter(c => c.status === 'fail').length;

  // حساب النتيجة الإجمالية
  let score = 100;
  checks.forEach(c => {
    if (c.status === 'fail') {
      score -= c.severity === 'critical' ? 25 : c.severity === 'high' ? 15 : 10;
    } else if (c.status === 'warning') {
      score -= c.severity === 'high' ? 8 : c.severity === 'medium' ? 5 : 2;
    }
  });
  score = Math.max(0, score);

  // حفظ النتائج في قاعدة البيانات
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  for (const check of checks) {
    await supabase.from('data_integrity_checks').insert({
      company_id: companyId,
      check_type: check.checkId,
      check_name: check.checkName,
      status: check.status,
      details: {
        category: check.category,
        severity: check.severity,
        summary: check.summary,
        issuesCount: check.issuesCount,
        recommendations: check.recommendations,
        ...check.details,
      },
      issues_found: check.issuesCount,
      checked_by: userId,
    });
  }

  return {
    companyId,
    companyName,
    reportDate: new Date().toISOString(),
    overallScore: score,
    overallStatus: score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical',
    checks,
    summary: { totalChecks: checks.length, passed, warnings, failed },
  };
}
