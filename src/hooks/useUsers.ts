import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, updateUserPermissions, updateUsername, createUser, deleteUser, UserWithPermissions } from '@/services/users';
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: UserPermission[] }) => 
      updateUserPermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUsername() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, username }: { userId: string; username: string }) => 
      updateUsername(userId, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password, username, permissions }: { 
      email: string; 
      password: string; 
      username: string; 
      permissions: UserPermission[] 
    }) => createUser(email, password, username, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
