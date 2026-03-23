/**
 * Trial Balance Scenario Engine - Facade (backward compatibility)
 * All implementations moved to src/services/trialBalanceScenarioEngine/ modules.
 */
export type { ScenarioResult, ScenarioCategory, ScenarioSummary } from './trialBalanceScenarioEngine/types';
export { SCENARIO_CATEGORY_LABELS, SEVERITY_LABELS } from './trialBalanceScenarioEngine/types';
export { runScenarioEngine, generateMissingAccounts } from './trialBalanceScenarioEngine/index';
