# Forward Collective

Dark, editorial e-commerce storefront for a luxury streetwear brand. Next.js 14 (App Router), Tailwind, Supabase. Three sections: **Staple** (catalog), **The Archives** (members only), **The Collective** (loyalty dashboard).

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                  # http://localhost:3000
```

The app runs without any keys using built-in sample data. Routes fall back to `src/lib/sample.ts` whenever Supabase returns nothing, so you can preview the full design immediately.

- `/` — Staple catalog
- `/archives` — members only (shows the join gate when signed out)
- `/collective` — program explanation + join (signed out)
- `/collective?demo=1` — preview the member dashboard with sample data, no auth needed

## Verify the points engine

```bash
npm test
```

Runs `src/lib/points.test.ts` (12 assertions covering multipliers, quantity, recurring, streak, and early-access logic). All pass.

## Setup checklist

1. **Supabase** — create a project, run `supabase/schema.sql` then `supabase/seed.sql` in the SQL editor. Put the URL and keys in `.env.local`. RLS is enabled: members read only their own rows; server writes use the service-role key.
2. **Auth** — email/SMS capture should create a Supabase Auth user, then call `joinCollective` (`/api/join`). See the note in `src/lib/actions.ts` — the join action expects an authenticated session so it can tie the member to `auth.users`. For a frictionless flow, use Supabase OTP (magic link / SMS OTP) on the capture form.
3. **Payments** — wire your Shopify or Stripe fulfillment webhook to call `recordFulfilledOrder` (`src/lib/actions.ts`) with `{ userId, orderId, amount, itemCount }`. That function runs the full earning calc and persists the events.
4. **Klaviyo** — set `KLAVIYO_API_KEY`. The eight flows map to the events fired in `src/lib/klaviyo.ts`; build the flow content in Klaviyo and segment on the `collective_member` and `early_access` profile properties.

## How the points system works

`src/lib/points.ts` is pure, tested, and the single source of truth.

| Rule | Points |
|---|---|
| Base | 1 per $1 |
| Order ≥ $100 / ≥ $200 | 1.25x / 1.5x on base |
| 3+ items | +50 |
| 2nd purchase within 60 days | +75 |
| 3rd purchase ever | +50 |
| 3 / 6 / 12-month streak | +100 / +200 / +500 |
| Maintained past 12 months | +100 per new month |
| 1-year anniversary | +150 |
| Referral (buyer converts) | +200 referrer / +100 referred |
| Welcome (signup) | +50 |

Rewards table and redemption logic live in `src/lib/rewards.ts`. At 6,000 lifetime points, `early_access` flips permanently — it is a status, never spent.

## Resolved spec ambiguities

These were underspecified; the choices are documented inline in `src/lib/points.ts`:

- **Multiplier threshold** uses `>=` ($100 order earns 1.25x). Tiers are mutually exclusive; $200 supersedes $100.
- **Multiplier applies to base points only**, never to bonuses. The extra is logged as a separate `order_size_bonus` event.
- **A streak month** = a calendar month with at least one purchase. Two buys in one month do not advance the streak; skipping a calendar month resets it to 1.
- **Past-12 bonus** (+100) fires once per new streak month, not per order, to prevent farming.
- **`ARCHIVE_PASSWORD`** is unused — Archives access is decided by membership, not a code. The env var is kept only as an optional secondary gate. You can delete it.

## Project structure

```
src/
  app/
    layout.tsx            root layout, nav, Inter font
    page.tsx              Staple catalog
    archives/page.tsx     member gate + archive grid
    collective/page.tsx   explanation + dashboard
    api/join/route.ts     membership entry
  components/
    Nav, Footer, JoinForm, ProductCard, ProductGrid
    dashboard/            CollectiveDashboard, RewardsStrip, StreakTracker,
                          PointsHistory, ReferralBlock
  lib/
    points.ts             earning engine (tested)
    rewards.ts            rewards table + redemption state
    actions.ts            server actions: join, record order, redeem
    klaviyo.ts            flow triggers
    supabase/             browser + server + service clients
    session.ts            current-member resolver
    sample.ts             dev fallback data
supabase/
    schema.sql, seed.sql
```

## Design tokens

Hard-coded in `tailwind.config.ts` and `globals.css`: bg `#080808`, surface `#0D0D0D`, border `#1E1E1E`, text `#EFEFEF`, muted `#555`, gold `#C9A84C`, gold-light `#E8D5A3`, error `#8B3A3A`. No radius, no gradients, no shadows. Grid lines are 1px gaps over the border color. All transitions are wrapped in `prefers-reduced-motion: no-preference`.

> No generative AI imagery. Replace the placeholder blocks in `ProductCard` and the drop cards with real product photography before launch.
