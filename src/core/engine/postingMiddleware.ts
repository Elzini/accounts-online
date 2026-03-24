/**
 * Core Engine - Posting Middleware
 * 
 * Extensible pipeline for journal entry creation.
 * Modules can register pre/post hooks without modifying the core engine.
 * 
 * Examples:
 *   - Pre-hook: Validate cost center allocation sums to 100%
 *   - Pre-hook: Auto-assign project_id based on account
 *   - Post-hook: Update inventory on COGS entry
 *   - Post-hook: Send notification to accountant
 */

import { JournalEntryInput, JournalEntryRecord } from './types';

export type PrePostHook = (
  input: JournalEntryInput,
  context: PostingContext
) => Promise<JournalEntryInput> | JournalEntryInput;

export type PostHook = (
  entry: JournalEntryRecord,
  input: JournalEntryInput,
  context: PostingContext
) => Promise<void> | void;

export interface PostingContext {
  companyId: string;
  companyType: string;
  fiscalYearId: string;
  userId?: string;
}

class PostingMiddlewareClass {
  private preHooks: Array<{ id: string; priority: number; hook: PrePostHook }> = [];
  private postHooks: Array<{ id: string; priority: number; hook: PostHook }> = [];

  /**
   * Register a pre-posting hook
   * Lower priority runs first (0 = first)
   */
  registerPreHook(id: string, hook: PrePostHook, priority = 100): void {
    // Remove existing with same id
    this.preHooks = this.preHooks.filter(h => h.id !== id);
    this.preHooks.push({ id, priority, hook });
    this.preHooks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Register a post-posting hook
   */
  registerPostHook(id: string, hook: PostHook, priority = 100): void {
    this.postHooks = this.postHooks.filter(h => h.id !== id);
    this.postHooks.push({ id, priority, hook });
    this.postHooks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Run all pre-hooks, transforming the input through the pipeline
   */
  async runPreHooks(input: JournalEntryInput, context: PostingContext): Promise<JournalEntryInput> {
    let result = input;
    for (const { hook, id } of this.preHooks) {
      try {
        result = await hook(result, context);
      } catch (err) {
        const { Logger: L } = await import('./logger');
        L.error(`Pre-hook "${id}" failed`, err, { module: 'PostingMiddleware', companyId: context.companyId });
        throw err; // Pre-hooks are critical — fail the entry
      }
    }
    return result;
  }

  /**
   * Run all post-hooks (fire-and-forget pattern for non-critical)
   */
  async runPostHooks(entry: JournalEntryRecord, input: JournalEntryInput, context: PostingContext): Promise<void> {
    for (const { hook, id } of this.postHooks) {
      try {
        await hook(entry, input, context);
      } catch (err) {
        console.error(`[PostingMiddleware] Post-hook "${id}" failed:`, err);
        // Post-hooks are non-critical — log and continue
      }
    }
  }

  /** Remove a hook by id */
  unregister(id: string): void {
    this.preHooks = this.preHooks.filter(h => h.id !== id);
    this.postHooks = this.postHooks.filter(h => h.id !== id);
  }

  /** Clear all hooks (testing) */
  clear(): void {
    this.preHooks = [];
    this.postHooks = [];
  }
}

/** Singleton posting middleware */
export const PostingMiddleware = new PostingMiddlewareClass();
