// Barrel export - backward compatible
export type { AccountingCheckResult, SystemHealthReport } from './types';
export { checkJournalBalance, checkAccountLinks, checkTrialBalanceZero, checkEntrySequence } from './journalChecks';
export { checkVATAccuracy } from './vatChecks';
export { checkCustomerReconciliation, checkSupplierReconciliation } from './reconciliationChecks';

import { supabase } from '@/hooks/modules/useMiscServices';
import type { SystemHealthReport } from './types';
import { checkJournalBalance, checkAccountLinks, checkTrialBalanceZero, checkEntrySequence } from './journalChecks';
import { checkVATAccuracy } from './vatChecks';
import { checkCustomerReconciliation, checkSupplierReconciliation } from './reconciliationChecks';

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

  // Log results to audit_logs instead of dropped data_integrity_checks
  for (const check of checks) {
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      user_id: userId || 'system',
      entity_type: 'integrity_check',
      entity_id: check.checkId,
      action: 'check',
      new_data: { 
        check_name: check.checkName, status: check.status, 
        category: check.category, severity: check.severity, 
        summary: check.summary, issuesCount: check.issuesCount,
        recommendations: check.recommendations, ...check.details 
      },
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
