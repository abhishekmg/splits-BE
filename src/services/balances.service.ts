import { createAdminClient } from '@/lib/supabase/admin';

export interface BalanceEntry {
  user_id: string;
  email: string;
  display_name: string | null;
  amount: number;
  currency: string;
}

/**
 * Get balances within a specific group for a specific user.
 * Positive = others owe you. Negative = you owe others.
 */
export async function getGroupBalances(groupId: string, userId: string): Promise<BalanceEntry[]> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc('get_group_balances', {
    p_group_id: groupId,
    p_user_id: userId,
  });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get net balances across ALL groups for a user (home summary).
 * Accounts for expenses and settlements.
 */
export async function getOverallBalances(userId: string): Promise<BalanceEntry[]> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc('get_overall_balances', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data ?? [];
}
