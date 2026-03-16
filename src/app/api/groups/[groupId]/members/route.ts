import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/errors';
import { getGroupMembers } from '@/services/groups.service';

type Params = { params: Promise<{ groupId: string }> };

/**
 * @swagger
 * /api/groups/{groupId}/members:
 *   get:
 *     tags: [Groups]
 *     summary: List members of a group
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
 *         description: List of group members with profile info
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { groupId } = await params;

  try {
    const members = await getGroupMembers(auth.supabase, groupId);
    return successResponse(members);
  } catch {
    return errorResponse('Group not found or access denied', 404);
  }
}
