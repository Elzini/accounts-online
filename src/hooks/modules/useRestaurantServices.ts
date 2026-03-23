/**
 * Restaurant Module - Service Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRestaurantTables(companyId: string | null) {
  return useQuery({
    queryKey: ['restaurant-tables', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('restaurant_tables').select('*').eq('company_id', companyId!).order('table_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useRestaurantOrders(companyId: string | null) {
  return useQuery({
    queryKey: ['restaurant-orders', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('restaurant_orders').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useKitchenOrders(companyId: string | null) {
  return useQuery({
    queryKey: ['kitchen-orders', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('restaurant_orders').select('*').eq('company_id', companyId!).in('status', ['new', 'preparing']).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    refetchInterval: 10000,
  });
}

export function useMenuItems(companyId: string | null) {
  return useQuery({
    queryKey: ['menu-items', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('restaurant_menu_items').select('*').eq('company_id', companyId!).order('category', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useCreateMenuItem(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { name: string; category: string; price: number; cost: number; description?: string }) => {
      const { error } = await (supabase as any).from('restaurant_menu_items').insert({ company_id: companyId!, ...form, is_available: true });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('restaurant_menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  });
}

export function useToggleMenuItemAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await (supabase as any).from('restaurant_menu_items').update({ is_available }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  });
}
