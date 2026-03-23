import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus, Events } from '@/core/engine/eventBus';

describe('EventBus', () => {
  beforeEach(() => {
    EventBus.clear();
  });

  it('emits events to subscribers', async () => {
    const handler = vi.fn();
    EventBus.on(Events.JOURNAL_CREATED, handler);

    await EventBus.emit('c1', Events.JOURNAL_CREATED, { entryId: 'e1' });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({
      type: Events.JOURNAL_CREATED,
      companyId: 'c1',
      payload: { entryId: 'e1' },
    });
  });

  it('does not call unsubscribed handlers', async () => {
    const handler = vi.fn();
    const unsub = EventBus.on(Events.JOURNAL_CREATED, handler);
    unsub();

    await EventBus.emit('c1', Events.JOURNAL_CREATED, { entryId: 'e1' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('handles multiple subscribers', async () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    EventBus.on(Events.INVOICE_POSTED, h1);
    EventBus.on(Events.INVOICE_POSTED, h2);

    await EventBus.emit('c1', Events.INVOICE_POSTED, { invoiceId: 'i1' });
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('does not throw when emitting with no subscribers', async () => {
    await expect(EventBus.emit('c1', 'unknown.event', {})).resolves.toBeUndefined();
  });

  it('catches handler errors without stopping other handlers', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const h1 = vi.fn(() => { throw new Error('boom'); });
    const h2 = vi.fn();
    EventBus.on(Events.JOURNAL_CREATED, h1);
    EventBus.on(Events.JOURNAL_CREATED, h2);

    await EventBus.emit('c1', Events.JOURNAL_CREATED, {});
    expect(h2).toHaveBeenCalledOnce();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('clear removes all handlers', async () => {
    const handler = vi.fn();
    EventBus.on(Events.JOURNAL_CREATED, handler);
    EventBus.clear();

    await EventBus.emit('c1', Events.JOURNAL_CREATED, {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('includes timestamp in event', async () => {
    const handler = vi.fn();
    EventBus.on(Events.JOURNAL_CREATED, handler);
    await EventBus.emit('c1', Events.JOURNAL_CREATED, {});

    const event = handler.mock.calls[0][0];
    expect(event.timestamp).toBeDefined();
    expect(new Date(event.timestamp).getTime()).not.toBeNaN();
  });
});
