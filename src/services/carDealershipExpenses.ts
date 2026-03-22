/**
 * Car dealership expense functions - isolated from general expenses service.
 * Only used when company_type === 'car_dealership'.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Expense } from './expenses';

// Fetch expenses for a specific car
export async function fetchCarExpenses(carId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, category:expense_categories(*)')
    .eq('car_id', carId)
    .order('expense_date', { ascending: false });
  
  if (error) throw error;
  return data as Expense[];
}

// Get total expenses for a car
export async function getCarExpensesTotal(carId: string): Promise<number> {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .eq('car_id', carId);
  
  if (error) throw error;
  return data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
}

// Get general (non-car) expenses for a company
export async function fetchGeneralExpenses(companyId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, category:expense_categories(*)')
    .eq('company_id', companyId)
    .is('car_id', null)
    .order('expense_date', { ascending: false });
  
  if (error) throw error;
  return data as Expense[];
}
