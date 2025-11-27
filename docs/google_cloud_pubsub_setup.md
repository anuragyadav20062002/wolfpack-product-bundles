# Google Cloud Pub/Sub Setup Guide for Shopify Webhooks

## Overview
This guide will help you set up Google Cloud Pub/Sub to receive webhooks from Shopify for your Wolfpack Product Bundles app.

## Prerequisites
- Google Cloud Project: `light-quest-455608-i3`
- Google Cloud CLI installed (optional, can use web console)
- Project billing enabled

## Step 1: Create Pub/Sub Topic

1. **Via Google Cloud Console:**
   - Go to: https://console.cloud.google.com/cloudpubsub/topic/list
   - Select project: `light-quest-455608-i3`
   - Click **"CREATE TOPIC"**
   - Topic ID: `wolfpack-only-bundles`
   - Leave other settings as default
   - Click **"CREATE"**

2. **Via gcloud CLI:**
   ```bash
   gcloud pubsub topics create wolfpack-only-bundles \
     --project=light-quest-455608-i3
   ```

## Step 2: Create Pub/Sub Subscription

1. **Via Google Cloud Console:**
   - Go to: https://console.cloud.google.com/cloudpubsub/subscription/list
   - Click **"CREATE SUBSCRIPTION"**
   - Subscription ID: `wolfpack-webhooks-subscription`
   - Select Cloud Pub/Sub topic: `wolfpack-only-bundles`
   - Delivery type: **Pull**
   - Message retention duration: **7 days**
   - Acknowledgement deadline: **600 seconds** (10 minutes)
   - Subscription expiration: **Never expire**
   - Click **"CREATE"**

2. **Via gcloud CLI:**
   ```bash
   gcloud pubsub subscriptions create wolfpack-webhooks-subscription \
     --topic=wolfpack-only-bundles \
     --project=light-quest-455608-i3 \
     --ack-deadline=600 \
     --message-retention-duration=7d
   ```

## Step 3: Grant Shopify Permissions

Shopify needs permission to publish messages to your Pub/Sub topic.

1. **Get Shopify's Service Account:**
   - Shopify uses: `shopify-eventbus@shopify-eventbus.iam.gserviceaccount.com`

2. **Grant Publisher Role:**

   **Via Google Cloud Console:**
   - Go to: https://console.cloud.google.com/cloudpubsub/topic/detail/wolfpack-only-bundles
   - Click **"PERMISSIONS"** tab
   - Click **"ADD PRINCIPAL"**
   - New principals: `shopify-eventbus@shopify-eventbus.iam.gserviceaccount.com`
   - Role: **Pub/Sub Publisher**
   - Click **"SAVE"**

   **Via gcloud CLI:**
   ```bash
   gcloud pubsub topics add-iam-policy-binding wolfpack-only-bundles \
     --member=serviceAccount:shopify-eventbus@shopify-eventbus.iam.gserviceaccount.com \
     --role=roles/pubsub.publisher \
     --project=light-quest-455608-i3
   ```

## Step 4: Create Service Account for Your App

Your Remix app needs credentials to pull messages from the subscription.

1. **Create Service Account:**

   **Via Google Cloud Console:**
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Click **"CREATE SERVICE ACCOUNT"**
   - Service account name: `wolfpack-webhooks-puller`
   - Service account ID: `wolfpack-webhooks-puller`
   - Description: "Service account for pulling webhook messages"
   - Click **"CREATE AND CONTINUE"**
   - Grant role: **Pub/Sub Subscriber**
   - Click **"CONTINUE"** then **"DONE"**

   **Via gcloud CLI:**
   ```bash
   gcloud iam service-accounts create wolfpack-webhooks-puller \
     --display-name="Wolfpack Webhooks Puller" \
     --description="Service account for pulling webhook messages" \
     --project=light-quest-455608-i3
   ```

2. **Grant Subscription Access:**

   **Via Google Cloud Console:**
   - Go to: https://console.cloud.google.com/cloudpubsub/subscription/detail/wolfpack-webhooks-subscription
   - Click **"PERMISSIONS"** tab
   - Click **"ADD PRINCIPAL"**
   - New principals: `wolfpack-webhooks-puller@light-quest-455608-i3.iam.gserviceaccount.com`
   - Role: **Pub/Sub Subscriber**
   - Click **"SAVE"**

   **Via gcloud CLI:**
   ```bash
   gcloud pubsub subscriptions add-iam-policy-binding wolfpack-webhooks-subscription \
     --member=serviceAccount:wolfpack-webhooks-puller@light-quest-455608-i3.iam.gserviceaccount.com \
     --role=roles/pubsub.subscriber \
     --project=light-quest-455608-i3
   ```

