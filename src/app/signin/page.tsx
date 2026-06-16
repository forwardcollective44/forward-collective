import Link from "next/link";
import JoinForm from "@/components/JoinForm";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <main>
      <section className="mx-auto max-w-md px-5 py-24 md:px-8">
        <p className="fc-label text-muted">The Collective</p>
        <h1 className="fc-display mt-2 text-[clamp(36px,8vw,60px)] text-text">
          Sign in
        </h1>
        <p className="fc-body mt-4 text-text">
          Enter your email and we&apos;ll send a secure sign-in link. No
          password to remember.
        </p>

        <div className="mt-8">
          <JoinForm mode="signin" cta="Send sign-in link" />
        </div>

        <p className="fc-label mt-8 text-muted">
          New here?{" "}
          <Link
            href="/collective"
            className="fc-color text-gold hover:text-gold-light"
          >
            Join the Collective.
          </Link>
        </p>
      </section>
      <Footer showJoin={false} />
    </main>
  );
}
