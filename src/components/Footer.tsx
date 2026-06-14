import JoinForm from "./JoinForm";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      {/* Opt-in strip */}
      <div className="flex flex-col gap-5 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="fc-display text-[clamp(18px,3vw,28px)] text-text">
          Join The Collective.
          <br />
          Earn points on every order.
        </p>
        <JoinForm variant="footer" />
      </div>
      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t border-border px-5 py-5 md:px-8">
        <span className="fc-label text-muted">Keep Moving Forward</span>
        <span className="fc-label text-muted">FC — 2026</span>
      </div>
    </footer>
  );
}
