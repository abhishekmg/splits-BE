# Project Structure

```
splits/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts        # POST - email/password login
│   │   │   │   ├── me/route.ts           # GET  - current user profile
│   │   │   │   └── signup/route.ts       # POST - create account
│   │   │   ├── api-docs/route.ts         # GET  - OpenAPI JSON spec
│   │   │   ├── balances/route.ts         # GET  - overall net balances
│   │   │   ├── groups/
│   │   │   │   ├── route.ts              # GET  - list groups, POST - create group
│   │   │   │   └── [groupId]/
│   │   │   │       ├── route.ts          # GET/PATCH/DELETE - single group
│   │   │   │       ├── balances/route.ts # GET  - group balances
│   │   │   │       ├── expenses/
│   │   │   │       │   ├── route.ts      # GET  - list, POST - create expense
│   │   │   │       │   └── [expenseId]/route.ts  # GET/PATCH/DELETE
│   │   │   │       └── members/route.ts  # GET  - list group members
│   │   │   ├── invitations/
│   │   │   │   ├── route.ts              # GET  - list, POST - send invitation
│   │   │   │   └── [invitationId]/route.ts  # PATCH - accept/decline
│   │   │   ├── settlements/
│   │   │   │   ├── route.ts              # GET  - list, POST - record settlement
│   │   │   │   └── [settlementId]/route.ts  # GET/DELETE
│   │   │   └── users/
│   │   │       └── search/route.ts       # GET  - search users by email
│   │   ├── api-docs/page.tsx             # Swagger UI page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── auth.ts                       # getAuthUser() - extract JWT, return user + scoped client
│   │   ├── errors.ts                     # errorResponse, successResponse, messageResponse helpers
│   │   ├── supabase/
│   │   │   ├── admin.ts                  # Service-role client (bypasses RLS)
│   │   │   └── server.ts                 # User-scoped client (RLS enforced)
│   │   ├── swagger.ts                    # OpenAPI spec generation via next-swagger-doc
│   │   └── validation.ts                 # Zod schemas + parseBody/parseQuery helpers
│   ├── services/
│   │   ├── balances.service.ts           # getGroupBalances, getOverallBalances
│   │   ├── expenses.service.ts           # CRUD + atomic creation via RPC
│   │   ├── groups.service.ts             # CRUD + membership/admin checks
│   │   ├── invitations.service.ts        # Send, list pending, accept/decline
│   │   ├── settlements.service.ts        # CRUD for settlement payments
│   │   └── splits.service.ts             # equal/percentage/exact split calculation
│   └── types/
│       ├── api.ts                        # Request/response types (SignupRequest, BalanceEntry, etc.)
│       ├── database.ts                   # Row types (Profile, Group, Expense, Settlement, etc.)
│       └── enums.ts                      # SplitType, InvitationStatus, GroupRole
├── supabase/
│   └── migrations/
│       ├── 00001_create_profiles.sql
│       ├── 00002_create_groups.sql
│       ├── 00003_create_invitations.sql
│       ├── 00004_create_expenses.sql
│       ├── 00005_create_settlements.sql
│       └── 00006_create_balance_functions.sql
├── CLAUDE.md
├── package.json
└── tsconfig.json
```

## Layer Responsibilities

| Layer | Location | Role |
|-------|----------|------|
| **Routes** | `src/app/api/` | HTTP handling, auth check, input validation, call service, return response |
| **Services** | `src/services/` | Business logic, Supabase queries, data transformation |
| **Lib** | `src/lib/` | Shared utilities (auth, validation, error formatting, Supabase clients) |
| **Types** | `src/types/` | TypeScript interfaces for DB rows, API payloads, and enums |
| **Migrations** | `supabase/migrations/` | Schema, RLS policies, triggers, and Postgres functions |
