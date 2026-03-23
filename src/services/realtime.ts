import { supabase } from '@/integrations/supabase/client';

/** Realtime channel helper - centralizes supabase realtime subscriptions */
export function subscribeToTable(
  channelName: string,
  table: string,
  filter: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: () => void
) {
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes' as any, { event, schema: 'public', table, filter }, callback)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
