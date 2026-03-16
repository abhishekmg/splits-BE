# Splits

Backend API for a Splitwise-style expense sharing app. Users create groups, invite members, log shared expenses, and settle debts. A separate mobile app consumes this API.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase** (PostgreSQL, Auth, Row Level Security)
- **Zod** for request validation
- **Swagger UI** for API documentation
- Deployed on **Vercel**

## Features

- Email/password auth via Supabase
- Groups with admin/member roles and email invitations
- Expenses with three split modes: equal, percentage, exact
- Multi-currency balances computed at read time (not stored)
- Global settlements that reduce net debt across all groups

## Getting Started

```bash
npm install
npm run dev
```

## API Docs

Once running, open the interactive Swagger UI:

```
http://localhost:3000/api-docs
```

Raw OpenAPI JSON spec:

```
http://localhost:3000/api/api-docs
```

## Project Docs

See the `docs/` folder for detailed documentation:

- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Overview](docs/OVERVIEW.md)
- [Coding Rules](docs/CODING_RULES.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
