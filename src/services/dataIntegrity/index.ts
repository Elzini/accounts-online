// Barrel re-export - backward compatible
export type { IntegrityCheckResult } from './types';
export { checkTenantIsolation } from './tenantIsolation';
export { checkAuditChainIntegrity } from './auditChain';
export { checkBalanceParity } from './balanceParity';
export { checkTemplateProtection } from './templateProtection';
export { runFullIntegrityCheck } from './runner';
