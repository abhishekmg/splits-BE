import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/errors';

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { user, supabase } = auth;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return errorResponse('Profile not found', 404);

  return successResponse(profile);
}
