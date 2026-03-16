# Splits - Splitwise Clone Backend

## Overview
Backend API for a Splitwise clone. Mobile frontend is built separately and consumes this API. Tech stack: Next.js App Router + TypeScript + Supabase (DB, Auth, Storage), deployed on Vercel.

## Architecture
- **API Routes**: Next.js App Router at `src/app/api/`
- **Services**: Business logic in `src/services/`
- **Auth**: Mobile app sends Supabase JWT as `Authorization: Bearer <token>`. Server creates Supabase client with it so RLS applies.
- **Admin Client**: Service role key, bypasses RLS — used only for cross-user queries (balance aggregation).
- **Balances**: Computed at read time from expense_splits + settlements, not stored.
- **Settlements**: Global (no group_id), reducing net debt across all groups.

## Key Conventions
- All request validation via Zod schemas in `src/lib/validation.ts`
- Standardized error responses via `src/lib/errors.ts`
- Swagger/OpenAPI annotations on every route handler via `@swagger` JSDoc
- API docs UI at `/api-docs`, JSON spec at `/api/api-docs`
- Pagination: `?limit=20&offset=0` on list endpoints
- Multi-currency: balances grouped by currency, no FX conversion

## Database
- Migrations in `supabase/migrations/` (run in order)
- RLS enabled on all tables
- `create_expense_with_splits` Postgres function for atomic expense creation
- `get_group_balances` and `get_overall_balances` Postgres functions for balance computation
- Trigger on `auth.users` auto-creates `profiles` row

## Documentation
Project docs live in `docs/`. **Always update the relevant doc** when making changes to:
- `docs/DATABASE_SCHEMA.md` — when adding/modifying tables, columns, RLS policies, migrations, or Postgres functions
- `docs/CODING_RULES.md` — when changing code conventions, auth patterns, validation approach, error handling, or authorization rules
- `docs/PROJECT_STRUCTURE.md` — when adding/removing/moving files or directories
- `docs/OVERVIEW.md` — when adding/changing features, altering the auth flow, or modifying core behavior

## Git
- Do NOT add `Co-Authored-By` lines in commit messages

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
