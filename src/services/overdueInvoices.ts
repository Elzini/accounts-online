import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function invokeOverdueNotify(daysOverdue: number) {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase.functions.invoke('overdue-invoices-notify', {
    body: { company_id: companyId, days_overdue: daysOverdue },
  });
  if (error) throw error;
  return data;
}
