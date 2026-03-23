export type { ScenarioResult, ScenarioCategory, ScenarioSummary, TrialBalanceRow, AccountMappingType } from './types';
export { REQUIRED_ACCOUNT_CATEGORIES, KNOWN_PATTERNS, SCENARIO_CATEGORY_LABELS, SEVERITY_LABELS } from './types';
export { runBalanceValidation, runMappingCoverage, runMissingAccountsCheck, runDuplicateDetection, runAmountAnomalyDetection, runClassificationConflicts, runZakatCompliance, runIFRSCompliance, runCrossStatementIntegrity, runHierarchyValidation } from './checks';

import { TrialBalanceRow, ScenarioSummary, AccountMappingType } from './types';
import { runBalanceValidation, runMappingCoverage, runMissingAccountsCheck, runDuplicateDetection, runAmountAnomalyDetection, runClassificationConflicts, runZakatCompliance, runIFRSCompliance, runCrossStatementIntegrity, runHierarchyValidation } from './checks';
import { ScenarioResult } from './types';

export function runScenarioEngine(rows: TrialBalanceRow[]): ScenarioSummary {
  const results: ScenarioResult[] = [];
  let scenarioCount = 0;
  scenarioCount += runBalanceValidation(rows, results);
  scenarioCount += runMappingCoverage(rows, results);
  scenarioCount += runMissingAccountsCheck(rows, results);
  scenarioCount += runDuplicateDetection(rows, results);
  scenarioCount += runAmountAnomalyDetection(rows, results);
  scenarioCount += runClassificationConflicts(rows, results);
  scenarioCount += runZakatCompliance(rows, results);
  scenarioCount += runIFRSCompliance(rows, results);
  scenarioCount += runCrossStatementIntegrity(rows, results);
  scenarioCount += runHierarchyValidation(rows, results);

  const critical = results.filter(r => r.severity === 'critical').length;
  const errors = results.filter(r => r.severity === 'error').length;
  const warnings = results.filter(r => r.severity === 'warning').length;
  return { totalScenariosTested: scenarioCount, passed: scenarioCount - results.length, warnings, errors, critical, results, overallScore: Math.max(0, Math.min(100, 100 - (critical * 25) - (errors * 10) - (warnings * 2))), timestamp: new Date().toISOString() };
}

export function generateMissingAccounts(rows: TrialBalanceRow[]): TrialBalanceRow[] {
  const existingTypes = new Set(rows.map(r => r.mappedType));
  const existingCodes = new Set(rows.map(r => r.code));
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
  return requiredDefaults
    .filter(d => !existingTypes.has(d.type) && !existingCodes.has(d.code))
    .map(d => ({ code: d.code, name: d.name, debit: 0, credit: 0, movementDebit: 0, movementCredit: 0, mappedType: d.type, isAutoMapped: true, isValid: true }));
}
