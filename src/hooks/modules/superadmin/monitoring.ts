/**
 * Super Admin - System Monitoring & SaaS Services
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, untypedFrom } from '@/integrations/supabase/untypedFrom';

// ─── System Monitoring ───
export function useSystemMonitoringStats() {
  return useQuery({
    queryKey: ['system-monitoring-real'],
    queryFn: async () => {
      const [companiesRes, profilesRes, journalsRes, salesRes, invoicesRes, checksRes, expensesRes, customersRes, suppliersRes, carsRes] = await Promise.all([
        supabase.from('companies').select('id, database_size_mb, api_calls_count, is_active, last_activity_at', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }),
        supabase.from('sales').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('checks').select('id', { count: 'exact', head: true }),
        supabase.from('expenses').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('cars').select('id', { count: 'exact', head: true }),
      ]);

      const companies = companiesRes.data || [];
      const totalDbSize = companies.reduce((s, c) => s + Number((c as any).database_size_mb || 0), 0);
      const totalApiCalls = companies.reduce((s, c) => s + Number((c as any).api_calls_count || 0), 0);
      const activeCompanies = companies.filter(c => c.is_active).length;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const activeRecently = companies.filter(c => (c as any).last_activity_at && (c as any).last_activity_at > oneDayAgo).length;

      return {
        totalCompanies: companiesRes.count || 0,
        activeCompanies,
        activeRecently,
        totalUsers: profilesRes.count || 0,
        totalJournals: journalsRes.count || 0,
        totalSales: salesRes.count || 0,
        totalInvoices: invoicesRes.count || 0,
        totalChecks: checksRes.count || 0,
        totalExpenses: expensesRes.count || 0,
        totalCustomers: customersRes.count || 0,
        totalSuppliers: suppliersRes.count || 0,
        totalCars: carsRes.count || 0,
        totalDbSize,
        totalApiCalls,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentSystemErrors() {
  return useQuery({
    queryKey: ['system-recent-errors'],
    queryFn: async () => {
      const { data } = await untypedFrom('system_activity_logs').select('*').order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
    refetchInterval: 60000,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Sensitive Operations Log (redirected to audit_logs) ───
export function useSensitiveOperationsLog(limit = 200) {
  return useQuery({
    queryKey: ['all-sensitive-operations', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('audit_logs').select('*').in('action', ['delete', 'update']).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Central Alerts ───
export function useCentralAlerts(limit = 100) {
  return useQuery({
    queryKey: ['central-smart-alerts', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Backups ───
export function useAllBackups(limit = 100) {
  return useQuery({
    queryKey: ['all-backups', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('backups').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllBackupSchedules() {
  return useQuery({
    queryKey: ['all-backup-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('backup_schedules').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── SaaS Dashboard ───
export function useRevenueSubscriptions() {
  return useQuery({
    queryKey: ['saas-subscriptions-revenue'],
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('*, companies(name)').order('end_date', { ascending: true });
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaaSMonthlyGrowth() {
  return useQuery({
    queryKey: ['saas-monthly-growth'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('created_at').order('created_at');
      if (!data) return [];

      const monthMap: Record<string, number> = {};
      data.forEach(c => {
        const month = c.created_at.substring(0, 7);
        monthMap[month] = (monthMap[month] || 0) + 1;
      });

      let cumulative = 0;
      return Object.entries(monthMap).map(([month, count]) => {
        cumulative += count;
        return { month: month.substring(5), companies: cumulative, newCompanies: count };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaaSPlanDistribution() {
  return useQuery({
    queryKey: ['saas-plan-distribution'],
    queryFn: async () => {
      const { data } = await untypedFrom('subscriptions').select('plan_id, companies(name)').eq('is_active', true);
      if (!data) return [];

      const planMap: Record<string, number> = {};
      data.forEach((s: any) => {
        const plan = s.plan_id || 'free';
        planMap[plan] = (planMap[plan] || 0) + 1;
      });

      return Object.entries(planMap).map(([name, value]) => ({ name, value }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Support Center ───
export function useSupportTickets() {
  return useQuery({
    queryKey: ['support-tickets-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('support_tickets').select('*, companies(name)').order('created_at', { ascending: false });
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'resolved' || status === 'closed') updates.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support-tickets-admin'] }),
  });
}
