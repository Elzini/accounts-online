import { supabase } from '@/integrations/supabase/client';

export interface ZatcaConfig {
  id: string;
  company_id: string;
  environment: string;
  otp: string | null;
  compliance_csid: string | null;
  production_csid: string | null;
  private_key: string | null;
  certificate: string | null;
  api_base_url: string;
  last_sync_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ZatcaInvoiceLog {
  id: string;
  company_id: string;
  invoice_id: string | null;
  invoice_type: string;
  invoice_hash: string | null;
  uuid: string | null;
  submission_status: string;
  zatca_response: any;
  warning_messages: any;
  error_messages: any;
  submitted_at: string | null;
  created_at: string;
}

// ==================== CONFIG ====================
export async function fetchZatcaConfig(companyId: string) {
  const { data, error } = await supabase
    .from('zatca_config')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();
  if (error) throw error;
  return data as ZatcaConfig | null;
}

export async function saveZatcaConfig(config: Partial<ZatcaConfig> & { company_id: string }) {
  const { data, error } = await supabase
    .from('zatca_config')
    .upsert(config, { onConflict: 'company_id' })
    .select()
    .single();
  if (error) throw error;
  return data as ZatcaConfig;
}

// ==================== INVOICE LOG ====================
export async function fetchZatcaInvoices(companyId: string) {
  const { data, error } = await supabase
    .from('zatca_invoices')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ZatcaInvoiceLog[];
}

export async function createZatcaInvoiceLog(log: Partial<ZatcaInvoiceLog> & { company_id: string }) {
  const { data, error } = await supabase.from('zatca_invoices').insert(log).select().single();
  if (error) throw error;
  return data as ZatcaInvoiceLog;
}

export async function updateZatcaInvoiceLog(id: string, updates: Partial<ZatcaInvoiceLog>) {
  const { data, error } = await supabase.from('zatca_invoices').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as ZatcaInvoiceLog;
}

// ==================== ZATCA API CALLS ====================
export async function callZatcaAPI(payload: {
  action: 'get-csid' | 'compliance' | 'reporting' | 'clearance' | 'renew-csid';
  environment: string;
  csr?: string;
  otp?: string;
  csid?: string;
  csidSecret?: string;
  invoice?: string;
  invoiceHash?: string;
  uuid?: string;
}) {
  const { data, error } = await supabase.functions.invoke('zatca-api', {
    body: payload,
  });
  if (error) throw error;
  return data;
}
