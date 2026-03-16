import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/errors';
import { getGroupBalances } from '@/services/balances.service';

type Params = { params: Promise<{ groupId: string }> };

/**
 * @swagger
 * /api/groups/{groupId}/balances:
 *   get:
 *     tags: [Balances]
 *     summary: Get balances within a group for the current user
 *     description: Positive amounts mean others owe you. Negative means you owe them. Multi-currency balances are separate entries.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of balance entries per user per currency
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { groupId } = await params;

  try {
    const balances = await getGroupBalances(groupId, auth.user.id);
    return successResponse(balances);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to compute balances';
    return errorResponse(message, 500);
  }
}
