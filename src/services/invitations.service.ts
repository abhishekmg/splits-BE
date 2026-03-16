import { SupabaseClient } from '@supabase/supabase-js';

export async function sendInvitation(
  supabase: SupabaseClient,
  groupId: string,
  invitedBy: string,
  email: string
) {
  // Check if user is already a member
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (profile) {
    const { data: existing } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', profile.id)
      .single();

    if (existing) {
      throw new Error('User is already a member of this group');
    }
  }

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      group_id: groupId,
      invited_by: invitedBy,
      invited_email: email,
      invited_user_id: profile?.id ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A pending invitation already exists for this email in this group');
    }
    throw error;
  }
  return data;
}

export async function getPendingInvitations(supabase: SupabaseClient, userId: string, email: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*, groups(id, name, description)')
    .or(`invited_user_id.eq.${userId},invited_email.eq.${email}`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function respondToInvitation(
  supabase: SupabaseClient,
  invitationId: string,
  userId: string,
  status: 'accepted' | 'declined'
) {
  // Get invitation
  const { data: invitation, error: fetchError } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .single();

  if (fetchError || !invitation) throw new Error('Invitation not found');
  if (invitation.status !== 'pending') throw new Error('Invitation already responded to');

  // Update invitation
  const { data, error } = await supabase
    .from('invitations')
    .update({ status, responded_at: new Date().toISOString(), invited_user_id: userId })
    .eq('id', invitationId)
    .select()
    .single();

  if (error) throw error;

  // If accepted, add to group
  if (status === 'accepted') {
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: invitation.group_id, user_id: userId, role: 'member' });

    if (memberError) throw memberError;
  }

  return data;
}
