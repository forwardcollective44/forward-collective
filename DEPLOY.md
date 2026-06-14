# Forward Collective — Deploy to a live URL

Goal: get the headless storefront live on a `*.vercel.app` URL showing your real
Shopify products, then point forwardapparel.us at it.

You need two free accounts: **GitHub** (stores the code) and **Vercel** (hosts it).
Claude can drive every click except creating accounts and typing passwords.

## The two values you'll paste in (environment variables)

```
SHOPIFY_STORE_DOMAIN = gkufcd-m5.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN = <the Public access token from
  Shopify admin → Headless → Forward Apparel Headless → Storefront API>
```

## Step 1 — Put the code on GitHub

Easiest, no command line:
1. Go to github.com, sign up / sign in.
2. Click **New repository** → name it `forward-collective` → **Private** → Create.
3. On the empty repo page click **uploading an existing file**.
4. Drag in the contents of the `forward-collective` folder (the zip Claude
   gave you, unzipped). Do NOT include `node_modules` or `.next`.
5. Commit.

## Step 2 — Deploy on Vercel

1. Go to vercel.com → **Sign up** → **Continue with GitHub** (authorize it).
2. **Add New… → Project** → import your `forward-collective` repo.
3. Framework preset auto-detects **Next.js**. Leave build settings default.
4. Open **Environment Variables** and add the two values above.
5. Click **Deploy**. ~2 minutes later you get a live `https://forward-collective-xxxx.vercel.app` URL.
6. Open it — you should see the dark grid of your real products.

## Step 3 — Point your domain (do this only once the site looks right)

1. In Vercel: Project → **Settings → Domains** → add `forwardapparel.us`.
2. Vercel shows you DNS records (an A record and/or CNAME).
3. In your domain registrar (where you bought forwardapparel.us), update the
   DNS to match what Vercel shows. Propagation takes minutes to a few hours.

> Note: pointing the domain here means forwardapparel.us serves this headless
> site instead of your Shopify theme. Shopify still handles products, checkout,
> orders, and payments behind it. Your Rivo widget and the theme content pages
> live on the old Shopify storefront and won't appear here until rebuilt in the app.

## Step 4 — Checkout (next build, after deploy works)

The grid is read-only until cart + checkout is wired. That's the next code task:
add the Storefront `cart` mutations so "Add to cart" creates a Shopify cart and
redirects to Shopify's hosted checkout. Ask Claude to build the cart/checkout
once the site is live.

## Local preview (optional, to see it before deploying)

```
cd forward-collective
npm install
echo "SHOPIFY_STORE_DOMAIN=gkufcd-m5.myshopify.com" > .env.local
echo "SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_public_token" >> .env.local
npm run dev      # http://localhost:3000
```
