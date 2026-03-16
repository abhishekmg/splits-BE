import { SplitDetail } from '@/types/api';

export interface ComputedSplit {
  user_id: string;
  owed_amount: number;
  percentage: number | null;
}

/**
 * Equal split: amount / participants, remainder cents distributed to first N participants.
 */
function calculateEqualSplits(amount: number, splits: SplitDetail[]): ComputedSplit[] {
  const count = splits.length;
  const baseAmount = Math.floor((amount * 100) / count) / 100;
  const remainder = Math.round(amount * 100) - Math.round(baseAmount * 100) * count;

  return splits.map((s, i) => ({
    user_id: s.user_id,
    owed_amount: i < remainder
      ? Math.round((baseAmount + 0.01) * 100) / 100
      : baseAmount,
    percentage: null,
  }));
}

/**
 * Percentage split: amount * (pct / 100). Validate percentages sum to 100.
 */
function calculatePercentageSplits(amount: number, splits: SplitDetail[]): ComputedSplit[] {
  const totalPct = splits.reduce((sum, s) => sum + (s.percentage ?? 0), 0);
  if (Math.abs(totalPct - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100, got ${totalPct}`);
  }

  const results: ComputedSplit[] = splits.map(s => ({
    user_id: s.user_id,
    owed_amount: Math.round(amount * (s.percentage! / 100) * 100) / 100,
    percentage: s.percentage!,
  }));

  // Adjust last participant for rounding
  const computedTotal = results.reduce((sum, r) => sum + Math.round(r.owed_amount * 100), 0);
  const targetTotal = Math.round(amount * 100);
  if (computedTotal !== targetTotal) {
    results[results.length - 1].owed_amount =
      Math.round((results[results.length - 1].owed_amount * 100 + (targetTotal - computedTotal))) / 100;
  }

  return results;
}

/**
 * Exact split: validate provided amounts sum to total.
 */
function calculateExactSplits(amount: number, splits: SplitDetail[]): ComputedSplit[] {
  const total = splits.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  if (Math.abs(total - amount) > 0.01) {
    throw new Error(`Split amounts must sum to ${amount}, got ${total}`);
  }

  return splits.map(s => ({
    user_id: s.user_id,
    owed_amount: s.amount!,
    percentage: null,
  }));
}

export function calculateSplits(
  amount: number,
  splitType: 'equal' | 'percentage' | 'exact',
  splits: SplitDetail[]
): ComputedSplit[] {
  switch (splitType) {
    case 'equal':
      return calculateEqualSplits(amount, splits);
    case 'percentage':
      return calculatePercentageSplits(amount, splits);
    case 'exact':
      return calculateExactSplits(amount, splits);
  }
}
