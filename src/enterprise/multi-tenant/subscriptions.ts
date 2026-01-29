/**
 * Subscription Management
 */

import { Subscription, SubscriptionPlan, FeatureAccess, EnterpriseFeature, SubscriptionStatus } from './types';

export class SubscriptionManager {
  /**
   * Check if feature is enabled for subscription
   */
  isFeatureEnabled(subscription: Subscription, feature: EnterpriseFeature): boolean {
    const featureAccess = subscription.features.find(f => f.feature === feature);
    return featureAccess?.enabled ?? false;
  }

  /**
   * Get feature limit
   */
  getFeatureLimit(subscription: Subscription, feature: EnterpriseFeature, limitType: keyof NonNullable<FeatureAccess['limits']>): number | undefined {
    const featureAccess = subscription.features.find(f => f.feature === feature);
    return featureAccess?.limits?.[limitType];
  }

  /**
   * Check if subscription is active
   */
  isActive(subscription: Subscription): boolean {
    return subscription.status === SubscriptionStatus.ACTIVE;
  }

  /**
   * Check if trial is expired
   */
  isTrialExpired(subscription: Subscription): boolean {
    if (subscription.status !== SubscriptionStatus.TRIAL) {
      return false;
    }
    if (!subscription.endDate) {
      return false;
    }
    return new Date() > subscription.endDate;
  }

  /**
   * Calculate subscription cost
   */
  calculateCost(subscription: Subscription): number {
    let cost = subscription.pricing.basePrice;

    // Add additional user costs
    if (subscription.usage.currentUsers > 0 && subscription.pricing.additionalUserPrice) {
      const additionalUsers = Math.max(0, subscription.usage.currentUsers - 1);
      cost += additionalUsers * subscription.pricing.additionalUserPrice;
    }

    // Add additional cloud account costs
    if (subscription.usage.currentCloudAccounts > 0 && subscription.pricing.additionalCloudAccountPrice) {
      const additionalAccounts = Math.max(0, subscription.usage.currentCloudAccounts - 1);
      cost += additionalAccounts * subscription.pricing.additionalCloudAccountPrice;
    }

    // Add storage costs
    if (subscription.usage.storageUsedGB > 0 && subscription.pricing.additionalStoragePrice) {
      cost += subscription.usage.storageUsedGB * subscription.pricing.additionalStoragePrice;
    }

    return cost;
  }

  /**
   * Check if usage exceeds limits
   */
  checkLimits(subscription: Subscription): { exceeded: boolean; violations: string[] } {
    const violations: string[] = [];

    for (const feature of subscription.features) {
      if (!feature.enabled || !feature.limits) continue;

      // Use !== undefined to allow zero limits
      if (feature.limits.maxUsers !== undefined && subscription.usage.currentUsers > feature.limits.maxUsers) {
        violations.push(`User limit exceeded: ${subscription.usage.currentUsers}/${feature.limits.maxUsers}`);
      }

      if (feature.limits.maxCloudAccounts !== undefined && subscription.usage.currentCloudAccounts > feature.limits.maxCloudAccounts) {
        violations.push(`Cloud account limit exceeded: ${subscription.usage.currentCloudAccounts}/${feature.limits.maxCloudAccounts}`);
      }

      if (feature.limits.maxStorageGB !== undefined && subscription.usage.storageUsedGB > feature.limits.maxStorageGB) {
        violations.push(`Storage limit exceeded: ${subscription.usage.storageUsedGB}GB/${feature.limits.maxStorageGB}GB`);
      }

      // Add missing limit checks
      if (feature.limits.maxResourcesMonitored !== undefined && subscription.usage.currentResourcesMonitored > feature.limits.maxResourcesMonitored) {
        violations.push(`Resource limit exceeded: ${subscription.usage.currentResourcesMonitored}/${feature.limits.maxResourcesMonitored}`);
      }

      if (feature.limits.maxReportsPerMonth !== undefined && subscription.usage.reportsThisMonth > feature.limits.maxReportsPerMonth) {
        violations.push(`Report limit exceeded: ${subscription.usage.reportsThisMonth}/${feature.limits.maxReportsPerMonth}`);
      }
    }

    return {
      exceeded: violations.length > 0,
      violations,
    };
  }
}
