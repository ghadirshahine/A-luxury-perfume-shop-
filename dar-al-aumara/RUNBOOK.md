# DAR AL-AUMARA — Sanity Integration Runbook

End-to-end setup for running **Sanity.io as the headless CMS** behind the
DAR AL-AUMARA storefront. This monorepo has two independent apps that share one
Sanity project (`xvmhw7dr`, dataset `production`):

```
dar-al-aumara/
├── studio/   ← standalone Sanity Studio (the product/order ADMIN)
└── web/      ← Next.js 16 App Router storefront (reads live from Sanity)
```

The Studio stays **standalone** (requirement 9): it is its own Vite app deployed
by the Sanity CLI, *not* embedded inside the Next.js route tree. The two apps are
connected only through the shared project + dataset, a read token, CORS, and
TypeGen-generated types.

> The old `../../test2/admin.html` entry now redirects to the authenticated
> Studio at `https://xvmhw7dr.sanity.studio`; its browser-local CRUD has been
> removed. Other vanilla storefront pages remain a separate static demo. Real
> product management now happens in Sanity Studio, and the Next.js storefront
> ships **zero hard-coded products**. See
> _How the 10 requirements are met_ at the bottom for the mapping.

---

## 0. Prerequisites

- Node.js ≥ 20
- Access to the Sanity project `xvmhw7dr` (you must be a member with rights to
  create API tokens)
- A package manager — commands below use `npm`

---

## 1. Install dependencies

```powershell
cd "c:\Users\Golden Hawk\test2\dar-al-aumara\studio"; npm install
cd "c:\Users\Golden Hawk\test2\dar-al-aumara\web";    npm install
```

Web pulls in `next-sanity`, `@sanity/image-url`, `zod`, `server-only`. Studio
pulls in `sanity`, `@sanity/client` (for the seed script) and `@types/node`.

The module-not-found squiggles you may see in the editor before this step
resolve once `npm install` completes.

---

## 2. Create API tokens (Sanity → API → Tokens)

Create **two separate** tokens — least privilege:

| Token | Used by | Scope | Env var (web) |
|-------|---------|-------|---------------|
| **Read** | storefront reads / draft preview | `views: read` for dataset `production`. Enable it for **Vision + queries**. Used in Draft Mode. | `SANITY_API_READ_TOKEN` (no `NEXT_PUBLIC_`) |
| **Write** | checkout server action creates `order` docs and decrements `product.stock` | `editor` on dataset `production` | `SANITY_API_WRITE_TOKEN` (no `NEXT_PUBLIC_`) |

The seed script reuses the **write** token.

---

## 3. Configure CORS + HTTP origins

Sanity → API → **CORS origins**. Allow both the Studio and the web app to read
(and the Studio to deploy). Add (Settings → API → CORS origins):

```
http://localhost:3333      # Studio dev
http://localhost:3000      # Next.js dev
https://cdn.sanity.io
```
and your production web origin (e.g. `https://your-web-app.vercel.app`) plus the
deployed Studio origin (`https://xvmhw7dr.sanity.studio`) once deployed.

Also add the same hosts under **Allowed Origins (CORS)** with `Credentials`
enabled so the read token can be used in the browser during preview.

---

## 4. Environment variables

### Web

```powershell
cd "c:\Users\Golden Hawk\test2\dar-al-aumara\web"
Copy-Item .env.example .env.local
```

Fill `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=xvmhw7dr
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-02-01
NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333

SANITY_API_READ_TOKEN=pat_xxx          # from step 2 — server only
SANITY_API_WRITE_TOKEN=pat_yyy         # from step 2 — server only
```

> **Never** put a token behind `NEXT_PUBLIC_`. `env.ts` (public) and `token.ts`
> (server-only, imported only by `live.ts`, the write client and server actions)
> enforce that split.

### Studio (optional, for Presentation preview)

```powershell
cd "c:\Users\Golden Hawk\test2\dar-al-aumara\studio"
Copy-Item .env.example .env
# SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:3000
```

---

## 5. Deploy the schema + generate types (TypeGen)

