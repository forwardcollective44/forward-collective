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
  await fetch(`${KLAVIYO_API}/events/`, {
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
  }).catch((e) => console.error("[klaviyo] track failed", e));
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
