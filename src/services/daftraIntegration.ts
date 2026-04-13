/**
 * Daftra Integration Service
 * Handles all communication with the Daftra API through the edge function proxy
 */
import { supabase } from '@/integrations/supabase/client';

interface DaftraResponse {
  success?: boolean;
  error?: string;
  details?: any;
  synced?: number;
  errors?: number;
  accounts?: any;
  site?: any;
  message?: string;
}

// ==================== AUTH ====================

export async function authenticateDaftra(companyId: string, credentials: {
  subdomain: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}) {
  const { data, error } = await supabase.functions.invoke<DaftraResponse>('daftra-api', {
    body: {
      action: 'authenticate',
      companyId,
      data: credentials,
    },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Authentication failed');
  return data;
}

// ==================== TEST CONNECTION ====================

export async function testDaftraConnection(companyId: string) {
  const { data, error } = await supabase.functions.invoke<DaftraResponse>('daftra-api', {
    body: { action: 'test_connection', companyId },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ==================== GET DAFTRA ACCOUNTS ====================

export async function getDaftraAccounts(companyId: string) {
  const { data, error } = await supabase.functions.invoke<DaftraResponse>('daftra-api', {
    body: { action: 'get_accounts', companyId },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ==================== SYNC ACCOUNTS ====================

export async function syncAccountsToDaftra(companyId: string, accounts: Array<{
  code: string;
  name: string;
  type: string;
  description?: string;
  parent_daftra_id?: string;
}>) {
  const { data, error } = await supabase.functions.invoke<DaftraResponse>('daftra-api', {
    body: {
      action: 'sync_accounts',
      companyId,
      data: { accounts },
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ==================== SYNC JOURNALS ====================

export async function syncJournalsToDaftra(companyId: string, entries: Array<{
  entry_number: number;
  description: string;
  currency?: string;
  lines: Array<{
    account_name: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
}>) {
  const { data, error } = await supabase.functions.invoke<DaftraResponse>('daftra-api', {
    body: {
      action: 'sync_journals',
      companyId,
      data: { entries },
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ==================== SYNC CLIENTS ====================

export async function syncClientsToDaftra(companyId: string, clients: Array<{
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
}>) {
  const { data, error } = await supabase.functions.invoke<DaftraResponse>('daftra-api', {
    body: {
      action: 'sync_clients',
      companyId,
      data: { clients },
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ==================== SYNC SUPPLIERS ====================

export async function syncSuppliersToDaftra(companyId: string, suppliers: Array<{
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
}>) {
  const { data, error } = await supabase.functions.invoke<DaftraResponse>('daftra-api', {
    body: {
      action: 'sync_suppliers',
      companyId,
      data: { suppliers },
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ==================== GET CONFIG ====================

export async function getDaftraConfig(companyId: string) {
  const { data, error } = await supabase
    .from('daftra_integrations' as any)
    .select('id, company_id, subdomain, client_id, is_active, last_sync_at, sync_status, sync_log, created_at')
    .eq('company_id', companyId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ==================== DELETE CONFIG ====================

export async function deleteDaftraConfig(companyId: string) {
  const { error } = await supabase
    .from('daftra_integrations' as any)
    .delete()
    .eq('company_id', companyId);
  if (error) throw error;
}
