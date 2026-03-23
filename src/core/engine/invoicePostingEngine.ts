/**
 * Core Accounting Engine - Invoice Posting Engine
 * Handles automatic journal entry creation when invoices are approved
 * 
 * This replaces the old invoiceJournal.ts with a clean, config-driven approach
 */

import { supabase } from '@/integrations/supabase/client';
import { AccountResolver } from './accountResolver';
import { JournalEngine } from './journalEngine';
import { JournalEntryLine } from './types';

interface InvoiceData {
  id: string;
  company_id: string;
  fiscal_year_id: string | null;
  invoice_type: 'purchase' | 'sales' | 'service';
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

  constructor(private companyId: string) {
    this.resolver = new AccountResolver(companyId);
    this.journal = new JournalEngine(companyId);
  }

  /** Post an invoice as a journal entry */
  async postInvoice(invoiceId: string): Promise<void> {
    // Check for duplicates
    const existingId = await this.journal.existsForReference(
      invoiceId,
      ['invoice_purchase', 'invoice_sale']
    );
    if (existingId) {
      await supabase.from('invoices')
        .update({ status: 'issued', journal_entry_id: existingId })
        .eq('id', invoiceId);
      return;
    }

    // Fetch invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('id, company_id, fiscal_year_id, invoice_type, invoice_number, customer_name, supplier_id, subtotal, vat_amount, total, payment_account_id')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) throw error || new Error('Invoice not found');

    const inv = invoice as InvoiceData;
    const subtotal = Number(inv.subtotal) || 0;
    const vatAmount = Number(inv.vat_amount) || 0;
    const total = Number(inv.total) || subtotal + vatAmount;

    if (total <= 0) {
      await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
      return;
    }

    // Check auto-entry settings
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
      await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
      return;
    }

    // Load account resolver
    await this.resolver.load();

    // Build journal lines based on invoice type
    const lines = isPurchase
      ? await this.buildPurchaseLines(inv, subtotal, vatAmount)
      : this.buildSalesLines(inv, subtotal, vatAmount, total);

    if (!lines || lines.length === 0) {
      console.error('Could not build journal lines - missing accounts');
      await supabase.from('invoices').update({ status: 'issued' }).eq('id', invoiceId);
      return;
    }

    // Get fiscal year
    const fiscalYearId = inv.fiscal_year_id || await this.getCurrentFiscalYear();

    // Create journal entry
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

    // Update invoice
    await supabase.from('invoices')
      .update({ status: 'issued', journal_entry_id: entry.id })
      .eq('id', invoiceId);
  }

  private async buildPurchaseLines(
    inv: InvoiceData, subtotal: number, vatAmount: number
  ): Promise<JournalEntryLine[]> {
    const lines: JournalEntryLine[] = [];

    const expenseAccount = this.resolver.resolve('purchase_expense');
    const vatInputAccount = this.resolver.resolve('vat_input');

    // Determine credit account
    let creditAccount = inv.payment_account_id
      ? this.resolver.resolveFlexible(inv.payment_account_id, null)
      : null;

    if (!creditAccount && inv.supplier_id) {
      // Try to find supplier sub-account
      const { data: supplier } = await supabase
        .from('suppliers').select('name').eq('id', inv.supplier_id).maybeSingle();
      if (supplier?.name) {
        creditAccount = this.resolver.findByNameUnderCode(supplier.name, '2101');
      }
    }
    if (!creditAccount) {
      creditAccount = this.resolver.resolve('suppliers');
    }

    if (!expenseAccount || !creditAccount) return [];

    lines.push({
      account_id: expenseAccount.id,
      description: `مشتريات - ${inv.customer_name || inv.invoice_number}`,
      debit: subtotal,
      credit: 0,
    });

    if (vatAmount > 0 && vatInputAccount) {
      lines.push({
        account_id: vatInputAccount.id,
        description: `ضريبة مشتريات - ${inv.invoice_number}`,
        debit: vatAmount,
        credit: 0,
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

    lines.push({
      account_id: cashAccount.id,
      description: `مبيعات - ${inv.customer_name || inv.invoice_number}`,
      debit: total,
      credit: 0,
    });

    lines.push({
      account_id: revenueAccount.id,
      description: `إيرادات - ${inv.invoice_number}`,
      debit: 0,
      credit: subtotal,
    });

    if (vatAmount > 0 && vatOutputAccount) {
      lines.push({
        account_id: vatOutputAccount.id,
        description: `ضريبة مبيعات - ${inv.invoice_number}`,
        debit: 0,
        credit: vatAmount,
      });
    }

    return lines;
  }

  private async getCurrentFiscalYear(): Promise<string> {
    const { data } = await supabase
      .from('fiscal_years')
      .select('id')
      .eq('company_id', this.companyId)
      .eq('is_current', true)
      .limit(1)
      .single();
    return data?.id || '';
  }
}
