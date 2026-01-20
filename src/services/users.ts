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

// Helper function to get current user's company_id
async function getCurrentCompanyId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('user_id', user.id)
    .single();
  
  return profile?.company_id || null;
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
  // Get current user's company_id to assign to new user
  const currentCompanyId = await getCurrentCompanyId();
  if (!currentCompanyId) throw new Error('لا يمكن العثور على الشركة الحالية');

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

  // Wait a bit for the trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 500));

  // Update the new user's profile to link to the current company (not create a new one)
  // First, get the profile that was created by the trigger
  const { data: newProfile, error: profileFetchError } = await supabase
    .from('profiles')
    .select('id, company_id')
    .eq('user_id', data.user.id)
    .single();

  if (profileFetchError) {
    console.error('Error fetching new user profile:', profileFetchError);
  }

  // If the trigger created a new company for this user, we need to:
  // 1. Delete that automatically created company (if it was created)
  // 2. Update the profile to point to the correct company
  if (newProfile && newProfile.company_id && newProfile.company_id !== currentCompanyId) {
    const autoCreatedCompanyId = newProfile.company_id;
    
    // Update profile to correct company
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ company_id: currentCompanyId })
      .eq('user_id', data.user.id);
    
    if (updateError) {
      console.error('Error updating profile company_id:', updateError);
    }

    // Delete the auto-created company (only if no other users are using it)
    const { data: otherUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('company_id', autoCreatedCompanyId);
    
    if (!otherUsers || otherUsers.length === 0) {
      // Safe to delete the auto-created company
      await supabase
        .from('companies')
        .delete()
        .eq('id', autoCreatedCompanyId);
    }
  } else if (newProfile && !newProfile.company_id) {
    // Profile exists but no company_id, just update it
    await supabase
      .from('profiles')
      .update({ company_id: currentCompanyId })
      .eq('user_id', data.user.id);
  }

  // Clear any auto-assigned permissions and add the ones we want
  await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', data.user.id);

  // Add permissions for the new user
  if (permissions.length > 0) {
    const { error: permError } = await supabase
      .from('user_roles')
      .insert(permissions.map(p => ({ user_id: data.user!.id, permission: p })));
    
    if (permError) throw permError;
  }

  return data.user;
}
