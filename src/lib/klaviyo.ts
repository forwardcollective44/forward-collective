// Forward Collective — Klaviyo integration (server only).
//
// These are thin stubs that map to the eight flows in the spec. Each function
// tracks an event / upserts a profile in Klaviyo; the actual email + SMS
// content lives in Klaviyo flows triggered by these events and by the
// `collective_member` / `early_access` profile properties.
//
// Wire KLAVIYO_API_KEY in .env, then flesh out the fetch calls. Left as
// no-ops if the key is missing so local dev does not error.

const KLAVIYO_API = "https://a.klaviyo.com/api";
const REVISION = "2024-10-15";

function key(): string | null {
  return process.env.KLAVIYO_API_KEY ?? null;
}

async function track(metric: string, profile: { email?: string | null; phone?: string | null }, properties: Record<string, unknown> = {}) {
  const apiKey = key();
  if (!apiKey) {
    console.warn(`[klaviyo] no API key — skipping event "${metric}"`);
    return;
  }
  try {
    const res = await fetch(`${KLAVIYO_API}/events/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        accept: "application/json",
        revision: REVISION,
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            metric: { data: { type: "metric", attributes: { name: metric } } },
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: profile.email ?? undefined,
                  phone_number: profile.phone ?? undefined,
                },
              },
            },
            properties,
          },
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[klaviyo] track "${metric}" failed`, res.status, body.slice(0, 500));
    }
  } catch (e) {
    console.error(`[klaviyo] track "${metric}" failed`, e);
  }
}

// ---------------------------------------------------------------------------
// List subscription — this is what actually adds a member to your Klaviyo
// lists (and triggers the welcome flow, which fires on "Added to List").
// SMS List is double opt-in, so new numbers get a confirmation text.
// ---------------------------------------------------------------------------

const LIST_EMAIL = "TnYc45"; // "Email List"
const LIST_SMS = "RvV4cc"; // "SMS List"

function formatPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/[^\d]/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (raw.trim().startsWith("+")) return raw.trim();
  return null;
}

async function subscribeToList(listId: string, profileAttributes: Record<string, unknown>) {
  const apiKey = key();
  if (!apiKey) {
    console.warn("[klaviyo] no API key — skipping list subscribe");
    return;
  }
  try {
    const res = await fetch(`${KLAVIYO_API}/profile-subscription-bulk-create-jobs/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        accept: "application/json",
        revision: REVISION,
      },
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            profiles: {
              data: [{ type: "profile", attributes: profileAttributes }],
            },
          },
          relationships: { list: { data: { type: "list", id: listId } } },
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[klaviyo] subscribe to list ${listId} failed`, res.status, body.slice(0, 500));
    }
  } catch (e) {
    console.error(`[klaviyo] subscribe to list ${listId} failed`, e);
  }
}

// Subscribe a new member: email → Email List, phone → SMS List, each with
// marketing consent (joining the form is the consent).
export async function subscribeMember(p: { email?: string | null; phone?: string | null }) {
  if (p.email) {
    await subscribeToList(LIST_EMAIL, {
      email: p.email,
      subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } },
    });
  }
  const phone = formatPhone(p.phone);
  if (phone) {
    await subscribeToList(LIST_SMS, {
      phone_number: phone,
      subscriptions: { sms: { marketing: { consent: "SUBSCRIBED" } } },
    });
  }
}

// Flow 1 — Welcome (email + SMS): "You're in the Collective."
export const welcome = (p: { email?: string | null; phone?: string | null }, pointsBalance: number) =>
  track("Joined The Collective", p, { points_balance: pointsBalance, archives_unlocked: true });

// Flow 2 — Points earned (after each fulfilled order).
export const pointsEarned = (
  p: { email?: string | null; phone?: string | null },
  added: number,
  balance: number,
  nextRewardDescription: string | null
) => track("Points Earned", p, { points_added: added, points_balance: balance, next_reward: nextRewardDescription });

// Flow 4 — Milestone reached.
export const milestoneReached = (p: { email?: string | null; phone?: string | null }, milestonePoints: number) =>
  track("Milestone Reached", p, { milestone: milestonePoints });

// Flow 5 — Early access unlocked.
export const earlyAccessUnlocked = (p: { email?: string | null; phone?: string | null }) =>
  track("Early Access Unlocked", p, {});

// Flow 7 — Referral confirmed.
export const referralConfirmed = (p: { email?: string | null; phone?: string | null }) =>
  track("Referral Confirmed", p, {});
