import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import styles from "../../styles/routes/app-index.module.css";

// This route handles /app → shows the Welcome landing screen for all users.
//
// Auth strategy:
// - The layout (app.tsx) calls authenticate.admin() and handles token exchange
//   plus the exit-iframe bounce. By the time this component renders, auth is
//   complete and App Bridge is initialized.
// - This route must NOT call authenticate.admin() — Remix runs layout and child
//   loaders in parallel, and a second authenticate.admin() would race for the
//   same one-time id_token, causing token exchange failures.
// - Client-side navigation (useNavigate) works because App Bridge's fetch
//   interceptor adds the Authorization header to Remix data requests.
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
        <a
          className={styles.footerLink}
          href="mailto:support@wolfpack-bundles.com"
        >
          Contact Support
        </a>
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
