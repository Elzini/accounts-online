import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAppSettings, updateAppSetting, resetDatabase, AppSettings, defaultSettings } from '@/services/settings';
import { fetchCompanySettings } from '@/services/companySettings';
import { useCompany } from '@/contexts/CompanyContext';

export interface MergedSettings extends AppSettings {
  company_logo_url?: string;
  company_welcome_message?: string;
  company_app_name?: string;
  company_app_subtitle?: string;
}

export function useAppSettings() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['app-settings', companyId],
    queryFn: async (): Promise<MergedSettings> => {
      const globalSettings = await fetchAppSettings();
      
      // If user has a company, fetch company-specific settings
      if (companyId) {
        try {
          const companySettings = await fetchCompanySettings(companyId);
          return {
            ...globalSettings,
            // Override with company-specific settings if they exist
            app_name: companySettings.app_name || globalSettings.app_name,
            app_subtitle: companySettings.app_subtitle || globalSettings.app_subtitle,
            welcome_message: companySettings.welcome_message || globalSettings.welcome_message,
            // Keep company-specific values separately for reference
            company_logo_url: companySettings.logo_url,
            company_welcome_message: companySettings.welcome_message,
            company_app_name: companySettings.app_name,
            company_app_subtitle: companySettings.app_subtitle,
          };
        } catch (error) {
          console.error('Error fetching company settings:', error);
          return globalSettings;
        }
      }
      
      return globalSettings;
    },
  });
}

export function useUpdateAppSetting() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => 
      updateAppSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', companyId] });
    },
  });
}

export function useResetDatabase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: resetDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
