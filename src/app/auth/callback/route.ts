import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureMember } from "@/lib/actions";

// Magic-link landing. Supabase redirects here with a `code`; we exchange it
// for a session, make sure the member record exists (+welcome points on first
// sign-in), then send them to The Collective.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/collective";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await ensureMember(user.id, user.email ?? null);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/?auth=error`);
}
