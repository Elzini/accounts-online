// حارس القيود المحاسبية
import { supabase } from '@/integrations/supabase/client';
import { AccountingCheckResult } from './types';

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
          entryNumber: entry.entry_number, date: entry.entry_date,
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
