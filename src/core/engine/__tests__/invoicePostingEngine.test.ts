import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvoicePostingEngine } from '@/core/engine/invoicePostingEngine';
import { AccountResolver } from '@/core/engine/accountResolver';
import { JournalEngine } from '@/core/engine/journalEngine';
import { EventBus } from '@/core/engine/eventBus';
import { PostingMiddleware } from '@/core/engine/postingMiddleware';
import type { IInvoiceRepository, ISupplierRepository, IFiscalYearRepository, ICompanySettingsRepository, IAccountRepository, IAccountMappingRepository, IJournalEntryRepository } from '@/core/engine/repositories';
import type { Account, JournalEntryRecord } from '@/core/engine/types';

// ── Mock accounts ──
const accounts: Account[] = [
  { id: 'cash', company_id: 'c1', code: '1101', name: 'النقدية', type: 'assets', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'revenue', company_id: 'c1', code: '4101', name: 'إيرادات', type: 'revenue', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'expense', company_id: 'c1', code: '5101', name: 'مشتريات', type: 'expenses', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'suppliers', company_id: 'c1', code: '2101', name: 'الموردون', type: 'liabilities', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'vat_in', company_id: 'c1', code: '21042', name: 'ضريبة مدخلات', type: 'liabilities', parent_id: null, is_system: false, description: null, created_at: '', updated_at: '' },
  { id: 'vat_out', company_id: 'c1', code: '210401', name: 'ضريبة مخرجات', type: 'liabilities', parent_id: null, is_system: false, description: null, created_at: '', updated_at: '' },
];

const mappings = [
  { mapping_key: 'cash', account_id: 'cash' },
  { mapping_key: 'sales_cash', account_id: 'cash' },
  { mapping_key: 'sales_revenue', account_id: 'revenue' },
  { mapping_key: 'purchase_expense', account_id: 'expense' },
  { mapping_key: 'suppliers', account_id: 'suppliers' },
  { mapping_key: 'vat_input', account_id: 'vat_in' },
  { mapping_key: 'vat_output', account_id: 'vat_out' },
];

function buildEngine() {
  const accountRepo: IAccountRepository = {
    findAll: async () => accounts,
    findById: async (id) => accounts.find(a => a.id === id) || null,
    findByCode: async (_, code) => accounts.find(a => a.code === code) || null,
    findByNameUnderCode: async () => null,
  };
  const mappingRepo: IAccountMappingRepository = { findActive: async () => mappings };

  let nextNum = 1;
  const journalRepo: IJournalEntryRepository = {
    create: vi.fn(async (data) => ({ id: `je-${nextNum++}`, ...data, entry_number: nextNum - 1, created_at: '', updated_at: '' } as JournalEntryRecord)),
    createLines: vi.fn(async () => {}),
    findByReference: vi.fn(async () => null),
    deleteLines: vi.fn(async () => {}),
    updateTotals: vi.fn(async () => {}),
    deleteEntry: vi.fn(async () => {}),
    deleteByReference: vi.fn(async () => {}),
    updateEntry: vi.fn(async () => {}),
    fetchAllLines: vi.fn(async () => []),
    findOpeningEntryIds: vi.fn(async () => []),
  };

  const invoiceRepo: IInvoiceRepository = {
    findById: vi.fn(),
    updateStatus: vi.fn(async () => {}),
  };

  const supplierRepo: ISupplierRepository = { findNameById: vi.fn(async () => null) };
  const fiscalYearRepo: IFiscalYearRepository = {
    findCurrent: vi.fn(async () => ({ id: 'fy1', company_id: 'c1', name: '2026', start_date: '2026-01-01', end_date: '2026-12-31', is_current: true, status: 'open' })),
    findById: vi.fn(async () => null),
    create: vi.fn(async () => ({} as any)),
    update: vi.fn(async () => {}),
  };
  const settingsRepo: ICompanySettingsRepository = {
    getAccountingSettings: vi.fn(async () => ({
      auto_journal_entries_enabled: true,
      auto_purchase_entries: true,
      auto_sales_entries: true,
    })),
  };

  const resolver = new AccountResolver('c1', accountRepo, mappingRepo);
  const journal = new JournalEngine('c1', journalRepo);

  const engine = new InvoicePostingEngine('c1', {
    resolver, journal,
    invoiceRepo, supplierRepo, fiscalYearRepo, settingsRepo,
  });

  return { engine, invoiceRepo, journalRepo, settingsRepo };
}

