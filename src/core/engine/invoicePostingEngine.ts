/**
 * Core Accounting Engine - Invoice Posting Engine (v2)
 * 
 * Uses repository interfaces + EventBus for decoupled posting.
 * Replaces direct Supabase access with injected repositories.
 */

import { AccountResolver } from './accountResolver';
import { JournalEngine } from './journalEngine';
import { JournalEntryLine } from './types';
import { IInvoiceRepository, ISupplierRepository, IFiscalYearRepository } from './repositories';
import { EventBus, Events, InvoicePostedEvent } from './eventBus';

interface InvoiceData {
  id: string;
  company_id: string;
  fiscal_year_id: string | null;
  invoice_type: string;
  invoice_number: string;
  customer_name: string | null;
  supplier_id: string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  payment_account_id: string | null;
}

export class InvoicePostingEngine {
  private resolver: AccountResolver;
  private journal: JournalEngine;
  private invoiceRepo: IInvoiceRepository | null;
  private supplierRepo: ISupplierRepository | null;
  private fiscalYearRepo: IFiscalYearRepository | null;

  constructor(
    private companyId: string,
    deps?: {
      resolver?: AccountResolver;
      journal?: JournalEngine;
      invoiceRepo?: IInvoiceRepository;
      supplierRepo?: ISupplierRepository;
      fiscalYearRepo?: IFiscalYearRepository;
    },
  ) {
    this.resolver = deps?.resolver || new AccountResolver(companyId);
    this.journal = deps?.journal || new JournalEngine(companyId);
    this.invoiceRepo = deps?.invoiceRepo || null;
    this.supplierRepo = deps?.supplierRepo || null;
    this.fiscalYearRepo = deps?.fiscalYearRepo || null;
  }

  private async getInvoiceRepo(): Promise<IInvoiceRepository> {
    if (this.invoiceRepo) return this.invoiceRepo;
    const { defaultRepos } = await import('./supabaseRepositories');
    this.invoiceRepo = defaultRepos.invoices;
    return this.invoiceRepo;
  }

  private async getSupplierRepo(): Promise<ISupplierRepository> {
    if (this.supplierRepo) return this.supplierRepo;
    const { defaultRepos } = await import('./supabaseRepositories');
    this.supplierRepo = defaultRepos.suppliers;
    return this.supplierRepo;
  }

  private async getFiscalYearRepo(): Promise<IFiscalYearRepository> {
    if (this.fiscalYearRepo) return this.fiscalYearRepo;
    const { defaultRepos } = await import('./supabaseRepositories');
    this.fiscalYearRepo = defaultRepos.fiscalYears;
    return this.fiscalYearRepo;
  }

  /** Post an invoice as a journal entry */
  async postInvoice(invoiceId: string): Promise<void> {
    const invoiceRepo = await this.getInvoiceRepo();

    // Check for duplicates
    const existingId = await this.journal.existsForReference(
      invoiceId,
      ['invoice_purchase', 'invoice_sale']
    );
    if (existingId) {
      await invoiceRepo.updateStatus(invoiceId, 'issued', existingId);
      return;
    }

    // Fetch invoice
    const invoice = await invoiceRepo.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const inv = invoice as InvoiceData;
    const subtotal = Number(inv.subtotal) || 0;
    const vatAmount = Number(inv.vat_amount) || 0;
    const total = Number(inv.total) || subtotal + vatAmount;

    if (total <= 0) {
      await invoiceRepo.updateStatus(invoiceId, 'issued');
      return;
    }

    // Check auto-entry settings
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: settings } = await supabase
      .from('company_accounting_settings')
      .select('auto_journal_entries_enabled, auto_purchase_entries, auto_sales_entries')
      .eq('company_id', this.companyId)
      .maybeSingle();

    const isPurchase = inv.invoice_type === 'purchase';
    const isSales = inv.invoice_type === 'sales';

    if (settings?.auto_journal_entries_enabled === false ||
        (isPurchase && settings?.auto_purchase_entries === false) ||
        (isSales && settings?.auto_sales_entries === false)) {
      await invoiceRepo.updateStatus(invoiceId, 'issued');
      return;
    }

    // Load account resolver
    await this.resolver.load();

    // Build journal lines
    const lines = isPurchase
      ? await this.buildPurchaseLines(inv, subtotal, vatAmount)
      : this.buildSalesLines(inv, subtotal, vatAmount, total);

