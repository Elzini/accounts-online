import { supabase } from '@/integrations/supabase/client';
import { getCompanyOverride } from '@/lib/companyOverride';

async function getCurrentCompanyId(): Promise<string | null> {
  const override = getCompanyOverride();
  if (override) return override;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  return profile?.company_id || null;
}

export interface ExpenseCategory {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  category_id: string | null;
  account_id: string | null;
  car_id: string | null;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  has_vat_invoice: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
  account?: {
    id: string;
    code: string;
    name: string;
  };
  car?: {
    id: string;
    name: string;
    chassis_number: string;
  };
}

export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'category'>;
export type ExpenseCategoryInsert = Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at'>;

// Expense Categories
export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  const companyId = await getCurrentCompanyId();
  let query = supabase
    .from('expense_categories')
    .select('*');
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query.order('name');
  
  if (error) throw error;
  return data as ExpenseCategory[];
}

export async function addExpenseCategory(category: ExpenseCategoryInsert): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from('expense_categories')
    .insert(category)
    .select()
    .single();
  
  if (error) throw error;
  return data as ExpenseCategory;
}

export async function updateExpenseCategory(id: string, updates: Partial<ExpenseCategoryInsert>): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from('expense_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as ExpenseCategory;
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Expenses
export async function fetchExpenses(): Promise<Expense[]> {
  const companyId = await getCurrentCompanyId();
  let query = supabase
    .from('expenses')
    .select('*, category:expense_categories(*), account:account_categories(id, code, name), car:cars(id, name, chassis_number)');
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query.order('expense_date', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(exp => ({
    ...exp,
    has_vat_invoice: exp.has_vat_invoice ?? false
  })) as Expense[];
}

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

export async function addExpense(expense: ExpenseInsert): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select('*, category:expense_categories(*), account:account_categories(id, code, name)')
    .single();
  
  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(id: string, updates: Partial<ExpenseInsert>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select('*, category:expense_categories(*)')
    .single();
  
  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function createDefaultExpenseCategories(companyId: string): Promise<void> {
  const { error } = await supabase.rpc('create_default_expense_categories', {
    p_company_id: companyId
  });
  
  if (error) throw error;
}
