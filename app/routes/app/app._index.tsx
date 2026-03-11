import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import styles from "../../styles/routes/app-index.module.css";

// This route handles /app → shows the Welcome landing screen for intentional visits,
// and silently redirects to the dashboard when Shopify's auth flow lands here.
//
// Auth strategy:
// - The layout (app.tsx) calls authenticate.admin() and handles token exchange
//   plus the exit-iframe bounce. By the time this component renders, auth is
//   complete and App Bridge is initialized.
// - This route must NOT call authenticate.admin() — Remix runs layout and child
//   loaders in parallel, and a second authenticate.admin() would race for the
//   same one-time id_token, causing token exchange failures.
// - Server-side redirects must not be used here — they lose auth context.
//
// Landing page flash fix:
// - showLanding starts false on both server and client (no SSR flash).
// - On mount, we check for Shopify auth params (shop/host/id_token).
//   • Auth params present  → Shopify's auth flow landed here → redirect to dashboard.
//   • No auth params       → intentional navigation → show the landing page.
export const loader = async () => {
  return json(null);
};

const FEATURES = [
  {
    icon: "🛒",
    iconClass: styles.iconPurple,
    title: "Product Page Bundles",
    desc: "Slide-out drawer on any product page. Customers build their bundle without leaving the page.",
  },
  {
    icon: "📄",
    iconClass: styles.iconTeal,
    title: "Full-Page Bundles",
    desc: "Dedicated bundle pages with step-by-step tabs, timeline navigation, and sidebar layouts.",
  },
  {
    icon: "🎨",
    iconClass: styles.iconOrange,
    title: "Design Control Panel",
    desc: "Pixel-perfect customization — colors, typography, promo banners, GIF loaders, and custom CSS.",
  },
  {
    icon: "📊",
    iconClass: styles.iconBlue,
    title: "UTM Attribution Analytics",
    desc: "Track bundle revenue by ad platform, campaign, and bundle. First-party web pixel included.",
  },
  {
    icon: "🏷️",
    iconClass: styles.iconGreen,
    title: "Smart Discount Rules",
    desc: "Percentage off, fixed amount, or fixed bundle price. Quantity-based tiered discounts.",
  },
  {
    icon: "🔀",
    iconClass: styles.iconPink,
    title: "Mix & Match Steps",
    desc: "Multi-step bundles with per-step conditions, collection filters, and inventory sync.",
  },
];

export default function AppIndex() {
  const navigate = useNavigate();
  // Start false so the server renders nothing (no SSR flash during auth bounces).
  // The useEffect below flips this to true only for intentional /app visits.
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Shopify's auth flow redirects to /app with one or more of these params.
    // When they're present we're mid-auth — silently move on to the dashboard.
    const isAuthFlow =
      params.has("id_token") || params.has("host") || params.has("shop");

    if (isAuthFlow) {
      navigate("/app/dashboard", { replace: true });
    } else {
      setShowLanding(true);
    }
  }, [navigate]);

  if (!showLanding) return null;

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.brandRow}>
            <div className={styles.wolfIcon}>🐺</div>
            <span className={styles.brandName}>Wolfpack Apps</span>
          </div>

          <h1 className={styles.heroTitle}>
            Welcome to <span>Wolfpack</span>
            <br />
            Product Bundles
          </h1>

          <p className={styles.heroSubtitle}>
            The complete bundle solution for Shopify — build, customize, and
            promote product bundles that convert.
          </p>

          <div className={styles.ctaRow}>
            <button
              className={styles.btnPrimary}
              onClick={() => navigate("/app/onboarding")}
            >
              ✦ Get Started
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => navigate("/app/dashboard")}
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className={styles.featuresSection}>
        <p className={styles.sectionLabel}>Everything included</p>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={`${styles.featureIconWrap} ${f.iconClass}`}>
                {f.icon}
              </div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer strip ── */}
      <div className={styles.footerStrip}>
        <button
          className={styles.footerLink}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onClick={() => {
            if (window.$crisp) window.$crisp.push(["do", "chat:open"]);
          }}
        >
          Contact Support
        </button>
        <span className={styles.footerDot} />
        <a
          className={styles.footerLink}
          href="https://docs.wolfpack-bundles.com"
          target="_blank"
          rel="noreferrer"
        >
          Documentation
        </a>
        <span className={styles.footerDot} />
        <button
          className={styles.footerLink}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onClick={() => navigate("/app/pricing")}
        >
          View Plans
        </button>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    $crisp?: any[];
  }
}
