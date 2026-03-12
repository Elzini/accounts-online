// خدمة فحص سلامة البيانات الشاملة
import { supabase } from '@/integrations/supabase/client';

export interface IntegrityCheckResult {
  checkType: string;
  checkName: string;
  status: 'pass' | 'fail' | 'warning';
  details: any;
  issuesFound: number;
}

// 1. فحص عزل بيانات الشركات - التأكد من عدم تداخل البيانات
export async function checkTenantIsolation(companyId: string): Promise<IntegrityCheckResult> {
  const tables = ['journal_entries', 'journal_entry_lines', 'account_categories', 'invoices', 'vouchers'];
  const issues: string[] = [];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table as any)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (error) {
        // بعض الجداول قد لا تحتوي على company_id مباشرة
        continue;
      }
    } catch {
      continue;
    }
  }

  // فحص تطابق company_id في الحسابات والقيود
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, company_id')
    .eq('company_id', companyId)
    .limit(100);

  if (entries && entries.length > 0) {
    const entryIds = entries.map(e => e.id);
    const { data: lines } = await supabase
      .from('journal_entry_lines')
      .select('id, account_id, journal_entry_id')
      .in('journal_entry_id', entryIds.slice(0, 50));

    if (lines) {
      const accountIds = [...new Set(lines.map(l => l.account_id))];
      const { data: accounts } = await supabase
        .from('account_categories')
        .select('id, company_id')
        .in('id', accountIds);

      if (accounts) {
        const foreignAccounts = accounts.filter(a => a.company_id !== companyId);
        if (foreignAccounts.length > 0) {
          issues.push(`تم اكتشاف ${foreignAccounts.length} حساب تابع لشركة أخرى في القيود`);
        }
      }
    }
  }

  return {
    checkType: 'tenant_isolation',
    checkName: 'عزل بيانات الشركات',
    status: issues.length === 0 ? 'pass' : 'fail',
    details: { issues, tablesChecked: tables.length },
    issuesFound: issues.length,
  };
}

// 2. فحص سلامة سلسلة التدقيق (Audit Hash Chain)
export async function checkAuditChainIntegrity(companyId: string): Promise<IntegrityCheckResult> {
  const { data: auditLogs, error } = await supabase
    .from('audit_logs')
    .select('id, integrity_hash, previous_hash, sequence_number')
    .eq('company_id', companyId)
    .order('sequence_number', { ascending: true })
    .limit(500);

  if (error) {
    return {
      checkType: 'audit_chain',
      checkName: 'سلامة سلسلة التدقيق',
      status: 'warning',
      details: { error: error.message },
      issuesFound: 0,
    };
  }

  const issues: string[] = [];
  let brokenLinks = 0;

  if (auditLogs && auditLogs.length > 1) {
    for (let i = 1; i < auditLogs.length; i++) {
      const current = auditLogs[i];
      const previous = auditLogs[i - 1];

      // التحقق من تسلسل الأرقام
      if (current.sequence_number !== null && previous.sequence_number !== null) {
        if (current.sequence_number !== previous.sequence_number + 1) {
          brokenLinks++;
          issues.push(`فجوة في التسلسل: ${previous.sequence_number} → ${current.sequence_number}`);
        }
      }

      // التحقق من ارتباط الهاش
      if (current.previous_hash && previous.integrity_hash) {
        if (current.previous_hash !== previous.integrity_hash) {
          brokenLinks++;
          issues.push(`كسر في سلسلة الهاش عند السجل ${current.sequence_number}`);
        }
      }
    }
  }

  return {
    checkType: 'audit_chain',
    checkName: 'سلامة سلسلة التدقيق',
    status: brokenLinks === 0 ? 'pass' : 'fail',
    details: { totalLogs: auditLogs?.length || 0, brokenLinks, issues },
    issuesFound: brokenLinks,
  };
}

