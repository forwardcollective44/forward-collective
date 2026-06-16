import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Supabase client — anon key, reads the user's session from cookies.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore when
            // middleware refreshes the session.
          }
        },
      },
      // Persist auth cookies for a year so members stay signed in across
      // browser restarts, not just page reloads.
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        path: "/",
      },
    }
  );
}

// Service-role client — bypasses RLS. Server only. Never expose to the browser.
// Use for crediting points, anniversary jobs, and redemption writes.
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