The Studio owns the schema. Extract it and generate `sanity.types.ts` **into the
web app** so GROQ query results are typed:

```powershell
cd "c:\Users\Golden Hawk\test2\dar-al-aumara\studio"
npm run typegen        # sanity schemas extract --force && sanity typegen generate
```

This writes `../web/sanity.types.ts` (per `sanity.cli.ts` → `typegen.generates`).
Re-run it whenever a schema field or a query in `web/src/sanity/lib/queries.ts`
changes (`typegen.path` scans `../web/src/**`).

> Do the schema deploy **before** seeding, so the dataset accepts the new
> document types.

---

## 6. Seed the catalogue from the legacy data.js

Transforms `test2/js/data.js` (16 products, 6 brands, 10 categories) into Sanity
documents. It is idempotent (`createOrReplace` under stable `brand.*`,
`category.*`, `product.*` ids):

```powershell
cd "c:\Users\Golden Hawk\test2\dar-al-aumara\studio"
$env:SANITY_API_WRITE_TOKEN="pat_yyy"
npm run seed           # node scripts/seed-from-data.mjs
```

Notes on the migration:
- `description_ar` becomes Portable Text; `notes`, `sizes`, `seo` are nested per
  the `product` schema; `brand` / `categories` / `recommended` / `coPurchase`
  become real Sanity references.
- Product images in `data.js` are procedural `art` descriptors (no files), so
  `mainImage` / `gallery` come over empty — **upload real images in the Studio**.
- `featured` is auto-set for bestsellers (rank ≤ 8) so the home page populates.

---

## 7. Run both apps

Two terminals:

```powershell
# Terminal A — Studio (admin) at http://localhost:3333
cd "c:\Users\Golden Hawk\test2\dar-al-aumara\studio"; npm run dev

# Terminal B — storefront at http://localhost:3000
cd "c:\Users\Golden Hawk\test2\dar-al-aumara\web"; npm run dev
```

---

## 8. Smoke test

1. **Studio** — sign in; Overview, Products, Orders, Customers, Marketing,
   Brands, and Categories are available as desk workspaces. Seeded catalogue
   documents appear in their corresponding lists.
2. **Storefront `/`** — featured products render from Sanity (no local data).
3. **`/products`** — full catalogue; **`/products/<slug>`** — detail page shows
   the fragrance pyramid, sizes, Portable Text description, recommendations.
4. **Live update** — with Draft Mode active (see below), edit a product title in
   Studio and watch the storefront update without a manual refresh.
5. **Visual Editing** — open a product in the Studio's **Presentation** tab; it
   loads the web page in an iframe with click-to-edit.
