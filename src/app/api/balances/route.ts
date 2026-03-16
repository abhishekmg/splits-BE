import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/errors';
import { getOverallBalances } from '@/services/balances.service';

/**
 * @swagger
 * /api/balances:
 *   get:
 *     tags: [Balances]
 *     summary: Get overall balances across all groups (home summary)
 *     description: Returns net balances with all users across all groups, accounting for settlements. Multi-currency balances are separate entries. Positive = others owe you.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of net balance entries per user per currency
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  try {
    const balances = await getOverallBalances(auth.user.id);
    return successResponse(balances);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to compute balances';
    return errorResponse(message, 500);
  }
}
