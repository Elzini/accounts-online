/**
 * Centralized Error Classes
 * 
 * Typed errors for the accounting engine and services.
 * Enables consistent error handling, logging, and user-facing messages.
 */

// ── Base Application Error ──
export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, httpStatus = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ── Validation Errors ──
export class ValidationError extends AppError {
  public readonly fields: string[];

  constructor(message: string, fields: string[] = []) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class UnbalancedEntryError extends ValidationError {
  constructor(totalDebit: number, totalCredit: number) {
    super(
      `القيد غير متوازن: مدين=${totalDebit.toFixed(2)}, دائن=${totalCredit.toFixed(2)}`,
      ['lines'],
    );
    this.name = 'UnbalancedEntryError';
  }
}

// ── Authentication & Authorization ──
export class AuthenticationError extends AppError {
  constructor(message = 'يجب تسجيل الدخول') {
    super(message, 'AUTHENTICATION_REQUIRED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'ليس لديك صلاحية لهذا الإجراء') {
    super(message, 'AUTHORIZATION_DENIED', 403);
    this.name = 'AuthorizationError';
  }
}

// ── Tenant / Company ──
export class CompanyRequiredError extends AppError {
  constructor() {
    super('لم يتم تحديد الشركة', 'COMPANY_REQUIRED', 400);
    this.name = 'CompanyRequiredError';
  }
}

export class TenantIsolationError extends AppError {
  constructor(message = 'انتهاك عزل البيانات') {
    super(message, 'TENANT_ISOLATION_VIOLATION', 403, false);
    this.name = 'TenantIsolationError';
  }
}

// ── Resource Not Found ──
export class NotFoundError extends AppError {
  public readonly resourceType: string;
  public readonly resourceId: string;

  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType} غير موجود (${resourceId})`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

// ── Business Logic ──
export class BusinessRuleError extends AppError {
  public readonly ruleId: string;

  constructor(message: string, ruleId: string) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422);
    this.name = 'BusinessRuleError';
    this.ruleId = ruleId;
  }
}

export class DuplicatePostingError extends BusinessRuleError {
  constructor(referenceId: string, existingEntryId: string) {
    super(
      `قيد مكرر: المرجع ${referenceId} مرتبط بالقيد ${existingEntryId}`,
      'DUPLICATE_POSTING',
    );
    this.name = 'DuplicatePostingError';
  }
}

export class FiscalYearClosedError extends BusinessRuleError {
  constructor(fiscalYearName: string) {
    super(`السنة المالية "${fiscalYearName}" مقفلة`, 'FISCAL_YEAR_CLOSED');
    this.name = 'FiscalYearClosedError';
  }
}

export class AccountResolutionError extends BusinessRuleError {
  constructor(mappingKey: string) {
    super(
      `تعذر تحديد الحساب للربط "${mappingKey}". تأكد من إعداد شجرة الحسابات والربط.`,
      'ACCOUNT_RESOLUTION_FAILED',
    );
    this.name = 'AccountResolutionError';
  }
}

// ── Infrastructure ──
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'DATABASE_ERROR', 500, false);
    this.name = 'DatabaseError';
    if (originalError instanceof Error) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

// ── Error Handler Utility ──

/**
 * Extract a user-friendly message from any error
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return 'حدث خطأ غير متوقع';
}

/**
 * Check if error is operational (expected, can be shown to user)
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) return error.isOperational;
  return false;
}

/**
 * Get error code for programmatic handling
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) return error.code;
  return 'UNKNOWN_ERROR';
}
