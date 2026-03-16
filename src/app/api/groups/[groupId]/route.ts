import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse, messageResponse } from '@/lib/errors';
import { parseBody, updateGroupSchema } from '@/lib/validation';
import { getGroup, updateGroup, deleteGroup, isGroupMember } from '@/services/groups.service';

type Params = { params: Promise<{ groupId: string }> };

/**
 * @swagger
 * /api/groups/{groupId}:
 *   get:
 *     tags: [Groups]
 *     summary: Get group details
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
 *         description: Group details
 *       404:
 *         description: Group not found
 *   patch:
 *     tags: [Groups]
 *     summary: Update group
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated group
 *   delete:
 *     tags: [Groups]
 *     summary: Delete group (admin only)
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
 *         description: Group deleted
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { groupId } = await params;

  try {
    const group = await getGroup(auth.supabase, groupId);
    return successResponse(group);
  } catch {
    return errorResponse('Group not found', 404);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { groupId } = await params;
  const body = await request.json();
  const parsed = parseBody(updateGroupSchema, body);
  if ('error' in parsed) return errorResponse(parsed.error);

  try {
    const group = await updateGroup(auth.supabase, groupId, parsed.data);
    return successResponse(group);
  } catch {
    return errorResponse('Failed to update group or insufficient permissions', 403);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { groupId } = await params;

  if (!(await isGroupMember(auth.supabase, groupId, auth.user.id))) {
    return errorResponse('Not a member of this group', 403);
  }

  try {
    await deleteGroup(auth.supabase, groupId);
    return messageResponse('Group deleted');
  } catch {
    return errorResponse('Failed to delete group or insufficient permissions', 403);
  }
}
