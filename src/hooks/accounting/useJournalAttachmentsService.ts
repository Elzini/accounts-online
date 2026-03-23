/**
 * Journal Attachments Service Hook
 * Centralized data access for journal entry attachments.
 */
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useJournalAttachmentsList(journalEntryId: string | null) {
  return useQuery({
    queryKey: ['journal-attachments', journalEntryId],
    queryFn: async () => {
      const { data, error } = await supabase.from('journal_attachments').select('*')
        .eq('journal_entry_id', journalEntryId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!journalEntryId,
  });
}

export function useUploadJournalAttachment(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ journalEntryId, file }: { journalEntryId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${companyId}/${journalEntryId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('journal-attachments').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('journal-attachments').getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('journal_attachments').insert({
        journal_entry_id: journalEntryId,
        company_id: companyId!,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
      });
      if (dbError) throw dbError;
    },
    onSuccess: (_, { journalEntryId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-attachments', journalEntryId] });
    },
  });
}

export function useDeleteJournalAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileUrl, journalEntryId }: { id: string; fileUrl: string; journalEntryId: string }) => {
      // Extract storage path from URL
      const path = fileUrl.split('/journal-attachments/').pop();
      if (path) {
        await supabase.storage.from('journal-attachments').remove([path]);
      }
      const { error } = await supabase.from('journal_attachments').delete().eq('id', id);
      if (error) throw error;
      return journalEntryId;
    },
    onSuccess: (journalEntryId) => {
      queryClient.invalidateQueries({ queryKey: ['journal-attachments', journalEntryId] });
    },
  });
}
