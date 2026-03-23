import { supabase } from '@/integrations/supabase/client';

export async function invokeParsePurchaseInvoice(body: any) {
  const { data, error } = await supabase.functions.invoke('parse-purchase-invoice', { body });
  if (error) throw error;
  return data;
}

export async function uploadInvoiceAttachment(filePath: string, file: File) {
  const { error } = await supabase.storage.from('invoice-attachments').upload(filePath, file, { cacheControl: '3600', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('invoice-attachments').getPublicUrl(filePath);
  return data.publicUrl;
}
