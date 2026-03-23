import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function invokeExpenseOcr(base64: string) {
  const { data, error } = await supabase.functions.invoke('expense-ocr', { body: { image: base64 } });
  if (error) throw error;
  return data;
}

export async function saveExpenseFromOcr(expense: { vendor: string; amount: number; date: string; category: string; description: string }) {
  const companyId = await requireCompanyId();
  const { error } = await supabase.from('expenses').insert({
    company_id: companyId,
    vendor_name: expense.vendor,
    amount: expense.amount,
    expense_date: expense.date,
    category: expense.category,
    description: expense.description || `فاتورة من ${expense.vendor}`,
    payment_method: 'cash',
    status: 'approved',
  });
  if (error) throw error;
}
