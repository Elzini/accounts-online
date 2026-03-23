import { describe, it, expect } from 'vitest';
import {
  AppError, ValidationError, UnbalancedEntryError,
  AuthenticationError, AuthorizationError,
  CompanyRequiredError, TenantIsolationError,
  NotFoundError, BusinessRuleError, DuplicatePostingError,
  FiscalYearClosedError, AccountResolutionError, DatabaseError,
  getUserMessage, isOperationalError, getErrorCode,
} from '@/core/engine/errors';

describe('Error Classes', () => {
  it('AppError has correct properties', () => {
    const err = new AppError('test', 'TEST_CODE', 400);
    expect(err.code).toBe('TEST_CODE');
    expect(err.httpStatus).toBe(400);
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('ValidationError includes fields', () => {
    const err = new ValidationError('bad input', ['name', 'date']);
    expect(err.fields).toEqual(['name', 'date']);
    expect(err.httpStatus).toBe(400);
  });

  it('UnbalancedEntryError shows amounts', () => {
    const err = new UnbalancedEntryError(1000, 500);
    expect(err.message).toContain('1000.00');
    expect(err.message).toContain('500.00');
  });

  it('NotFoundError includes resource info', () => {
    const err = new NotFoundError('Invoice', 'inv-123');
    expect(err.resourceType).toBe('Invoice');
    expect(err.resourceId).toBe('inv-123');
    expect(err.httpStatus).toBe(404);
  });

  it('DuplicatePostingError is a BusinessRuleError', () => {
    const err = new DuplicatePostingError('ref1', 'je1');
    expect(err instanceof BusinessRuleError).toBe(true);
    expect(err.ruleId).toBe('DUPLICATE_POSTING');
  });

  it('TenantIsolationError is non-operational', () => {
    const err = new TenantIsolationError();
    expect(err.isOperational).toBe(false);
  });

  it('DatabaseError wraps original error stack', () => {
    const original = new Error('pg connection failed');
    const err = new DatabaseError('DB error', original);
    expect(err.stack).toContain('pg connection failed');
  });
});

describe('Error Utilities', () => {
  it('getUserMessage extracts AppError message', () => {
    expect(getUserMessage(new CompanyRequiredError())).toContain('الشركة');
  });

  it('getUserMessage handles plain errors', () => {
    expect(getUserMessage(new Error('oops'))).toBe('oops');
  });

  it('getUserMessage handles non-errors', () => {
    expect(getUserMessage('string')).toBe('حدث خطأ غير متوقع');
  });

  it('isOperationalError returns true for AppError', () => {
    expect(isOperationalError(new AuthenticationError())).toBe(true);
  });

  it('isOperationalError returns false for non-operational', () => {
    expect(isOperationalError(new TenantIsolationError())).toBe(false);
  });

  it('getErrorCode returns correct code', () => {
    expect(getErrorCode(new FiscalYearClosedError('2025'))).toBe('BUSINESS_RULE_VIOLATION');
    expect(getErrorCode(new AccountResolutionError('cash'))).toBe('BUSINESS_RULE_VIOLATION');
    expect(getErrorCode(new AuthorizationError())).toBe('AUTHORIZATION_DENIED');
    expect(getErrorCode('random')).toBe('UNKNOWN_ERROR');
  });
});
