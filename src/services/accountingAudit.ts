import { supabase } from '@/integrations/supabase/client';

export interface AuditCheckResult {
  id: string;
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'running' | 'pending';
  message: string;
  details?: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

// ===== Category 1: Database & Core Tables =====

export async function checkCoreTables(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  // Check accounts exist
  const { count: accountsCount, error: accErr } = await supabase
    .from('account_categories')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  results.push({
    id: 'core-accounts',
    category: 'database',
    name: 'جدول شجرة الحسابات',
    status: accErr ? 'fail' : (accountsCount && accountsCount > 0 ? 'pass' : 'warning'),
    message: accErr ? 'خطأ في الوصول لجدول الحسابات' : (accountsCount && accountsCount > 0 ? `تم العثور على ${accountsCount} حساب` : 'لا توجد حسابات - يجب إنشاء شجرة الحسابات'),
    severity: accErr ? 'critical' : (accountsCount && accountsCount > 0 ? 'info' : 'high'),
  });

  // Check journal entries table
  const { count: jeCount, error: jeErr } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  results.push({
    id: 'core-journal-entries',
    category: 'database',
    name: 'جدول القيود اليومية',
    status: jeErr ? 'fail' : 'pass',
    message: jeErr ? 'خطأ في الوصول لجدول القيود' : `تم العثور على ${jeCount || 0} قيد`,
    severity: jeErr ? 'critical' : 'info',
  });

  // Check fiscal years
  const { count: fyCount, error: fyErr } = await supabase
    .from('fiscal_years')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  results.push({
    id: 'core-fiscal-years',
    category: 'database',
    name: 'السنوات المالية',
    status: fyErr ? 'fail' : (fyCount && fyCount > 0 ? 'pass' : 'warning'),
    message: fyErr ? 'خطأ في الوصول للسنوات المالية' : (fyCount && fyCount > 0 ? `تم العثور على ${fyCount} سنة مالية` : 'لا توجد سنوات مالية محددة'),
    severity: fyErr ? 'critical' : (fyCount && fyCount > 0 ? 'info' : 'medium'),
  });

  // Check tax settings
  const { data: taxData, error: taxErr } = await supabase
    .from('tax_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  results.push({
    id: 'core-tax-settings',
    category: 'database',
    name: 'إعدادات الضريبة',
    status: taxErr ? 'fail' : (taxData ? 'pass' : 'warning'),
    message: taxErr ? 'خطأ في إعدادات الضريبة' : (taxData ? `الضريبة: ${taxData.tax_rate}%` : 'لم يتم تعيين إعدادات الضريبة'),
    severity: taxErr ? 'high' : (taxData ? 'info' : 'medium'),
  });

  // Check users/profiles
  const { count: usersCount, error: usersErr } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  results.push({
    id: 'core-users',
    category: 'database',
    name: 'المستخدمين والصلاحيات',
    status: usersErr ? 'fail' : 'pass',
    message: usersErr ? 'خطأ في جدول المستخدمين' : `${usersCount || 0} مستخدم مسجل`,
    severity: usersErr ? 'critical' : 'info',
  });

  return results;
}

// ===== Category 2: Opening & Journal Entries Balance =====

