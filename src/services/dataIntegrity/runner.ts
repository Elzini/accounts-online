import { supabase } from '@/integrations/supabase/client';
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
