import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { setGlobalDecimals } from '@/components/financial-statements/utils/numberFormatting';

export type NumberDisplayMode = 'integer' | 'decimal';

async function fetchNumberDisplayMode(companyId: string | null): Promise<NumberDisplayMode> {
  // Try company-specific setting first
  if (companyId) {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'number_display_mode')
      .eq('company_id', companyId)
      .maybeSingle();
    if (data?.value) return data.value as NumberDisplayMode;
  }
  // Fallback to global setting
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'number_display_mode')
    .is('company_id', null)
    .maybeSingle();
  return (data?.value as NumberDisplayMode) || 'integer';
}

export function useNumberFormat() {
  const { companyId } = useCompany();

  const { data: mode = 'integer' } = useQuery({
    queryKey: ['number-display-mode', companyId],
    queryFn: () => fetchNumberDisplayMode(companyId),
  });

  const decimals = mode === 'decimal' ? 2 : 0;

  // Sync global setting for utility functions
  useEffect(() => {
    setGlobalDecimals(decimals);
  }, [decimals]);

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    if (value === 0) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(decimals === 0 ? Math.round(value) : value);
  };

  const formatCurrency = (value: number | null | undefined, currency = 'ر.س'): string => {
    const formatted = formatNumber(value);
    if (formatted === '-') return '-';
    return `${formatted} ${currency}`;
  };

  return { mode, decimals, formatNumber, formatCurrency };
}
