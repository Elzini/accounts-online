/**
 * Super Admin - User & RBAC Management Services
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAllUsers() {
  return useQuery({
    queryKey: ['all-users-management'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*, companies(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      const { error } = await supabase.from('profiles').update({ permissions } as any).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users-management'] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users-management'] }),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users-rbac'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('admin_users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: { email: string; role: string; full_name: string }) => {
      const { error } = await (supabase.from as any)('admin_users').insert({ ...user, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users-rbac'] }),
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)('admin_users').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users-rbac'] }),
  });
}
