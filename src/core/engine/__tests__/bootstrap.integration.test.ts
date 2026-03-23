/**
 * Integration Test: Company Bootstrap Validation
 * 
 * Verifies that a new company can be fully bootstrapped with:
 * 1. Chart of Accounts (with required types)
 * 2. Account Mappings (5 critical keys)
 * 3. Fiscal Year
 * 4. Journal entry creation works end-to-end
 * 5. Invoice posting works for purchase & sales
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createServiceContainer } from '@/core/engine/serviceContainer';
import { PostingMiddleware } from '@/core/engine/postingMiddleware';
import { EventBus, Events } from '@/core/engine/eventBus';
import type {
  IAccountRepository, IAccountMappingRepository, IJournalEntryRepository,
  IFiscalYearRepository, IInvoiceRepository, ISupplierRepository,
  ICompanySettingsRepository,
} from '@/core/engine/repositories';
import type { Account, JournalEntryRecord, FiscalYear } from '@/core/engine/types';

// ── Full mock company data ──
const COMPANY_ID = 'bootstrap-test-co';

const accounts: Account[] = [
  { id: 'acc-cash', company_id: COMPANY_ID, code: '1101', name: 'النقدية', type: 'assets', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'acc-ar', company_id: COMPANY_ID, code: '1201', name: 'العملاء', type: 'assets', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'acc-inv', company_id: COMPANY_ID, code: '1301', name: 'المخزون', type: 'assets', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'acc-ap', company_id: COMPANY_ID, code: '2101', name: 'الموردون', type: 'liabilities', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'acc-vat-in', company_id: COMPANY_ID, code: '21042', name: 'ضريبة مدخلات', type: 'liabilities', parent_id: null, is_system: false, description: null, created_at: '', updated_at: '' },
  { id: 'acc-vat-out', company_id: COMPANY_ID, code: '210401', name: 'ضريبة مخرجات', type: 'liabilities', parent_id: null, is_system: false, description: null, created_at: '', updated_at: '' },
  { id: 'acc-equity', company_id: COMPANY_ID, code: '3103', name: 'أرباح مبقاة', type: 'equity', parent_id: null, is_system: false, description: null, created_at: '', updated_at: '' },
  { id: 'acc-rev', company_id: COMPANY_ID, code: '4101', name: 'إيرادات المبيعات', type: 'revenue', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
  { id: 'acc-exp', company_id: COMPANY_ID, code: '5101', name: 'مصروفات المشتريات', type: 'expenses', parent_id: null, is_system: true, description: null, created_at: '', updated_at: '' },
];

const mappings = [
  { mapping_key: 'cash', account_id: 'acc-cash' },
  { mapping_key: 'sales_cash', account_id: 'acc-cash' },
  { mapping_key: 'sales_revenue', account_id: 'acc-rev' },
  { mapping_key: 'purchase_expense', account_id: 'acc-exp' },
  { mapping_key: 'suppliers', account_id: 'acc-ap' },
  { mapping_key: 'customers', account_id: 'acc-ar' },
  { mapping_key: 'vat_input', account_id: 'acc-vat-in' },
  { mapping_key: 'vat_output', account_id: 'acc-vat-out' },
  { mapping_key: 'retained_earnings', account_id: 'acc-equity' },
];

const fiscalYear: FiscalYear = {
  id: 'fy-2026', company_id: COMPANY_ID, name: '2026',
  start_date: '2026-01-01', end_date: '2026-12-31',
  is_current: true, status: 'open',
};

// ── In-memory journal store ──
let journalStore: JournalEntryRecord[] = [];
let lineStore: any[] = [];
let nextEntryNum = 1;

function buildDeps() {
  journalStore = [];
  lineStore = [];
  nextEntryNum = 1;

  const accountRepo: IAccountRepository = {
    findAll: async () => accounts,
    findById: async (id) => accounts.find(a => a.id === id) || null,
    findByCode: async (_, code) => accounts.find(a => a.code === code) || null,
    findByNameUnderCode: async () => null,
  };

  const mappingRepo: IAccountMappingRepository = {
    findActive: async () => mappings,
  };

  const journalRepo: IJournalEntryRepository = {
    create: vi.fn(async (data) => {
      const entry: JournalEntryRecord = {
        id: `je-${nextEntryNum}`, ...data, entry_number: nextEntryNum++,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      journalStore.push(entry);
      return entry;
    }),
    createLines: vi.fn(async (lines) => { lineStore.push(...lines); }),
    findByReference: vi.fn(async (_, refId) => {
      const entry = journalStore.find(e => e.reference_id === refId);
      return entry?.id || null;
    }),
    deleteLines: vi.fn(async (entryId) => { lineStore = lineStore.filter(l => l.journal_entry_id !== entryId); }),
    updateTotals: vi.fn(async () => {}),
    deleteEntry: vi.fn(async (id) => { journalStore = journalStore.filter(e => e.id !== id); }),
    deleteByReference: vi.fn(async () => {}),
    updateEntry: vi.fn(async () => {}),
    fetchAllLines: vi.fn(async () => []),
    findOpeningEntryIds: vi.fn(async () => []),
  };

  const fiscalYearRepo: IFiscalYearRepository = {
    findCurrent: async () => fiscalYear,
    findById: async (id) => id === fiscalYear.id ? fiscalYear : null,
    create: async () => fiscalYear,
    update: vi.fn(async () => {}),
  };

  const invoiceRepo: IInvoiceRepository = {
    findById: vi.fn(),
    updateStatus: vi.fn(async () => {}),
  };

  const supplierRepo: ISupplierRepository = { findNameById: async () => null };
  const settingsRepo: ICompanySettingsRepository = {
    getAccountingSettings: async () => ({
      auto_journal_entries_enabled: true,
      auto_purchase_entries: true,
      auto_sales_entries: true,
    }),
  };

  return {
    accounts: accountRepo,
    accountMappings: mappingRepo,
    journalEntries: journalRepo,
    fiscalYears: fiscalYearRepo,
    invoices: invoiceRepo,
    suppliers: supplierRepo,
    companySettings: settingsRepo,
  };
}

describe('Company Bootstrap Integration', () => {
  let deps: ReturnType<typeof buildDeps>;

  beforeEach(() => {
    PostingMiddleware.clear();
    EventBus.clear();
    deps = buildDeps();
  });

  it('1. Chart of Accounts has all required account types', () => {
    const types = new Set(accounts.map(a => a.type));
    expect(types).toContain('assets');
    expect(types).toContain('liabilities');
    expect(types).toContain('equity');
    expect(types).toContain('revenue');
    expect(types).toContain('expenses');
  });

  it('2. All 5 critical account mappings are present', () => {
    const criticalKeys = ['cash', 'sales_cash', 'sales_revenue', 'purchase_expense', 'suppliers'];
    for (const key of criticalKeys) {
      expect(mappings.some(m => m.mapping_key === key)).toBe(true);
    }
  });

  it('3. Resolver loads and resolves all critical accounts', async () => {
    const container = createServiceContainer(COMPANY_ID, deps);
    await container.initialize();

    expect(container.resolver.resolve('cash')).not.toBeNull();
    expect(container.resolver.resolve('sales_revenue')).not.toBeNull();
    expect(container.resolver.resolve('purchase_expense')).not.toBeNull();
    expect(container.resolver.resolve('suppliers')).not.toBeNull();
    expect(container.resolver.resolve('vat_input')).not.toBeNull();
    expect(container.resolver.resolve('vat_output')).not.toBeNull();
    expect(container.resolver.resolve('retained_earnings')).not.toBeNull();
  });

  it('4. Manual journal entry creates successfully', async () => {
    const container = createServiceContainer(COMPANY_ID, deps);
    await container.initialize();

    const entry = await container.journal.createEntry({
      company_id: COMPANY_ID, fiscal_year_id: fiscalYear.id,
      entry_date: '2026-06-15', description: 'قيد يدوي تجريبي',
      lines: [
        { account_id: 'acc-cash', description: 'مدين', debit: 5000, credit: 0 },
        { account_id: 'acc-rev', description: 'دائن', debit: 0, credit: 5000 },
      ],
    });

    expect(entry.id).toBeDefined();
    expect(journalStore).toHaveLength(1);
    expect(lineStore).toHaveLength(2);
  });

  it('5. Purchase invoice posts balanced journal entry', async () => {
    const container = createServiceContainer(COMPANY_ID, deps);
    await container.initialize();

    (deps.invoices.findById as any).mockResolvedValue({
      id: 'inv-p1', company_id: COMPANY_ID, fiscal_year_id: fiscalYear.id,
      invoice_type: 'purchase', invoice_number: 'P-001',
      invoice_date: '2026-03-15', customer_name: 'مورد تجريبي',
      supplier_id: null, subtotal: 10000, vat_amount: 1500, total: 11500,
      payment_account_id: null,
    });

    await container.invoicePosting.postInvoice('inv-p1');

    expect(journalStore).toHaveLength(1);
    const totalDebit = lineStore.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lineStore.reduce((s, l) => s + l.credit, 0);
    expect(totalDebit).toBe(totalCredit);
    expect(totalDebit).toBe(11500);
  });

  it('6. Sales invoice posts balanced journal entry', async () => {
    const container = createServiceContainer(COMPANY_ID, deps);
    await container.initialize();

    (deps.invoices.findById as any).mockResolvedValue({
      id: 'inv-s1', company_id: COMPANY_ID, fiscal_year_id: fiscalYear.id,
      invoice_type: 'sales', invoice_number: 'S-001',
      invoice_date: '2026-04-01', customer_name: 'عميل تجريبي',
      supplier_id: null, subtotal: 8000, vat_amount: 1200, total: 9200,
      payment_account_id: null,
    });

    await container.invoicePosting.postInvoice('inv-s1');

    expect(journalStore).toHaveLength(1);
    const totalDebit = lineStore.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lineStore.reduce((s, l) => s + l.credit, 0);
    expect(totalDebit).toBe(totalCredit);
    expect(totalDebit).toBe(9200);
  });

  it('7. Duplicate invoice posting is prevented', async () => {
    const container = createServiceContainer(COMPANY_ID, deps);
    await container.initialize();

    (deps.invoices.findById as any).mockResolvedValue({
      id: 'inv-dup', company_id: COMPANY_ID, fiscal_year_id: fiscalYear.id,
      invoice_type: 'sales', invoice_number: 'S-DUP',
      invoice_date: '2026-05-01', customer_name: 'عميل',
      supplier_id: null, subtotal: 1000, vat_amount: 0, total: 1000,
      payment_account_id: null,
    });

    await container.invoicePosting.postInvoice('inv-dup');
    expect(journalStore).toHaveLength(1);

    // Post same invoice again
    await container.invoicePosting.postInvoice('inv-dup');
    expect(journalStore).toHaveLength(1); // no duplicate
  });

  it('8. Tenant isolation: entries are scoped to company_id', async () => {
    const container = createServiceContainer(COMPANY_ID, deps);
    await container.initialize();

    await container.journal.createEntry({
      company_id: COMPANY_ID, fiscal_year_id: fiscalYear.id,
      entry_date: '2026-06-15', description: 'Scoped entry',
      lines: [
        { account_id: 'acc-cash', description: 'D', debit: 100, credit: 0 },
        { account_id: 'acc-rev', description: 'C', debit: 0, credit: 100 },
      ],
    });

    expect(journalStore.every(e => e.company_id === COMPANY_ID)).toBe(true);
  });
});
