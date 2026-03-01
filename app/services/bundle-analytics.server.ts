/**
 * Bundle Analytics Service
 *
 * Tracks and aggregates bundle performance metrics including:
 * - Bundle views and interactions
 * - Add-to-cart events
 * - Conversion rates
 * - Revenue attribution
 *
 * Note: This is a foundation for analytics. Full tracking requires
 * storefront integration via app proxies or metafield-based tracking.
 */

import db from "../db.server";
import { AppLogger } from "../lib/logger";
import { BundleStatus, BundleType } from "../constants/bundle";

export interface BundleStats {
  totalBundles: number;
  activeBundles: number;
  draftBundles: number;
  totalSteps: number;
  averageStepsPerBundle: number;
  bundlesWithDiscounts: number;
  bundlesByType: {
    product_page: number;
    full_page: number;
  };
}

export interface BundlePerformanceMetrics {
  bundleId: string;
  bundleName: string;
  bundleType: string;
  status: string;
  stepsCount: number;
  productsCount: number;
  hasDiscounts: boolean;
  createdAt: Date;
  // Future metrics (require storefront tracking):
  // views: number;
  // addToCartCount: number;
  // conversionRate: number;
  // revenue: number;
}

export interface ShopAnalyticsSummary {
  stats: BundleStats;
  topBundles: BundlePerformanceMetrics[];
  recentActivity: {
    bundlesCreatedLast7Days: number;
    bundlesCreatedLast30Days: number;
  };
  planUsage: {
    currentPlan: string;
    bundlesUsed: number;
    bundleLimit: number;
    usagePercentage: number;
  };
}

export class BundleAnalyticsService {
  /**
   * Get comprehensive bundle statistics for a shop
   */
  static async getShopStats(shopDomain: string): Promise<BundleStats> {
    try {
      // Get all bundle counts by status
      const [totalBundles, activeBundles, draftBundles] = await Promise.all([
        db.bundle.count({
          where: { shopId: shopDomain, status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT] } }
        }),
        db.bundle.count({
          where: { shopId: shopDomain, status: BundleStatus.ACTIVE }
        }),
        db.bundle.count({
          where: { shopId: shopDomain, status: 'draft' }
        }),
      ]);

