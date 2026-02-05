import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicFiscalYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

/**
 * Fetches fiscal years without requiring authentication.
 * Used on the login page before the user is authenticated.
 */
export function usePublicFiscalYears() {
  return useQuery({
    queryKey: ['public-fiscal-years'],
    queryFn: async (): Promise<PublicFiscalYear[]> => {
      const { data, error } = await supabase
        .from('fiscal_years')
        .select('id, name, start_date, end_date, is_current')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching public fiscal years:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