## Step 5: Generate and Download Service Account Key

1. **Via Google Cloud Console:**
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Find `wolfpack-webhooks-puller` service account
   - Click on it, then go to **"KEYS"** tab
   - Click **"ADD KEY"** → **"Create new key"**
   - Key type: **JSON**
   - Click **"CREATE"**
   - A JSON file will download automatically
   - **IMPORTANT:** Keep this file secure!

2. **Via gcloud CLI:**
   ```bash
   gcloud iam service-accounts keys create wolfpack-webhooks-key.json \
     --iam-account=wolfpack-webhooks-puller@light-quest-455608-i3.iam.gserviceaccount.com \
     --project=light-quest-455608-i3
   ```

## Step 6: Configure Environment Variables

Add these to your `.env` file:

```env
# Google Cloud Pub/Sub Configuration
GOOGLE_CLOUD_PROJECT=light-quest-455608-i3
PUBSUB_TOPIC=wolfpack-only-bundles
PUBSUB_SUBSCRIPTION=wolfpack-webhooks-subscription

# Service Account Credentials (JSON key file)
# Option 1: Store the entire JSON as a string
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account","project_id":"light-quest-455608-i3",...}'

# Option 2: Path to JSON key file (if deploying with file)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/wolfpack-webhooks-key.json
```

**For Render.com Deployment:**
1. Go to your Render dashboard
2. Select your web service
3. Go to **"Environment"** tab
4. Add the `GOOGLE_APPLICATION_CREDENTIALS_JSON` variable
5. Paste the entire contents of the JSON key file
6. Save changes

## Step 7: Verify Webhook Configuration

After deploying your app with the webhook handler:

1. **Check Shopify CLI:**
   ```bash
   shopify app config push
   ```

2. **Test Webhook Delivery:**
   - Trigger a test event (e.g., update a product)
   - Check Google Cloud Logging:
     ```bash
     gcloud logging read "resource.type=pubsub_subscription" \
       --project=light-quest-455608-i3 \
       --limit=10
     ```

3. **Monitor Messages:**
   ```bash
   gcloud pubsub subscriptions pull wolfpack-webhooks-subscription \
     --limit=1 \
     --project=light-quest-455608-i3
   ```

## Troubleshooting

### Messages Not Arriving
- Verify Shopify service account has Publisher role
- Check topic and subscription names match exactly
- Ensure webhooks are registered in shopify.app.toml
- Run `shopify app config push` to sync configuration

### Permission Denied Errors
- Verify service account has Subscriber role
- Check IAM permissions on both topic and subscription
- Ensure credentials JSON is valid and not expired

### Messages Piling Up
- Check if your webhook handler is acknowledging messages
- Verify acknowledgment deadline is sufficient (600 seconds)
- Monitor error logs in your application

## Cost Estimates

Google Cloud Pub/Sub pricing (as of 2025):
- First 10 GB per month: **FREE**
- Beyond 10 GB: $40 per TB

**Typical Usage:**
- ~1,000 webhooks/month = ~1 MB
- Well within free tier for most apps

## Security Best Practices

1. **Never commit service account keys to git**
2. **Use environment variables for credentials**
3. **Rotate service account keys regularly** (every 90 days)
4. **Monitor unusual activity** in Google Cloud Console
5. **Use principle of least privilege** (only grant necessary roles)

## Next Steps

After completing this setup:
1. Deploy your app with the webhook handler route
2. Test with a development store
3. Monitor the first few webhooks in Google Cloud Console
4. Set up alerting for webhook processing errors

## Useful Commands

```bash
# List all topics
gcloud pubsub topics list --project=light-quest-455608-i3

# List all subscriptions
gcloud pubsub subscriptions list --project=light-quest-455608-i3

# View subscription details
gcloud pubsub subscriptions describe wolfpack-webhooks-subscription \
  --project=light-quest-455608-i3

# Pull messages manually (for testing)
gcloud pubsub subscriptions pull wolfpack-webhooks-subscription \
  --auto-ack --limit=5 --project=light-quest-455608-i3

# View logs
gcloud logging read "resource.type=pubsub_subscription" \
  --project=light-quest-455608-i3 \
  --format=json \
  --limit=50
```

## Support Resources

- Google Cloud Pub/Sub Docs: https://cloud.google.com/pubsub/docs
- Shopify Webhook Docs: https://shopify.dev/docs/apps/webhooks
- Google Cloud Console: https://console.cloud.google.com
