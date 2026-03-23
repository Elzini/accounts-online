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
  overallScore: number;
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

export async function checkJournalBalance(companyId: string): Promise<AccountingCheckResult> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, entry_number, entry_date, description')
    .eq('company_id', companyId)
    .eq('is_posted', true)
    .order('entry_date', { ascending: false })
    .limit(500);

  const imbalanced: any[] = [];

  if (entries && entries.length > 0) {
    // Batch fetch all lines for these entries in one query (fixes N+1)
    const entryIds = entries.map(e => e.id);
    const allLines: any[] = [];
    for (let i = 0; i < entryIds.length; i += 100) {
      const batch = entryIds.slice(i, i + 100);
      const { data: lines } = await supabase
        .from('journal_entry_lines')
        .select('journal_entry_id, debit, credit')
        .in('journal_entry_id', batch);
      if (lines) allLines.push(...lines);
    }

    // Group lines by entry
    const linesByEntry = new Map<string, typeof allLines>();
    for (const line of allLines) {
      const arr = linesByEntry.get(line.journal_entry_id) || [];
      arr.push(line);
      linesByEntry.set(line.journal_entry_id, arr);
    }

    for (const entry of entries) {
      const lines = linesByEntry.get(entry.id) || [];
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

export async function checkAccountLinks(companyId: string): Promise<AccountingCheckResult> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_posted', true)
    .limit(300);

  const orphaned: any[] = [];
  let foreignCount = 0;

  if (entries && entries.length > 0) {
    const entryIds = entries.map(e => e.id).slice(0, 100);
    const { data: lines } = await supabase
      .from('journal_entry_lines')
      .select('id, account_id, journal_entry_id, debit, credit')
      .in('journal_entry_id', entryIds);

    if (lines) {
      const accountIds = [...new Set(lines.map(l => l.account_id))];
      const { data: accounts } = await supabase
        .from('account_categories')
        .select('id, company_id, name')
        .in('id', accountIds);

      const validIds = new Set((accounts || []).filter(a => a.company_id === companyId).map(a => a.id));
      foreignCount = (accounts || []).filter(a => a.company_id !== companyId).length;

      lines.forEach(line => {
        if (!validIds.has(line.account_id)) {
          orphaned.push({ lineId: line.id, accountId: line.account_id });
        }
      });
    }
  }

  return {
    checkId: 'account_links',
    checkName: 'ارتباط الحسابات بالشركة',
    category: 'journal',
    status: foreignCount > 0 ? 'fail' : orphaned.length > 0 ? 'warning' : 'pass',
    severity: foreignCount > 0 ? 'critical' : orphaned.length > 0 ? 'high' : 'low',
    summary: foreignCount > 0
      ? `${foreignCount} حساب تابع لشركة أخرى`
      : orphaned.length > 0
        ? `${orphaned.length} سطر قيد بحساب غير مرتبط`
        : 'جميع الحسابات مرتبطة بشكل صحيح',
    details: { orphaned, foreignAccounts: foreignCount },
    issuesCount: foreignCount + orphaned.length,
    recommendations: foreignCount > 0
      ? ['فحص تداخل البيانات بين الشركات فوراً']
      : orphaned.length > 0 ? ['مراجعة ربط الحسابات'] : [],
  };
}

export async function checkTrialBalanceZero(companyId: string): Promise<AccountingCheckResult> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_posted', true);

  if (!entries || entries.length === 0) {
    return {
      checkId: 'trial_balance_zero', checkName: 'صافي ميزان المراجعة = صفر',
      category: 'trial_balance', status: 'pass', severity: 'low',
      summary: 'لا توجد قيود مرحلة', details: {}, issuesCount: 0, recommendations: [],
    };
  }

  let totalDebit = 0, totalCredit = 0;
  const entryIds = entries.map(e => e.id);

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
      ? ['مراجعة القيود المحاسبية لاكتشاف مصدر الفرق']
      : [],
  };
}

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
    const seen = new Map<number, number>();
    entries.forEach((e, i) => {
      const num = Number(e.entry_number);
      if (seen.has(num)) duplicates.push({ entryNumber: num, date: e.entry_date });
      seen.set(num, (seen.get(num) || 0) + 1);
      if (i > 0) {
        const prevNum = Number(entries[i - 1].entry_number);
        if (num - prevNum > 1) gaps.push({ from: prevNum, to: num, missing: num - prevNum - 1 });
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
      : `${gaps.length} فجوة + ${duplicates.length} تكرار`,
    details: { totalEntries: entries?.length || 0, gaps, duplicates },
    issuesCount: issues,
    recommendations: [
      ...(gaps.length > 0 ? ['مراجعة الفجوات في تسلسل القيود'] : []),
      ...(duplicates.length > 0 ? ['إصلاح أرقام القيود المكررة'] : []),
    ],
  };
}

// ========== 2. مدقق ضريبة القيمة المضافة ==========

export async function checkVATAccuracy(companyId: string): Promise<AccountingCheckResult> {
  const { data: accounts } = await supabase
    .from('account_categories')
    .select('id, code, name, type')
    .eq('company_id', companyId)
    .or('code.like.2201%,code.like.2202%,code.like.2203%');

  if (!accounts || accounts.length === 0) {
    return {
      checkId: 'vat_accuracy', checkName: 'دقة حسابات ضريبة القيمة المضافة',
      category: 'vat', status: 'warning', severity: 'medium',
      summary: 'لم يتم العثور على حسابات ضريبة القيمة المضافة',
      details: { message: 'لا توجد حسابات ضريبة (2201/2202/2203)' },
      issuesCount: 1, recommendations: ['إضافة حسابات ضريبة المخرجات (2201) والمدخلات (2202)'],
    };
  }

  const accountIds = accounts.map(a => a.id);
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_posted', true);

  let vatOutput = 0, vatInput = 0;

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
    .select('total, vat_amount, status')
    .eq('company_id', companyId)
    .eq('invoice_type', 'sale')
    .in('status', ['issued', 'paid']);

  const { data: purchaseInvoices } = await supabase
    .from('invoices')
    .select('total, vat_amount, status')
    .eq('company_id', companyId)
    .eq('invoice_type', 'purchase')
    .in('status', ['issued', 'paid']);

  const invoiceSalesVAT = (salesInvoices || []).reduce((s: number, i: any) => s + (Number(i.vat_amount) || 0), 0);
  const totalExpectedInput = (purchaseInvoices || []).reduce((s: number, i: any) => s + (Number(i.vat_amount) || 0), 0);

  const outputDiff = Math.round((vatOutput - invoiceSalesVAT) * 100) / 100;
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
      : `الضريبة متطابقة | صافي مستحق: ${Math.round(netVAT * 100 / 100).toLocaleString()} ريال`,
    details: {
      vatOutput: Math.round(vatOutput * 100) / 100,
      vatInput: Math.round(vatInput * 100) / 100,
      netVAT: Math.round(netVAT * 100) / 100,
      expectedOutput: invoiceSalesVAT,
      expectedInput: totalExpectedInput,
      outputDifference: outputDiff,
      inputDifference: inputDiff,
    },
    issuesCount: hasDiscrepancy ? 1 : 0,
    recommendations: hasDiscrepancy
      ? ['مراجعة ترحيل الضريبة في الفواتير', 'التأكد من استخدام حسابات 2201/2202 الصحيحة']
      : [],
  };
}