      // Get bundle type distribution
      const [productPageBundles, fullPageBundles] = await Promise.all([
        db.bundle.count({
          where: { shopId: shopDomain, bundleType: BundleType.PRODUCT_PAGE, status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT] } }
        }),
        db.bundle.count({
          where: { shopId: shopDomain, bundleType: BundleType.FULL_PAGE, status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT] } }
        }),
      ]);

      // Get total steps count
      const stepsResult = await db.bundleStep.aggregate({
        where: {
          bundle: { shopId: shopDomain, status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT] } }
        },
        _count: { id: true }
      });
      const totalSteps = stepsResult._count.id;

      // Get bundles with discounts enabled
      const bundlesWithDiscounts = await db.bundle.count({
        where: {
          shopId: shopDomain,
          status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT] },
          pricing: {
            enabled: true
          }
        }
      });

      return {
        totalBundles,
        activeBundles,
        draftBundles,
        totalSteps,
        averageStepsPerBundle: totalBundles > 0 ? Math.round((totalSteps / totalBundles) * 10) / 10 : 0,
        bundlesWithDiscounts,
        bundlesByType: {
          product_page: productPageBundles,
          full_page: fullPageBundles,
        }
      };

    } catch (error) {
      AppLogger.error("Error getting shop stats", {
        component: "bundle-analytics.server",
        operation: "getShopStats"
      }, error);

      return {
        totalBundles: 0,
        activeBundles: 0,
        draftBundles: 0,
        totalSteps: 0,
        averageStepsPerBundle: 0,
        bundlesWithDiscounts: 0,
        bundlesByType: {
          product_page: 0,
          full_page: 0,
        }
      };
    }
  }

  /**
   * Get performance metrics for individual bundles
   */
  static async getBundleMetrics(shopDomain: string): Promise<BundlePerformanceMetrics[]> {
    try {
      const bundles = await db.bundle.findMany({
        where: {
          shopId: shopDomain,
          status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT] }
        },
        include: {
          steps: {
            include: {
              _count: {
                select: { StepProduct: true }
              }
            }
          },
          pricing: {
            select: { enabled: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10 // Top 10 bundles
      });

      return bundles.map(bundle => ({
        bundleId: bundle.id,
        bundleName: bundle.name,
        bundleType: bundle.bundleType,
        status: bundle.status,
        stepsCount: bundle.steps.length,
        productsCount: bundle.steps.reduce((acc, step) => acc + (step._count?.StepProduct || 0), 0),
        hasDiscounts: bundle.pricing?.enabled || false,
        createdAt: bundle.createdAt,
      }));

    } catch (error) {
      AppLogger.error("Error getting bundle metrics", {
        component: "bundle-analytics.server",
        operation: "getBundleMetrics"
      }, error);

      return [];
    }
  }

  /**
   * Get recent activity metrics
   */
  static async getRecentActivity(shopDomain: string): Promise<{
    bundlesCreatedLast7Days: number;
    bundlesCreatedLast30Days: number;
  }> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [last7Days, last30Days] = await Promise.all([
        db.bundle.count({
          where: {
            shopId: shopDomain,
            createdAt: { gte: sevenDaysAgo }
          }
        }),
        db.bundle.count({
          where: {
            shopId: shopDomain,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
      ]);

      return {
        bundlesCreatedLast7Days: last7Days,
        bundlesCreatedLast30Days: last30Days,
      };

    } catch (error) {
      AppLogger.error("Error getting recent activity", {
        component: "bundle-analytics.server",
        operation: "getRecentActivity"
      }, error);

      return {
        bundlesCreatedLast7Days: 0,
        bundlesCreatedLast30Days: 0,
      };
    }
  }

  /**
   * Get comprehensive analytics summary for a shop
   */
  static async getAnalyticsSummary(
    shopDomain: string,
    planInfo: { plan: string; bundleLimit: number; currentBundleCount: number }
  ): Promise<ShopAnalyticsSummary> {
    try {
      const [stats, topBundles, recentActivity] = await Promise.all([
        this.getShopStats(shopDomain),
        this.getBundleMetrics(shopDomain),
        this.getRecentActivity(shopDomain),
      ]);

      return {
        stats,
        topBundles,
        recentActivity,
        planUsage: {
          currentPlan: planInfo.plan,
          bundlesUsed: planInfo.currentBundleCount,
          bundleLimit: planInfo.bundleLimit,
          usagePercentage: Math.round((planInfo.currentBundleCount / planInfo.bundleLimit) * 100),
        }
      };

    } catch (error) {
      AppLogger.error("Error getting analytics summary", {
        component: "bundle-analytics.server",
        operation: "getAnalyticsSummary"
      }, error);

      return {
        stats: {
          totalBundles: 0,
          activeBundles: 0,
          draftBundles: 0,
          totalSteps: 0,
          averageStepsPerBundle: 0,
          bundlesWithDiscounts: 0,
          bundlesByType: { product_page: 0, full_page: 0 }
        },
        topBundles: [],
        recentActivity: {
          bundlesCreatedLast7Days: 0,
          bundlesCreatedLast30Days: 0,
        },
        planUsage: {
          currentPlan: planInfo.plan,
          bundlesUsed: planInfo.currentBundleCount,
          bundleLimit: planInfo.bundleLimit,
          usagePercentage: 0,
        }
      };
    }
  }

  /**
   * Get quick stats for display in UI cards
   * Optimized for dashboard widgets
   */
  static async getQuickStats(shopDomain: string): Promise<{
    activeBundles: number;
    totalSteps: number;
    bundleTypes: { productPage: number; fullPage: number };
  }> {
    try {
      const [activeBundles, totalSteps, productPage, fullPage] = await Promise.all([
        db.bundle.count({
          where: { shopId: shopDomain, status: BundleStatus.ACTIVE }
        }),
        db.bundleStep.count({
          where: {
            bundle: { shopId: shopDomain, status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT] } }
          }
        }),
        db.bundle.count({
          where: { shopId: shopDomain, bundleType: BundleType.PRODUCT_PAGE, status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT] } }
        }),
        db.bundle.count({
          where: { shopId: shopDomain, bundleType: BundleType.FULL_PAGE, status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT] } }
        }),
      ]);

      return {
        activeBundles,
        totalSteps,
        bundleTypes: { productPage: productPage, fullPage: fullPage }
      };

    } catch (error) {
      AppLogger.error("Error getting quick stats", {
        component: "bundle-analytics.server",
        operation: "getQuickStats"
      }, error);

      return {
        activeBundles: 0,
        totalSteps: 0,
        bundleTypes: { productPage: 0, fullPage: 0 }
      };
    }
  }
}
