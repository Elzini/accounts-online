import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import {
  getBackups,
  getBackupSchedule,
  createBackup,
  deleteBackup,
  restoreBackup,
  updateBackupSchedule,
  downloadBackupAsJson,
  Backup,
  BackupSchedule
} from '@/services/backups';

export function useBackups() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['backups', companyId],
    queryFn: () => getBackups(companyId!),
    enabled: !!companyId
  });
}

export function useBackupSchedule() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['backup-schedule', companyId],
    queryFn: () => getBackupSchedule(companyId!),
    enabled: !!companyId
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createBackup(companyId!, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups', companyId] });
      toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
    },
    onError: (error) => {
      toast.error('فشل إنشاء النسخة الاحتياطية: ' + (error as Error).message);
    }
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (backupId: string) => deleteBackup(backupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups', companyId] });
      toast.success('تم حذف النسخة الاحتياطية');
    },
    onError: (error) => {
      toast.error('فشل حذف النسخة الاحتياطية: ' + (error as Error).message);
    }
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (backupId: string) => restoreBackup(backupId, companyId!),
    onSuccess: () => {
      // Invalidate all data queries
      queryClient.invalidateQueries();
      toast.success('تم استعادة النسخة الاحتياطية بنجاح');
    },
    onError: (error) => {
      toast.error('فشل استعادة النسخة الاحتياطية: ' + (error as Error).message);
    }
  });
}

export function useUpdateBackupSchedule() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (schedule: Partial<BackupSchedule>) =>
      updateBackupSchedule(companyId!, schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-schedule', companyId] });
      toast.success('تم تحديث إعدادات النسخ الاحتياطي');
    },
    onError: (error) => {
      toast.error('فشل تحديث الإعدادات: ' + (error as Error).message);
    }
  });
}

export function useDownloadBackup() {
  return useMutation({
    mutationFn: (backup: Backup) => {
      downloadBackupAsJson(backup);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success('جاري تحميل النسخة الاحتياطية');
    },
    onError: (error) => {
      toast.error('فشل تحميل النسخة: ' + (error as Error).message);
    }
  });
}
