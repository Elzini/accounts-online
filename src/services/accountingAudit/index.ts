// Re-export types
export type { AuditCheckResult, AuditCategory } from './types';

// Re-export check runners
export { checkCoreTables } from './checks/coreTables';
export { checkJournalEntryBalance } from './checks/journalBalance';
export { checkFinancialReports } from './checks/financialReports';
export { checkFiscalYearIntegrity } from './checks/fiscalYearIntegrity';
export { checkEdgeCases } from './checks/edgeCases';
export { checkSecurityPermissions } from './checks/security';

import { AuditCategory, AuditCheckResult } from './types';
import { checkCoreTables } from './checks/coreTables';
import { checkJournalEntryBalance } from './checks/journalBalance';
import { checkFinancialReports } from './checks/financialReports';
import { checkFiscalYearIntegrity } from './checks/fiscalYearIntegrity';
import { checkEdgeCases } from './checks/edgeCases';
import { checkSecurityPermissions } from './checks/security';

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
      results.set(category.id, await category.runner(companyId));
    } catch (error) {
      results.set(category.id, [{ id: `${category.id}-error`, category: category.id, name: 'خطأ في الفحص', status: 'fail', message: `حدث خطأ أثناء فحص ${category.title}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`, severity: 'critical' }]);
    }
  }
  return results;
}
