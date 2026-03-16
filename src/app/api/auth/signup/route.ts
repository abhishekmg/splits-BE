import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { errorResponse, successResponse } from '@/lib/errors';
import { parseBody, signupSchema } from '@/lib/validation';

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Sign up a new user
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
 *                 minLength: 6
 *               display_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = parseBody(signupSchema, body);
  if ('error' in parsed) return errorResponse(parsed.error);

  const { email, password, display_name } = parsed.data;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: display_name ?? email.split('@')[0] },
    },
  });

  if (error) return errorResponse(error.message, 400);

  return successResponse({
    user: {
      id: data.user!.id,
      email: data.user!.email,
      display_name: display_name ?? email.split('@')[0],
    },
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
  }, 201);
}
