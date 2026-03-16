import { NextRequest } from 'next/server';
import { createClient } from './supabase/server';
import { errorResponse } from './errors';

/**
 * Extracts the Bearer token from the request and returns
 * the authenticated user + a Supabase client scoped to that user.
 */
export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: errorResponse('Missing or invalid Authorization header', 401) };
  }

  const token = authHeader.slice(7);
  const supabase = createClient(token);

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: errorResponse('Invalid or expired token', 401) };
  }

  return { user, supabase };
}
