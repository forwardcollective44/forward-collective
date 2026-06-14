import Link from "next/link";
import JoinForm from "@/components/JoinForm";
import Footer from "@/components/Footer";
import CollectiveDashboard from "@/components/dashboard/CollectiveDashboard";
import { getCurrentMember, getMemberEvents } from "@/lib/session";
import { SAMPLE_MEMBER, SAMPLE_EVENTS } from "@/lib/sample";

export const dynamic = "force-dynamic";

const EARN = [
  "1 point for every $1 you spend",
  "Orders over $100 earn 1.25x on that order",
  "Orders over $200 earn 1.5x on that order",
  "Buy 3 or more items in one order: +50 bonus points",
  "2nd purchase within 60 days: +75 bonus points",
  "3rd purchase ever: +50 bonus points",
  "3 months in a row: +100 bonus points",
  "6 months in a row: +200 bonus points",
  "12 months in a row: +500 bonus points",
  "Every purchase after a 12-month streak is maintained: +100 bonus points",
  "1-year membership anniversary: +150 bonus points",
  "Refer someone who buys: +200 bonus points (they get +100 on their first order)",
];

export default async function CollectivePage({
  searchParams,
}: {
  searchParams: { demo?: string };
}) {
  const member = await getCurrentMember();

  // `?demo=1` previews the member dashboard with sample data (no auth needed).
  if (member) {
    const events = await getMemberEvents(member.id);
    return (
      <main>
        <CollectiveDashboard user={member} events={events} />
      </main>
    );
  }
  if (searchParams.demo) {
    return (
      <main>
        <CollectiveDashboard user={SAMPLE_MEMBER} events={SAMPLE_EVENTS} />
      </main>
    );
  }

  // ---------- Non-member state ----------
  return (
    <main>
      <section className="mx-auto max-w-2xl px-5 py-16 md:px-8">
        <h1 className="fc-display text-[clamp(40px,9vw,72px)] text-text">The Collective</h1>

        <div className="fc-body mt-8 space-y-4 text-text">
          <p>
            The Collective is Forward&apos;s loyalty program. Join with your email or SMS and
            you&apos;re in immediately — no waiting, no levels to unlock.
          </p>
          <p>
            From the moment you join, you have access to The Archives, and you start earning
            points on every purchase. Points accumulate forever and never expire. The more
            consistently you buy, the more the system rewards you.
          </p>

          <p className="fc-label pt-4 text-muted">How you earn</p>
          <ul className="space-y-2">
            {EARN.map((line) => (
              <li key={line} className="fc-body text-text">
                — {line}
              </li>
            ))}
          </ul>

          <p className="fc-label pt-4 text-muted">What you can redeem</p>
          <p>
            Points unlock cash rewards starting at 150 points. At 6,000 points, you earn early
            access to every Forward Collective drop before it goes public. The rewards never
            stop.
          </p>
          <p>
            This is the only membership you&apos;ll ever need with us. Join once. Stay as long
            as you want. The longer you stay, the more you get.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <JoinForm />
          <p className="fc-label text-muted">
            Already a member?{" "}
            <Link href="/collective?demo=1" className="fc-color text-gold hover:text-gold-light">
              Sign in.
            </Link>
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
