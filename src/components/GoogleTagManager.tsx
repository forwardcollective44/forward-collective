import Script from "next/script";

/**
 * Google Tag Manager loader.
 *
 * The headless storefront loads ONE thing: the GTM container. Every marketing
 * and analytics tag (GA4, Google Ads conversions, Google Ads remarketing, Meta,
 * TikTok) lives inside the container at tagmanager.google.com and is managed
 * there, so adding or changing a tag never needs a code deploy. This avoids
 * loading the same pixels twice (the old approach hardcoded them in the page).
 *
 * Set NEXT_PUBLIC_GTM_ID in Vercel (e.g. GTM-5STQDDVZ), then redeploy. The
 * loader no-ops if the ID is missing.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function GoogleTagManagerHead() {
  if (!GTM_ID) return null;
  return (
    <Script id="gtm-base" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

// Fallback for users with JavaScript disabled. Renders right after <body>.
export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="gtm"
      />
    </noscript>
  );
}