export async function checkJournalEntryBalance(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  // Check opening entries balance
  const { data: openingEntries, error: oeErr } = await supabase
    .from('journal_entries')
    .select('id, entry_number, total_debit, total_credit, description')
    .eq('company_id', companyId)
    .eq('reference_type', 'opening');

  if (oeErr) {
    results.push({
      id: 'balance-opening',
      category: 'journal-balance',
      name: 'توازن القيد الافتتاحي',
      status: 'fail',
      message: 'خطأ في قراءة القيود الافتتاحية',
      severity: 'critical',
    });
  } else {
    const unbalancedOpening = (openingEntries || []).filter(
      e => Math.abs(Number(e.total_debit) - Number(e.total_credit)) > 0.01
    );

    results.push({
      id: 'balance-opening',
      category: 'journal-balance',
      name: 'توازن القيد الافتتاحي',
      status: unbalancedOpening.length > 0 ? 'fail' : (openingEntries && openingEntries.length > 0 ? 'pass' : 'warning'),
      message: unbalancedOpening.length > 0
        ? `${unbalancedOpening.length} قيد افتتاحي غير متوازن!`
        : (openingEntries && openingEntries.length > 0 ? `${openingEntries.length} قيد افتتاحي متوازن` : 'لا توجد قيود افتتاحية'),
      details: unbalancedOpening.map(e => `قيد #${e.entry_number}: مدين=${e.total_debit} ≠ دائن=${e.total_credit}`),
      severity: unbalancedOpening.length > 0 ? 'critical' : 'info',
    });
  }

  // Check ALL journal entries balance
  const { data: allEntries, error: allErr } = await supabase
    .from('journal_entries')
    .select('id, entry_number, total_debit, total_credit, entry_date, description')
    .eq('company_id', companyId)
    .order('entry_number', { ascending: true });

  if (allErr) {
    results.push({
      id: 'balance-all-entries',
      category: 'journal-balance',
      name: 'توازن جميع القيود اليومية',
      status: 'fail',
      message: 'خطأ في قراءة القيود',
      severity: 'critical',
    });
  } else {
    const unbalanced = (allEntries || []).filter(
      e => Math.abs(Number(e.total_debit) - Number(e.total_credit)) > 0.01
    );

    results.push({
      id: 'balance-all-entries',
      category: 'journal-balance',
      name: 'توازن جميع القيود اليومية',
      status: unbalanced.length > 0 ? 'fail' : 'pass',
      message: unbalanced.length > 0
        ? `⚠️ ${unbalanced.length} قيد غير متوازن من أصل ${(allEntries || []).length}`
        : `✓ جميع القيود متوازنة (${(allEntries || []).length} قيد)`,
      details: unbalanced.slice(0, 20).map(e => `قيد #${e.entry_number} (${e.entry_date}): مدين=${e.total_debit} ≠ دائن=${e.total_credit} | ${e.description || ''}`),
      severity: unbalanced.length > 0 ? 'critical' : 'info',
    });
  }

  // Check for duplicate entries (same date, same amounts, same description)
  if (allEntries && allEntries.length > 0) {
    const duplicates: string[] = [];
    const seen = new Map<string, number[]>();

    for (const entry of allEntries) {
      const key = `${entry.entry_date}_${entry.total_debit}_${entry.total_credit}_${entry.description || ''}`;
      const existing = seen.get(key) || [];
      existing.push(entry.entry_number);
      seen.set(key, existing);
    }

    for (const [, numbers] of seen) {
      if (numbers.length > 1) {
        duplicates.push(`قيود مكررة: #${numbers.join(', #')}`);
      }
    }

    results.push({
      id: 'balance-duplicates',
      category: 'journal-balance',
      name: 'فحص القيود المكررة',
      status: duplicates.length > 0 ? 'warning' : 'pass',
      message: duplicates.length > 0
        ? `⚠️ تم العثور على ${duplicates.length} مجموعة من القيود المحتمل تكرارها`
        : 'لا توجد قيود مكررة',
      details: duplicates.slice(0, 10),
      severity: duplicates.length > 0 ? 'medium' : 'info',
    });
  }

  // Verify journal_entry_lines match entry totals
  const { data: entriesWithLines, error: ewlErr } = await supabase
    .from('journal_entries')
    .select('id, entry_number, total_debit, total_credit')
    .eq('company_id', companyId);

  if (!ewlErr && entriesWithLines && entriesWithLines.length > 0) {
    const mismatchDetails: string[] = [];
    // Check a batch of entries
    const sampleEntries = entriesWithLines.slice(0, 100);

    for (const entry of sampleEntries) {
      const { data: lines } = await supabase
        .from('journal_entry_lines')
        .select('debit, credit')
        .eq('journal_entry_id', entry.id);

      if (lines) {
        const linesDebit = lines.reduce((s, l) => s + Number(l.debit), 0);
        const linesCredit = lines.reduce((s, l) => s + Number(l.credit), 0);

        if (Math.abs(linesDebit - Number(entry.total_debit)) > 0.01 ||
            Math.abs(linesCredit - Number(entry.total_credit)) > 0.01) {
          mismatchDetails.push(
            `قيد #${entry.entry_number}: مجموع السطور (${linesDebit}/${linesCredit}) ≠ إجمالي القيد (${entry.total_debit}/${entry.total_credit})`
          );
        }
      }
    }

    results.push({
      id: 'balance-lines-match',
      category: 'journal-balance',
      name: 'تطابق سطور القيود مع الإجمالي',
      status: mismatchDetails.length > 0 ? 'fail' : 'pass',
      message: mismatchDetails.length > 0
        ? `${mismatchDetails.length} قيد لا تتطابق سطوره مع الإجمالي`
        : `تم فحص ${sampleEntries.length} قيد - جميعها متطابقة`,
      details: mismatchDetails.slice(0, 10),
      severity: mismatchDetails.length > 0 ? 'high' : 'info',
    });
  }

  return results;
}

