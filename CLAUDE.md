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
  app/
    api/orders/[id]/
      send-otp/route.ts   # POST — génère OTP, stocke en DB, envoie WhatsApp
      verify-otp/route.ts # POST { code } — vérifie OTP, passe commande en "confirmed"
  components/
    ui/          # Primitive UI: Button, Input, Select, Card, StatusBadge
    layout/      # Sidebar (client, nav + sign-out), Header
    dashboard/   # StatsCard
    orders/      # OrdersTable, OrderStatusSelect, OtpVerifyWidget
  lib/
    supabase/
      client.ts   # Browser Supabase client (createBrowserClient)
      server.ts   # Server Supabase client (createServerClient + cookies)
      middleware.ts  # Session refresh + auth redirect logic
    whatsapp.ts   # generateOTP(), normalizeAlgerianPhone(), sendOtpWhatsApp()
    utils.ts      # cn(), formatCurrency() (DZD), formatDate(), generateReference(),
                  # ORDER_STATUS_LABELS/COLORS, WILAYAS map (01–58)
  types/index.ts  # Shared TS types: Order, Client, Product, OrderItem, Profile, DashboardStats
  middleware.ts   # Next.js middleware — delegates to lib/supabase/middleware.ts
supabase/
  migrations/001_initial_schema.sql   # Full schema + RLS + trigger
  migrations/002_otp_columns.sql      # Ajout otp_code, otp_expires_at, otp_verified_at sur orders
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

## WhatsApp OTP flow

### Variables d'environnement
```
WHATSAPP_ACCESS_TOKEN=          # Token permanent Meta (jamais le token temporaire)
WHATSAPP_OTP_TEMPLATE_NAME=     # Nom du template approuvé, ou vide pour mode texte (dev)
```

### Flow
1. Création commande → `POST /api/orders/[id]/send-otp` déclenché automatiquement
2. OTP généré (6 chiffres, `crypto.randomInt`), stocké en clair avec expiry 10 min dans `orders.otp_code`
3. Message envoyé à `normalizeAlgerianPhone(client.phone)` → format `213XXXXXXXXX`
4. Widget `OtpVerifyWidget` affiché sur `/dashboard/orders/[id]` tant que `otp_verified_at IS NULL` et `status = 'pending'`
5. `POST /api/orders/[id]/verify-otp` { code } → vérifie, met `status = 'confirmed'`, efface `otp_code`

### Template Meta (production)
Créer dans WhatsApp Business Manager > Message Templates :
- **Catégorie :** UTILITY
- **Langue :** Français (fr)
- **Corps :** `Bonjour {{1}},\n\nVotre code de confirmation LIVRA est : *{{2}}*\n\nCe code expire dans 10 minutes. Ne le communiquez à personne.`
- Paramètre 1 = prénom client, Paramètre 2 = code OTP

### Mode développement
Laisser `WHATSAPP_OTP_TEMPLATE_NAME` vide → message texte libre (fonctionne uniquement avec les numéros de test enregistrés dans Meta Developer Console).

### Normalisation des numéros algériens
`normalizeAlgerianPhone()` dans `lib/whatsapp.ts` gère : `0XXXXXXXXX` → `213XXXXXXXXX`, `+213XXXXXXXXX` → `213XXXXXXXXX`, `9 chiffres` → `213XXXXXXXXX`.

## Environment setup

Copy `.env.example` to `.env.local` and fill in all variables.

Run migrations in order in your Supabase SQL editor:
1. `supabase/migrations/001_initial_schema.sql` — tables, RLS, trigger
2. `supabase/migrations/002_otp_columns.sql` — colonnes OTP sur orders

---

## Règles Claude Code — LIVRA Mobile

### Palette dark mode
- bg global : #0D0D0D
- cards : #161618, border : #252525
- text primary : #F0EDE8, text secondary : #8A8780, text muted : #B8B5B0
- accent : #10B981, danger : #F87171

### Règles de travail obligatoires
1. Lire chaque fichier EN ENTIER avant toute modification
2. Après tout changement CSS/Tailwind, lister mentalement tous les 
   classNames et vérifier qu'aucun élément ne dépasse 100vw sur 390px
3. tsc propre ≠ layout correct — vérifier la logique visuelle mobile
4. Toute card mobile : w-full + overflow-hidden
   Enfants : flex-1 min-w-0 (texte) + shrink-0 (montants/actions)
5. Tout <main> scrollable : overflow-y-auto overflow-x-hidden 
   overscroll-contain [-webkit-overflow-scrolling:touch] pb-40
6. Architecture scroll iOS : layout h-dvh overflow-hidden,
   pages flex flex-1 flex-col min-h-0, main gère son propre scroll
