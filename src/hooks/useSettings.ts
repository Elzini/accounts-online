import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAppSettings, updateAppSetting, resetDatabase, AppSettings } from '@/services/settings';

export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: fetchAppSettings,
  });
}

export function useUpdateAppSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => 
      updateAppSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
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
