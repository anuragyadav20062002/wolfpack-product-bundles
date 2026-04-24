/**
 * Subscription domain constants.
 *
 * Re-export Prisma's generated enum so application code can use a domain-specific
 * import path while keeping the database enum as the source of truth.
 */

import { SubscriptionStatus as PrismaSubscriptionStatus } from "@prisma/client";

export const SubscriptionStatus = PrismaSubscriptionStatus;