// ===== Category 3: Financial Reports & Statements =====

export async function checkFinancialReports(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  // Trial Balance Check
  const { data: trialLines, error: tbErr } = await supabase
    .from('journal_entry_lines')
    .select(`
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (tbErr) {
    results.push({
      id: 'reports-trial-balance',
      category: 'financial-reports',
      name: 'ميزان المراجعة',
      status: 'fail',
      message: 'خطأ في حساب ميزان المراجعة',
      severity: 'critical',
    });
  } else {
    const totalDebit = (trialLines || []).reduce((s, l: any) => s + Number(l.debit), 0);
    const totalCredit = (trialLines || []).reduce((s, l: any) => s + Number(l.credit), 0);
    const diff = Math.abs(totalDebit - totalCredit);

    results.push({
      id: 'reports-trial-balance',
      category: 'financial-reports',
      name: 'ميزان المراجعة',
      status: diff > 0.01 ? 'fail' : 'pass',
      message: diff > 0.01
        ? `⚠️ ميزان المراجعة غير متوازن! فرق: ${diff.toFixed(2)}`
        : `✓ ميزان المراجعة متوازن (مدين: ${totalDebit.toFixed(2)} = دائن: ${totalCredit.toFixed(2)})`,
      severity: diff > 0.01 ? 'critical' : 'info',
    });
  }

  // Income Statement Check - Revenue vs Expenses accounts exist
  const { data: accounts } = await supabase
    .from('account_categories')
    .select('type')
    .eq('company_id', companyId);

  if (accounts) {
    const hasRevenue = accounts.some(a => a.type === 'revenue');
    const hasExpenses = accounts.some(a => a.type === 'expenses');
    const hasAssets = accounts.some(a => a.type === 'assets');
    const hasLiabilities = accounts.some(a => a.type === 'liabilities');
    const hasEquity = accounts.some(a => a.type === 'equity');

    results.push({
      id: 'reports-income-accounts',
      category: 'financial-reports',
      name: 'حسابات قائمة الدخل',
      status: hasRevenue && hasExpenses ? 'pass' : 'warning',
      message: hasRevenue && hasExpenses
        ? '✓ حسابات الإيرادات والمصروفات موجودة'
        : `${!hasRevenue ? 'لا توجد حسابات إيرادات. ' : ''}${!hasExpenses ? 'لا توجد حسابات مصروفات.' : ''}`,
      severity: hasRevenue && hasExpenses ? 'info' : 'high',
    });

    results.push({
      id: 'reports-balance-sheet-accounts',
      category: 'financial-reports',
      name: 'حسابات الميزانية العمومية',
      status: hasAssets && hasLiabilities && hasEquity ? 'pass' : 'warning',
      message: hasAssets && hasLiabilities && hasEquity
        ? '✓ حسابات الأصول والالتزامات وحقوق الملكية موجودة'
        : `مفقود: ${[!hasAssets && 'أصول', !hasLiabilities && 'التزامات', !hasEquity && 'حقوق ملكية'].filter(Boolean).join(', ')}`,
      severity: hasAssets && hasLiabilities && hasEquity ? 'info' : 'high',
    });
  }

  // Check sales/purchases linkage to journal entries
  const { count: salesCount } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  const { count: saleEntriesCount } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('reference_type', 'sale');

  results.push({
    id: 'reports-sales-linkage',
    category: 'financial-reports',
    name: 'ربط المبيعات بالقيود المحاسبية',
    status: (salesCount || 0) > 0 && (saleEntriesCount || 0) === 0 ? 'warning' : 'pass',
    message: (salesCount || 0) > 0 && (saleEntriesCount || 0) === 0
      ? `⚠️ ${salesCount} عملية بيع بدون قيود محاسبية مرتبطة`
      : `${salesCount || 0} مبيعات، ${saleEntriesCount || 0} قيد مرتبط`,
    severity: (salesCount || 0) > 0 && (saleEntriesCount || 0) === 0 ? 'high' : 'info',
  });

  const { count: purchasesCount } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  const { count: purchaseEntriesCount } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('reference_type', 'purchase');

  results.push({
    id: 'reports-purchases-linkage',
    category: 'financial-reports',
    name: 'ربط المشتريات بالقيود المحاسبية',
    status: (purchasesCount || 0) > 0 && (purchaseEntriesCount || 0) === 0 ? 'warning' : 'pass',
    message: (purchasesCount || 0) > 0 && (purchaseEntriesCount || 0) === 0
      ? `⚠️ ${purchasesCount} عملية شراء بدون قيود محاسبية مرتبطة`
      : `${purchasesCount || 0} مشتريات، ${purchaseEntriesCount || 0} قيد مرتبط`,
    severity: (purchasesCount || 0) > 0 && (purchaseEntriesCount || 0) === 0 ? 'high' : 'info',
  });

  // VAT Check
  const { data: taxSettings } = await supabase
    .from('tax_settings')
    .select('is_active, tax_rate')
    .eq('company_id', companyId)
    .maybeSingle();

  if (taxSettings?.is_active) {
    const { data: vatAccounts } = await supabase
      .from('account_categories')
      .select('id, code, name')
      .eq('company_id', companyId)
      .or('code.like.%ضريبة%,name.like.%ضريبة%,name.like.%VAT%');

    results.push({
      id: 'reports-vat-accounts',
      category: 'financial-reports',
      name: 'حسابات الإقرار الضريبي',
      status: vatAccounts && vatAccounts.length > 0 ? 'pass' : 'warning',
      message: vatAccounts && vatAccounts.length > 0
        ? `✓ تم العثور على ${vatAccounts.length} حساب ضريبي`
        : '⚠️ الضريبة مفعلة لكن لا توجد حسابات ضريبية في شجرة الحسابات',
      severity: vatAccounts && vatAccounts.length > 0 ? 'info' : 'high',
    });
  }

  return results;
}

// ===== Category 4: Fiscal Year Integrity =====

export async function checkFiscalYearIntegrity(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  const { data: fiscalYears, error: fyErr } = await supabase
    .from('fiscal_years')
    .select('*')
    .eq('company_id', companyId)
    .order('start_date', { ascending: true });

  if (fyErr || !fiscalYears || fiscalYears.length === 0) {
    results.push({
      id: 'fy-exists',
      category: 'fiscal-year',
      name: 'وجود سنوات مالية',
      status: 'warning',
      message: 'لا توجد سنوات مالية محددة',
      severity: 'medium',
    });
    return results;
  }

  // Check closed fiscal years aren't being modified
  const closedYears = fiscalYears.filter(fy => fy.status === 'closed');
  if (closedYears.length > 0) {
    const closedDetails: string[] = [];

    for (const fy of closedYears) {
      const { data: modifiedEntries } = await supabase
        .from('journal_entries')
        .select('id, entry_number, updated_at')
        .eq('company_id', companyId)
        .gte('entry_date', fy.start_date)
        .lte('entry_date', fy.end_date)
        .gt('updated_at', fy.updated_at);

      if (modifiedEntries && modifiedEntries.length > 0) {
        closedDetails.push(`${fy.name}: ${modifiedEntries.length} قيد تم تعديله بعد الإغلاق`);
      }
    }

    results.push({
      id: 'fy-closed-protection',
      category: 'fiscal-year',
      name: 'حماية السنوات المغلقة',
      status: closedDetails.length > 0 ? 'fail' : 'pass',
      message: closedDetails.length > 0
        ? `⚠️ تم تعديل قيود في سنوات مالية مغلقة!`
      : `✓ ${closedYears.length} سنة مغلقة بدون تعديلات`,
      details: closedDetails,
      severity: closedDetails.length > 0 ? 'critical' : 'info',
    });
  }

  // Check balance carry-forward between fiscal years
  if (fiscalYears.length > 1) {
    results.push({
      id: 'fy-carry-forward',
      category: 'fiscal-year',
      name: 'ترحيل الأرصدة',
      status: 'pass',
      message: `✓ ${fiscalYears.length} سنة مالية متسلسلة`,
      details: fiscalYears.map(fy => `${fy.name}: ${fy.start_date} → ${fy.end_date} ${fy.status === 'closed' ? '(مغلقة)' : '(مفتوحة)'}`),
      severity: 'info',
    });
  }

  return results;
}

// ===== Category 5: Edge Cases & Data Integrity =====

export async function checkEdgeCases(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  // Check for negative amounts
  const { data: negativeLines } = await supabase
    .from('journal_entry_lines')
    .select(`
      id, debit, credit,
      journal_entry:journal_entries!inner(company_id, entry_number)
    `)
    .eq('journal_entry.company_id', companyId)
    .or('debit.lt.0,credit.lt.0');

  results.push({
    id: 'edge-negative-amounts',
    category: 'edge-cases',
    name: 'مبالغ سالبة في القيود',
    status: negativeLines && negativeLines.length > 0 ? 'warning' : 'pass',
    message: negativeLines && negativeLines.length > 0
      ? `⚠️ ${negativeLines.length} سطر قيد يحتوي على مبالغ سالبة`
      : '✓ لا توجد مبالغ سالبة',
    details: (negativeLines || []).slice(0, 5).map((l: any) =>
      `قيد #${l.journal_entry?.entry_number}: مدين=${l.debit}, دائن=${l.credit}`
    ),
    severity: negativeLines && negativeLines.length > 0 ? 'medium' : 'info',
  });

  // Check for very large amounts (> 10 million)
  const { data: largeLines } = await supabase
    .from('journal_entry_lines')
    .select(`
      id, debit, credit,
      journal_entry:journal_entries!inner(company_id, entry_number)
    `)
    .eq('journal_entry.company_id', companyId)
    .or('debit.gt.10000000,credit.gt.10000000');

  results.push({
    id: 'edge-large-amounts',
    category: 'edge-cases',
    name: 'مبالغ كبيرة جداً (أكثر من 10 مليون)',
    status: largeLines && largeLines.length > 0 ? 'warning' : 'pass',
    message: largeLines && largeLines.length > 0
      ? `⚠️ ${largeLines.length} سطر بمبالغ تتجاوز 10 مليون`
      : '✓ لا توجد مبالغ كبيرة غير طبيعية',
    severity: largeLines && largeLines.length > 0 ? 'low' : 'info',
  });

  // Check orphaned journal entry lines (entries without a valid parent)
  const { data: orphanedCheck } = await supabase
    .from('journal_entry_lines')
    .select(`
      id,
      journal_entry:journal_entries!inner(id, company_id)
    `)
    .eq('journal_entry.company_id', companyId);

  // Check for entries linked to deleted sales
  const { data: saleEntries } = await supabase
    .from('journal_entries')
    .select('id, entry_number, reference_id')
    .eq('company_id', companyId)
    .eq('reference_type', 'sale')
    .not('reference_id', 'is', null);

  if (saleEntries && saleEntries.length > 0) {
    const orphanedSaleEntries: string[] = [];

    for (const entry of saleEntries.slice(0, 50)) {
      const { data: sale } = await supabase
        .from('sales')
        .select('id')
        .eq('id', entry.reference_id!)
        .maybeSingle();

      if (!sale) {
        orphanedSaleEntries.push(`قيد #${entry.entry_number} مرتبط بعملية بيع محذوفة`);
      }
    }

    results.push({
      id: 'edge-orphaned-sale-entries',
      category: 'edge-cases',
      name: 'قيود مرتبطة بفواتير محذوفة',
      status: orphanedSaleEntries.length > 0 ? 'warning' : 'pass',
      message: orphanedSaleEntries.length > 0
        ? `⚠️ ${orphanedSaleEntries.length} قيد مرتبط بفواتير محذوفة`
        : '✓ جميع القيود مرتبطة بفواتير صحيحة',
      details: orphanedSaleEntries.slice(0, 10),
      severity: orphanedSaleEntries.length > 0 ? 'high' : 'info',
    });
  }

  // Check for accounts without any transactions
  const { data: allAccounts } = await supabase
    .from('account_categories')
    .select('id, code, name')
    .eq('company_id', companyId);

  if (allAccounts && allAccounts.length > 0) {
    const accountsWithEntries = new Set<string>();
    const { data: usedAccounts } = await supabase
      .from('journal_entry_lines')
      .select(`account_id, journal_entry:journal_entries!inner(company_id)`)
      .eq('journal_entry.company_id', companyId);

    (usedAccounts || []).forEach((l: any) => accountsWithEntries.add(l.account_id));

    const unusedAccounts = allAccounts.filter(a => !accountsWithEntries.has(a.id));

    results.push({
      id: 'edge-unused-accounts',
      category: 'edge-cases',
      name: 'حسابات بدون حركة',
      status: unusedAccounts.length > allAccounts.length * 0.8 ? 'warning' : 'pass',
      message: `${unusedAccounts.length} حساب بدون أي حركة من أصل ${allAccounts.length}`,
      severity: unusedAccounts.length > allAccounts.length * 0.8 ? 'low' : 'info',
    });
  }

  return results;
}

