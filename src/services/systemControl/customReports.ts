/**
 * System Control - Custom Reports CRUD
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import type { CustomReport, ReportColumn, ReportFilter, ReportGrouping, ReportSorting, ReportStyling } from './types';

export async function fetchCustomReports(companyId: string): Promise<CustomReport[]> {
  const { data, error } = await supabase
    .from('custom_reports')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(row => ({
    ...row,
    report_type: row.report_type as 'table' | 'chart' | 'summary',
    columns: (row.columns || []) as unknown as ReportColumn[],
    filters: (row.filters || []) as unknown as ReportFilter[],
    grouping: (row.grouping || []) as unknown as ReportGrouping[],
    sorting: (row.sorting || []) as unknown as ReportSorting[],
    styling: (row.styling || {}) as unknown as ReportStyling,
  }));
}

export async function createCustomReport(report: Omit<CustomReport, 'id' | 'created_at' | 'updated_at'>): Promise<CustomReport> {
  const { data, error } = await supabase
    .from('custom_reports' as any)
    .insert({
      company_id: report.company_id,
      name: report.name,
      description: report.description,
      report_type: report.report_type,
      source_table: report.source_table,
      columns: report.columns,
      filters: report.filters,
      grouping: report.grouping,
      sorting: report.sorting,
      styling: report.styling,
      is_active: report.is_active,
    } as any)
    .select()
    .single();

  if (error) throw error;
  const result = data as any;
  return {
    ...result,
    report_type: result.report_type as 'table' | 'chart' | 'summary',
    columns: (result.columns || []) as ReportColumn[],
    filters: (result.filters || []) as ReportFilter[],
    grouping: (result.grouping || []) as ReportGrouping[],
    sorting: (result.sorting || []) as ReportSorting[],
    styling: (result.styling || {}) as ReportStyling,
  };
}

export async function updateCustomReport(id: string, updates: Partial<CustomReport>): Promise<void> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.report_type !== undefined) updateData.report_type = updates.report_type;
  if (updates.source_table !== undefined) updateData.source_table = updates.source_table;
  if (updates.columns !== undefined) updateData.columns = updates.columns as unknown as object[];
  if (updates.filters !== undefined) updateData.filters = updates.filters as unknown as object[];
  if (updates.grouping !== undefined) updateData.grouping = updates.grouping as unknown as object[];
  if (updates.sorting !== undefined) updateData.sorting = updates.sorting as unknown as object[];
  if (updates.styling !== undefined) updateData.styling = updates.styling as unknown as object;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

  const { error } = await supabase
    .from('custom_reports')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCustomReport(id: string): Promise<void> {
  const { error } = await supabase
    .from('custom_reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
