import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Paperclip, Upload, Trash2, FileText, Image, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface JournalAttachmentsProps {
  journalEntryId: string;
}

export function JournalAttachments({ journalEntryId }: JournalAttachmentsProps) {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['journal-attachments', journalEntryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_attachments')
        .select('*')
        .eq('journal_entry_id', journalEntryId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!journalEntryId,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !companyId) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${companyId}/${journalEntryId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('journal-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('journal-attachments')
          .getPublicUrl(filePath);

        await supabase.from('journal_attachments').insert({
          company_id: companyId,
          journal_entry_id: journalEntryId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['journal-attachments', journalEntryId] });
      toast.success('تم رفع المرفقات بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteAttachment = useMutation({
    mutationFn: async (attachment: any) => {
      // Extract path from URL
      const urlParts = attachment.file_url.split('/journal-attachments/');
      if (urlParts[1]) {
        await supabase.storage.from('journal-attachments').remove([urlParts[1]]);
      }
      const { error } = await supabase.from('journal_attachments').delete().eq('id', attachment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-attachments', journalEntryId] });
      toast.success('تم حذف المرفق');
    },
  });

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    if (type?.includes('pdf')) return <FileText className="w-4 h-4 text-destructive" />;
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          المرفقات ({attachments.length})
        </h4>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-1"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            رفع ملف
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">لا توجد مرفقات</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((att: any) => (
            <div key={att.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 hover:bg-muted/50">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(att.file_type)}
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline truncate"
                >
                  {att.file_name}
                </a>
                {att.file_size && (
                  <Badge variant="secondary" className="text-xs shrink-0">{formatSize(att.file_size)}</Badge>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-destructive h-7 w-7"
                onClick={() => deleteAttachment.mutate(att)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
