import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { errorResponse, successResponse } from '@/lib/errors';
import { parseBody, loginSchema } from '@/lib/validation';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in an existing user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = parseBody(loginSchema, body);
  if ('error' in parsed) return errorResponse(parsed.error);

  const { email, password } = parsed.data;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return errorResponse('Invalid credentials', 401);

  // Fetch profile for display_name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', data.user.id)
    .single();

  return successResponse({
    user: {
      id: data.user.id,
      email: data.user.email,
      display_name: profile?.display_name ?? null,
    },
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}