6. **Inventory-aware checkout**:
   - Add a product to the basket (the Add-to-basket button caps quantity at the
     product's live `stock` and disables at 0).
    - An optional coupon can be authored under Studio → Marketing; checkout
       validates its active state, date window, minimum spend, and discount type
       against Sanity on the server.
    - Place an order on `/cart`. The `createOrder` server action re-reads each
     line from Sanity, rejects if `qty > stock`, then creates an `order` document
       and decrements `product.stock` in one guarded transaction. It also upserts
       the customer record and links it to the order in that transaction.
   - Confirm the new order appears in the Studio → **Orders**, and that the
     product's stock dropped.
   - Try to order more than the remaining stock → expect a server error.

### Draft Mode / preview toggle
- Enable (from Studio): the Presentation tool hits `/draft-mode/enable`.
- Enable (manual): visit `http://localhost:3000/draft-mode/enable`.
- Disable: the floating **Exit preview** button (`/draft-mode/disable`).

---

## 9. Deploy for production

```powershell
# Studio → https://xvmhw7dr.sanity.studio
cd "c:\Users\Golden Hawk\test2\dar-al-aumara\studio"; npm run deploy

# Web → Vercel (or any Node host)
cd "c:\Users\Golden Hawk\test2\dar-al-aumara\web"; npm run build
```

In the hosting provider set the same `.env.local` values; point
`NEXT_PUBLIC_SANITY_STUDIO_URL` and the Studio `SANITY_STUDIO_PREVIEW_ORIGIN` at
the **deployed** origins, and add those origins to CORS (step 3). `SANITY_API_READ_TOKEN`
is required in production (`token.ts` throws if missing).

---

## Architecture cheat-sheet (what talks to what)

| Concern | Where | Why it's safe |
|---------|-------|---------------|
| Public env (projectId/dataset) | `web/src/sanity/env.ts` | `NEXT_PUBLIC_*` only |
| Read token | `web/src/sanity/lib/token.ts` | unprefixed, server-only import |
| Write token | `web/src/sanity/lib/writeClient.ts` (`import 'server-only'`) | token never in client bundle |
| Live reads + preview | `web/src/sanity/lib/live.ts` (`defineLive`) | CDN for published, non-CDN + drafts in preview |
| GROQ | `web/src/sanity/lib/queries.ts` (`defineQuery`) | typed by TypeGen |
| Admin writes | Sanity **Studio** (Editor role) | no token in the browser; auth is Studio membership/invites |
| Order/customer writes | `web/src/app/actions/create-order.ts` | Zod-validated, server re-checks stock/coupon; atomic Sanity transaction |
| Campaign banners | `studio/schemaTypes/campaign.ts` + home page query | active/scheduled content fetched with Live Content API |

---

## How the 10 requirements are met

1. **Studio ↔ Next.js connection** — shared `projectId xvmhw7dr` / `production`,
   `NEXT_PUBLIC_*` env, read token, TypeGen into `web`, CORS.
2. **Comprehensive product schema** — `studio/schemaTypes/product.ts`: name
   (ar/en), slug (async-uniqueness), price/oldPrice/currency, image (hotspot +
   alt + gallery), Portable Text description, fragrance notes (top/middle/base),
   brand + categories as references, stock, sizes, concentration/strength/
   longevity/sillage, discoverability flags, SEO, grouped UI + validation.
3. **GROQ real-time fetch** — `web/src/sanity/lib/queries.ts` + `defineLive`;
   pages use `sanityFetch` against the production dataset.
4. **Migrate admin functionality to Sanity** — `admin.html` redirects to Studio;
   local-storage CRUD was removed. Products, orders, customers, marketing, and
   the live Overview are represented by Studio schemas/tools.
5. **Data synchronization / live storefront** — Live Content API + Visual
   Editing; published content is CDN-cached, drafts stream in real time.
6. **No hard-coded products** — the Next.js storefront has no catalogue; every
   product/category/brand is fetched from Sanity.
7. **Inventory-aware cart/checkout** — `AddToCart` caps to live `stock`; the
   `createOrder` server action re-validates stock server-side and decrements it
   atomically when creating the order.
8. **Admin writes to Sanity, not localStorage** — catalogue edits go through
   Studio. Checkout writes order/customer records and stock changes through a
   server-only write token; coupon rules are evaluated against Sanity documents.
9. **Standalone Studio** — separate `studio/` app deployed by `sanity deploy`;
   only the Presentation plugin references the web origin. Not embedded in Next.
10. **Getting-started + Next.js patterns** — `defineLive`, `defineQuery`,
    `defineEnableDraftMode`, `SanityLive`/`VisualEditing` in the root layout,
    `@sanity/image-url` → `next/image` with LQIP blur, remotePatterns for
    `cdn.sanity.io`, TypeGen for type safety.

---

## Known limitations / follow-ups

- **Payments** are recorded as `paymentMethod` on the order; no gateway is wired.
- **Coupon codes and banners** are managed as Campaign documents. Existing
   vanilla local-storage coupon/banner records are not imported; create active
   campaign documents in Studio. Loyalty and payment gateways are not migrated.
- Stock decrement uses **optimistic concurrency**: the order + all stock patches
  commit in one Sanity transaction, each patch pinned to the `_rev` read at
  checkout. If a product changed on the server in between, the whole commit is
  aborted and the shopper is asked to retry — so no phantom order and no
  overselling. For sustained very-high concurrency, move reservation to a
  dedicated inventory service.
