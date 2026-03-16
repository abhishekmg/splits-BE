import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/errors';

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     tags: [Users]
 *     summary: Search users by email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching users
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { supabase } = auth;
  const email = request.nextUrl.searchParams.get('email');

  if (!email || email.length < 3) {
    return errorResponse('Email query must be at least 3 characters');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url')
    .ilike('email', `%${email}%`)
    .limit(10);

  if (error) return errorResponse(error.message);

  return successResponse(data);
}
