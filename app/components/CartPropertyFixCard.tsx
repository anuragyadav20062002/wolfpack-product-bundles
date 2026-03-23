import { useState, useCallback } from "react";
import { Card, BlockStack, InlineStack, Text } from "@shopify/polaris";

const LIQUID_SNIPPET = `or property.first contains '_'`;

const STEPS = [
  {
    n: 1,
    title: "Open your theme code editor",
    desc: "In Shopify admin: Online Store → Themes → Actions → Edit code.",
  },
  {
    n: 2,
    title: "Find the cart property loop",
    desc: "In cart.liquid or cart-items.liquid, locate the for property in item.properties loop.",
  },
  {
    n: 3,
    title: "Add this condition to the existing unless guard",
    desc: 'Inside the loop, find the unless condition (e.g. unless property.last == empty ...) and append the snippet below. If there is no unless, wrap the loop body with {%- unless property.first contains \'_\' -%} ... {%- endunless -%}.',
  },
] as const;

/**
 * Standalone inner content — usable inside AccordionItem or any container.
 * Does not include an outer Card wrapper.
 */
export function CartPropertyFixContent() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(LIQUID_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      // clipboard unavailable — no-op
    }
  }, []);

  return (
    <BlockStack gap="500">

      {/* ── Description ───────────────────────────────────────────── */}
      <Text variant="bodySm" tone="subdued" as="p">
        If your cart page shows internal properties like{' '}
        <code style={{
          fontFamily: '"SFMono-Regular", Consolas, monospace',
          background: '#f4f4f4',
          padding: '1px 5px',
          borderRadius: 3,
          fontSize: '0.88em',
        }}>_bundle_name</code>
        {' '}or{' '}
        <code style={{
          fontFamily: '"SFMono-Regular", Consolas, monospace',
          background: '#f4f4f4',
          padding: '1px 5px',
          borderRadius: 3,
          fontSize: '0.88em',
        }}>_is_bundle_parent</code>
        , your theme needs a one-line fix.
      </Text>

      {/* ── Numbered steps ────────────────────────────────────────── */}
      <BlockStack gap="300">
        {STEPS.map(({ n, title, desc }) => (
          <InlineStack key={n} gap="300" blockAlign="start" wrap={false}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: '#1a1a2e',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
              marginTop: 2,
            }}>
              {n}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <BlockStack gap="050">
                <Text variant="bodySm" fontWeight="semibold" as="p">{title}</Text>
                <Text variant="bodySm" tone="subdued" as="p">{desc}</Text>
              </BlockStack>
            </div>
          </InlineStack>
        ))}
      </BlockStack>

      {/* ── Code block ────────────────────────────────────────────── */}
      <div style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #30363d',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          background: '#161b22',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #30363d',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            <span style={{
              color: '#6e7681',
              fontFamily: '"SFMono-Regular", Consolas, monospace',
              fontSize: 11,
              marginLeft: 6,
            }}>
              cart-item.liquid — unless condition
            </span>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#1a4731' : '#21262d',
              color: copied ? '#3fb950' : '#c9d1d9',
              border: `1px solid ${copied ? '#238636' : '#30363d'}`,
              borderRadius: 6,
              padding: '4px 14px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          >
            {copied ? 'Copied!' : 'Copy snippet'}
          </button>
        </div>
        <pre style={{
          margin: 0,
          padding: '18px 22px',
          fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: 13,
          lineHeight: 1.75,
          color: '#e6edf3',
          background: '#0d1117',
          overflowX: 'auto',
          tabSize: 2,
        }}>
          <span style={{ color: '#79c0ff' }}>or </span>
          <span style={{ color: '#e6edf3' }}>property.first </span>
          <span style={{ color: '#79c0ff' }}>contains </span>
          <span style={{ color: '#a5d6ff' }}>'_'</span>
        </pre>
      </div>

      {/* ── Context label ─────────────────────────────────────────── */}
      <Text variant="bodySm" tone="subdued" as="p">
        Append this to the existing{' '}
        <code style={{
          fontFamily: '"SFMono-Regular", Consolas, monospace',
          background: '#f4f4f4',
          padding: '1px 5px',
          borderRadius: 3,
          fontSize: '0.88em',
        }}>unless</code>
        {' '}condition inside your property loop — for example:{' '}
        <code style={{
          fontFamily: '"SFMono-Regular", Consolas, monospace',
          background: '#f4f4f4',
          padding: '1px 5px',
          borderRadius: 3,
          fontSize: '0.88em',
        }}>unless property.last == empty or property.first contains '_'</code>
      </Text>

      {/* ── Footer note ───────────────────────────────────────────── */}
      <div style={{
        background: '#f6f6f7',
        border: '1px solid #e1e3e5',
        borderLeft: '3px solid #005bd3',
        borderRadius: '0 6px 6px 0',
        padding: '10px 14px',
      }}>
        <Text variant="bodySm" tone="subdued" as="p">
          <strong>Most themes don't need this.</strong>{' '}
          Dawn, Refresh, and other modern Shopify themes hide underscore-prefixed properties automatically.
          Only apply this fix if you can visibly see internal properties on your cart page.
        </Text>
      </div>

    </BlockStack>
  );
}

/**
 * Standalone Card-wrapped version — kept for potential single-card use.
 */
export function CartPropertyFixCard() {
  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack gap="200" blockAlign="center">
          <Text variant="headingSm" as="h3">Cart Property Display Fix</Text>
          <span style={{
            background: '#e8f4fd',
            color: '#0066b2',
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            Custom themes only
          </span>
        </InlineStack>
      </BlockStack>
      <div style={{ marginTop: 16 }}>
        <CartPropertyFixContent />
      </div>
    </Card>
  );
}