// ========== 3. محرك التسوية التلقائي ==========

export async function checkCustomerReconciliation(companyId: string): Promise<AccountingCheckResult> {
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name')
    .eq('company_id', companyId)
    .limit(100);

  const discrepancies: any[] = [];

  if (customers && customers.length > 0) {
    // Batch: fetch all outstanding invoices for all customers at once (fixes N+1)
    const customerIds = customers.map(c => c.id);
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('customer_id, total, amount_paid, status')
      .eq('company_id', companyId)
      .in('customer_id', customerIds)
      .in('status', ['issued', 'partially_paid']);

    const invoicesByCustomer = new Map<string, typeof allInvoices>();
    for (const inv of allInvoices || []) {
      const arr = invoicesByCustomer.get(inv.customer_id!) || [];
      arr.push(inv);
      invoicesByCustomer.set(inv.customer_id!, arr);
    }

    for (const customer of customers as any[]) {
      const invoices = invoicesByCustomer.get(customer.id) || [];
      const balance = invoices.reduce((s: number, i: any) =>
        s + ((Number(i.total) || 0) - (Number(i.amount_paid) || 0)), 0);
      if (Math.abs(balance) > 1) {
        discrepancies.push({
          customerName: customer.name,
          outstandingBalance: Math.round(balance * 100) / 100,
          invoicesCount: invoices.length,
        });
      }
    }
  }

  return {
    checkId: 'customer_reconciliation',
    checkName: 'تسوية أرصدة العملاء',
    category: 'reconciliation',
    status: 'pass',
    severity: 'low',
    summary: `${customers?.length || 0} عميل | ${discrepancies.length} بأرصدة مستحقة`,
    details: { totalCustomers: customers?.length || 0, withBalances: discrepancies },
    issuesCount: 0,
    recommendations: discrepancies.length > 3
      ? ['متابعة تحصيل الأرصدة المستحقة من العملاء']
      : [],
  };
}