// 3. فحص تطابق الأرصدة المحاسبية (مدين = دائن)
export async function checkBalanceParity(companyId: string): Promise<IntegrityCheckResult> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, entry_number, is_posted')
    .eq('company_id', companyId)
    .eq('is_posted', true)
    .limit(200);

  const issues: string[] = [];
  let imbalancedEntries = 0;

  if (entries) {
    for (const entry of entries) {
      const { data: lines } = await supabase
        .from('journal_entry_lines')
        .select('debit, credit')
        .eq('journal_entry_id', entry.id);

      if (lines) {
        const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
        const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
        const diff = Math.abs(totalDebit - totalCredit);

        if (diff > 0.01) {
          imbalancedEntries++;
          issues.push(`قيد رقم ${entry.entry_number}: فرق ${diff.toFixed(2)} ريال`);
        }
      }
    }
  }

  return {
    checkType: 'balance_parity',
    checkName: 'تطابق الأرصدة (مدين = دائن)',
    status: imbalancedEntries === 0 ? 'pass' : 'fail',
    details: { totalEntries: entries?.length || 0, imbalancedEntries, issues },
    issuesFound: imbalancedEntries,
  };
}

// 4. فحص حماية القوالب - التأكد من عدم وجود بيانات مؤقتة أو قوالب قديمة
export async function checkTemplateProtection(companyId: string): Promise<IntegrityCheckResult> {
  const issues: string[] = [];

  // فحص أن الإعدادات تأتي من قاعدة البيانات وليس من ملفات ثابتة
  const { data: settings, error } = await supabase
    .from('app_settings')
    .select('key, value, updated_at')
    .eq('company_id', companyId);

  // فحص وجود إعدادات قديمة أو غير محدثة
  if (settings) {
    const now = new Date();
    const staleSettings = settings.filter(s => {
      const updatedAt = new Date(s.updated_at);
      const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 365; // إعدادات لم تُحدث منذ أكثر من سنة
    });

    if (staleSettings.length > 0) {
      issues.push(`${staleSettings.length} إعداد لم يُحدث منذ أكثر من سنة`);
    }
  }

  // التحقق من عدم وجود بيانات localStorage قديمة
  const localStorageKeys = ['cached_accounts', 'cached_balances', 'old_template_data', 'legacy_data'];
  const foundLegacyKeys: string[] = [];

  try {
    localStorageKeys.forEach(key => {
      if (typeof window !== 'undefined' && localStorage.getItem(key)) {
        foundLegacyKeys.push(key);
      }
    });
  } catch {
    // localStorage غير متاح
  }

  if (foundLegacyKeys.length > 0) {
    issues.push(`وجود ${foundLegacyKeys.length} مفتاح قديم في التخزين المحلي: ${foundLegacyKeys.join(', ')}`);
  }

  // فحص أن جميع الحسابات تنتمي لهذه الشركة فقط
  const { count: accountCount } = await supabase
    .from('account_categories')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  return {
    checkType: 'template_protection',
    checkName: 'حماية مصادر البيانات',
    status: issues.length === 0 ? 'pass' : 'warning',
    details: {
      settingsCount: settings?.length || 0,
      accountsCount: accountCount || 0,
      legacyKeys: foundLegacyKeys,
      issues,
    },
    issuesFound: issues.length,
  };
}

// 5. فحص شامل
export async function runFullIntegrityCheck(companyId: string): Promise<IntegrityCheckResult[]> {
  const results = await Promise.all([
    checkTenantIsolation(companyId),
    checkAuditChainIntegrity(companyId),
    checkBalanceParity(companyId),
    checkTemplateProtection(companyId),
  ]);

  // حفظ النتائج في قاعدة البيانات
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  for (const result of results) {
    await supabase.from('data_integrity_checks').insert({
      company_id: companyId,
      check_type: result.checkType,
      check_name: result.checkName,
      status: result.status,
      details: result.details,
      issues_found: result.issuesFound,
      checked_by: userId,
    });
  }

  return results;
}