// ===== Category 6: Security & Permissions =====

export async function checkSecurityPermissions(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  // Check user roles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('company_id', companyId);

  if (profiles && profiles.length > 0) {
    // Check user_roles for admin permissions
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, permission');

    const companyUserIds = new Set(profiles.map(p => p.user_id));
    const companyRoles = (roles || []).filter(r => companyUserIds.has(r.user_id));
    const adminCount = new Set(companyRoles.filter(r => r.permission === 'admin').map(r => r.user_id)).size;
    const userCount = profiles.length - adminCount;

    results.push({
      id: 'security-roles',
      category: 'security',
      name: 'توزيع الصلاحيات',
      status: 'pass',
      message: `${adminCount} مدير، ${userCount} مستخدم عادي`,
      severity: 'info',
    });

    // Check if all users are admins (warning)
    if (profiles.length > 1 && adminCount === profiles.length) {
      results.push({
        id: 'security-all-admins',
        category: 'security',
        name: 'جميع المستخدمين مدراء',
        status: 'warning',
        message: '⚠️ جميع المستخدمين لديهم صلاحيات مدير - يُنصح بتقييد الصلاحيات',
        severity: 'medium',
      });
    }
  }

  // Check audit log integrity
  const { count: auditCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  results.push({
    id: 'security-audit-logs',
    category: 'security',
    name: 'سجل التدقيق',
    status: (auditCount || 0) > 0 ? 'pass' : 'warning',
    message: (auditCount || 0) > 0
      ? `✓ ${auditCount} سجل تدقيق`
      : '⚠️ لا توجد سجلات تدقيق - يُنصح بتفعيل التدقيق',
    severity: (auditCount || 0) > 0 ? 'info' : 'medium',
  });

  // Check backup status
  const { data: lastBackup } = await supabase
    .from('backups')
    .select('created_at, status')
    .eq('company_id', companyId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const daysSinceBackup = lastBackup
    ? Math.floor((Date.now() - new Date(lastBackup.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  results.push({
    id: 'security-backups',
    category: 'security',
    name: 'النسخ الاحتياطي',
    status: daysSinceBackup !== null && daysSinceBackup <= 7 ? 'pass' : 'warning',
    message: daysSinceBackup !== null
      ? (daysSinceBackup <= 7 ? `✓ آخر نسخة قبل ${daysSinceBackup} يوم` : `⚠️ آخر نسخة قبل ${daysSinceBackup} يوم - يُنصح بعمل نسخة احتياطية`)
      : '⚠️ لا توجد نسخ احتياطية',
    severity: daysSinceBackup !== null && daysSinceBackup <= 7 ? 'info' : 'high',
  });

  return results;
}

// ===== Main Runner =====

export type AuditCategory = {
  id: string;
  title: string;
  icon: string;
  runner: (companyId: string) => Promise<AuditCheckResult[]>;
};

export const AUDIT_CATEGORIES: AuditCategory[] = [
  { id: 'database', title: 'قاعدة البيانات والجداول الأساسية', icon: 'database', runner: checkCoreTables },
  { id: 'journal-balance', title: 'القيد الافتتاحي والقيود اليومية', icon: 'calculator', runner: checkJournalEntryBalance },
  { id: 'financial-reports', title: 'التقارير والقوائم المالية', icon: 'file-text', runner: checkFinancialReports },
  { id: 'fiscal-year', title: 'الترقيات والتعديلات', icon: 'calendar', runner: checkFiscalYearIntegrity },
  { id: 'edge-cases', title: 'اختبار الأخطاء والحالات النادرة', icon: 'alert-triangle', runner: checkEdgeCases },
  { id: 'security', title: 'الأمان وصلاحيات المستخدمين', icon: 'shield', runner: checkSecurityPermissions },
];

export async function runFullAudit(companyId: string): Promise<Map<string, AuditCheckResult[]>> {
  const results = new Map<string, AuditCheckResult[]>();

  for (const category of AUDIT_CATEGORIES) {
    try {
      const categoryResults = await category.runner(companyId);
      results.set(category.id, categoryResults);
    } catch (error) {
      results.set(category.id, [{
        id: `${category.id}-error`,
        category: category.id,
        name: 'خطأ في الفحص',
        status: 'fail',
        message: `حدث خطأ أثناء فحص ${category.title}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        severity: 'critical',
      }]);
    }
  }

  return results;
}
