"use server";

// Forward Collective — lead capture.
// One entry point for every email/SMS signup on the site (popup + footer form).
// Subscribes the lead to Klaviyo (Email + SMS lists, with consent) AND writes a
// Shopify customer record (email-marketing consent), in parallel. Both are
// best-effort: a failure in one never blocks the other, and missing API keys
// degrade to a quiet no-op so the signup still succeeds for the visitor.

import * as klaviyo from "./klaviyo";

const ADMIN_API_VERSION = "2025-10";

function adminEndpoint(): string | null {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) return null;
  return "https://" + domain + "/admin/api/" + ADMIN_API_VERSION + "/graphql.json";
}

function formatPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/[^\d]/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d.startsWith("1")) return "+" + d;
  if (raw.trim().startsWith("+")) return raw.trim();
  return null;
}

const CUSTOMER_MUTATION =
  "mutation Create($input: CustomerInput!) { customerCreate(input: $input) { customer { id } userErrors { field message } } }";

// Create a Shopify customer with email-marketing consent. If the email already
// exists, Shopify returns a "taken" error, which we treat as success. Needs
// SHOPIFY_ADMIN_API_KEY (admin access token with write_customers). No-ops if
// the token is missing. Never throws.
async function upsertShopifyCustomer(p: {
  email?: string | null;
  phone?: string | null;
}): Promise<void> {
  const token = process.env.SHOPIFY_ADMIN_API_KEY;
  const url = adminEndpoint();
  if (!token || !url || !p.email) {
    if (!token) console.warn("[shopify] no admin token — skipping customer upsert");
    return;
  }

  const input: Record<string, unknown> = {
    email: p.email,
    emailMarketingConsent: {
      marketingState: "SUBSCRIBED",
      marketingOptInLevel: "SINGLE_OPT_IN",
    },
    tags: ["forward-collective", "site-signup"],
  };
  const phone = formatPhone(p.phone);
  if (phone) input.phone = phone;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query: CUSTOMER_MUTATION, variables: { input } }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    // Surface HTTP-level and top-level GraphQL errors (auth, unsupported
    // version, throttling) — these appear as json.errors, not userErrors.
    if (!res.ok || (json && json.errors)) {
      console.error(
        "[shopify] admin call failed",
        res.status,
        JSON.stringify(json?.errors ?? json)?.slice(0, 500)
      );
      return;
    }
    const errs = json?.data?.customerCreate?.userErrors;
    if (Array.isArray(errs) && errs.length) {
      const onlyTaken = errs.every((e: any) =>
        /taken|already|exists/i.test(String(e?.message || ""))
      );
      if (!onlyTaken) console.error("[shopify] customerCreate errors", errs);
    }
  } catch (e) {
    console.error("[shopify] customer upsert failed", e);
  }
}

export async function subscribeLead(input: {
  email?: string;
  phone?: string;
}): Promise<{ ok: boolean; message: string }> {
  const email = input.email?.trim() || undefined;
  const phone = input.phone?.trim() || undefined;

  if (!email && !phone) {
    return { ok: false, message: "Enter your email to join." };
  }

  await Promise.allSettled([
    klaviyo.subscribeMember({ email, phone }),
    upsertShopifyCustomer({ email, phone }),
  ]);

  return {
    ok: true,
    message: "You're in. Watch your inbox and texts for first access.",
  };
}
