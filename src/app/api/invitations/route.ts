import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/errors';
import { parseBody, sendInvitationSchema } from '@/lib/validation';
import { sendInvitation, getPendingInvitations } from '@/services/invitations.service';
import { isGroupAdmin } from '@/services/groups.service';

/**
 * @swagger
 * /api/invitations:
 *   get:
 *     tags: [Invitations]
 *     summary: List pending invitations for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invitations with group info
 *   post:
 *     tags: [Invitations]
 *     summary: Send a group invitation (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [group_id, email]
 *             properties:
 *               group_id:
 *                 type: string
 *                 format: uuid
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Invitation sent
 *       403:
 *         description: Not a group admin
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  try {
    const invitations = await getPendingInvitations(auth.supabase, auth.user.id, auth.user.email!);
    return successResponse(invitations);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch invitations';
    return errorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const parsed = parseBody(sendInvitationSchema, body);
  if ('error' in parsed) return errorResponse(parsed.error);

  const { group_id, email } = parsed.data;

  if (!(await isGroupAdmin(auth.supabase, group_id, auth.user.id))) {
    return errorResponse('Only group admins can send invitations', 403);
  }

  try {
    const invitation = await sendInvitation(auth.supabase, group_id, auth.user.id, email);
    return successResponse(invitation, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send invitation';
    return errorResponse(message);
  }
}
