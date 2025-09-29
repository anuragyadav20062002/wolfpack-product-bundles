import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { ThemeTemplateService } from "../services/theme-template-service.server";
import db from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  try {
    const shopDomain = session.shop.includes('.myshopify.com')
      ? session.shop.replace('.myshopify.com', '')
      : session.shop;

    const templateService = new ThemeTemplateService(admin, shopDomain);

    // Test 1: Get current theme ID
    console.log('🧪 [TEST] Getting current theme ID...');
    const themeId = await templateService.getCurrentThemeId();

    // Test 2: Get available product templates
    console.log('🧪 [TEST] Getting available product templates...');
    const templates = await templateService.getAvailableProductTemplates();

    // Test 3: Check if a test template exists
    const testProductHandle = 'test-bundle-product';
    console.log(`🧪 [TEST] Checking if template exists for: ${testProductHandle}`);
    const templateExists = await templateService.checkProductTemplateExists(testProductHandle);

    // Test 4: Get a sample bundle to test deep link generation
    const sampleBundle = await db.bundle.findFirst({
      where: { shopId: session.shop },
      include: {
        steps: {
          include: {
            products: true
          }
        }
      }
    });

    let deepLinkTest = null;
    if (sampleBundle) {
      console.log('🧪 [TEST] Generating deep link for sample bundle...');
      deepLinkTest = templateService.generateThemeEditorLink(
        'product',
        sampleBundle.id.toString(),
        'test-product'
      );
    }

    // Test 5: Try creating a test template (if it doesn't exist)
    let templateCreationTest = null;
    if (!templateExists) {
      console.log('🧪 [TEST] Testing template creation...');
      templateCreationTest = await templateService.ensureProductTemplate(testProductHandle);
    }

    const results = {
      success: true,
      shopDomain,
      tests: {
        themeId: {
          success: !!themeId,
          value: themeId,
          message: themeId ? 'Theme ID retrieved successfully' : 'Failed to get theme ID'
        },
        templates: {
          success: templates.length > 0,
          count: templates.length,
          templates: templates.slice(0, 5), // First 5 for brevity
          message: `Found ${templates.length} product templates`
        },
        templateExists: {
          success: true,
          productHandle: testProductHandle,
          exists: templateExists,
          message: templateExists ? 'Test template exists' : 'Test template does not exist'
        },
        deepLink: {
          success: !!deepLinkTest,
          url: deepLinkTest,
          bundleId: sampleBundle?.id,
          message: deepLinkTest ? 'Deep link generated successfully' : 'No bundle available for deep link test'
        },
        templateCreation: templateCreationTest ? {
          success: templateCreationTest.exists,
          created: templateCreationTest.created,
          handle: templateCreationTest.handle,
          message: templateCreationTest.created ? 'Template created successfully' : 'Template creation failed or already exists'
        } : {
          success: true,
          message: 'Template creation skipped - template already exists'
        }
      },
      recommendations: []
    };

    // Add recommendations based on test results
    if (!themeId) {
      results.recommendations.push('⚠️ Unable to retrieve theme ID - check API permissions and authentication');
    }

    if (templates.length === 0) {
      results.recommendations.push('⚠️ No product templates found - theme may not support JSON templates');
    }

    if (!deepLinkTest) {
      results.recommendations.push('⚠️ No bundles available for deep link testing - create a test bundle first');
    }

    if (templateCreationTest && !templateCreationTest.exists) {
      results.recommendations.push('⚠️ Template creation failed - check theme write permissions');
    }

    console.log('✅ [TEST] Theme editor integration tests completed');
    console.log('📊 [TEST] Results:', results);

    return json(results);

  } catch (error) {
    console.error('🚨 [TEST] Theme editor integration test failed:', error);
    return json(
      {
        success: false,
        error: "Theme editor integration test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function loader({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  try {
    const shopDomain = session.shop.includes('.myshopify.com')
      ? session.shop.replace('.myshopify.com', '')
      : session.shop;

    const templateService = new ThemeTemplateService(admin, shopDomain);

    // Quick health check
    const themeId = await templateService.getCurrentThemeId();
    const templates = await templateService.getAvailableProductTemplates();

    return json({
      success: true,
      shopDomain,
      themeId,
      templateCount: templates.length,
      status: 'Theme editor integration service is operational'
    });

  } catch (error) {
    console.error('🚨 [TEST] Health check failed:', error);
    return json(
      {
        success: false,
        error: "Health check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}