describe('InvoicePostingEngine', () => {
  beforeEach(() => {
    PostingMiddleware.clear();
    EventBus.clear();
  });

  it('posts a purchase invoice with VAT', async () => {
    const { engine, invoiceRepo, journalRepo } = buildEngine();
    (invoiceRepo.findById as any).mockResolvedValue({
      id: 'inv1', company_id: 'c1', fiscal_year_id: 'fy1',
      invoice_type: 'purchase', invoice_number: 'P-001',
      invoice_date: '2026-03-01', customer_name: 'مورد 1',
      supplier_id: null, subtotal: 1000, vat_amount: 150, total: 1150,
      payment_account_id: null,
    });

    await engine.postInvoice('inv1');

    expect(journalRepo.create).toHaveBeenCalledOnce();
    expect(journalRepo.createLines).toHaveBeenCalledOnce();
    const lines = (journalRepo.createLines as any).mock.calls[0][0];
    expect(lines).toHaveLength(3); // expense + vat + supplier
    const totalDebit = lines.reduce((s: number, l: any) => s + l.debit, 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + l.credit, 0);
    expect(totalDebit).toBe(totalCredit);
    expect(invoiceRepo.updateStatus).toHaveBeenCalledWith('inv1', 'issued', expect.any(String));
  });

  it('posts a sales invoice', async () => {
    const { engine, invoiceRepo, journalRepo } = buildEngine();
    (invoiceRepo.findById as any).mockResolvedValue({
      id: 'inv2', company_id: 'c1', fiscal_year_id: 'fy1',
      invoice_type: 'sales', invoice_number: 'S-001',
      invoice_date: '2026-03-01', customer_name: 'عميل 1',
      supplier_id: null, subtotal: 2000, vat_amount: 300, total: 2300,
      payment_account_id: null,
    });

    await engine.postInvoice('inv2');
    const lines = (journalRepo.createLines as any).mock.calls[0][0];
    expect(lines).toHaveLength(3); // cash + revenue + vat
    expect(lines[0].debit).toBe(2300);
  });

  it('skips posting when auto_journal_entries disabled', async () => {
    const { engine, invoiceRepo, journalRepo, settingsRepo } = buildEngine();
    (settingsRepo.getAccountingSettings as any).mockResolvedValue({
      auto_journal_entries_enabled: false,
      auto_purchase_entries: true,
      auto_sales_entries: true,
    });
    (invoiceRepo.findById as any).mockResolvedValue({
      id: 'inv3', company_id: 'c1', fiscal_year_id: 'fy1',
      invoice_type: 'purchase', invoice_number: 'P-002',
      invoice_date: '2026-03-01', customer_name: null,
      supplier_id: null, subtotal: 500, vat_amount: 0, total: 500,
      payment_account_id: null,
    });

    await engine.postInvoice('inv3');
    expect(journalRepo.create).not.toHaveBeenCalled();
    expect(invoiceRepo.updateStatus).toHaveBeenCalledWith('inv3', 'issued');
  });

  it('skips if duplicate reference exists', async () => {
    const { engine, invoiceRepo, journalRepo } = buildEngine();
    // Make findByReference return existing entry
    (journalRepo.findByReference as any).mockResolvedValue('je-existing');

    await engine.postInvoice('inv4');
    expect(invoiceRepo.updateStatus).toHaveBeenCalledWith('inv4', 'issued', 'je-existing');
    expect(journalRepo.create).not.toHaveBeenCalled();
  });

  it('skips posting when total is 0', async () => {
    const { engine, invoiceRepo, journalRepo } = buildEngine();
    (invoiceRepo.findById as any).mockResolvedValue({
      id: 'inv5', company_id: 'c1', fiscal_year_id: 'fy1',
      invoice_type: 'purchase', invoice_number: 'P-003',
      invoice_date: '2026-03-01', customer_name: null,
      supplier_id: null, subtotal: 0, vat_amount: 0, total: 0,
      payment_account_id: null,
    });

    await engine.postInvoice('inv5');
    expect(journalRepo.create).not.toHaveBeenCalled();
  });

  it('emits INVOICE_POSTED event', async () => {
    const handler = vi.fn();
    EventBus.on('invoice.posted', handler);

    const { engine, invoiceRepo } = buildEngine();
    (invoiceRepo.findById as any).mockResolvedValue({
      id: 'inv6', company_id: 'c1', fiscal_year_id: 'fy1',
      invoice_type: 'sales', invoice_number: 'S-002',
      invoice_date: '2026-03-01', customer_name: 'Test',
      supplier_id: null, subtotal: 100, vat_amount: 0, total: 100,
      payment_account_id: null,
    });

    await engine.postInvoice('inv6');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].payload.invoiceId).toBe('inv6');
  });
});
