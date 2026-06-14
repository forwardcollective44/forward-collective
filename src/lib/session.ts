import { createClient } from "./supabase/server";
import type { User, PointEvent } from "./types";

/**
 * Returns the signed-in Collective member, or null if not signed in / not a
 * member. Access to gated areas (The Archives, the dashboard) is decided by
 * this, not by any password.
 */
export async function getCurrentMember(): Promise<User | null> {
  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (data && (data as User).collective_member) return data as User;
    return null;
  } catch {
    return null;
  }
}

export async function getMemberEvents(userId: string): Promise<PointEvent[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("point_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data as PointEvent[]) ?? [];
  } catch {
    return [];
  }
}
