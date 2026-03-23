/**
 * System Change Alerts Hook
 * STUB: The underlying table was removed during schema cleanup.
 * This hook returns empty state for backward compatibility.
 */

import { useState, useCallback } from 'react';

export interface SystemChangeAlert {
  id: string;
  change_type: string;
  affected_module: string;
  description: string;
  request_source: string;
  previous_value: any;
  new_value: any;
  affected_tables: string[];
  impact_analysis: any;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type SecurityStatus = 'normal' | 'warning' | 'frozen';

export function useSystemChangeAlerts() {
  const [newAlert, setNewAlert] = useState<SystemChangeAlert | null>(null);
  const dismissNewAlert = useCallback(() => setNewAlert(null), []);

  return {
    alerts: [] as SystemChangeAlert[],
    pendingAlerts: [] as SystemChangeAlert[],
    approvedAlerts: [] as SystemChangeAlert[],
    rejectedAlerts: [] as SystemChangeAlert[],
    newAlert,
    dismissNewAlert,
    approveAlert: { mutateAsync: async (_args?: any) => {}, mutate: (_args?: any) => {}, isPending: false },
    rejectAlert: { mutateAsync: async (_args?: any) => {}, mutate: (_args?: any) => {}, isPending: false },
    isLoading: false,
    isFrozen: false,
    securityStatus: 'normal' as SecurityStatus,
  };
}
