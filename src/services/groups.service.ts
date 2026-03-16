import { SupabaseClient } from '@supabase/supabase-js';

export async function createGroup(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  description?: string
) {
  // Create group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name, description, created_by: userId })
    .select()
    .single();

  if (groupError) throw groupError;

  // Add creator as admin
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'admin' });

  if (memberError) throw memberError;

  return group;
}

export async function listGroups(supabase: SupabaseClient, userId: string, limit: number, offset: number) {
  const { data, error, count } = await supabase
    .from('groups')
    .select('*, group_members!inner(user_id)', { count: 'exact' })
    .eq('group_members.user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, count };
}

export async function getGroup(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateGroup(
  supabase: SupabaseClient,
  groupId: string,
  updates: { name?: string; description?: string | null }
) {
  const { data, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGroup(supabase: SupabaseClient, groupId: string) {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (error) throw error;
}

export async function getGroupMembers(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profiles(id, email, display_name, avatar_url)')
    .eq('group_id', groupId);

  if (error) throw error;
  return data;
}

export async function isGroupMember(supabase: SupabaseClient, groupId: string, userId: string) {
  const { data } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  return !!data;
}

export async function isGroupAdmin(supabase: SupabaseClient, groupId: string, userId: string) {
  const { data } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  return data?.role === 'admin';
}
