/**
 * Core Engine - Event Bus
 * 
 * Enables decoupled communication between modules.
 * Modules publish events; other modules subscribe without direct dependencies.
 * 
 * Examples:
 *   - InvoicePostingEngine emits 'journal.created' → Audit module logs it
 *   - SalesModule emits 'sale.completed' → Inventory module updates stock
 *   - FiscalYearEngine emits 'fiscal_year.closed' → Reports module caches
 */

export type EventHandler<T = any> = (payload: T) => void | Promise<void>;

export interface AccountingEvent<T = any> {
  type: string;
  timestamp: string;
  companyId: string;
  payload: T;
}

// ============ Standard Event Types ============
export interface JournalCreatedEvent {
  entryId: string;
  referenceType: string;
  referenceId: string | null;
  totalDebit: number;
  totalCredit: number;
}

export interface InvoicePostedEvent {
  invoiceId: string;
  journalEntryId: string;
  invoiceType: string;
  total: number;
}

export interface FiscalYearClosedEvent {
  closedYearId: string;
  newYearId: string;
  openingEntryId: string;
}

// ============ Event Bus Implementation ============
class EventBusClass {
  private handlers = new Map<string, Set<EventHandler>>();

  /**
   * Subscribe to an event type
   * Returns unsubscribe function
   */
  on<T>(eventType: string, handler: EventHandler<AccountingEvent<T>>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Emit an event to all subscribers
   * Errors in handlers are caught and logged (fire-and-forget)
   */
  async emit<T>(companyId: string, eventType: string, payload: T): Promise<void> {
    const event: AccountingEvent<T> = {
      type: eventType,
      timestamp: new Date().toISOString(),
      companyId,
      payload,
    };

    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) return;

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (err) {
        const { Logger: L } = await import('./logger');
        L.error(`EventBus handler failed for "${eventType}"`, err, { module: 'EventBus', companyId });
      }
    });

    await Promise.allSettled(promises);
  }

  /** Remove all handlers (useful for testing) */
  clear(): void {
    this.handlers.clear();
  }
}

/** Singleton event bus */
export const EventBus = new EventBusClass();

// ============ Standard Event Names ============
export const Events = {
  JOURNAL_CREATED: 'journal.created',
  JOURNAL_UPDATED: 'journal.updated',
  JOURNAL_DELETED: 'journal.deleted',
  INVOICE_POSTED: 'invoice.posted',
  INVOICE_APPROVED: 'invoice.approved',
  FISCAL_YEAR_CLOSED: 'fiscal_year.closed',
  FISCAL_YEAR_OPENED: 'fiscal_year.opened',
  ACCOUNT_CREATED: 'account.created',
  ACCOUNT_UPDATED: 'account.updated',
  CONFIG_CHANGED: 'config.changed',
} as const;
