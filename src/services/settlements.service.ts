import { SupabaseClient } from '@supabase/supabase-js';

export async function createSettlement(
  supabase: SupabaseClient,
  paidBy: string,
  paidTo: string,
  amount: number,
  currency: string,
  note?: string
) {
  const { data, error } = await supabase
    .from('settlements')
    .insert({ paid_by: paidBy, paid_to: paidTo, amount, currency, note })
    .select('*, payer:profiles!paid_by(id, email, display_name), payee:profiles!paid_to(id, email, display_name)')
    .single();

  if (error) throw error;
  return data;
}

export async function listSettlements(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
  offset: number
) {
  const { data, error, count } = await supabase
    .from('settlements')
    .select(
      '*, payer:profiles!paid_by(id, email, display_name), payee:profiles!paid_to(id, email, display_name)',
      { count: 'exact' }
    )
    .or(`paid_by.eq.${userId},paid_to.eq.${userId}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, count };
}

export async function getSettlement(supabase: SupabaseClient, settlementId: string) {
  const { data, error } = await supabase
    .from('settlements')
    .select('*, payer:profiles!paid_by(id, email, display_name), payee:profiles!paid_to(id, email, display_name)')
    .eq('id', settlementId)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSettlement(supabase: SupabaseClient, settlementId: string) {
  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('id', settlementId);

  if (error) throw error;
}
