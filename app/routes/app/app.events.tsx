import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../../shopify.server";
import { AccordionItem } from "../../components/AccordionItem";
import { CartPropertyFixContent } from "../../components/CartPropertyFixCard";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};

// ─────────────────────────────────────────────────────────────────────────────
// Static content — add new events / FAQs here
// ─────────────────────────────────────────────────────────────────────────────

const LATEST_EVENTS = [
  {
    id: "fpb-metafield-cache-v2.3.0",
    title: "Landing Page Bundles Now Load Instantly",
    subtitle: "Full-page bundles now load instantly — no app proxy round-trip on first paint.",
    badge: "v2.3.0",
    badgeColor: "#e6f4ea",
    badgeTextColor: "#1e7e34",
    content: (
      <s-stack direction="block" gap="base">
        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>Released: March 2026</p>
        <s-stack direction="block" gap="small-100">
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>What changed</p>
          <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
            Your full-page bundles now appear instantly when a customer visits the page —
            no more loading spinner while the bundle content loads in.
          </p>
        </s-stack>
        <s-stack direction="block" gap="small-100">
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Why it matters</p>
          <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
            A faster first impression means a smoother shopping experience. Customers see
            your bundle immediately, which reduces drop-off before they even engage with it.
          </p>
        </s-stack>
        <s-stack direction="block" gap="small-100">
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>What you need to do</p>
          <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
            For any full-page bundles you set up before this update, open the bundle and
            click <strong>Sync Bundle</strong> once. That&apos;s it — bundles you create going
            forward are already covered.
          </p>
        </s-stack>
      </s-stack>
    ),
  },
] as const;

const FAQS_AND_TUTORIALS = [
  {
    id: "cart-property-display-fix",
    title: "Cart Property Display Fix",
    subtitle: "Hide internal bundle properties from your cart page on custom themes.",
    badge: "Custom themes only",
    badgeColor: "#e8f4fd",
    badgeTextColor: "#0066b2",
    content: <CartPropertyFixContent />,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <>
      <ui-title-bar title="Updates &amp; FAQs">
        <button variant="breadcrumb" onClick={() => navigate("/app/dashboard")}>
          Dashboard
        </button>
      </ui-title-bar>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 4px 88px" }}>
        <s-stack direction="block" gap="large">

          {/* Latest Updates */}
          <s-stack direction="block" gap="base">
            <SectionHeader title="Latest Updates" count={LATEST_EVENTS.length} />
            <s-stack direction="block" gap="small">
              {LATEST_EVENTS.map((item) => (
                <AccordionItem
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  badge={item.badge}
                  badgeColor={item.badgeColor}
                  badgeTextColor={item.badgeTextColor}
                >
                  {item.content}
                </AccordionItem>
              ))}
            </s-stack>
          </s-stack>

          {/* FAQs & Tutorials */}
          <s-stack direction="block" gap="base">
            <SectionHeader title="FAQs & Tutorials" count={FAQS_AND_TUTORIALS.length} />
            <s-stack direction="block" gap="small">
              {FAQS_AND_TUTORIALS.map((item) => (
                <AccordionItem
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  badge={item.badge}
                  badgeColor={item.badgeColor}
                  badgeTextColor={item.badgeTextColor}
                >
                  {item.content}
                </AccordionItem>
              ))}
            </s-stack>
          </s-stack>

        </s-stack>
      </div>
    </>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <s-stack direction="inline" alignItems="center" gap="small-100">
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h2>
      <s-badge tone="info">{String(count)}</s-badge>
    </s-stack>
  );
}
