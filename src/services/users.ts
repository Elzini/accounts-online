import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];

export interface UserWithPermissions {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
  permissions: UserPermission[];
}

export async function fetchUsers(): Promise<UserWithPermissions[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) throw profilesError;

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, permission');

  if (rolesError) throw rolesError;

  return profiles.map(profile => ({
    id: profile.id,
    user_id: profile.user_id,
    username: profile.username,
    created_at: profile.created_at,
    permissions: roles
      .filter(r => r.user_id === profile.user_id)
      .map(r => r.permission),
  }));
}

export async function addUserPermission(userId: string, permission: UserPermission) {
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, permission });
  
  if (error && !error.message.includes('duplicate')) throw error;
}

export async function removeUserPermission(userId: string, permission: UserPermission) {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('permission', permission);
  
  if (error) throw error;
}

export async function updateUserPermissions(userId: string, permissions: UserPermission[]) {
  // Delete all existing permissions
  await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  // Add new permissions
  if (permissions.length > 0) {
    const { error } = await supabase
      .from('user_roles')
      .insert(permissions.map(p => ({ user_id: userId, permission: p })));
    
    if (error) throw error;
  }
}

export async function updateUsername(userId: string, username: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('user_id', userId);
  
  if (error) throw error;
}

export async function deleteUser(userId: string) {
  // Use edge function to delete user (requires service role)
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { userId }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  
  return data;
}

export async function createUser(email: string, password: string, username: string, permissions: UserPermission[]) {
  // Create user using admin API (this requires service role, so we'll use signUp)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username
      }
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error('فشل إنشاء المستخدم');

  // Add permissions for the new user
  if (permissions.length > 0) {
    const { error: permError } = await supabase
      .from('user_roles')
      .insert(permissions.map(p => ({ user_id: data.user!.id, permission: p })));
    
    if (permError) throw permError;
  }

  return data.user;
}
