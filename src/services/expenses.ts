import { supabase } from '@/integrations/supabase/client';

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
  amount: number;
  description: string;
  expense_date: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
}

export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'category'>;
export type ExpenseCategoryInsert = Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at'>;

// Expense Categories
export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name');
  
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
  const { data, error } = await supabase
    .from('expenses')
    .select('*, category:expense_categories(*)')
    .order('expense_date', { ascending: false });
  
  if (error) throw error;
  return data as Expense[];
}

export async function addExpense(expense: ExpenseInsert): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select('*, category:expense_categories(*)')
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
