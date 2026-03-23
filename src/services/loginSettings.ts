import { supabase } from '@/integrations/supabase/client';

export async function uploadLoginLogo(filePath: string, file: File) {
  const { error } = await supabase.storage.from('company-assets').upload(filePath, file, { cacheControl: '3600', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('company-assets').getPublicUrl(filePath);
  return data.publicUrl;
}
