-- Shopify App Bridge now supplies the embedded Admin Web Vitals signal used for
-- Built for Shopify assessment. Drop the previous app-owned LCP beacon store.
DROP TABLE IF EXISTS "AdminWebVital";
