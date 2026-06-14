import Link from "next/link";
import JoinForm from "@/components/JoinForm";
import Footer from "@/components/Footer";
import { getCurrentMember } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_DROPS } from "@/lib/sample";
import type { Drop } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getDrops(): Promise<Drop[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("drops")
      .select("*")
      .order("created_at", { ascending: false });
    if (data && data.length) return data as Drop[];
  } catch {
    /* fall through */
  }
  return SAMPLE_DROPS;
}

export default async function ArchivesPage() {
  const member = await getCurrentMember();

  // ---------- Non-member state ----------
  if (!member) {
    return (
      <main className="flex min-h-[calc(100vh-57px)] items-center justify-center px-5 py-16">
        <div className="w-full max-w-xl space-y-6 text-center">
          <h1 className="fc-display text-[clamp(40px,9vw,72px)] text-text">The Archives</h1>
          <div className="fc-body space-y-4 text-text">
            <p>
              The Archives is home to every Forward Collective drop that came before. Past
              seasons, sold-out pieces, and the full history of where this brand has been.
              Access is exclusive to members of The Collective.
            </p>
            <p>
              The Collective is our loyalty program and community — free to join, no catches.
              Sign up with your email or phone number and you&apos;re in. You&apos;ll earn
              points on every purchase, get rewarded for coming back, and unlock early drop
              access when you hit 6,000 points. Once you&apos;re a member, The Archives opens.
            </p>
            <p>Join The Collective below.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <JoinForm />
            <p className="fc-label text-muted">
              Already a member?{" "}
              <Link href="/collective" className="fc-color text-gold hover:text-gold-light">
                Sign in.
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ---------- Member state ----------
  const drops = await getDrops();
  return (
    <main>
      <section className="px-5 py-10 md:px-8">
        <p className="fc-label text-muted">The Archives — Collective Members Only</p>
        <div className="fc-grid mt-8 grid-cols-1 min-[480px]:grid-cols-2">
          {drops.map((drop, i) => (
            <article key={drop.id} className="space-y-3 bg-surface p-6">
              <p className="fc-label text-muted">
                Drop {String(drops.length - i).padStart(2, "0")}
              </p>
              <h2 className="fc-display text-[clamp(24px,4vw,40px)] text-text">{drop.name}</h2>
              <p className="fc-label text-muted">{drop.season}</p>
              <p className="fc-label text-gold">Archived</p>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
