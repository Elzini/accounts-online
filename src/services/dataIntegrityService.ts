// Re-export from modular structure for backward compatibility
export type { IntegrityCheckResult } from './dataIntegrity';
export {
  checkTenantIsolation,
  checkAuditChainIntegrity,
  checkBalanceParity,
  checkTemplateProtection,
  runFullIntegrityCheck,
} from './dataIntegrity';
