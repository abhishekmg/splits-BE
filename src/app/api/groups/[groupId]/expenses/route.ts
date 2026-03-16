import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/errors';
import { parseBody, parseQuery, createExpenseSchema, paginationSchema } from '@/lib/validation';
import { createExpense, listExpenses } from '@/services/expenses.service';
import { isGroupMember } from '@/services/groups.service';

type Params = { params: Promise<{ groupId: string }> };

/**
 * @swagger
 * /api/groups/{groupId}/expenses:
 *   get:
 *     tags: [Expenses]
 *     summary: List expenses in a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Paginated list of expenses
 *   post:
 *     tags: [Expenses]
 *     summary: Create an expense in a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description, amount, currency, split_type, splits]
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 example: USD
 *               split_type:
 *                 type: string
 *                 enum: [equal, percentage, exact]
 *               splits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [user_id]
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     amount:
 *                       type: number
 *                     percentage:
 *                       type: number
 *     responses:
 *       201:
 *         description: Expense created
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { groupId } = await params;

  const pagination = parseQuery(paginationSchema, request.nextUrl.searchParams);
  if ('error' in pagination) return errorResponse(pagination.error);

  try {
    const { limit, offset } = pagination.data;
    const { data, count } = await listExpenses(auth.supabase, groupId, limit, offset);
    return successResponse({ data, count, limit, offset });
  } catch {
    return errorResponse('Failed to list expenses', 500);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { groupId } = await params;

  if (!(await isGroupMember(auth.supabase, groupId, auth.user.id))) {
    return errorResponse('Not a member of this group', 403);
  }

  const body = await request.json();
  const parsed = parseBody(createExpenseSchema, body);
  if ('error' in parsed) return errorResponse(parsed.error);

  try {
    const expense = await createExpense(
      auth.supabase,
      groupId,
      auth.user.id,
      parsed.data.description,
      parsed.data.amount,
      parsed.data.currency,
      parsed.data.split_type,
      parsed.data.splits
    );
    return successResponse(expense, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create expense';
    return errorResponse(message);
  }
}
