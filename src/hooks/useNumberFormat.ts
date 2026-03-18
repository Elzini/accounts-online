import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { setGlobalDecimals, setGlobalRounding } from '@/components/financial-statements/utils/numberFormatting';

export type NumberDisplayMode = 'integer' | 'decimal';
export type NumberRoundingMode = 'rounded' | 'precise';

async function fetchSetting(key: string, companyId: string | null, fallback: string): Promise<string> {
  if (companyId) {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .eq('company_id', companyId)
      .maybeSingle();
    if (data?.value) return data.value;
  }
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .is('company_id', null)
    .maybeSingle();
  return data?.value || fallback;
}

export function useNumberFormat() {
  const { companyId } = useCompany();

  const { data: mode = 'integer' } = useQuery({
    queryKey: ['number-display-mode', companyId],
    queryFn: () => fetchSetting('number_display_mode', companyId, 'integer'),
  });

  const { data: rounding = 'rounded' } = useQuery({
    queryKey: ['number-rounding-mode', companyId],
    queryFn: () => fetchSetting('number_rounding_mode', companyId, 'rounded'),
  });

  const decimals = mode === 'decimal' ? 2 : 0;
  const isRounded = rounding === 'rounded';

  // Sync global settings for utility functions
  useEffect(() => {
    setGlobalDecimals(decimals);
  }, [decimals]);

  useEffect(() => {
    setGlobalRounding(isRounded);
  }, [isRounded]);

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    if (value === 0) return '0';
    if (isRounded) {
      const v = Math.round(value);
      return String(v);
    }
    return value.toFixed(decimals || 2);
  };

  const formatCurrency = (value: number | null | undefined, currency = 'ر.س'): string => {
    const formatted = formatNumber(value);
    if (formatted === '-') return '-';
    return `${formatted} ${currency}`;
  };

  return { mode: mode as NumberDisplayMode, rounding: rounding as NumberRoundingMode, decimals, isRounded, formatNumber, formatCurrency };
}
