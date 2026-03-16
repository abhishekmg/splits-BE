import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/errors';
import { parseBody, respondInvitationSchema } from '@/lib/validation';
import { respondToInvitation } from '@/services/invitations.service';

type Params = { params: Promise<{ invitationId: string }> };

/**
 * @swagger
 * /api/invitations/{invitationId}:
 *   patch:
 *     tags: [Invitations]
 *     summary: Accept or decline an invitation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, declined]
 *     responses:
 *       200:
 *         description: Invitation updated
 *       404:
 *         description: Invitation not found
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { invitationId } = await params;
  const body = await request.json();
  const parsed = parseBody(respondInvitationSchema, body);
  if ('error' in parsed) return errorResponse(parsed.error);

  try {
    const invitation = await respondToInvitation(
      auth.supabase,
      invitationId,
      auth.user.id,
      parsed.data.status
    );
    return successResponse(invitation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to respond to invitation';
    return errorResponse(message);
  }
}
