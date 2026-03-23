import { supabase } from '@/hooks/modules/useMiscServices';
import { IntegrityCheckResult } from './types';
import { checkTenantIsolation } from './tenantIsolation';
import { checkAuditChainIntegrity } from './auditChain';
import { checkBalanceParity } from './balanceParity';
import { checkTemplateProtection } from './templateProtection';

export async function runFullIntegrityCheck(companyId: string): Promise<IntegrityCheckResult[]> {
  const results = await Promise.all([
    checkTenantIsolation(companyId),
    checkAuditChainIntegrity(companyId),
    checkBalanceParity(companyId),
    checkTemplateProtection(companyId),
  ]);

  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  // Log results to audit_logs instead of dropped data_integrity_checks
  for (const result of results) {
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      user_id: userId || 'system',
      entity_type: 'integrity_check',
      entity_id: result.checkType,
      action: 'check',
      new_data: {
        check_name: result.checkName,
        status: result.status,
        details: result.details,
        issues_found: result.issuesFound,
      },
    });
  }

  return results;
}
