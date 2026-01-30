/**
 * Accounts API Routes
 * Endpoints for account information (multi-account/Organizations)
 */

import { Router, Request, Response } from 'express';
import { getProviderFromConfig, getConfig } from '../utils';
import { createApiResponse, createErrorResponse } from '../server';



const router = Router();

/**
 * GET /api/v1/accounts
 * List all accounts
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const config = getConfig();
    const provider = await getProviderFromConfig();

    const accountInfo = await provider.getAccountInfo();

    // For single account, return array with one item
    const accounts = [
      {
        id: accountInfo.accountId,
        name: accountInfo.accountAlias || accountInfo.accountId,
        provider: config.provider,
        region: accountInfo.region,
      },
    ];

    res.json(
      createApiResponse({
        accounts,
        count: accounts.length,
      })
    );
  } catch (error: any) {
    res.status(500).json(createErrorResponse('FETCH_ERROR', error.message));
  }
});

/**
 * GET /api/v1/accounts/:id/costs
 * Get costs for specific account
 */
router.get('/:id/costs', async (req: Request, res: Response) => {
  try {
    const config = getConfig();
    const provider = await getProviderFromConfig();
    const { id } = req.params;

    const accountInfo = await provider.getAccountInfo();

    // Verify account ID matches
    if (accountInfo.accountId !== id) {
      return res
        .status(404)
        .json(createErrorResponse('NOT_FOUND', `Account ${id} not found`));
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const costs = await provider.getCostBreakdown(monthStart, now, 'SERVICE');

    res.json(
      createApiResponse({
        accountId: id,
        costs: {
          total: costs.totalCost,
          breakdown: costs.breakdown,
        },
        period: {
          start: monthStart.toISOString(),
          end: now.toISOString(),
        },
      })
    );
  } catch (error: any) {
    res.status(500).json(createErrorResponse('FETCH_ERROR', error.message));
  }
});

export default router;
