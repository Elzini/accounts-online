/**
 * Security Monitoring Service - Uses audit_logs (dropped: data_integrity_checks, sensitive_operations_log)
 */
import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchIntegrityChecks() {
  const companyId = await requireCompanyId();
  // Redirected to audit_logs after data_integrity_checks was dropped
  const { data } = await supabase.from('audit_logs')
    .select('*')
    .eq('company_id', companyId)
    .eq('entity_type', 'integrity_check')
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}

export async function fetchSensitiveOperations() {
  const companyId = await requireCompanyId();
  // Redirected to audit_logs after sensitive_operations_log was dropped
  const { data } = await supabase.from('audit_logs')
    .select('*')
    .eq('company_id', companyId)
    .in('action', ['delete', 'update'])
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

export async function fetchRecentAuditLogs() {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from('audit_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20);
  return data || [];
}
