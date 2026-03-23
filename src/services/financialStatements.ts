/**
 * Financial Statements Service - Edge function calls
 */
import { supabase } from '@/integrations/supabase/client';

export async function parseMedadExcelViaEdge(sheetNames: string[], sheets: Record<string, any[][]>) {
  const { data, error } = await supabase.functions.invoke('parse-medad-excel', {
    body: { sheetNames, sheets },
  });
  if (error) throw error;
  return data;
}
