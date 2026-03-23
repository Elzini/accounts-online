/**
 * useReportSettings - Fetches report settings from app_settings
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCompany } from '@/contexts/CompanyContext';
import { defaultReportSettings, type ReportSettings } from './reportTypes';

export function useReportSettings() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['report-settings', companyId],
    queryFn: async (): Promise<ReportSettings> => {
      if (!companyId) return defaultReportSettings;

      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('company_id', companyId)
        .like('key', 'report_%');

      if (error) throw error;

      const settings: ReportSettings = { ...defaultReportSettings };
      
      data?.forEach((row) => {
        const key = row.key.replace('report_', '') as keyof ReportSettings;
        if (key in settings) {
          if (typeof settings[key] === 'boolean') {
            (settings as any)[key] = row.value === 'true';
          } else {
            (settings as any)[key] = row.value;
          }
        }
      });

      return settings;
    },
    enabled: !!companyId,
  });
}
