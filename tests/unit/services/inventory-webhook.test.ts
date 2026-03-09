/**
 * Unit Tests for Inventory Webhook Handler
 * Tests webhook processing for inventory_levels/update topic
 */

jest.mock('../../../app/db.server', () => ({
  __esModule: true,
  default: {
    stepProduct: {
      findMany: jest.fn(),
    },
    bundle: {
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../../../app/shopify.server', () => ({
  unauthenticated: {
    admin: jest.fn(),
  },
}));

jest.mock('../../../app/services/bundles/inventory-sync.server', () => ({
  syncBundleInventory: jest.fn(),
}));

import { handleInventoryUpdate } from '../../../app/services/webhooks/handlers/inventory.server';
import { syncBundleInventory } from '../../../app/services/bundles/inventory-sync.server';

describe('Inventory Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return early when inventory_item_id is missing from payload', async () => {
    const result = await handleInventoryUpdate('test-shop.myshopify.com', {});
    expect(result.success).toBe(true);
    expect(result.message).toContain('no inventory_item_id');
  });

  it('should return early when no bundles contain the updated product', async () => {
    const db = require('../../../app/db.server').default;
    db.stepProduct.findMany.mockResolvedValue([]);

    const result = await handleInventoryUpdate('test-shop.myshopify.com', {
      inventory_item_id: 12345,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('not in any active bundle');
  });

  it('should mark affected bundles as stale and trigger sync', async () => {
    const db = require('../../../app/db.server').default;
    const { unauthenticated } = require('../../../app/shopify.server');

    db.stepProduct.findMany.mockResolvedValue([
      {
        step: {
          bundle: {
            id: 'bundle-1',
            shopId: 'test-shop.myshopify.com',
            status: 'active',
          },
        },
      },
      {
        step: {
          bundle: {
            id: 'bundle-2',
            shopId: 'test-shop.myshopify.com',
            status: 'active',
          },
        },
      },
    ]);

    db.bundle.updateMany.mockResolvedValue({ count: 2 });

    const mockAdmin = { graphql: jest.fn() };
    unauthenticated.admin.mockResolvedValue({ admin: mockAdmin });
    (syncBundleInventory as jest.Mock).mockResolvedValue({ success: true, skipped: false });

    const result = await handleInventoryUpdate('test-shop.myshopify.com', {
      inventory_item_id: 12345,
    });

    expect(result.success).toBe(true);
    // Should have marked bundles stale
    expect(db.bundle.updateMany).toHaveBeenCalled();
    // Should have triggered sync for each unique bundle
    expect(syncBundleInventory).toHaveBeenCalledTimes(2);
  });

  it('should deduplicate bundle IDs when same bundle found via multiple steps', async () => {
    const db = require('../../../app/db.server').default;
    const { unauthenticated } = require('../../../app/shopify.server');

    db.stepProduct.findMany.mockResolvedValue([
      {
        step: {
          bundle: { id: 'bundle-1', shopId: 'test-shop.myshopify.com', status: 'active' },
        },
      },
      {
        step: {
          bundle: { id: 'bundle-1', shopId: 'test-shop.myshopify.com', status: 'active' },
        },
      },
    ]);

    db.bundle.updateMany.mockResolvedValue({ count: 1 });

    const mockAdmin = { graphql: jest.fn() };
    unauthenticated.admin.mockResolvedValue({ admin: mockAdmin });
    (syncBundleInventory as jest.Mock).mockResolvedValue({ success: true, skipped: false });

    await handleInventoryUpdate('test-shop.myshopify.com', {
      inventory_item_id: 12345,
    });

    // Should only sync once despite two step products pointing to same bundle
    expect(syncBundleInventory).toHaveBeenCalledTimes(1);
  });

  it('should handle sync errors gracefully without crashing', async () => {
    const db = require('../../../app/db.server').default;
    const { unauthenticated } = require('../../../app/shopify.server');

    db.stepProduct.findMany.mockResolvedValue([
      {
        step: {
          bundle: { id: 'bundle-1', shopId: 'test-shop.myshopify.com', status: 'active' },
        },
      },
    ]);

    db.bundle.updateMany.mockResolvedValue({ count: 1 });

    const mockAdmin = { graphql: jest.fn() };
    unauthenticated.admin.mockResolvedValue({ admin: mockAdmin });
    (syncBundleInventory as jest.Mock).mockRejectedValue(new Error('Shopify API down'));

    const result = await handleInventoryUpdate('test-shop.myshopify.com', {
      inventory_item_id: 12345,
    });

    // Should not crash — returns error result
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should skip archived/draft bundles', async () => {
    const db = require('../../../app/db.server').default;

    db.stepProduct.findMany.mockResolvedValue([
      {
        step: {
          bundle: { id: 'bundle-1', shopId: 'test-shop.myshopify.com', status: 'archived' },
        },
      },
      {
        step: {
          bundle: { id: 'bundle-2', shopId: 'test-shop.myshopify.com', status: 'draft' },
        },
      },
    ]);

    const result = await handleInventoryUpdate('test-shop.myshopify.com', {
      inventory_item_id: 12345,
    });

    expect(result.success).toBe(true);
    // No sync triggered for non-active bundles
    expect(syncBundleInventory).not.toHaveBeenCalled();
  });
});
