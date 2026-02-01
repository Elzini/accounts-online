import { supabase } from '@/integrations/supabase/client';

export interface PrepaidExpense {
  id: string;
  company_id: string;
  description: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  number_of_months: number;
  monthly_amount: number;
  amortized_amount: number;
  remaining_amount: number;
  category_id: string | null;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  };
}

export interface PrepaidExpenseAmortization {
  id: string;
  prepaid_expense_id: string;
  expense_id: string | null;
  journal_entry_id: string | null;
  amortization_date: string;
  amount: number;
  month_number: number;
  status: 'pending' | 'processed';
  processed_at: string | null;
  created_at: string;
}

export interface CreatePrepaidExpenseInput {
  company_id: string;
  description: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  number_of_months: number;
  category_id?: string | null;
  expense_account_id?: string | null;
  debit_account_id: string; // حساب المدين (المصروفات المقدمة)
  payment_account_id: string; // حساب الدائن (نقدي/بنك)
  payment_date: string;
  payment_method?: string;
  notes?: string;
}

export async function fetchPrepaidExpenses(companyId: string): Promise<PrepaidExpense[]> {
  const { data, error } = await supabase
    .from('prepaid_expenses')
    .select(`
      *,
      category:expense_categories(id, name)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as PrepaidExpense[];
}

export async function fetchPrepaidExpenseAmortizations(
  prepaidExpenseId: string
): Promise<PrepaidExpenseAmortization[]> {
  const { data, error } = await supabase
    .from('prepaid_expense_amortizations')
    .select('*')
    .eq('prepaid_expense_id', prepaidExpenseId)
    .order('month_number', { ascending: true });

  if (error) throw error;
  return (data || []) as PrepaidExpenseAmortization[];
}

export async function createPrepaidExpense(
  input: CreatePrepaidExpenseInput
): Promise<PrepaidExpense> {
  const monthly_amount = input.total_amount / input.number_of_months;
  
  // 1. إنشاء المصروف المقدم
  const { data, error } = await supabase
    .from('prepaid_expenses')
    .insert({
      company_id: input.company_id,
      description: input.description,
      total_amount: input.total_amount,
      start_date: input.start_date,
      end_date: input.end_date,
      number_of_months: input.number_of_months,
      monthly_amount: monthly_amount,
      remaining_amount: input.total_amount,
      category_id: input.category_id || null,
      expense_account_id: input.expense_account_id || null,
      payment_date: input.payment_date,
      payment_method: input.payment_method || 'cash',
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  // القيد المحاسبي يُنشأ تلقائياً عبر database trigger
  // لتجنب التكرار، لا نُنشئ القيد هنا

  return data as PrepaidExpense;
}

export async function updatePrepaidExpense(
  id: string,
  updates: Partial<PrepaidExpense>
): Promise<PrepaidExpense> {
  const { data, error } = await supabase
    .from('prepaid_expenses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as PrepaidExpense;
}

export async function deletePrepaidExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('prepaid_expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function processAmortization(
  amortizationId: string,
  companyId: string,
  prepaidExpenseId: string,
  amount: number,
  description: string,
  categoryId: string | null,
  amortizationDate: string,
  monthNumber: number
): Promise<void> {
  // Create expense entry
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      company_id: companyId,
      description: `إطفاء: ${description} (شهر ${monthNumber})`,
      amount: amount,
      expense_date: amortizationDate,
      category_id: categoryId,
      notes: 'قيد إطفاء للمصروف المقدم',
      payment_method: 'prepaid',
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  // Update amortization record
  const { error: amortError } = await supabase
    .from('prepaid_expense_amortizations')
    .update({
      status: 'processed',
      expense_id: expense.id,
      processed_at: new Date().toISOString(),
    })
    .eq('id', amortizationId);

  if (amortError) throw amortError;

  // Update prepaid expense totals
  const { data: prepaid, error: fetchError } = await supabase
    .from('prepaid_expenses')
    .select('amortized_amount, remaining_amount')
    .eq('id', prepaidExpenseId)
    .single();

  if (fetchError) throw fetchError;

  const newAmortized = (prepaid.amortized_amount || 0) + amount;
  const newRemaining = (prepaid.remaining_amount || 0) - amount;

  const { error: updateError } = await supabase
    .from('prepaid_expenses')
    .update({
      amortized_amount: newAmortized,
      remaining_amount: newRemaining,
      status: newRemaining <= 0 ? 'completed' : 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', prepaidExpenseId);

  if (updateError) throw updateError;
}

export async function processAllDueAmortizations(companyId: string): Promise<number> {
  // Get all pending amortizations that are due
  const { data: amortizations, error: fetchError } = await supabase
    .from('prepaid_expense_amortizations')
    .select(`
      *,
      prepaid_expense:prepaid_expenses(
        id,
        company_id,
        description,
        category_id,
        status
      )
    `)
    .eq('status', 'pending')
    .lte('amortization_date', new Date().toISOString().split('T')[0]);

  if (fetchError) throw fetchError;

  let processedCount = 0;

  for (const amort of amortizations || []) {
    const prepaid = amort.prepaid_expense as any;
    if (prepaid?.company_id === companyId && prepaid?.status === 'active') {
      await processAmortization(
        amort.id,
        companyId,
        prepaid.id,
        amort.amount,
        prepaid.description,
        prepaid.category_id,
        amort.amortization_date,
        amort.month_number
      );
      processedCount++;
    }
  }

  return processedCount;
}
