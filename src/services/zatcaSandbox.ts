import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function saveZatcaTestResult(testData: any) {
  const companyId = await requireCompanyId();
  await supabase.from('zatca_sandbox_tests').insert({ ...testData, company_id: companyId });
}