    if (!lines || lines.length === 0) {
      console.error('Could not build journal lines - missing accounts');
      await invoiceRepo.updateStatus(invoiceId, 'issued');
      return;
    }

    // Get fiscal year
    const fiscalYearId = inv.fiscal_year_id || await this.getCurrentFiscalYear();

    // Create journal entry (goes through middleware + events automatically)
    const entry = await this.journal.createEntry({
      company_id: this.companyId,
      fiscal_year_id: fiscalYearId,
      entry_date: new Date().toISOString().split('T')[0],
      description: `${isPurchase ? 'فاتورة شراء' : 'فاتورة مبيعات'} رقم ${inv.invoice_number} - ${inv.customer_name || ''}`,
      reference_type: isPurchase ? 'invoice_purchase' : 'invoice_sale',
      reference_id: invoiceId,
      is_posted: true,
      lines,
    });

    // Update invoice status
    await invoiceRepo.updateStatus(invoiceId, 'issued', entry.id);

    // Emit invoice-specific event
    await EventBus.emit<InvoicePostedEvent>(this.companyId, Events.INVOICE_POSTED, {
      invoiceId,
      journalEntryId: entry.id,
      invoiceType: inv.invoice_type,
      total,
    });
  }

  private async buildPurchaseLines(
    inv: InvoiceData, subtotal: number, vatAmount: number
  ): Promise<JournalEntryLine[]> {
    const lines: JournalEntryLine[] = [];
    const expenseAccount = this.resolver.resolve('purchase_expense');
    const vatInputAccount = this.resolver.resolve('vat_input');

    let creditAccount = inv.payment_account_id
      ? this.resolver.resolveFlexible(inv.payment_account_id, null)
      : null;

    if (!creditAccount && inv.supplier_id) {
      const supplierRepo = await this.getSupplierRepo();
      const supplierName = await supplierRepo.findNameById(inv.supplier_id);
      if (supplierName) {
        creditAccount = this.resolver.findByNameUnderCode(supplierName, '2101');
      }
    }
    if (!creditAccount) {
      creditAccount = this.resolver.resolve('suppliers');
    }

    if (!expenseAccount || !creditAccount) return [];

    lines.push({
      account_id: expenseAccount.id,
      description: `مشتريات - ${inv.customer_name || inv.invoice_number}`,
      debit: subtotal, credit: 0,
    });

    if (vatAmount > 0 && vatInputAccount) {
      lines.push({
        account_id: vatInputAccount.id,
        description: `ضريبة مشتريات - ${inv.invoice_number}`,
        debit: vatAmount, credit: 0,
      });
    }

    lines.push({
      account_id: creditAccount.id,
      description: `${creditAccount.name} - ${inv.customer_name || inv.invoice_number}`,
      debit: 0,
      credit: vatAmount > 0 && vatInputAccount ? subtotal + vatAmount : subtotal,
    });

    return lines;
  }

  private buildSalesLines(
    inv: InvoiceData, subtotal: number, vatAmount: number, total: number
  ): JournalEntryLine[] {
    const lines: JournalEntryLine[] = [];
    const cashAccount = inv.payment_account_id
      ? this.resolver.resolveFlexible(inv.payment_account_id, 'sales_cash')
      : this.resolver.resolve('sales_cash');
    const revenueAccount = this.resolver.resolve('sales_revenue');
    const vatOutputAccount = this.resolver.resolve('vat_output');

    if (!cashAccount || !revenueAccount) return [];

    lines.push({ account_id: cashAccount.id, description: `مبيعات - ${inv.customer_name || inv.invoice_number}`, debit: total, credit: 0 });
    lines.push({ account_id: revenueAccount.id, description: `إيرادات - ${inv.invoice_number}`, debit: 0, credit: subtotal });
    if (vatAmount > 0 && vatOutputAccount) {
      lines.push({ account_id: vatOutputAccount.id, description: `ضريبة مبيعات - ${inv.invoice_number}`, debit: 0, credit: vatAmount });
    }

    return lines;
  }

  private async getCurrentFiscalYear(): Promise<string> {
    const repo = await this.getFiscalYearRepo();
    const fy = await repo.findCurrent(this.companyId);
    return fy?.id || '';
  }
}
