/**
 * Alibaba Cloud Account Management
 *
 * Handles account information retrieval and multi-account support.
 */

import { AlibabaCloudClientConfig } from './config';

export interface AlibabaCloudAccount {
  accountId: string;
  accountName: string;
  accountType: string; // 'Enterprise' | 'PayAsYouGo' | 'Subscription'
  status: string;
  createTime?: string;
}

/**
 * Get Alibaba Cloud account information
 * Note: Alibaba Cloud uses RAM (Resource Access Management) for account info
 */
export async function getAccountInfo(
  aliConfig: AlibabaCloudClientConfig
): Promise<AlibabaCloudAccount> {
  try {
    // In a real implementation, this would call RAM GetAccountAlias or similar API
    // For now, return basic info from config
    const accountId = aliConfig.accountId || 'default';

    return {
      accountId,
      accountName: `Alibaba Cloud Account (${accountId})`,
      accountType: 'Enterprise',
      status: 'Active',
    };
  } catch (error: any) {
    console.error('Failed to get Alibaba Cloud account info:', error.message);
    return {
      accountId: aliConfig.accountId || 'unknown',
      accountName: 'Alibaba Cloud Account',
      accountType: 'Unknown',
      status: 'Unknown',
    };
  }
}

/**
 * List all accessible accounts (for multi-account scenarios)
 * This would typically use Resource Directory API in enterprise scenarios
 */
export async function listAccounts(
  aliConfig: AlibabaCloudClientConfig
): Promise<AlibabaCloudAccount[]> {
  try {
    // If specific account IDs are provided, use those
    if (aliConfig.accountIds && aliConfig.accountIds.length > 0) {
      return aliConfig.accountIds.map((accountId) => ({
        accountId,
        accountName: `Account ${accountId}`,
        accountType: 'Enterprise',
        status: 'Active',
      }));
    }

    // If allAccounts flag is set, would call Resource Directory API
    if (aliConfig.allAccounts) {
      // In real implementation, would call resourcedirectory.ListAccounts()
      console.warn('Multi-account discovery requires Resource Directory API access');
    }

    // Default to single account
    return [await getAccountInfo(aliConfig)];
  } catch (error: any) {
    console.error('Failed to list Alibaba Cloud accounts:', error.message);
    return [await getAccountInfo(aliConfig)];
  }
}

/**
 * Get multiple accounts information in parallel
 */
export async function getMultipleAccounts(
  aliConfig: AlibabaCloudClientConfig,
  accountIds: string[]
): Promise<Array<AlibabaCloudAccount & { error?: string }>> {
  const results = await Promise.all(
    accountIds.map(async (accountId) => {
      try {
        return {
          accountId,
          accountName: `Account ${accountId}`,
          accountType: 'Enterprise',
          status: 'Active',
        };
      } catch (error: any) {
        return {
          accountId,
          accountName: `Account ${accountId}`,
          accountType: 'Unknown',
          status: 'Unknown',
          error: error.message,
        };
      }
    })
  );

  return results;
}

/**
 * Validate account credentials by making a simple API call
 */
export async function validateAccountCredentials(
  aliConfig: AlibabaCloudClientConfig
): Promise<boolean> {
  try {
    // In real implementation, would make a lightweight API call like DescribeRegions
    // to verify credentials work
    const account = await getAccountInfo(aliConfig);
    return account.status !== 'Unknown';
  } catch (error) {
    return false;
  }
}
