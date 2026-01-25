import { supabase } from '@/integrations/supabase/client';
import { createJournalEntry } from './accounting';

export interface Voucher {
  id: string;
  company_id: string;
  voucher_number: number;
  voucher_type: 'receipt' | 'payment';
  amount: number;
  related_to: string | null;
  related_id: string | null;
  description: string;
  voucher_date: string;
  payment_method: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  journal_entry_id: string | null;
}

export type VoucherInsert = Omit<Voucher, 'id' | 'voucher_number' | 'created_at' | 'updated_at' | 'journal_entry_id'>;

export async function fetchVouchers(): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Voucher[];
}

export async function fetchVouchersByType(type: 'receipt' | 'payment'): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('voucher_type', type)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Voucher[];
}

// Helper to get default account IDs
async function getDefaultAccounts(companyId: string) {
  // Get company accounting settings
  const { data: settings } = await supabase
    .from('company_accounting_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  // Get accounts by code
  const { data: accounts } = await supabase
    .from('account_categories')
    .select('id, code, name')
    .eq('company_id', companyId);

  const getAccountByCode = (code: string) => accounts?.find(a => a.code === code)?.id;

  return {
    cashAccountId: settings?.sales_cash_account_id || getAccountByCode('1101'),
    bankAccountId: getAccountByCode('1102'),
    customersAccountId: getAccountByCode('1201'),
    suppliersAccountId: settings?.suppliers_account_id || getAccountByCode('2101'),
    revenueAccountId: settings?.sales_revenue_account_id || getAccountByCode('4101'),
    expenseAccountId: settings?.expense_account_id || getAccountByCode('5101'),
  };
}

export async function addVoucher(voucher: VoucherInsert): Promise<Voucher> {
  // First insert the voucher
  const { data, error } = await supabase
    .from('vouchers')
    .insert(voucher)
    .select()
    .single();
  
  if (error) throw error;

  // Create automatic journal entry
  try {
    const defaultAccounts = await getDefaultAccounts(voucher.company_id);
    
    // Determine which account to use based on payment method
    let paymentAccountId: string | undefined;
    if (voucher.payment_method === 'cash') {
      paymentAccountId = defaultAccounts.cashAccountId;
    } else if (voucher.payment_method === 'bank') {
      paymentAccountId = defaultAccounts.bankAccountId;
    } else {
      paymentAccountId = defaultAccounts.cashAccountId; // Default to cash
    }

    // Determine the related account based on voucher type and related_to
    let relatedAccountId: string | undefined;
    if (voucher.related_to === 'customer') {
      relatedAccountId = defaultAccounts.customersAccountId;
    } else if (voucher.related_to === 'supplier') {
      relatedAccountId = defaultAccounts.suppliersAccountId;
    } else if (voucher.related_to === 'expense') {
      relatedAccountId = defaultAccounts.expenseAccountId;
    } else {
      // Default based on voucher type
      relatedAccountId = voucher.voucher_type === 'receipt' 
        ? defaultAccounts.revenueAccountId 
        : defaultAccounts.expenseAccountId;
    }

    if (paymentAccountId && relatedAccountId) {
      const lines = voucher.voucher_type === 'receipt' 
        ? [
            // Receipt: Cash/Bank increases (debit), Revenue/Customer decreases (credit)
            { account_id: paymentAccountId, debit: voucher.amount, credit: 0, description: voucher.description },
            { account_id: relatedAccountId, debit: 0, credit: voucher.amount, description: voucher.description },
          ]
        : [
            // Payment: Expense/Supplier increases (debit), Cash/Bank decreases (credit)
            { account_id: relatedAccountId, debit: voucher.amount, credit: 0, description: voucher.description },
            { account_id: paymentAccountId, debit: 0, credit: voucher.amount, description: voucher.description },
          ];

      const journalEntry = await createJournalEntry(
        {
          company_id: voucher.company_id,
          entry_date: voucher.voucher_date,
          description: `${voucher.voucher_type === 'receipt' ? 'سند قبض' : 'سند صرف'} - ${voucher.description}`,
          reference_type: 'voucher' as any,
          reference_id: data.id,
          is_posted: true,
          total_debit: voucher.amount,
          total_credit: voucher.amount,
          created_by: voucher.created_by,
        },
        lines
      );

      // Update voucher with journal entry ID
      await supabase
        .from('vouchers')
        .update({ journal_entry_id: journalEntry.id })
        .eq('id', data.id);

      return { ...data, journal_entry_id: journalEntry.id } as Voucher;
    }
  } catch (journalError) {
    console.error('Error creating journal entry for voucher:', journalError);
    // Continue even if journal entry fails - voucher is already created
  }

  return data as Voucher;
}

export async function updateVoucher(id: string, updates: Partial<VoucherInsert>): Promise<Voucher> {
  const { data, error } = await supabase
    .from('vouchers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Voucher;
}

export async function deleteVoucher(id: string): Promise<void> {
  // Get the voucher first to check for linked journal entry
  const { data: voucher } = await supabase
    .from('vouchers')
    .select('journal_entry_id')
    .eq('id', id)
    .single();

  // Delete the voucher
  const { error } = await supabase
    .from('vouchers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;

  // Delete linked journal entry if exists
  if (voucher?.journal_entry_id) {
    await supabase
      .from('journal_entries')
      .delete()
      .eq('id', voucher.journal_entry_id);
  }
}
