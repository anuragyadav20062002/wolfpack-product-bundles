import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals({ nativeFetch: true });

// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the remix server. The CLI will eventually
// stop passing in HOST, so we can remove this workaround after the next major release.
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT!) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    allowedHosts: [host],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT ?? 3000),
    hmr: hmrConfig,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ["app", "node_modules", "extensions"],
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        // Issue: admin-lcp-phase2-universal-wins-1.
        // Remix's single-fetch parallelises child-route data loading and
        // removes a serial waterfall during navigation. Safe to enable as
        // long as no loader returns non-serializable values (Maps, Sets,
        // BigInts, Dates outside `defer()` payloads). Audited 2026-06-07:
        // every admin loader returns plain JSON shapes via Remix `json()`.
        v3_singleFetch: true,
        v3_routeConfig: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        chunkFileNames: (chunkInfo) => {
          // Don't generate chunks for routes with minimal content
          if (chunkInfo.name && (
            chunkInfo.name.includes('api.create-bundle-discount') ||
            chunkInfo.name.includes('api.get-function-id') ||
            chunkInfo.name.includes('api.check-bundles') ||
            chunkInfo.name.includes('auth._')
          )) {
            return 'assets/minimal-routes-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        // Issue: admin-lcp-phase2-universal-wins-1 — manual chunking.
        // Before: every admin route re-shipped recharts, polaris, react.
        // After: long-lived vendor bundles get their own files, cached
        // across navigations + across deploys (until the bundle's deps change).
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            // Issue: admin-lcp-phase5-recharts-lazy-1 — keep React's
            // useSyncExternalStore shim with React, NOT with charts. It's
            // shared by react-redux (recharts' dep) and react-i18next, and
            // Vite's default split was pulling vendor-charts onto every
            // i18next-using route.
            id.includes('node_modules/use-sync-external-store/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-vendor/')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/@shopify/')) {
            return 'vendor-shopify';
          }
          if (id.includes('node_modules/@remix-run/')) {
            return 'vendor-remix';
          }
          return undefined;
        },
      },
      onwarn: (warning, warn) => {
        // Suppress empty chunk warnings for known minimal routes
        if (warning.code === 'EMPTY_BUNDLE') {
          const knownEmptyRoutes = [
            'api.create-bundle-discount',
            'api.get-function-id',
            'api.check-bundles',
            'auth._'
          ];
          if (knownEmptyRoutes.some(route => warning.message?.includes(route))) {
            return; // Don't warn about these
          }
        }
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    include: ["@shopify/app-bridge-react", "@shopify/polaris"],
  },
}) satisfies UserConfig;
