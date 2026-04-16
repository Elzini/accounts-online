import { supabase } from '@/hooks/modules/useMiscServices';

export interface ZatcaConfig {
  id: string;
  company_id: string;
  environment: string;
  otp: string | null;
  compliance_csid: string | null;
  compliance_secret: string | null;
  compliance_request_id: string | null;
  production_csid: string | null;
  production_secret: string | null;
  production_request_id: string | null;
  private_key: string | null;
  certificate: string | null;
  api_base_url: string;
  last_sync_at: string | null;
  status: string;
  onboarding_status: string;
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
  saleId?: string;
  companyId?: string;
}) {
  const { data, error } = await supabase.functions.invoke('zatca-api', {
    body: payload,
  });
  if (error) throw error;
  return data;
}

// ==================== ONBOARDING FLOW ====================
export async function startZatcaOnboarding(companyId: string, csrParams: {
  commonName: string;
  organizationName: string;
  organizationUnit: string;
  country: string;
  serialNumber: string;
  vatNumber: string;
  invoiceType: string;
  location: string;
  industry: string;
  csrType: 'sandbox' | 'simulation' | 'production';
}, otp: string) {
  // Step 1: Generate CSR
  const { data: csrData, error: csrError } = await supabase.functions.invoke('zatca-generate-csr', {
    body: csrParams,
  });
  if (csrError) throw csrError;
  if (!csrData?.success) throw new Error(csrData?.error || 'فشل توليد CSR');

  // Save private key
  await saveZatcaConfig({
    company_id: companyId,
    private_key: csrData.privateKeyPEM,
    certificate: csrData.publicKeyPEM,
    environment: csrParams.csrType,
    onboarding_status: 'csr_generated',
  });

  // Step 2: Get Compliance CSID from ZATCA
  const csidResult = await callZatcaAPI({
    action: 'get-csid',
    environment: csrParams.csrType,
    csr: csrData.csrBase64,
    otp,
    companyId,
  });

  if (!csidResult?.success) throw new Error(csidResult?.error || 'فشل الحصول على CSID');

  return {
    csrBase64: csrData.csrBase64,
    csid: csidResult.data,
  };
}

// ==================== SUBMIT INVOICE ====================
export async function submitInvoiceToZatca(params: {
  companyId: string;
  saleId: string;
  invoiceXmlBase64: string;
  invoiceHash: string;
  uuid: string;
  invoiceType: 'standard' | 'simplified';
}) {
  const config = await fetchZatcaConfig(params.companyId);
  if (!config) throw new Error('لم يتم إعداد ربط ZATCA - يرجى إكمال عملية الربط أولاً');

  const csid = config.production_csid || config.compliance_csid;
  const secret = (config as any).production_secret || (config as any).compliance_secret;
  if (!csid || !secret) throw new Error('لا يوجد CSID صالح - يرجى إعادة الربط');

  const action = params.invoiceType === 'standard' ? 'clearance' : 'reporting';

  // Log the submission
  const log = await createZatcaInvoiceLog({
    company_id: params.companyId,
    invoice_id: params.saleId,
    invoice_type: params.invoiceType,
    invoice_hash: params.invoiceHash,
    uuid: params.uuid,
    submission_status: 'pending',
  });

  try {
    const result = await callZatcaAPI({
      action,
      environment: config.environment || 'sandbox',
      csid,
      csidSecret: secret,
      invoice: params.invoiceXmlBase64,
      invoiceHash: params.invoiceHash,
      uuid: params.uuid,
      saleId: params.saleId,
      companyId: params.companyId,
    });

    await updateZatcaInvoiceLog(log.id, {
      submission_status: result?.success ? 'success' : 'failed',
      zatca_response: result?.data,
      warning_messages: result?.data?.validationResults?.warningMessages || null,
      error_messages: result?.data?.validationResults?.errorMessages || null,
      submitted_at: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    await updateZatcaInvoiceLog(log.id, {
      submission_status: 'error',
      error_messages: [{ message: error instanceof Error ? error.message : 'خطأ غير معروف' }],
    });
    throw error;
  }
}
