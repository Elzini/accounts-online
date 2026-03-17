import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SystemChangeAlert {
  id: string;
  change_type: string;
  affected_module: string;
  description: string;
  request_source: string;
  previous_value: any;
  new_value: any;
  affected_tables: string[];
  impact_analysis: {
    sales_invoices: number;
    purchase_invoices: number;
    journal_entries: number;
    account_balances_affected: number;
    trial_balance_impact: string;
    vat_reports_impact: string;
  } | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSystemChangeAlerts() {
  const queryClient = useQueryClient();
  const [newAlert, setNewAlert] = useState<SystemChangeAlert | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['system-change-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_change_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as SystemChangeAlert[];
    },
    staleTime: 1000 * 30,
  });

  const pendingAlerts = alerts.filter(a => a.status === 'pending');

  // Real-time listener
  useEffect(() => {
    const channel = supabase
      .channel('system-change-alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_change_alerts' },
        (payload) => {
          const alert = payload.new as SystemChangeAlert;
          setNewAlert(alert);
          queryClient.invalidateQueries({ queryKey: ['system-change-alerts'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const approveAlert = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { error } = await supabase
        .from('system_change_alerts')
        .update({
          status: 'approved',
          reviewed_by: (await supabase.auth.getUser()).data.user?.email || 'unknown',
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-change-alerts'] }),
  });

  const rejectAlert = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { error } = await supabase
        .from('system_change_alerts')
        .update({
          status: 'rejected',
          reviewed_by: (await supabase.auth.getUser()).data.user?.email || 'unknown',
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-change-alerts'] }),
  });

  const dismissNewAlert = useCallback(() => setNewAlert(null), []);

  return {
    alerts,
    pendingAlerts,
    newAlert,
    dismissNewAlert,
    approveAlert,
    rejectAlert,
    isLoading,
  };
}
