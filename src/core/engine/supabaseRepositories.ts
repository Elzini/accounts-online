/**
 * Supabase Implementation of Repository Interfaces
 * 
 * This is the ONLY file that imports supabase in the data layer.
 * All engine classes depend on repository interfaces, not this file.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  IAccountRepository,
  IJournalEntryRepository,
  IAccountMappingRepository,
  ICompanyConfigRepository,
  IFiscalYearRepository,
  IInvoiceRepository,
  ISupplierRepository,
  ICompanySettingsRepository,
} from './repositories';
import { Account, JournalEntryRecord, FiscalYear, AccountMapping, CompanyConfig } from './types';

// ============ Account Repository ============
export class SupabaseAccountRepository implements IAccountRepository {
  async findAll(companyId: string): Promise<Account[]> {
    const allData: Account[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('account_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('code')
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData.push(...(data as Account[]));
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return allData;
  }

  async findById(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('account_categories').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Account | null;
  }

  async findByCode(companyId: string, code: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('account_categories').select('*').eq('company_id', companyId).eq('code', code).maybeSingle();
    if (error) throw error;
    return data as Account | null;
  }

  async findByNameUnderCode(companyId: string, name: string, parentCodePrefix: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('account_categories')
      .select('*')
      .eq('company_id', companyId)
      .eq('name', name)
      .like('code', `${parentCodePrefix}%`)
      .maybeSingle();
    if (error) throw error;
    return data as Account | null;
  }
}

// ============ Journal Entry Repository ============
export class SupabaseJournalEntryRepository implements IJournalEntryRepository {
  async create(entry: Parameters<IJournalEntryRepository['create']>[0]): Promise<JournalEntryRecord> {
    const { data, error } = await supabase
      .from('journal_entries').insert(entry).select().single();
    if (error) throw error;
    return data as unknown as JournalEntryRecord;
  }

  async createLines(lines: Parameters<IJournalEntryRepository['createLines']>[0]): Promise<void> {
    const { error } = await supabase.from('journal_entry_lines').insert(lines);
    if (error) throw error;
  }

  async findByReference(companyId: string, referenceId: string, referenceTypes: string[]): Promise<string | null> {
    const { data } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('reference_id', referenceId)
      .in('reference_type', referenceTypes)
      .eq('company_id', companyId)
      .limit(1);
    return data && data.length > 0 ? data[0].id : null;
  }

  async deleteLines(entryId: string): Promise<void> {
    const { error } = await supabase.from('journal_entry_lines').delete().eq('journal_entry_id', entryId);
    if (error) throw error;
  }

  async updateTotals(entryId: string, totalDebit: number, totalCredit: number): Promise<void> {
    const { error } = await supabase
      .from('journal_entries').update({ total_debit: totalDebit, total_credit: totalCredit }).eq('id', entryId);
    if (error) throw error;
  }

  async deleteEntry(entryId: string): Promise<void> {
    const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
    if (error) throw error;
  }

  async fetchAllLines(companyId: string, fiscalYearId: string) {
    const allLines: Array<{
      journal_entry_id: string; account_id: string;
      debit: number; credit: number; entry_date: string; reference_type?: string;
    }> = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('journal_entry_lines')
        .select(`
          journal_entry_id, account_id, debit, credit,
          journal_entry:journal_entries!inner(entry_date, is_posted, company_id, fiscal_year_id, reference_type)
        `)
        .eq('journal_entry.company_id', companyId)
        .eq('journal_entry.fiscal_year_id', fiscalYearId)
        .eq('journal_entry.is_posted', true)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const row of data) {
        const je = row.journal_entry as any;
        allLines.push({
          journal_entry_id: row.journal_entry_id,
          account_id: row.account_id,
          debit: Number(row.debit) || 0,
          credit: Number(row.credit) || 0,
          entry_date: je?.entry_date || '',
          reference_type: je?.reference_type || undefined,
        });
      }
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return allLines;
  }

  async findOpeningEntryIds(companyId: string, fiscalYearId: string): Promise<string[]> {
    const { data } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('company_id', companyId)
      .eq('fiscal_year_id', fiscalYearId)
      .eq('reference_type', 'opening')
      .eq('is_posted', true);
    return (data || []).map(e => e.id);
  }
}

// ============ Account Mapping Repository ============
export class SupabaseAccountMappingRepository implements IAccountMappingRepository {
  async findActive(companyId: string): Promise<AccountMapping[]> {
    const { data, error } = await supabase
      .from('account_mappings')
      .select('mapping_key, account_id')
      .eq('company_id', companyId)
      .eq('is_active', true);
    if (error) throw error;
    return (data || []).filter(m => m.account_id).map(m => ({
      mapping_key: m.mapping_key,
      account_id: m.account_id!,
    }));
  }
}

// ============ Fiscal Year Repository ============
export class SupabaseFiscalYearRepository implements IFiscalYearRepository {
  async findCurrent(companyId: string): Promise<FiscalYear | null> {
    const { data, error } = await supabase
      .from('fiscal_years')
      .select('id, company_id, name, start_date, end_date, is_current, status')
      .eq('company_id', companyId)
      .eq('is_current', true)
      .maybeSingle();
    if (error) return null;
    return data as FiscalYear | null;
  }

  async findById(id: string): Promise<FiscalYear | null> {
    const { data, error } = await supabase
      .from('fiscal_years')
      .select('id, company_id, name, start_date, end_date, is_current, status')
      .eq('id', id)
      .maybeSingle();
    if (error) return null;
    return data as FiscalYear | null;
  }
}

// ============ Invoice Repository ============
export class SupabaseInvoiceRepository implements IInvoiceRepository {
  async findById(invoiceId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, company_id, fiscal_year_id, invoice_type, invoice_number, invoice_date, customer_name, supplier_id, subtotal, vat_amount, total, payment_account_id')
      .eq('id', invoiceId)
      .single();
    if (error || !data) return null;
    return data as any;
  }

  async updateStatus(invoiceId: string, status: string, journalEntryId?: string): Promise<void> {
    const update: any = { status };
    if (journalEntryId) update.journal_entry_id = journalEntryId;
    const { error } = await supabase.from('invoices').update(update).eq('id', invoiceId);
    if (error) throw error;
  }
}

// ============ Supplier Repository ============
export class SupabaseSupplierRepository implements ISupplierRepository {
  async findNameById(supplierId: string): Promise<string | null> {
    const { data } = await supabase
      .from('suppliers').select('name').eq('id', supplierId).maybeSingle();
    return data?.name || null;
  }
}

// ============ Company Settings Repository ============
export class SupabaseCompanySettingsRepository implements ICompanySettingsRepository {
  async getAccountingSettings(companyId: string) {
    const { data } = await supabase
      .from('company_accounting_settings')
      .select('auto_journal_entries_enabled, auto_purchase_entries, auto_sales_entries')
      .eq('company_id', companyId)
      .maybeSingle();
    if (!data) return null;
    return {
      auto_journal_entries_enabled: data.auto_journal_entries_enabled ?? true,
      auto_purchase_entries: data.auto_purchase_entries ?? true,
      auto_sales_entries: data.auto_sales_entries ?? true,
    };
  }
}

// ============ Default instances ============
export const defaultRepos = {
  accounts: new SupabaseAccountRepository(),
  journalEntries: new SupabaseJournalEntryRepository(),
  accountMappings: new SupabaseAccountMappingRepository(),
  fiscalYears: new SupabaseFiscalYearRepository(),
  invoices: new SupabaseInvoiceRepository(),
  suppliers: new SupabaseSupplierRepository(),
  companySettings: new SupabaseCompanySettingsRepository(),
};
