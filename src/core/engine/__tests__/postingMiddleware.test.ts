import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostingMiddleware } from '@/core/engine/postingMiddleware';
import type { JournalEntryInput, JournalEntryRecord } from '@/core/engine/types';

const baseInput: JournalEntryInput = {
  company_id: 'c1', fiscal_year_id: 'fy1', entry_date: '2026-01-15',
  description: 'Test', lines: [
    { account_id: 'a1', description: 'D', debit: 100, credit: 0 },
    { account_id: 'a2', description: 'C', debit: 0, credit: 100 },
  ],
};

const baseContext = { companyId: 'c1', companyType: 'general_trading', fiscalYearId: 'fy1' };

const baseRecord: JournalEntryRecord = {
  id: 'je1', company_id: 'c1', fiscal_year_id: 'fy1', entry_number: 1,
  entry_date: '2026-01-15', description: 'Test', is_posted: true,
  total_debit: 100, total_credit: 100, created_at: '', updated_at: '',
};

describe('PostingMiddleware', () => {
  beforeEach(() => PostingMiddleware.clear());

  it('pre-hooks transform input in priority order', async () => {
    PostingMiddleware.registerPreHook('second', (input) => ({
      ...input, description: input.description + '-B',
    }), 200);
    PostingMiddleware.registerPreHook('first', (input) => ({
      ...input, description: input.description + '-A',
    }), 100);

    const result = await PostingMiddleware.runPreHooks(baseInput, baseContext);
    expect(result.description).toBe('Test-A-B');
  });

  it('pre-hook failure throws and stops pipeline', async () => {
    PostingMiddleware.registerPreHook('fail', () => { throw new Error('blocked'); });
    PostingMiddleware.registerPreHook('after', vi.fn((i) => i), 200);

    await expect(PostingMiddleware.runPreHooks(baseInput, baseContext)).rejects.toThrow('blocked');
  });

  it('post-hooks run but errors do not throw', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const h2 = vi.fn();
    PostingMiddleware.registerPostHook('fail', () => { throw new Error('oops'); }, 1);
    PostingMiddleware.registerPostHook('ok', h2, 2);

    await PostingMiddleware.runPostHooks(baseRecord, baseInput, baseContext);
    expect(h2).toHaveBeenCalledOnce();
    errSpy.mockRestore();
  });

  it('unregister removes both pre and post hooks', async () => {
    const hook = vi.fn((i: JournalEntryInput) => i);
    PostingMiddleware.registerPreHook('x', hook);
    PostingMiddleware.registerPostHook('x', vi.fn());
    PostingMiddleware.unregister('x');

    await PostingMiddleware.runPreHooks(baseInput, baseContext);
    expect(hook).not.toHaveBeenCalled();
  });

  it('re-registering same id replaces old hook', async () => {
    PostingMiddleware.registerPreHook('a', (i) => ({ ...i, description: 'old' }));
    PostingMiddleware.registerPreHook('a', (i) => ({ ...i, description: 'new' }));

    const result = await PostingMiddleware.runPreHooks(baseInput, baseContext);
    expect(result.description).toBe('new');
  });
});
