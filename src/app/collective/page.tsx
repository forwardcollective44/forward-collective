import JoinForm from "@/components/JoinForm";
import Footer from "@/components/Footer";
import PointsLine from "@/components/PointsLine";
import CollectiveDashboard from "@/components/dashboard/CollectiveDashboard";
import { getCurrentMember, getMemberEvents } from "@/lib/session";
import { SAMPLE_MEMBER, SAMPLE_EVENTS } from "@/lib/sample";

export const dynamic = "force-dynamic";

const PERKS = [
  { t: "Points on everything", d: "1 point for every $1. They never expire." },
  { t: "Cash rewards", d: "Redeem from 150 points. The ladder never ends." },
  { t: "Early access", d: "At 6,000 points, the Kadima Archives and every drop open early." },
];

export default async function CollectivePage({
  searchParams,
}: {
  searchParams: { demo?: string };
}) {
  const member = await getCurrentMember();

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

  // ---------- Non-member: short, perks, the points line, the form ----------
  return (
    <main>
      <section className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <h1 className="fc-display text-[clamp(40px,9vw,72px)] text-text">
          The Collective
        </h1>
        <p className="fc-body mt-6 max-w-xl text-text">
          Forward&apos;s membership. Join with your number and you&apos;re in &mdash;
          instant, free, forever. Every order earns points that never expire, and
          the further you go, the more opens up.
        </p>

        {/* Perks */}
        <div className="mt-10 grid gap-px bg-border sm:grid-cols-3">
          {PERKS.map((p) => (
            <div key={p.t} className="bg-surface p-5">
              <p className="fc-label text-text">{p.t}</p>
              <p className="fc-body mt-2 text-muted">{p.d}</p>
            </div>
          ))}
        </div>

        {/* The points system, as a line instead of a list */}
        <div className="mt-14">
          <p className="fc-label text-muted">The points line</p>
          <p className="fc-body mt-2 max-w-xl text-text">
            One point per dollar. Cross a milestone, claim the reward. Your line
            picks up wherever you left off &mdash; it only moves forward.
          </p>
          <div className="mt-6">
            <PointsLine demo />
          </div>
        </div>

        {/* Join */}
        <div className="mt-14">
          <JoinForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
