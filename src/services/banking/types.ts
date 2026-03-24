export interface BankAccount {
  id: string;
  company_id: string;
  account_name: string;
  bank_name: string;
  account_number?: string;
  iban?: string;
  swift_code?: string;
  account_category_id?: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  account_category?: { id: string; code: string; name: string };
}

export interface BankStatement {
  id: string;
  company_id: string;
  bank_account_id: string;
  statement_date: string;
  file_name?: string;
  import_date: string;
  imported_by?: string;
  total_transactions: number;
  matched_transactions: number;
  unmatched_transactions: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  notes?: string;
  created_at: string;
  bank_account?: BankAccount;
  transactions?: BankTransaction[];
}

export interface BankTransaction {
  id: string;
  statement_id: string;
  bank_account_id: string;
  transaction_date: string;
  value_date?: string;
  description?: string;
  reference?: string;
  debit: number;
  credit: number;
  balance?: number;
  is_matched: boolean;
  matched_type?: string;
  matched_id?: string;
  matched_at?: string;
  matched_by?: string;
  notes?: string;
  created_at: string;
}

export interface BankReconciliation {
  id: string;
  company_id: string;
  bank_account_id: string;
  reconciliation_date: string;
  statement_ending_balance: number;
  book_balance: number;
  adjusted_book_balance?: number;
  difference: number;
  status: 'draft' | 'in_progress' | 'completed' | 'approved';
  prepared_by?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  bank_account?: BankAccount;
}

export type BankAccountInsert = Omit<BankAccount, 'id' | 'created_at' | 'updated_at' | 'account_category'>;
