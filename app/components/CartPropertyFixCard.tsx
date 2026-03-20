import { useState, useCallback } from "react";
import { Card, BlockStack, InlineStack, Text } from "@shopify/polaris";

const LIQUID_SNIPPET = `{%- unless property.first contains '_' -%}
  <dt>{{ property.first }}</dt>
  <dd>{{ property.last }}</dd>
{%- endunless -%}`;

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
    title: "Wrap the loop body with this condition",
    desc: "Replace the loop body contents with the snippet below. Any property whose name starts with _ will be hidden from customers.",
  },
] as const;

export function CartPropertyFixCard() {
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
    <Card>
      <BlockStack gap="500">

        {/* ── Header ────────────────────────────────────────────────── */}
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
        </BlockStack>

        {/* ── Numbered steps ────────────────────────────────────────── */}
        <BlockStack gap="300">
          {STEPS.map(({ n, title, desc }) => (
            <InlineStack key={n} gap="300" blockAlign="start">
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
              <BlockStack gap="050">
                <Text variant="bodySm" fontWeight="semibold" as="p">{title}</Text>
                <Text variant="bodySm" tone="subdued" as="p">{desc}</Text>
              </BlockStack>
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
          {/* Window chrome bar */}
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
                cart.liquid
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

          {/* Code content */}
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
            <span style={{ color: '#ff7b72' }}>{'{%-'}</span>
            <span style={{ color: '#79c0ff' }}> unless </span>
            <span style={{ color: '#e6edf3' }}>property.first </span>
            <span style={{ color: '#79c0ff' }}>contains </span>
            <span style={{ color: '#a5d6ff' }}>'_'</span>
            <span style={{ color: '#ff7b72' }}>{' -%}'}</span>
            {'\n'}
            {'  '}
            <span style={{ color: '#7ee787' }}>{'<dt>'}</span>
            <span style={{ color: '#ff7b72' }}>{'{{'}</span>
            <span style={{ color: '#e6edf3' }}> property.first </span>
            <span style={{ color: '#ff7b72' }}>{'}}'}</span>
            <span style={{ color: '#7ee787' }}>{'</dt>'}</span>
            {'\n'}
            {'  '}
            <span style={{ color: '#7ee787' }}>{'<dd>'}</span>
            <span style={{ color: '#ff7b72' }}>{'{{'}</span>
            <span style={{ color: '#e6edf3' }}> property.last </span>
            <span style={{ color: '#ff7b72' }}>{'}}'}</span>
            <span style={{ color: '#7ee787' }}>{'</dd>'}</span>
            {'\n'}
            <span style={{ color: '#ff7b72' }}>{'{%-'}</span>
            <span style={{ color: '#79c0ff' }}> endunless </span>
            <span style={{ color: '#ff7b72' }}>{'-%}'}</span>
          </pre>
        </div>

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
    </Card>
  );
}
