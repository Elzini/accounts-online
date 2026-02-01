import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchFixedAssets,
  fetchAssetById,
  createFixedAsset,
  updateFixedAsset,
  deleteFixedAsset,
  disposeAsset,
  fetchDepreciationEntries,
  calculateAndRecordDepreciation,
  fetchAssetCategories,
  createAssetCategory,
  getAssetsSummary,
  type FixedAsset,
  type DepreciationEntry,
  type AssetCategory,
  type CreateAssetInput,
} from '@/services/fixedAssets';

export function useFixedAssets() {
  return useQuery({
    queryKey: ['fixed-assets'],
    queryFn: fetchFixedAssets,
  });
}

export function useAssetById(id: string | undefined) {
  return useQuery({
    queryKey: ['fixed-assets', id],
    queryFn: () => id ? fetchAssetById(id) : null,
    enabled: !!id,
  });
}

export function useCreateFixedAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssetInput) => createFixedAsset(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast.success('تم إضافة الأصل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل في إضافة الأصل: ${error.message}`);
    },
  });
}

export function useUpdateFixedAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateAssetInput> }) =>
      updateFixedAsset(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast.success('تم تحديث الأصل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل في تحديث الأصل: ${error.message}`);
    },
  });
}

export function useDeleteFixedAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFixedAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast.success('تم حذف الأصل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل في حذف الأصل: ${error.message}`);
    },
  });
}

export function useDisposeAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, disposalDate, disposalValue, notes }: {
      id: string;
      disposalDate: string;
      disposalValue: number;
      notes?: string;
    }) => disposeAsset(id, disposalDate, disposalValue, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast.success('تم التخلص من الأصل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل في عملية التخلص: ${error.message}`);
    },
  });
}

export function useDepreciationEntries(assetId?: string) {
  return useQuery({
    queryKey: ['depreciation-entries', assetId],
    queryFn: () => fetchDepreciationEntries(assetId),
  });
}

export function useCalculateDepreciation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, periodStart, periodEnd }: {
      assetId: string;
      periodStart: string;
      periodEnd: string;
    }) => calculateAndRecordDepreciation(assetId, periodStart, periodEnd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      queryClient.invalidateQueries({ queryKey: ['depreciation-entries'] });
      toast.success('تم حساب وتسجيل الإهلاك بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل في حساب الإهلاك: ${error.message}`);
    },
  });
}

export function useAssetCategories() {
  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: fetchAssetCategories,
  });
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      default_useful_life?: number;
      default_depreciation_method?: string;
      default_depreciation_rate?: number;
      description?: string;
    }) => createAssetCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('تم إضافة تصنيف الأصول بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل في إضافة التصنيف: ${error.message}`);
    },
  });
}

export function useAssetsSummary() {
  return useQuery({
    queryKey: ['assets-summary'],
    queryFn: getAssetsSummary,
  });
}

export type { FixedAsset, DepreciationEntry, AssetCategory, CreateAssetInput };
