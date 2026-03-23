/**
 * Core Accounting Engine - Journal Entry Engine (v2)
 * 
 * Uses repository interfaces + EventBus + PostingMiddleware.
 * Industry-agnostic — works for any company type.
 */

import { JournalEntryInput, JournalEntryRecord } from './types';
import { IJournalEntryRepository } from './repositories';
import { validateJournalEntry } from './validation';
import { EventBus, Events, JournalCreatedEvent } from './eventBus';
import { PostingMiddleware, PostingContext } from './postingMiddleware';

export class JournalEngine {
  private repo: IJournalEntryRepository | null;

  constructor(
    private companyId: string,
    repo?: IJournalEntryRepository,
  ) {
    this.repo = repo || null;
  }

  /** Get repository (lazy-load fallback) */
  private async getRepo(): Promise<IJournalEntryRepository> {
    if (this.repo) return this.repo;
    const { defaultRepos } = await import('./supabaseRepositories');
    this.repo = defaultRepos.journalEntries;
    return this.repo;
  }

  /** Create and optionally post a journal entry with full validation */
  async createEntry(
    input: JournalEntryInput,
    context?: Partial<PostingContext>,
  ): Promise<JournalEntryRecord> {
    const repo = await this.getRepo();

    // Build posting context
    const ctx: PostingContext = {
      companyId: this.companyId,
      companyType: context?.companyType || 'general_trading',
      fiscalYearId: input.fiscal_year_id,
      userId: context?.userId,
    };

    // Run pre-hooks (middleware pipeline)
    let processedInput = input;
    try {
      processedInput = await PostingMiddleware.runPreHooks(input, ctx);
    } catch (err) {
      // Pre-hook failure is critical
      throw err;
    }

    // Validate
    const validation = validateJournalEntry(processedInput);
    if (!validation.valid) {
      throw new Error(`Journal entry validation failed: ${validation.errors.join('; ')}`);
    }

    const totalDebit = processedInput.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = processedInput.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    // Insert entry header
    const entry = await repo.create({
      company_id: processedInput.company_id,
      fiscal_year_id: processedInput.fiscal_year_id,
      entry_date: processedInput.entry_date,
      description: processedInput.description,
      reference_type: processedInput.reference_type || 'manual',
      reference_id: processedInput.reference_id || null,
      is_posted: processedInput.is_posted ?? true,
      total_debit: totalDebit,
      total_credit: totalCredit,
    });

    // Insert lines
    await repo.createLines(processedInput.lines.map(line => ({
      journal_entry_id: entry.id,
      account_id: line.account_id,
      description: line.description || null,
      debit: line.debit || 0,
      credit: line.credit || 0,
      cost_center_id: line.cost_center_id || null,
    })));

    // Emit event
    await EventBus.emit<JournalCreatedEvent>(this.companyId, Events.JOURNAL_CREATED, {
      entryId: entry.id,
      referenceType: processedInput.reference_type || 'manual',
      referenceId: processedInput.reference_id || null,
      totalDebit,
      totalCredit,
    });

    // Run post-hooks (non-critical)
    await PostingMiddleware.runPostHooks(entry, processedInput, ctx);

    return entry;
  }

  /** Check if a journal entry already exists for a reference */
  async existsForReference(referenceId: string, referenceTypes: string[]): Promise<string | null> {
    const repo = await this.getRepo();
    return repo.findByReference(this.companyId, referenceId, referenceTypes);
  }

  /** Delete all lines and re-insert (for entry updates) */
  async replaceLines(entryId: string, lines: JournalEntryInput['lines']): Promise<void> {
    const repo = await this.getRepo();
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    await repo.updateTotals(entryId, totalDebit, totalCredit);
    await repo.deleteLines(entryId);
    await repo.createLines(lines.map(l => ({
      journal_entry_id: entryId,
      account_id: l.account_id,
      description: l.description || null,
      debit: l.debit || 0,
      credit: l.credit || 0,
      cost_center_id: l.cost_center_id || null,
    })));

    await EventBus.emit(this.companyId, Events.JOURNAL_UPDATED, { entryId, totalDebit, totalCredit });
  }

  /** Delete a journal entry and its lines */
  async deleteEntry(entryId: string): Promise<void> {
    const repo = await this.getRepo();
    await repo.deleteLines(entryId);
    await repo.deleteEntry(entryId);
  }

  /** Delete journal entries by reference */
  async deleteByReference(referenceId: string, referenceType: string): Promise<void> {
    const repo = await this.getRepo();
    await repo.deleteByReference(this.companyId, referenceId, referenceType);
  }
}
