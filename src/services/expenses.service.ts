import { SupabaseClient } from '@supabase/supabase-js';
import { calculateSplits } from './splits.service';
import { SplitDetail } from '@/types/api';
import { SplitType } from '@/types/enums';

export async function createExpense(
  supabase: SupabaseClient,
  groupId: string,
  paidBy: string,
  description: string,
  amount: number,
  currency: string,
  splitType: SplitType,
  splits: SplitDetail[]
) {
  const computedSplits = calculateSplits(amount, splitType, splits);

  const splitsJson = computedSplits.map(s => ({
    user_id: s.user_id,
    owed_amount: s.owed_amount,
    percentage: s.percentage,
  }));

  const { data, error } = await supabase.rpc('create_expense_with_splits', {
    p_group_id: groupId,
    p_paid_by: paidBy,
    p_description: description,
    p_amount: amount,
    p_currency: currency,
    p_split_type: splitType,
    p_splits: splitsJson,
  });

  if (error) throw error;

  // Fetch the created expense with splits
  return getExpense(supabase, data);
}

export async function listExpenses(
  supabase: SupabaseClient,
  groupId: string,
  limit: number,
  offset: number
) {
  const { data, error, count } = await supabase
    .from('expenses')
    .select('*, expense_splits(*), profiles!paid_by(id, email, display_name)', { count: 'exact' })
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, count };
}

export async function getExpense(supabase: SupabaseClient, expenseId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_splits(*, profiles(id, email, display_name)), profiles!paid_by(id, email, display_name)')
    .eq('id', expenseId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateExpense(
  supabase: SupabaseClient,
  expenseId: string,
  updates: {
    description?: string;
    amount?: number;
    currency?: string;
    split_type?: SplitType;
    splits?: SplitDetail[];
  }
) {
  // If splits are being updated, we need amount and split_type
  if (updates.splits) {
    // Get current expense for defaults
    const current = await getExpense(supabase, expenseId);
    const amount = updates.amount ?? current.amount;
    const splitType = updates.split_type ?? current.split_type;

    const computedSplits = calculateSplits(amount, splitType, updates.splits);

    // Delete old splits
    const { error: deleteError } = await supabase
      .from('expense_splits')
      .delete()
      .eq('expense_id', expenseId);

    if (deleteError) throw deleteError;

    // Insert new splits
    const { error: insertError } = await supabase
      .from('expense_splits')
      .insert(computedSplits.map(s => ({
        expense_id: expenseId,
        user_id: s.user_id,
        owed_amount: s.owed_amount,
        percentage: s.percentage,
      })));

    if (insertError) throw insertError;
  }

  // Update expense fields
  const { splits: _, ...expenseUpdates } = updates;
  if (Object.keys(expenseUpdates).length > 0) {
    const { error } = await supabase
      .from('expenses')
      .update(expenseUpdates)
      .eq('id', expenseId);

    if (error) throw error;
  }

  return getExpense(supabase, expenseId);
}

export async function deleteExpense(supabase: SupabaseClient, expenseId: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  if (error) throw error;
}
