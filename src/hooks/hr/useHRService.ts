/**
 * HR Service Hooks
 * Centralized data access for HR modules: Leaves, Attendance, OrgStructure, Checks,
 * Contracts, Fingerprint Devices, Attendance Reports, Device Logs.
 */
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Leaves ──
export function useLeaves(companyId: string | null) {
  return useQuery({
    queryKey: ['leaves', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('employee_leaves').select('*, employees(name)')
        .eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useCreateLeave(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { employee_id: string; leave_type: string; start_date: string; end_date: string; days_count: number; reason?: string | null }) => {
      const { error } = await supabase.from('employee_leaves').insert({ company_id: companyId!, ...row });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('employee_leaves').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
  });
}

// ── Attendance ──
export function useAttendance(companyId: string | null, date: string) {
  return useQuery({
    queryKey: ['attendance', companyId, date],
    queryFn: async () => {
      const { data, error } = await supabase.from('employee_attendance')
        .select('*, employees(name, job_title), hr_fingerprint_devices(device_name)')
        .eq('company_id', companyId!).eq('date', date).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useCreateAttendance(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { employee_id: string; date: string; check_in?: string | null; check_out?: string | null; status: string; overtime_hours?: number; notes?: string | null }) => {
      const { error } = await supabase.from('employee_attendance').insert({ company_id: companyId!, ...row });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

// ── Checks / Cheques ──
export function useChecks(companyId: string | null, checkType: 'received' | 'issued') {
  return useQuery({
    queryKey: ['checks', companyId, checkType],
    queryFn: async () => {
      const { data, error } = await supabase.from('checks').select('*')
        .eq('company_id', companyId!).eq('check_type', checkType).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useCreateCheck(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { check_number: string; check_type: string; amount: number; issue_date: string; due_date: string; bank_name?: string; drawer_name?: string; payee_name?: string; notes?: string; fiscal_year_id?: string | null }) => {
      const { error } = await supabase.from('checks').insert({ company_id: companyId!, ...row });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checks'] }),
  });
}

export function useUpdateCheckStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('checks').update({ status, status_date: new Date().toISOString().split('T')[0] }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checks'] }),
  });
}

// ── Org Structure (departments table) ──
export function useDepartments(companyId: string | null) {
  return useQuery({
    queryKey: ['departments', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*')
        .eq('company_id', companyId!).order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useCreateDepartment(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { name: string; manager_name?: string | null; description?: string | null; is_active?: boolean }) => {
      const { error } = await supabase.from('departments').insert({ company_id: companyId!, ...row });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

// ── Holidays (hr_holidays table) ──
export function useHolidays(companyId: string | null) {
  return useQuery({
    queryKey: ['holidays', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hr_holidays').select('*')
        .eq('company_id', companyId!).order('holiday_date');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useCreateHoliday(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { name: string; holiday_date: string; end_date?: string | null; is_recurring?: boolean }) => {
      const { error } = await supabase.from('hr_holidays').insert({ company_id: companyId!, ...row });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hr_holidays').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });
}

// ── Work Schedules ──
export function useWorkSchedules(companyId: string | null) {
  return useQuery({
    queryKey: ['work-schedules', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hr_work_schedules').select('*')
        .eq('company_id', companyId!).order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useSaveWorkSchedule(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...row }: { id?: string; name: string; start_time: string; end_time: string; work_days: string[]; break_duration_minutes: number; late_tolerance_minutes: number; early_leave_tolerance_minutes: number; overtime_after_minutes: number; is_default: boolean }) => {
      if (id) {
        const { error } = await supabase.from('hr_work_schedules').update(row).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hr_work_schedules').insert({ company_id: companyId!, ...row });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work-schedules'] }),
  });
}

export function useDeleteWorkSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hr_work_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work-schedules'] }),
  });
}
