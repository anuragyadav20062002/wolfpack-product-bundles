const functions = require('@google-cloud/functions-framework');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');
require('dotenv').config();

// Initialize Prisma with Accelerate - do this OUTSIDE the handler
let prismaClient;

function getPrismaClient() {
  if (!prismaClient) {
    console.log('Initializing Prisma client with Accelerate');
    // Using Accelerate is recommended for serverless environments
    prismaClient = new PrismaClient().$extends(withAccelerate());
  }
  return prismaClient;
}

// Shopify webhook secret from environment variable
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

// Verify Shopify webhook signature
function verifyShopifyWebhook(data, hmacHeader) {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.error('SHOPIFY_WEBHOOK_SECRET environment variable is not set');
    return false;
  }

  try {
    const calculatedHmac = crypto
      .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
      .update(data, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac),
      Buffer.from(hmacHeader)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Process customer data request
async function processCustomerDataRequest(shop, payload) {
  console.log(`Processing customer data request for shop: ${shop}`);
  const prisma = getPrismaClient();
  const customerId = payload.customer?.id;

  try {
    const complianceRecord = await prisma.complianceRecord.create({
      data: {
        shop: shop,
        type: 'customer_data_request',
        payload: payload,
        status: 'processing',
      }
    });

    const analyticsRecords = await prisma.bundleAnalytics.findMany({
      where: {
        shopId: shop,
        metadata: { path: ['customer_id'], equals: customerId }
      },
      include: { Bundle: { select: { name: true } } }
    });

    const customerData = {
      customer_id: customerId,
      email: payload.customer?.email,
      analytics: analyticsRecords.map(row => ({
        event: row.event,
        bundle_name: row.Bundle?.name || 'Unknown',
        timestamp: row.createdAt,
        metadata: row.metadata
      })),
      timestamp: new Date().toISOString()
    };
    console.log(`Found ${customerData.analytics.length} analytics records for customer ${customerId}`);

    await prisma.complianceRecord.update({
      where: { id: complianceRecord.id },
      data: { status: 'completed', processedAt: new Date() }
    });
    
    return { success: true, data: customerData };
  } catch (error) {
    console.error(`Error processing customer data request: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Process customer data redaction
async function processCustomerRedaction(shop, payload) {
  console.log(`Processing customer redaction for shop: ${shop}`);
  const prisma = getPrismaClient();
  const customerId = payload.customer?.id;

  try {
    const complianceRecord = await prisma.complianceRecord.create({
      data: {
        shop: shop,
        type: 'customer_redact',
        payload: payload,
        status: 'processing',
      }
    });

    const deleteResult = await prisma.bundleAnalytics.deleteMany({
      where: {
        shopId: shop,
        metadata: { path: ['customer_id'], equals: customerId }
      }
    });
    
    console.log(`Redacted ${deleteResult.count} analytics records for customer ${customerId}`);
    
    await prisma.complianceRecord.update({
      where: { id: complianceRecord.id },
      data: { status: 'completed', processedAt: new Date() }
    });
    
    return { success: true };
  } catch (error) {
    console.error(`Error processing customer redaction: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Process shop data redaction
async function processShopRedaction(shop, payload) {
  console.log(`Processing shop redaction for shop: ${shop}`);
  const prisma = getPrismaClient();

  try {
    const complianceRecord = await prisma.complianceRecord.create({
      data: {
        shop: shop,
        type: 'shop_redact',
        payload: payload,
        status: 'processing',
      }
    });

    // Using a transaction to ensure all or nothing is deleted.
    // The Prisma schema's `onDelete: Cascade` handles the deletion of related
    // steps, pricing, and analytics when a bundle is deleted.
    await prisma.$transaction(async (tx) => {
      // 1. Delete all bundles for the shop. This will cascade to related models.
      const bundlesResult = await tx.bundle.deleteMany({ where: { shopId: shop } });
      console.log(`Deleted ${bundlesResult.count} bundles and their related data for shop ${shop}`);

      // 2. Delete shop settings
      const settingsResult = await tx.shopSettings.deleteMany({ where: { shopId: shop } });
      console.log(`Deleted ${settingsResult.count} shop settings for shop ${shop}`);
      
      // 3. Delete queued jobs
      const jobsResult = await tx.queuedJob.deleteMany({ where: { shopId: shop } });
      console.log(`Deleted ${jobsResult.count} queued jobs for shop ${shop}`);
      
      // 4. Delete sessions
      const sessionsResult = await tx.session.deleteMany({ where: { shop: shop } });
      console.log(`Deleted ${sessionsResult.count} sessions for shop ${shop}`);

      // 5. Delete remaining compliance records for this shop
      const complianceResult = await tx.complianceRecord.deleteMany({ where: { shop: shop, id: { not: complianceRecord.id } } });
      console.log(`Deleted ${complianceResult.count} old compliance records for shop ${shop}`);
    });
    
    await prisma.complianceRecord.update({
      where: { id: complianceRecord.id },
      data: { status: 'completed', processedAt: new Date() }
    });
    
    console.log(`Shop redaction processed successfully for shop: ${shop}`);
    return { success: true };
  } catch (error) {
    console.error(`Error processing shop redaction: ${error.message}`);
    return { success: false, error: error.message };
  }
}


// Main webhook handler function - THIS IS THE ENTRY POINT
functions.http('shopifyWebhookHandler', async (req, res) => {
  console.log('Received a webhook request.');

  // Health check endpoint
  if (req.method === 'GET') {
    res.status(200).send('Webhook handler is running.');
    return;
  }

  // Verify the request is a POST request
  if (req.method !== 'POST') {
    console.error('Request method is not POST.');
    res.setHeader('Allow', 'POST');
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  try {
    // The actual payload is the JSON body.
    const payload = req.body;
    
    // Verify the webhook signature
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    if (!verifyShopifyWebhook(JSON.stringify(payload), hmacHeader)) {
      console.error('Could not validate webhook request.');
      return res.status(401).send('Unauthorized');
    }

    const shop = req.headers['x-shopify-shop-domain'];
    const topic = req.headers['x-shopify-topic'];
    
    if (!shop || !topic) {
      return res.status(400).send('Bad Request: Missing required headers.');
    }
    
    console.log(`Processing ${topic} webhook for shop: ${shop}`);
    let result;
    
    switch (topic) {
      case 'customers/data_request':
        result = await processCustomerDataRequest(shop, payload);
        break;
      case 'customers/redact':
        result = await processCustomerRedaction(shop, payload);
        break;
      case 'shop/redact':
        result = await processShopRedaction(shop, payload);
        break;
      default:
        console.warn(`Unsupported webhook topic: ${topic}`);
        return res.status(200).send('Webhook received, but topic is not handled.');
    }
    
    if (result.success) {
      return res.status(200).send('Webhook processed successfully.');
    } else {
      console.error(`Failed to process webhook: ${result.error}`);
      return res.status(500).send('Error processing webhook.');
    }

  } catch (error) {
    console.error('Unexpected error in webhook handler:', error);
    res.status(500).send('Internal Server Error.');
  }
});

// Add a special handler for the health check
functions.http('healthCheck', (req, res) => {
  res.status(200).send('OK');
});