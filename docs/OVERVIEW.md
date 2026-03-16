# Splits - What This Project Does

## Summary

Splits is the backend API for a Splitwise-style expense sharing app. A separate mobile app consumes this API. Users can create groups, add members via invitations, log shared expenses, and settle debts.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth + RLS)
- **Deployment**: Vercel
- **Validation**: Zod
- **API Docs**: Swagger UI + OpenAPI 3.0 via next-swagger-doc

## Core Features

### Authentication
- Email/password signup and login via Supabase Auth
- Mobile app sends JWT as `Authorization: Bearer <token>`
- Server creates a user-scoped Supabase client so Row Level Security (RLS) policies apply automatically

### Groups
- Users create groups and become the admin
- Invite other users by email; invitees accept/decline
- Admins can update/delete groups and manage members

### Expenses
- Any group member can log an expense they paid for
- Three split modes:
  - **Equal** - divides evenly, distributes remainder cents
  - **Percentage** - must sum to 100%
  - **Exact** - manually specify each person's share, must sum to total
- Created atomically via a Postgres function (`create_expense_with_splits`)

### Balances
- **Not stored** - computed at read time from expenses + settlements
- Two views:
  - **Group balances** - who owes whom within a single group
  - **Overall balances** - net debt across all groups, accounting for settlements
- Multi-currency: balances grouped by currency, no FX conversion
- Positive amount = they owe you, negative = you owe them

### Settlements
- Record a payment from one user to another
- Global (not tied to a specific group) - reduces net debt across all groups
- Factored into overall balance computation

### Invitations
- Admins send invitations to an email address
- Unique constraint prevents duplicate pending invitations per group+email
- Accepting auto-adds the user to the group as a member

## Auth Flow

```
Mobile App                    API Server                    Supabase
    │                             │                             │
    ├── POST /api/auth/signup ───►│── signUp() ────────────────►│
    │◄── { access_token } ────────│◄── { user, session } ───────│
    │                             │                             │
    ├── GET /api/groups ──────────│                             │
    │   Authorization: Bearer JWT │── createClient(jwt) ───────►│
    │                             │   (RLS scoped to user)      │
    │◄── { groups: [...] } ───────│◄── filtered rows ───────────│
```

## Balance Computation Flow

```
Expenses (who paid, who owes)
         │
         ├──► get_group_balances()   → per-group view
         │
         ├──► get_overall_balances() → cross-group net view
         │         │
Settlements ───────┘  (reduce net debt)
```
