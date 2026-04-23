# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint on src/
npx tsc --noEmit    # Type-check without emitting
```

## Architecture

**Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4 · Supabase (auth + DB)

### Directory layout

```
src/
  app/                        # Next.js App Router pages
    auth/{login,register,callback}/   # Public auth pages
    dashboard/                # Protected area (layout wraps all)
      orders/{new,[id]}/      # Order list, creation, detail
      clients/                # Client list
      settings/               # Profile settings
  components/
    ui/          # Primitive UI: Button, Input, Select, Card, StatusBadge
    layout/      # Sidebar (client, nav + sign-out), Header
    dashboard/   # StatsCard
    orders/      # OrdersTable, OrderStatusSelect (inline Supabase update)
  lib/
    supabase/
      client.ts   # Browser Supabase client (createBrowserClient)
      server.ts   # Server Supabase client (createServerClient + cookies)
      middleware.ts  # Session refresh + auth redirect logic
    utils.ts      # cn(), formatCurrency() (DZD), formatDate(), generateReference(),
                  # ORDER_STATUS_LABELS/COLORS, WILAYAS map (01–58)
  types/index.ts  # Shared TS types: Order, Client, Product, OrderItem, Profile, DashboardStats
  middleware.ts   # Next.js middleware — delegates to lib/supabase/middleware.ts
supabase/
  migrations/001_initial_schema.sql   # Full schema + RLS + trigger
```

### Auth flow

Middleware (`src/middleware.ts`) runs on every request except static assets. It calls `updateSession()` which:
- Redirects unauthenticated users away from `/dashboard/**` → `/auth/login`
- Redirects authenticated users away from `/auth/**` → `/dashboard`

Auth callback at `/auth/callback` (route handler) exchanges the code for a session.

### Database schema

Five tables, all with RLS policies scoped to `auth.uid()`:

| Table | Key relationships |
|---|---|
| `profiles` | 1:1 with `auth.users`, auto-created via trigger |
| `clients` | belongs to `user_id` |
| `products` | belongs to `user_id` (optional catalog) |
| `orders` | belongs to `user_id` + `client_id`, has a unique `reference` (format `LV-YYMM-XXXX`) |
| `order_items` | belongs to `order_id`, RLS checked via parent order |

Order status values: `pending` → `confirmed` → `processing` → `shipped` → `delivered` / `cancelled` / `returned`.

### Key conventions

- **Server components** fetch data directly via `createClient()` from `lib/supabase/server.ts`. No API routes needed for reads.
- **Client components** (marked `"use client"`) use `createClient()` from `lib/supabase/client.ts` for mutations (e.g. `OrderStatusSelect`, auth forms).
- **Currency:** always format with `formatCurrency()` — outputs DZD with `fr-DZ` locale.
- **Wilayas:** use the `WILAYAS` map in `utils.ts` (`"01"` → `"Adrar"`, …, `"58"` → `"El Meniaa"`). The code (01–58) is what is stored in the DB.
- **Tailwind v4** is used — no `tailwind.config.js`; configuration is in CSS with `@theme` blocks if needed.

## Environment setup

Copy `.env.example` to `.env.local` and fill in the three Supabase variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Run the migration `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor to create all tables, indexes, RLS policies, and the new-user trigger.
