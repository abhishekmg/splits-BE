# Coding Rules & Conventions

## API Route Pattern

Every route handler follows this structure:

```typescript
export async function METHOD(request: NextRequest) {
  // 1. Authenticate
  const { user, supabase } = await getAuthUser(request);
  if (!user) return errorResponse('Unauthorized', 401);

  // 2. Validate input
  const body = await parseBody(request, someSchema);
  if (!body.success) return errorResponse(body.error, 400);

  // 3. Authorize (check membership/admin role if needed)
  const isMember = await isGroupMember(supabase, groupId, user.id);
  if (!isMember) return errorResponse('Not a member', 403);

  // 4. Call service
  const result = await someService.doThing(supabase, ...args);

  // 5. Return response
  return successResponse(result);
}
```

## Validation

- All request bodies and query params are validated with Zod schemas defined in `src/lib/validation.ts`
- Use `parseBody(request, schema)` for POST/PATCH bodies
- Use `parseQuery(request, schema)` for GET query parameters
- Never trust raw input - always validate before passing to services

## Error Handling

Use the helpers from `src/lib/errors.ts`:

| Helper | Usage |
|--------|-------|
| `errorResponse(message, status)` | Error with message and HTTP status |
| `successResponse(data, status?)` | Success with data payload (default 200) |
| `messageResponse(message, status?)` | Success with message string (default 200) |

Standard status codes:
- `400` - validation error / bad request
- `401` - missing or invalid auth token
- `403` - authenticated but not authorized (not a member, not admin, not creator)
- `404` - resource not found
- `409` - conflict (duplicate invitation, already a member)

## Supabase Clients

Two clients, used for different purposes:

| Client | Created via | RLS | When to use |
|--------|-------------|-----|-------------|
| **User client** | `createClient(accessToken)` | Enforced | Default - all user-facing queries |
| **Admin client** | `createAdminClient()` | Bypassed | Only for cross-user aggregations (balance functions) |

## Services

- All business logic lives in `src/services/`, not in route handlers
- Services receive the Supabase client as a parameter (dependency injection)
- Services throw no exceptions - they return data or null, and routes handle the response
- One service file per domain: groups, expenses, splits, balances, settlements, invitations

## API Documentation

- Every route handler must have a `@swagger` JSDoc comment with the OpenAPI spec
- Swagger UI served at `/api-docs`
- JSON spec at `/api/api-docs`

## Pagination

List endpoints support:
- `?limit=20` (default 20, max 100)
- `?offset=0` (default 0)

Validated via `paginationSchema` in validation.ts.

## Naming Conventions

- Files: `kebab-case` for routes, `camelCase.service.ts` for services
- Types: `PascalCase` for interfaces and type aliases
- Functions: `camelCase`
- Database columns: `snake_case`
- API request/response fields: `snake_case` (matching DB columns)

## Authorization Model

| Action | Required Role |
|--------|--------------|
| View group/expenses/members | Group member |
| Create expense | Group member |
| Update expense | Expense creator |
| Delete expense | Expense creator or group admin |
| Send invitation | Group admin |
| Accept/decline invitation | Invitee |
| Update/delete group | Group admin |
| Create settlement | Any authenticated user |
| Delete settlement | Settlement creator |

## Currency

- Multi-currency supported
- Balances are grouped by currency - no cross-currency conversion
- Currency stored as text (e.g., "USD", "EUR", "INR")
