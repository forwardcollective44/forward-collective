import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session on every request and keeps the
// session cookie current. Called from the root middleware.ts.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach(({ name, value }: any) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: any) =>
            response.cookies.set(name, value, options)
          );
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

  // Touch the session so the cookie refreshes if needed.
  await supabase.auth.getUser();
  return response;
}
