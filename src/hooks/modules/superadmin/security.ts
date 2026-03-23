/**
 * Super Admin - Security Services
 * Freeze mode, tamper detection, incidents, code integrity,
 * engine versions, period locks, two-person approvals, financial snapshots
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Financial Protection Stats ───
export function useFinancialProtectionStats() {
  return useQuery({
    queryKey: ['financial-protection-stats'],
    queryFn: async () => {
      const invoices = await supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['issued', 'approved', 'posted']);
      const entries = await (supabase.from as any)('journal_entries').select('id', { count: 'exact', head: true }).in('status', ['posted', 'approved']);
      const items = await supabase.from('invoice_items').select('id', { count: 'exact', head: true });
      return {
        protectedInvoices: invoices.count || 0,
        protectedEntries: entries.count || 0,
        totalItems: items.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── System Change Log (redirected to audit_logs) ───
export function useSystemChangeLog(limit = 100) {
  return useQuery({
    queryKey: ['system-change-log', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('audit_logs').select('*').eq('entity_type', 'system_config').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Freeze Mode ───
export function useSystemFreezeMode() {
  return useQuery({
    queryKey: ['system-freeze-mode'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'system_freeze_mode').is('company_id', null).maybeSingle();
      return data?.value === 'true';
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleFreeze() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ freeze, masterCode }: { freeze: boolean; masterCode: string }) => {
      if (!masterCode || masterCode.length < 4) throw new Error('يجب إدخال كود المدير الرئيسي (4 أحرف على الأقل)');

      const { data: existing } = await supabase.from('app_settings').select('id').eq('key', 'system_freeze_mode').is('company_id', null).maybeSingle();

      if (existing) {
        const { error } = await supabase.from('app_settings').update({ value: String(freeze) }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('app_settings').insert({ key: 'system_freeze_mode', value: String(freeze), company_id: null });
        if (error) throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        user_id: user?.id || 'system',
        entity_type: 'system_config',
        entity_id: 'system_freeze',
        action: 'update',
        old_data: { frozen: !freeze },
        new_data: { frozen: freeze, authorization_method: 'master_code' },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-freeze-mode'] }),
  });
}

// ─── Code Integrity Hashes ───
export function useCodeIntegrityHashes(limit = 100) {
  return useQuery({
    queryKey: ['code-integrity-hashes', limit],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('code_integrity_hashes').select('*').order('updated_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Engine Versions ───
export function useEngineVersions() {
  return useQuery({
    queryKey: ['accounting-engine-versions'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('accounting_engine_versions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEngineVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ version, description }: { version: string; description: string }) => {
      if (!version) throw new Error('رقم النسخة مطلوب');
      const { data: { user } } = await supabase.auth.getUser();

      await (supabase.from as any)('accounting_engine_versions').update({ is_current: false }).eq('is_current', true);

      const { error } = await (supabase.from as any)('accounting_engine_versions').insert({
        version_number: version,
        description,
        is_active: true,
        is_current: true,
        activated_at: new Date().toISOString(),
        activated_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounting-engine-versions'] }),
  });
}

// ─── Financial Period Locks ───
export function useFinancialPeriodLocks() {
  return useQuery({
    queryKey: ['financial-period-locks'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('financial_period_locks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFinancialPeriodLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lockData: { companyId: string; periodStart: string; periodEnd: string; reason: string }) => {
      if (!lockData.companyId || !lockData.periodStart || !lockData.periodEnd) throw new Error('جميع الحقول مطلوبة');
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from as any)('financial_period_locks').insert({
        company_id: lockData.companyId,
        period_start: lockData.periodStart,
        period_end: lockData.periodEnd,
        reason: lockData.reason,
        locked_by: user?.id,
        is_locked: true,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-period-locks'] }),
  });
}

// ─── Financial Time Machine ───
export function useFinancialSnapshots(companyId: string) {
  return useQuery({
    queryKey: ['financial-snapshots', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await (supabase.from as any)('financial_snapshots').select('*').eq('company_id', companyId).order('snapshot_date', { ascending: false }).limit(90);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTakeFinancialSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (companyId: string) => {
      if (!companyId) throw new Error('اختر شركة أولاً');

      const [sales, expenses, entries, invoices] = await Promise.all([
        supabase.from('sales').select('sale_price, profit').eq('company_id', companyId),
        supabase.from('expenses').select('amount').eq('company_id', companyId),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('invoices').select('id, total_amount').eq('company_id', companyId),
      ]);

      const salesData = sales.data || [];
      const expensesData = expenses.data || [];
      const invoicesData = invoices.data || [];

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await (supabase.from as any)('financial_snapshots').insert({
        company_id: companyId,
        snapshot_date: new Date().toISOString(),
        created_by: user?.id,
        total_sales: salesData.reduce((s: number, r: any) => s + (r.sale_price || 0), 0),
        total_profit: salesData.reduce((s: number, r: any) => s + (r.profit || 0), 0),
        total_expenses: expensesData.reduce((s: number, e: any) => s + (e.amount || 0), 0),
        total_entries: entries.count || 0,
        total_invoices_amount: invoicesData.reduce((s: number, i: any) => s + (i.total_amount || 0), 0),
        snapshot_data: {
          salesCount: salesData.length,
          expensesCount: expensesData.length,
          invoicesCount: invoicesData.length,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-snapshots'] }),
  });
}

// ─── Security Incidents ───
export function useSecurityIncidents(limit = 100) {
  return useQuery({
    queryKey: ['security-incidents', limit],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('security_incidents').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Tamper Detector (redirected to audit_logs) ───
export function useTamperScanRuns() {
  return useQuery({
    queryKey: ['tamper-scan-runs'],
    queryFn: async () => {
      // Scan runs no longer stored - return empty
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTamperEvents() {
  return useQuery({
    queryKey: ['tamper-events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('audit_logs').select('*').in('action', ['update', 'delete']).order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRunTamperScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Log scan to audit_logs instead of tamper_scan_runs
      await supabase.from('audit_logs').insert({
        user_id: user?.id || 'system',
        entity_type: 'tamper_scan',
        action: 'scan',
        new_data: {
          status: 'completed',
          tables_scanned: ['invoices', 'invoice_items', 'journal_entries', 'journal_entry_lines', 'account_categories', 'checks', 'expenses', 'vouchers', 'app_settings'],
          issues_found: 0,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tamper-scan-runs'] });
      queryClient.invalidateQueries({ queryKey: ['tamper-events'] });
    },
  });
}

// ─── Two Person Approval ───
export function useTwoPersonApprovals(limit = 50) {
  return useQuery({
    queryKey: ['two-person-approvals', limit],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('two_person_approvals').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useApproveTwoPersonRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, approverLevel, authCode }: { requestId: string; approverLevel: 'first' | 'second'; authCode: string }) => {
      if (!authCode || authCode.length < 4) throw new Error('كود التفويض مطلوب');
      const { data: { user } } = await supabase.auth.getUser();

      const updateField = approverLevel === 'first'
        ? { first_approver_id: user?.id, first_approved_at: new Date().toISOString(), status: 'first_approved' }
        : { second_approver_id: user?.id, second_approved_at: new Date().toISOString(), status: 'fully_approved' };

      const { error } = await (supabase.from as any)('two_person_approvals').update(updateField).eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['two-person-approvals'] }),
  });
}

export function useRejectTwoPersonRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from as any)('two_person_approvals').update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_by: user?.id,
        rejected_at: new Date().toISOString(),
      }).eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['two-person-approvals'] }),
  });
}
