import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/errors';
import { parseBody, parseQuery, createGroupSchema, paginationSchema } from '@/lib/validation';
import { createGroup, listGroups } from '@/services/groups.service';

/**
 * @swagger
 * /api/groups:
 *   get:
 *     tags: [Groups]
 *     summary: List groups the current user belongs to
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Paginated list of groups
 *   post:
 *     tags: [Groups]
 *     summary: Create a new group
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const pagination = parseQuery(paginationSchema, request.nextUrl.searchParams);
  if ('error' in pagination) return errorResponse(pagination.error);

  const { limit, offset } = pagination.data;
  const { data, count } = await listGroups(auth.supabase, auth.user.id, limit, offset);

  return successResponse({ data, count, limit, offset });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const parsed = parseBody(createGroupSchema, body);
  if ('error' in parsed) return errorResponse(parsed.error);

  try {
    const group = await createGroup(auth.supabase, auth.user.id, parsed.data.name, parsed.data.description);
    return successResponse(group, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create group';
    return errorResponse(message);
  }
}