export async function checkSupplierReconciliation(companyId: string): Promise<AccountingCheckResult> {
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('company_id', companyId)
    .limit(100);

  const discrepancies: any[] = [];

  if (suppliers && suppliers.length > 0) {
    // Batch: fetch all outstanding invoices for all suppliers at once (fixes N+1)
    const supplierIds = suppliers.map(s => s.id);
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('supplier_id, total, amount_paid, status')
      .eq('company_id', companyId)
      .in('supplier_id', supplierIds)
      .in('status', ['issued', 'partially_paid']);

    const invoicesBySupplier = new Map<string, typeof allInvoices>();
    for (const inv of allInvoices || []) {
      const arr = invoicesBySupplier.get(inv.supplier_id!) || [];
      arr.push(inv);
      invoicesBySupplier.set(inv.supplier_id!, arr);
    }

    for (const supplier of suppliers as any[]) {
      const invoices = invoicesBySupplier.get(supplier.id) || [];
      const balance = invoices.reduce((s: number, i: any) =>
        s + ((Number(i.total) || 0) - (Number(i.amount_paid) || 0)), 0);
      if (Math.abs(balance) > 1) {
        discrepancies.push({
          supplierName: supplier.name,
          outstandingBalance: Math.round(balance * 100) / 100,
          invoicesCount: invoices.length,
        });
      }
    }
  }

  return {
    checkId: 'supplier_reconciliation',
    checkName: 'تسوية أرصدة الموردين',
    category: 'reconciliation',
    status: 'pass',
    severity: 'low',
    summary: `${suppliers?.length || 0} مورد | ${discrepancies.length} بأرصدة مستحقة`,
    details: { totalSuppliers: suppliers?.length || 0, withBalances: discrepancies },
    issuesCount: 0,
    recommendations: discrepancies.length > 3
      ? ['متابعة سداد الأرصدة المستحقة للموردين']
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

  let score = 100;
  checks.forEach(c => {
    if (c.status === 'fail') score -= c.severity === 'critical' ? 25 : c.severity === 'high' ? 15 : 10;
    else if (c.status === 'warning') score -= c.severity === 'high' ? 8 : c.severity === 'medium' ? 5 : 2;
  });
  score = Math.max(0, score);

  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  for (const check of checks) {
    await supabase.from('data_integrity_checks').insert({
      company_id: companyId,
      check_type: check.checkId,
      check_name: check.checkName,
      status: check.status,
      details: { category: check.category, severity: check.severity, summary: check.summary, issuesCount: check.issuesCount, recommendations: check.recommendations, ...check.details },
      issues_found: check.issuesCount,
      checked_by: userId,
    });
  }

  return {
    companyId, companyName, reportDate: new Date().toISOString(),
    overallScore: score,
    overallStatus: score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical',
    checks,
    summary: { totalChecks: checks.length, passed, warnings, failed },
  };
}
