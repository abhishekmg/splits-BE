import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/errors';
import { parseBody, parseQuery, createSettlementSchema, paginationSchema } from '@/lib/validation';
import { createSettlement, listSettlements } from '@/services/settlements.service';

/**
 * @swagger
 * /api/settlements:
 *   get:
 *     tags: [Settlements]
 *     summary: List settlement history for the current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Paginated list of settlements
 *   post:
 *     tags: [Settlements]
 *     summary: Record a settlement payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paid_to, amount, currency]
 *             properties:
 *               paid_to:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 example: USD
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Settlement recorded
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const pagination = parseQuery(paginationSchema, request.nextUrl.searchParams);
  if ('error' in pagination) return errorResponse(pagination.error);

  try {
    const { limit, offset } = pagination.data;
    const { data, count } = await listSettlements(auth.supabase, auth.user.id, limit, offset);
    return successResponse({ data, count, limit, offset });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list settlements';
    return errorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const parsed = parseBody(createSettlementSchema, body);
  if ('error' in parsed) return errorResponse(parsed.error);

  if (parsed.data.paid_to === auth.user.id) {
    return errorResponse('Cannot settle with yourself');
  }

  try {
    const settlement = await createSettlement(
      auth.supabase,
      auth.user.id,
      parsed.data.paid_to,
      parsed.data.amount,
      parsed.data.currency,
      parsed.data.note
    );
    return successResponse(settlement, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create settlement';
    return errorResponse(message);
  }
}
