import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getImportedInvoiceData, 
  saveImportedInvoiceData, 
  deleteImportedInvoiceData,
  ImportedInvoiceItem,
  ImportedInvoiceData
} from '@/services/importedInvoiceData';
import { useCompanyId } from './useCompanyId';

export function useImportedInvoiceData() {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: ['importedInvoiceData', companyId],
    queryFn: () => getImportedInvoiceData(companyId!),
    enabled: !!companyId,
  });
}

export function useSaveImportedInvoiceData() {
  const queryClient = useQueryClient();
  const companyId = useCompanyId();

  return useMutation({
    mutationFn: ({ name, items, fileName }: { name: string; items: ImportedInvoiceItem[]; fileName?: string }) =>
      saveImportedInvoiceData(companyId!, name, items, fileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['importedInvoiceData'] });
    },
  });
}

export function useDeleteImportedInvoiceData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteImportedInvoiceData(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['importedInvoiceData'] });
    },
  });
}

export type { ImportedInvoiceData, ImportedInvoiceItem };
