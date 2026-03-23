/**
 * System Control - Custom Reports CRUD
 * STUB: custom_reports table removed during schema cleanup.
 */
import type { CustomReport } from './types';

export async function fetchCustomReports(_companyId: string): Promise<CustomReport[]> {
  return [];
}

export async function createCustomReport(_companyId: string, _report: Partial<CustomReport>): Promise<CustomReport> {
  throw new Error('Custom reports feature is being redesigned');
}

export async function updateCustomReport(_id: string, _updates: Partial<CustomReport>): Promise<void> {
  throw new Error('Custom reports feature is being redesigned');
}

export async function deleteCustomReport(_id: string): Promise<void> {
  throw new Error('Custom reports feature is being redesigned');
}
