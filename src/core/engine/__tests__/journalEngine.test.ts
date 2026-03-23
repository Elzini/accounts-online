import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JournalEngine } from '@/core/engine/journalEngine';
import { PostingMiddleware } from '@/core/engine/postingMiddleware';
import { EventBus } from '@/core/engine/eventBus';
import type { IJournalEntryRepository } from '@/core/engine/repositories';
import type { JournalEntryRecord } from '@/core/engine/types';

function createMockRepo(): IJournalEntryRepository {
  let nextNum = 1;
  return {
    create: vi.fn(async (data) => ({
      id: `je-${nextNum++}`, ...data, entry_number: nextNum - 1,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as JournalEntryRecord)),
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
}

const validInput = {
  company_id: 'c1', fiscal_year_id: 'fy1', entry_date: '2026-06-15',
  description: 'Test entry',
  lines: [
    { account_id: 'a1', description: 'Debit', debit: 500, credit: 0 },
    { account_id: 'a2', description: 'Credit', debit: 0, credit: 500 },
  ],
};

describe('JournalEngine', () => {
  let repo: ReturnType<typeof createMockRepo>;
  let engine: JournalEngine;

  beforeEach(() => {
    PostingMiddleware.clear();
    EventBus.clear();
    repo = createMockRepo();
    engine = new JournalEngine('c1', repo);
  });

  it('creates a valid journal entry', async () => {
    const entry = await engine.createEntry(validInput);
    expect(entry.id).toBeDefined();
    expect(repo.create).toHaveBeenCalledOnce();
    expect(repo.createLines).toHaveBeenCalledOnce();
    expect((repo.createLines as any).mock.calls[0][0]).toHaveLength(2);
  });

  it('rejects unbalanced entry', async () => {
    const bad = { ...validInput, lines: [
      { account_id: 'a1', description: 'D', debit: 500, credit: 0 },
      { account_id: 'a2', description: 'C', debit: 0, credit: 300 },
    ]};
    await expect(engine.createEntry(bad)).rejects.toThrow('unbalanced');
  });

  it('rejects entry with missing company_id', async () => {
    await expect(engine.createEntry({ ...validInput, company_id: '' }))
      .rejects.toThrow('validation failed');
  });

  it('emits JOURNAL_CREATED event', async () => {
    const handler = vi.fn();
    EventBus.on('journal.created', handler);
    await engine.createEntry(validInput);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].payload.totalDebit).toBe(500);
  });

  it('runs pre-hooks before validation', async () => {
    PostingMiddleware.registerPreHook('test', (input) => ({
      ...input, description: 'modified',
    }));
    const entry = await engine.createEntry(validInput);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'modified' })
    );
  });

  it('existsForReference delegates to repo', async () => {
    (repo.findByReference as any).mockResolvedValue('je-99');
    const result = await engine.existsForReference('inv1', ['invoice_purchase']);
    expect(result).toBe('je-99');
  });

  it('replaceLines deletes old and inserts new', async () => {
    await engine.replaceLines('je-1', validInput.lines);
    expect(repo.deleteLines).toHaveBeenCalledWith('je-1');
    expect(repo.createLines).toHaveBeenCalledOnce();
    expect(repo.updateTotals).toHaveBeenCalledWith('je-1', 500, 500);
  });

  it('deleteEntry removes lines then entry', async () => {
    await engine.deleteEntry('je-1');
    expect(repo.deleteLines).toHaveBeenCalledWith('je-1');
    expect(repo.deleteEntry).toHaveBeenCalledWith('je-1');
  });
});
