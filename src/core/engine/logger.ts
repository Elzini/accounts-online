/**
 * Core Engine - Structured Logger
 * 
 * Centralized logging for the accounting engine.
 * Replaces scattered console.error/log with structured, contextual logging.
 * 
 * Features:
 *   - Log levels (debug, info, warn, error)
 *   - Automatic context injection (companyId, operation, timestamp)
 *   - Operation tracing with duration measurement
 *   - Pluggable transport (console now, remote later)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  companyId?: string;
  operation?: string;
  module?: string;
  referenceId?: string;
  referenceType?: string;
  durationMs?: number;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: string;
  error?: Error;
}

type LogTransport = (entry: LogEntry) => void;

// ── Default Console Transport ──
const consoleTransport: LogTransport = (entry) => {
  const prefix = `[${entry.context.module || 'Engine'}]`;
  const ctx = entry.context.companyId
    ? ` (company=${entry.context.companyId.substring(0, 8)}…)`
    : '';
  const duration = entry.context.durationMs != null
    ? ` [${entry.context.durationMs}ms]`
    : '';
  const msg = `${prefix}${ctx}${duration} ${entry.message}`;

  switch (entry.level) {
    case 'debug':
      if (import.meta.env.DEV) console.debug(msg, entry.context);
      break;
    case 'info':
      console.info(msg);
      break;
    case 'warn':
      console.warn(msg, entry.context);
      break;
    case 'error':
      console.error(msg, entry.error || entry.context);
      break;
  }
};

// ── Logger Class ──
class EngineLogger {
  private transports: LogTransport[] = [consoleTransport];
  private minLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'info';

  private readonly levelOrder: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  /** Add a custom transport (e.g., remote logging service) */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /** Set minimum log level */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    if (this.levelOrder[level] < this.levelOrder[this.minLevel]) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      error,
    };

    for (const transport of this.transports) {
      try {
        transport(entry);
      } catch {
        // Transport failure should never crash the engine
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    this.log('error', message, context, err);
  }

  /**
   * Create a scoped logger with pre-filled context
   */
  scope(baseContext: LogContext): ScopedLogger {
    return new ScopedLogger(this, baseContext);
  }

  /**
   * Trace an async operation with automatic duration measurement
   */
  async trace<T>(
    operation: string,
    context: LogContext,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = performance.now();
    this.debug(`${operation} started`, { ...context, operation });

    try {
      const result = await fn();
      const durationMs = Math.round(performance.now() - start);
      this.info(`${operation} completed`, { ...context, operation, durationMs });
      return result;
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      this.error(`${operation} failed`, err, { ...context, operation, durationMs });
      throw err;
    }
  }
}

// ── Scoped Logger ──
class ScopedLogger {
  constructor(
    private parent: EngineLogger,
    private baseContext: LogContext,
  ) {}

  private merge(ctx?: LogContext): LogContext {
    return { ...this.baseContext, ...ctx };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.merge(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.merge(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.merge(context));
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    this.parent.error(message, error, this.merge(context));
  }

  async trace<T>(operation: string, fn: () => Promise<T>, extra?: LogContext): Promise<T> {
    return this.parent.trace(operation, this.merge(extra), fn);
  }
}

/** Singleton engine logger */
export const Logger = new EngineLogger();

export type { ScopedLogger };
