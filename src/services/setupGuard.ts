import { supabase } from '@/integrations/supabase/client';

export async function getAuthUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function populateAccountMappings(companyId: string) {
  await supabase.rpc('populate_account_mappings', { p_company_id: companyId });
}
