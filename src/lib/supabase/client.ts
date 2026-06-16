"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client — anon key, RLS enforced.
// cookieOptions.maxAge keeps the auth cookies persistent (1 year) so a member
// stays signed in after closing and reopening the browser — not just on reload.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        path: "/",
      },
    }
  );
}
