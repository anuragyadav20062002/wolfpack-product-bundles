/**
 * Unit Tests for Inventory Sync Service
 * Tests bundle inventory calculation logic and Shopify API sync operations
 */

import { mockShopifyAdmin, createMockGraphQLResponse } from '../../setup';

// Mock db.server before importing the module under test
jest.mock('../../../app/db.server', () => ({
  __esModule: true,
  default: {
    bundle: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    stepProduct: {
      findMany: jest.fn(),
    },
  },
}));

// Mock shopify.server
jest.mock('../../../app/shopify.server', () => ({
  unauthenticated: {
    admin: jest.fn(),
  },
}));

import {
  calculateMinInventory,
  calculateBundleInventory,
  setInventoryLevel,
  syncBundleInventory,
} from '../../../app/services/bundles/inventory-sync.server';

describe('Inventory Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateMinInventory', () => {
    it('should return MIN of component inventories with qty 1 each', () => {
      const components = [
        { available: 50, quantity: 1 },
        { available: 20, quantity: 1 },
        { available: 10, quantity: 1 },
      ];
      expect(calculateMinInventory(components)).toBe(10);
    });

    it('should floor-divide by component quantity for multi-qty components', () => {
      const components = [
        { available: 50, quantity: 2 }, // floor(50/2) = 25
        { available: 20, quantity: 1 }, // 20
      ];
      expect(calculateMinInventory(components)).toBe(20);
    });

    it('should return 0 when any component has 0 stock', () => {
      const components = [
        { available: 50, quantity: 1 },
        { available: 0, quantity: 1 },
        { available: 30, quantity: 1 },
      ];
      expect(calculateMinInventory(components)).toBe(0);
    });

    it('should handle floor division correctly (not round up)', () => {
      const components = [
        { available: 7, quantity: 3 }, // floor(7/3) = 2
      ];
      expect(calculateMinInventory(components)).toBe(2);
    });

    it('should return 0 for empty components array', () => {
      expect(calculateMinInventory([])).toBe(0);
    });

    it('should return 999 when all components are untracked (null available)', () => {
      const components = [
        { available: null, quantity: 1 },
        { available: null, quantity: 1 },
      ];
      expect(calculateMinInventory(components)).toBe(999);
    });

    it('should exclude untracked components from MIN calculation', () => {
      const components = [
        { available: 50, quantity: 1 },
        { available: null, quantity: 1 }, // untracked — skip
        { available: 30, quantity: 1 },
      ];
      expect(calculateMinInventory(components)).toBe(30);
    });
  });

  describe('calculateBundleInventory', () => {
    it('should query component inventories and return calculated MIN', async () => {
      const admin = { graphql: jest.fn() };

      // Product 1: 50 available
      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        product: {
          variants: {
            edges: [{
              node: {
                id: 'gid://shopify/ProductVariant/101',
                inventoryItem: {
                  id: 'gid://shopify/InventoryItem/201',
                  tracked: true,
                  inventoryLevels: {
                    edges: [{ node: { quantities: [{ name: 'available', quantity: 50 }] } }],
                  },
                },
              },
            }],
          },
        },
      }));

      // Product 2: 20 available
      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        product: {
          variants: {
            edges: [{
              node: {
                id: 'gid://shopify/ProductVariant/102',
                inventoryItem: {
                  id: 'gid://shopify/InventoryItem/202',
                  tracked: true,
                  inventoryLevels: {
                    edges: [{ node: { quantities: [{ name: 'available', quantity: 20 }] } }],
                  },
                },
              },
            }],
          },
        },
      }));

      const componentProducts = [
        { productId: 'gid://shopify/Product/1', quantity: 1 },
        { productId: 'gid://shopify/Product/2', quantity: 1 },
      ];

      const result = await calculateBundleInventory(admin, componentProducts);
      expect(result).toBe(20);
    });

    it('should return 0 when a component has 0 stock', async () => {
      const admin = { graphql: jest.fn() };

      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        product: {
          variants: {
            edges: [{
              node: {
                id: 'gid://shopify/ProductVariant/101',
                inventoryItem: {
                  id: 'gid://shopify/InventoryItem/201',
                  tracked: true,
                  inventoryLevels: {
                    edges: [{ node: { quantities: [{ name: 'available', quantity: 0 }] } }],
                  },
                },
              },
            }],
          },
        },
      }));

      const result = await calculateBundleInventory(admin, [
        { productId: 'gid://shopify/Product/1', quantity: 1 },
      ]);
      expect(result).toBe(0);
    });
  });

  describe('setInventoryLevel', () => {
    it('should call inventoryAdjustQuantities with correct delta', async () => {
      const admin = { graphql: jest.fn() };

      // Mock: get current inventory level
      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        inventoryItem: {
          inventoryLevels: {
            edges: [{
              node: {
                id: 'gid://shopify/InventoryLevel/1',
                location: { id: 'gid://shopify/Location/1' },
                quantities: [{ name: 'available', quantity: 5 }],
              },
            }],
          },
        },
      }));

      // Mock: inventoryAdjustQuantities
      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        inventoryAdjustQuantities: {
          inventoryAdjustmentGroup: { reason: 'correction' },
          userErrors: [],
        },
      }));

      await setInventoryLevel(admin, 'gid://shopify/InventoryItem/201', 10);

      // Should have called graphql twice (get current + adjust)
      expect(admin.graphql).toHaveBeenCalledTimes(2);

      // Verify the adjustment call has the correct delta (10 - 5 = 5)
      const adjustCall = admin.graphql.mock.calls[1];
      const variables = adjustCall[1].variables;
      expect(variables.input.changes[0].delta).toBe(5);
      expect(variables.input.reason).toBe('correction');
      expect(variables.input.name).toBe('available');
    });

    it('should skip adjustment when current level equals target', async () => {
      const admin = { graphql: jest.fn() };

      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        inventoryItem: {
          inventoryLevels: {
            edges: [{
              node: {
                id: 'gid://shopify/InventoryLevel/1',
                location: { id: 'gid://shopify/Location/1' },
                quantities: [{ name: 'available', quantity: 10 }],
              },
            }],
          },
        },
      }));

      await setInventoryLevel(admin, 'gid://shopify/InventoryItem/201', 10);

      // Should only call graphql once (get current), skip adjust
      expect(admin.graphql).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncBundleInventory', () => {
    it('should skip sync if bundle was synced less than 60 seconds ago', async () => {
      const db = require('../../../app/db.server').default;
      db.bundle.findUnique.mockResolvedValue({
        id: 'bundle-1',
        shopifyProductId: 'gid://shopify/Product/999',
        inventorySyncedAt: new Date(), // just synced
        inventoryStaleAt: new Date(Date.now() - 30000), // stale 30s ago
        steps: [],
      });

      const admin = { graphql: jest.fn() };
      const result = await syncBundleInventory(admin, 'bundle-1');
      expect(result.skipped).toBe(true);
      expect(admin.graphql).not.toHaveBeenCalled();
    });

    it('should perform sync when bundle has no recent sync', async () => {
      const db = require('../../../app/db.server').default;

      db.bundle.findUnique.mockResolvedValue({
        id: 'bundle-1',
        shopifyProductId: 'gid://shopify/Product/999',
        inventorySyncedAt: null,
        inventoryStaleAt: new Date(),
        steps: [
          {
            StepProduct: [
              { productId: 'gid://shopify/Product/1', minQuantity: 1 },
            ],
          },
        ],
      });

      const admin = { graphql: jest.fn() };

      // Mock: get bundle variant's inventory item
      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        product: {
          variants: {
            edges: [{
              node: {
                id: 'gid://shopify/ProductVariant/999',
                inventoryItem: { id: 'gid://shopify/InventoryItem/999' },
              },
            }],
          },
        },
      }));

      // Mock: get component inventory
      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        productVariants: {
          nodes: [{
            id: 'gid://shopify/ProductVariant/101',
            inventoryItem: {
              id: 'gid://shopify/InventoryItem/201',
              tracked: true,
              inventoryLevels: {
                edges: [{ node: { quantities: [{ name: 'available', quantity: 15 }] } }],
              },
            },
          }],
        },
      }));

      // Mock: get current bundle inventory level
      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        inventoryItem: {
          inventoryLevels: {
            edges: [{
              node: {
                id: 'gid://shopify/InventoryLevel/1',
                location: { id: 'gid://shopify/Location/1' },
                quantities: [{ name: 'available', quantity: 0 }],
              },
            }],
          },
        },
      }));

      // Mock: inventoryAdjustQuantities
      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        inventoryAdjustQuantities: {
          inventoryAdjustmentGroup: { reason: 'correction' },
          userErrors: [],
        },
      }));

      // Mock: bundle update (clear stale, set synced)
      db.bundle.update.mockResolvedValue({});

      const result = await syncBundleInventory(admin, 'bundle-1');
      expect(result.skipped).toBe(false);
      expect(result.success).toBe(true);
      expect(db.bundle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bundle-1' },
          data: expect.objectContaining({
            inventoryStaleAt: null,
          }),
        })
      );
    });
  });
});
