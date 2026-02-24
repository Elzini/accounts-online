import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyId } from './useCompanyId';
import { useCallback, useRef } from 'react';

/**
 * Hook for syncing user preferences to the database.
 * Falls back to localStorage when user is not authenticated.
 */
export function useUserPreference<T>(key: string, defaultValue: T) {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const localKey = `pref_${key}`;

  const { data, isLoading } = useQuery({
    queryKey: ['user-preference', key, user?.id, companyId],
    queryFn: async (): Promise<T> => {
      if (!user || !companyId) {
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem(localKey);
          return saved ? JSON.parse(saved) : defaultValue;
        } catch {
          return defaultValue;
        }
      }

      const { data: pref } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .eq('preference_key', key)
        .maybeSingle();

      if (pref?.preference_value != null) {
        return pref.preference_value as T;
      }

      // Try migrating from localStorage
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Save to DB in background
          await supabase.from('user_preferences').upsert({
            user_id: user.id,
            company_id: companyId,
            preference_key: key,
            preference_value: parsed,
          }, { onConflict: 'user_id,company_id,preference_key' });
          return parsed as T;
        }
      } catch {}

      return defaultValue;
    },
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (value: T) => {
      // Always save to localStorage as fallback
      localStorage.setItem(localKey, JSON.stringify(value));

      if (!user || !companyId) return;

      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        company_id: companyId,
        preference_key: key,
        preference_value: value as any,
      }, { onConflict: 'user_id,company_id,preference_key' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preference', key] });
    },
  });

  const setValue = useCallback((value: T) => {
    // Optimistic update
    queryClient.setQueryData(['user-preference', key, user?.id, companyId], value);
    mutation.mutate(value);
  }, [key, user?.id, companyId, mutation, queryClient]);

  return {
    value: data ?? defaultValue,
    setValue,
    isLoading,
  };
}

// ── Dashboard Display Settings ──

export type DashboardDensity = 'compact' | 'comfortable' | 'spacious';
export type GridColumns = 2 | 3 | 4 | 5 | 6;
export type AutoRefreshInterval = 0 | 30 | 60 | 300; // seconds, 0 = off

export interface DashboardDisplaySettings {
  density: DashboardDensity;
  gridColumns: GridColumns;
  kpiColumns: GridColumns;
  autoRefreshInterval: AutoRefreshInterval;
}

const DEFAULT_DISPLAY: DashboardDisplaySettings = {
  density: 'comfortable',
  gridColumns: 4,
  kpiColumns: 4,
  autoRefreshInterval: 0,
};

export function useDashboardDisplay() {
  const { value, setValue, isLoading } = useUserPreference<DashboardDisplaySettings>(
    'dashboard_display',
    DEFAULT_DISPLAY
  );

  const update = useCallback((partial: Partial<DashboardDisplaySettings>) => {
    setValue({ ...value, ...partial });
  }, [value, setValue]);

  return { settings: value, updateSettings: update, isLoading };
}
