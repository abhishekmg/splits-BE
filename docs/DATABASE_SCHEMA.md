# Database Schema

All tables have RLS enabled. Migrations are in `supabase/migrations/` and run in order.

## Tables

### profiles

Mirrors `auth.users`. Auto-created via trigger on signup.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | FK to `auth.users.id` |
| `email` | text (unique) | |
| `display_name` | text | |
| `avatar_url` | text | nullable |
| `created_at` | timestamptz | default now() |

**RLS**: All authenticated users can view any profile. Users can only update their own.

**Trigger**: `on_auth_user_created` - automatically inserts a profile row when a new user signs up.

---

### groups

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | default gen_random_uuid() |
| `name` | text | |
| `description` | text | nullable |
| `created_by` | uuid | FK to profiles |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | default now(), auto-updated via trigger |

**RLS**: Members can view. Creator can insert. Admins can update/delete.

---

### group_members

| Column | Type | Notes |
|--------|------|-------|
| `group_id` | uuid | PK (composite), FK to groups (cascade delete) |
| `user_id` | uuid | PK (composite), FK to profiles |
| `role` | text | `'admin'` or `'member'` |
| `joined_at` | timestamptz | default now() |

**RLS**: Members can view their group's members. Admins can insert/delete members.

---

### invitations

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | default gen_random_uuid() |
| `group_id` | uuid | FK to groups (cascade delete) |
| `invited_by` | uuid | FK to profiles |
| `invited_email` | text | |
| `invited_user_id` | uuid | FK to profiles, nullable |
| `status` | text | `'pending'`, `'accepted'`, `'declined'` |
| `created_at` | timestamptz | default now() |
| `responded_at` | timestamptz | nullable |

**Unique index**: `(group_id, invited_email) WHERE status = 'pending'` - prevents duplicate pending invitations.

**RLS**: Invitees (by user_id or email) and inviters can view. Group admins can insert. Invitees can update (accept/decline).

---

### expenses

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | default gen_random_uuid() |
| `group_id` | uuid | FK to groups (cascade delete) |
| `paid_by` | uuid | FK to profiles |
| `description` | text | |
| `amount` | numeric(12,2) | must be > 0 |
| `currency` | text | e.g., "USD", "INR" |
| `split_type` | text | `'equal'`, `'percentage'`, `'exact'` |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | default now(), auto-updated via trigger |

**RLS**: Group members can view/insert. Creator can update. Creator or admin can delete.

---

### expense_splits

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | default gen_random_uuid() |
| `expense_id` | uuid | FK to expenses (cascade delete) |
| `user_id` | uuid | FK to profiles |
| `owed_amount` | numeric(12,2) | must be >= 0 |
| `percentage` | numeric(5,2) | nullable, used for percentage splits |

**Unique constraint**: `(expense_id, user_id)` - one split per user per expense.

**RLS**: Group members can view/insert. Expense creator can delete.

---

### settlements

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | default gen_random_uuid() |
| `paid_by` | uuid | FK to profiles |
| `paid_to` | uuid | FK to profiles |
| `amount` | numeric(12,2) | must be > 0 |
| `currency` | text | |
| `note` | text | nullable |
| `created_at` | timestamptz | default now() |

**Check constraint**: `paid_by != paid_to`

**RLS**: Users can view settlements where they are payer or payee. Users can insert (paid_by = self). Creator can delete.

---

## Postgres Functions

### `create_expense_with_splits()`

Atomically creates an expense and its splits in a single transaction.

**Parameters**:
- `p_group_id` uuid
- `p_paid_by` uuid
- `p_description` text
- `p_amount` numeric
- `p_currency` text
- `p_split_type` text
- `p_splits` jsonb - array of `{user_id, owed_amount, percentage}`

**Returns**: The created expense row.

### `get_group_balances(p_group_id, p_user_id)`

Computes net balances for a user within a single group.

**Logic**:
1. Sum what others owe (from expenses user paid)
2. Subtract what user owes (from splits on others' expenses)
3. Group by counterpart user and currency
4. Filter out zero balances
5. Join with profiles for display info

**Returns**: Table of `(user_id, email, display_name, amount, currency)`

### `get_overall_balances(p_user_id)`

Computes net balances across all groups, factoring in settlements.

**Logic**:
1. Sum all expense-based debts (same as group balances, but across all groups)
2. Add settlement adjustments (payments made/received)
3. Net everything by counterpart user and currency
4. Filter out zero balances

**Returns**: Same format as `get_group_balances`.

---

## ER Diagram

```
auth.users ──trigger──► profiles
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
            groups    invitations   settlements
                │           │
                ▼           │
          group_members     │
                │           │
                ▼           │
            expenses ◄──────┘
                │
                ▼
          expense_splits
```

**Cascade deletes**: Deleting a group cascades to group_members, invitations, expenses, and expense_splits.
