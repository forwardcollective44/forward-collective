import { cookies } from "next/headers";
import Link from "next/link";
import JoinForm from "@/components/JoinForm";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ExclusiveDrop from "@/components/ExclusiveDrop";
import { getCurrentMember } from "@/lib/session";
import {
  getArchiveSections,
  getExclusiveDropMeta,
  getExclusiveReveal,
  type ExclusiveReveal,
} from "@/lib/shopify";

export const dynamic = "force-dynamic";

export default async function ArchivesPage() {
  const member = await getCurrentMember();
  const sections = await getArchiveSections();

  // ---------- Non-member: built to convert ----------
  if (!member) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 md:px-8">
        <div className="space-y-6 text-center">
          <p className="fc-label text-muted">Members only</p>
          <h1 className="fc-display text-[clamp(40px,9vw,72px)] text-text">
            The Forward Archives
          </h1>
          <p className="fc-body text-text">
            Every Forward Collective drop that came before, plus first access to
            what&apos;s next. Past seasons, sold-out pieces, and the drops still
            to come. The Archives open the moment you join The Collective &mdash;
            free, instant, forever.
          </p>
        </div>

        {/* Locked teaser: what's inside */}
        {sections.length > 0 && (
          <div className="mt-10">
            <p className="fc-label text-muted">Inside the Archives</p>
            <div className="mt-3 grid gap-px bg-border sm:grid-cols-2">
              {sections.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-surface px-4 py-4">
                  <span className="fc-label text-text">{s.title}</span>
                  <span className="fc-label text-muted">Locked</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* The conversion point */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-12">
          <p className="fc-label text-text">Join with your number to unlock</p>
          <JoinForm cta="Unlock the Archives" />
          <p className="fc-label text-muted">
            Already a member?{" "}
            <Link href="/signin" className="fc-color text-gold hover:text-gold-light">
              Sign in.
            </Link>
          </p>
        </div>
        <Footer showJoin={false} />
      </main>
    );
  }

  // ---------- Member: exclusive drop (gated) + every past collection ----------
  const name = member.name?.split(" ")[0] || "Member";

  // The current exclusive drop. The gate only ever knows status + teaser; the
  // name and products come back only after a verified unlock. If this member
  // already unlocked it (cookie scoped to the drop), reveal it straight away.
  const dropMeta = await getExclusiveDropMeta();
  let initialReveal: ExclusiveReveal | null = null;
  if (dropMeta && dropMeta.status === "live") {
    const unlocked = cookies().get("fc_drop_unlocked")?.value === dropMeta.handle;
    if (unlocked) initialReveal = await getExclusiveReveal();
  }

  return (
    <main>
      <section className="px-5 py-10 md:px-8">
        <header className="max-w-2xl">
          <p className="fc-label text-muted">Forward Archives &mdash; Collective Members Only</p>
          <h1 className="fc-display mt-2 text-[clamp(32px,7vw,56px)] text-text">
            Welcome back, {name}.
          </h1>
          <p className="fc-body mt-3 text-text">
            Look back through every drop that came before, and see what&apos;s
            coming next. When we release something new here, you&apos;ll be the
            first to know &mdash; we&apos;ll text and email you the moment it lands.
          </p>
        </header>

        {/* The current exclusive drop, gated. Shows only when one is flagged. */}
        {dropMeta && (
          <div className="mt-12 border-y border-border py-10">
            <ExclusiveDrop
              status={dropMeta.status}
              teaser={dropMeta.teaser}
              initialReveal={initialReveal}
            />
          </div>
        )}

        {/* Past collections */}
        {sections.length === 0 ? (
          <div className="mt-10 bg-surface p-8">
            <p className="fc-body text-text">
              The archive is being catalogued. Check back soon &mdash; and watch
              your texts, we&apos;ll let you know the moment new history goes up.
            </p>
          </div>
        ) : (
          <div className="mt-12 space-y-16">
            {sections.map((s) => (
              <section key={s.id}>
                <h2 className="fc-display text-[clamp(24px,5vw,40px)] text-text">
                  {s.title}
                </h2>

                {/* Story + social proof — edited in Shopify (collection description) */}
                {s.descriptionHtml && (
                  <div
                    className="fc-body mt-4 max-w-2xl text-text [&_a]:text-gold [&_img]:my-5 [&_img]:w-full [&_p]:mt-3"
                    dangerouslySetInnerHTML={{ __html: s.descriptionHtml }}
                  />
                )}

                {/* The clothing — products in the collection */}
                {s.products.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-px bg-border md:grid-cols-3">
                    {s.products.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
      <Footer showJoin={false} />
    </main>
  );
}
