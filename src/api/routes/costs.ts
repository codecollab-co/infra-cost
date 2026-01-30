/**
 * Costs API Routes
 * Endpoints for cost data
 */

import { Router, Request, Response } from 'express';
import { getProviderFromConfig, getConfig } from '../utils';
import { createApiResponse, createErrorResponse } from '../server';



const router = Router();

/**
 * GET /api/v1/costs
 * Get current cost summary
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const config = getConfig();
    const provider = await getProviderFromConfig();

    // Get today's costs
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Get MTD costs
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [todayCosts, mtdCosts] = await Promise.all([
      provider.getCostBreakdown(todayStart, todayEnd, 'SERVICE'),
      provider.getCostBreakdown(monthStart, monthEnd, 'SERVICE'),
    ]);

    // Calculate service breakdown
    const serviceBreakdown: Record<string, number> = {};
    todayCosts.breakdown.forEach((item: any) => {
      serviceBreakdown[item.service] = item.cost;
    });

    const accountInfo = await provider.getAccountInfo();

    const response = {
      account: {
        id: accountInfo.accountId,
        name: accountInfo.accountAlias || accountInfo.accountId,
        provider: config.provider,
      },
      costs: {
        today: {
          total: todayCosts.totalCost,
          currency: 'USD',
          byService: serviceBreakdown,
        },
        mtd: {
          total: mtdCosts.totalCost,
          projected: mtdCosts.totalCost * (30 / today.getDate()),
        },
        delta: {
          vsYesterday: 0, // Would need historical data
          vsLastWeek: 0, // Would need historical data
        },
      },
      timestamp: new Date().toISOString(),
    };

    res.json(createApiResponse(response));
  } catch (error: any) {
    res.status(500).json(createErrorResponse('FETCH_ERROR', error.message));
  }
});

/**
 * GET /api/v1/costs/services
 * Get cost breakdown by service
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    
    const provider = await getProviderFromConfig();

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date();

    const breakdown = await provider.getCostBreakdown(start, end, 'SERVICE');

    const services = breakdown.breakdown.map((item: any) => ({
      service: item.service,
      cost: item.cost,
      percentage: (item.cost / breakdown.totalCost) * 100,
    }));

    res.json(
      createApiResponse({
        total: breakdown.totalCost,
        services,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      })
    );
  } catch (error: any) {
    res.status(500).json(createErrorResponse('FETCH_ERROR', error.message));
  }
});

/**
 * GET /api/v1/costs/daily
 * Get daily cost breakdown
 */
router.get('/daily', async (req: Request, res: Response) => {
  try {
    
    const provider = await getProviderFromConfig();

    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string, 10);

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysNum);

    const breakdown = await provider.getCostBreakdown(start, end, 'DAILY');

    const dailyCosts = breakdown.breakdown.map((item: any) => ({
      date: item.date,
      cost: item.cost,
    }));

    res.json(
      createApiResponse({
        total: breakdown.totalCost,
        daily: dailyCosts,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: daysNum,
        },
      })
    );
  } catch (error: any) {
    res.status(500).json(createErrorResponse('FETCH_ERROR', error.message));
  }
});

/**
 * GET /api/v1/costs/trends
 * Get cost trends
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    
    const provider = await getProviderFromConfig();

    // Get last 3 months of data
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);

    const breakdown = await provider.getCostBreakdown(start, end, 'MONTHLY');

    const trends = breakdown.breakdown.map((item: any, index: number, arr: any[]) => {
      const previousMonth = index > 0 ? arr[index - 1].cost : null;
      const changePercent = previousMonth
        ? ((item.cost - previousMonth) / previousMonth) * 100
        : 0;

      return {
        month: item.date,
        cost: item.cost,
        change: item.cost - (previousMonth || 0),
        changePercent,
      };
    });

    res.json(
      createApiResponse({
        trends,
        average: breakdown.totalCost / breakdown.breakdown.length,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      })
    );
  } catch (error: any) {
    res.status(500).json(createErrorResponse('FETCH_ERROR', error.message));
  }
});

export default router;
