import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse, messageResponse } from '@/lib/errors';
import { parseBody, updateExpenseSchema } from '@/lib/validation';
import { getExpense, updateExpense, deleteExpense } from '@/services/expenses.service';

type Params = { params: Promise<{ groupId: string; expenseId: string }> };

/**
 * @swagger
 * /api/groups/{groupId}/expenses/{expenseId}:
 *   get:
 *     tags: [Expenses]
 *     summary: Get expense details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Expense with splits
 *   patch:
 *     tags: [Expenses]
 *     summary: Update expense (creator only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               split_type:
 *                 type: string
 *                 enum: [equal, percentage, exact]
 *               splits:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Updated expense
 *   delete:
 *     tags: [Expenses]
 *     summary: Delete expense (creator or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Expense deleted
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { expenseId } = await params;

  try {
    const expense = await getExpense(auth.supabase, expenseId);
    return successResponse(expense);
  } catch {
    return errorResponse('Expense not found', 404);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { expenseId } = await params;
  const body = await request.json();
  const parsed = parseBody(updateExpenseSchema, body);
  if ('error' in parsed) return errorResponse(parsed.error);

  try {
    const expense = await updateExpense(auth.supabase, expenseId, parsed.data);
    return successResponse(expense);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update expense';
    return errorResponse(message);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { expenseId } = await params;

  try {
    await deleteExpense(auth.supabase, expenseId);
    return messageResponse('Expense deleted');
  } catch {
    return errorResponse('Failed to delete expense or insufficient permissions', 403);
  }
}
