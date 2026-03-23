import { supabase } from '@/integrations/supabase/client';
import { IntegrityCheckResult } from './types';

export async function checkAuditChainIntegrity(companyId: string): Promise<IntegrityCheckResult> {
  const { data: auditLogs, error } = await supabase
    .from('audit_logs')
    .select('id, integrity_hash, previous_hash, sequence_number')
    .eq('company_id', companyId)
    .order('sequence_number', { ascending: true })
    .limit(500);

  if (error) {
    return {
      checkType: 'audit_chain', checkName: 'سلامة سلسلة التدقيق',
      status: 'warning', details: { error: error.message }, issuesFound: 0,
    };
  }

  const issues: string[] = [];
  let brokenLinks = 0;

  if (auditLogs && auditLogs.length > 1) {
    for (let i = 1; i < auditLogs.length; i++) {
      const current = auditLogs[i];
      const previous = auditLogs[i - 1];

      if (current.sequence_number !== null && previous.sequence_number !== null) {
        if (current.sequence_number !== previous.sequence_number + 1) {
          brokenLinks++;
          issues.push(`فجوة في التسلسل: ${previous.sequence_number} → ${current.sequence_number}`);
        }
      }

      if (current.previous_hash && previous.integrity_hash) {
        if (current.previous_hash !== previous.integrity_hash) {
          brokenLinks++;
          issues.push(`كسر في سلسلة الهاش عند السجل ${current.sequence_number}`);
        }
      }
    }
  }

  return {
    checkType: 'audit_chain', checkName: 'سلامة سلسلة التدقيق',
    status: brokenLinks === 0 ? 'pass' : 'fail',
    details: { totalLogs: auditLogs?.length || 0, brokenLinks, issues },
    issuesFound: brokenLinks,
  };
}
