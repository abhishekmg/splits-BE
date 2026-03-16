import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse, messageResponse } from '@/lib/errors';
import { getSettlement, deleteSettlement } from '@/services/settlements.service';

type Params = { params: Promise<{ settlementId: string }> };

/**
 * @swagger
 * /api/settlements/{settlementId}:
 *   get:
 *     tags: [Settlements]
 *     summary: Get settlement details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Settlement details
 *       404:
 *         description: Settlement not found
 *   delete:
 *     tags: [Settlements]
 *     summary: Delete a settlement (creator only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Settlement deleted
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { settlementId } = await params;

  try {
    const settlement = await getSettlement(auth.supabase, settlementId);
    return successResponse(settlement);
  } catch {
    return errorResponse('Settlement not found', 404);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { settlementId } = await params;

  try {
    await deleteSettlement(auth.supabase, settlementId);
    return messageResponse('Settlement deleted');
  } catch {
    return errorResponse('Failed to delete settlement or insufficient permissions', 403);
  }
}
