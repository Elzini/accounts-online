import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchIntegrityChecks() {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from('data_integrity_checks').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20);
  return data || [];
}

export async function fetchSensitiveOperations() {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from('sensitive_operations_log').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50);
  return data || [];
}

export async function fetchRecentAuditLogs() {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from('audit_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20);
  return data || [];
}
