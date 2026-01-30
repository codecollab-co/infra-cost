/**
 * Chargeback API Routes
 * Endpoints for chargeback reports
 */

import { Router, Request, Response } from 'express';
import { getProviderFromConfig } from '../utils';
import { createApiResponse, createErrorResponse } from '../server';



const router = Router();

/**
 * GET /api/v1/chargeback
 * Get chargeback report
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    
    const provider = await getProviderFromConfig();

    const { groupBy = 'tag' } = req.query;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const breakdown = await provider.getCostBreakdown(
      monthStart,
      now,
      groupBy === 'tag' ? 'TAG' : 'SERVICE'
    );

    res.json(
      createApiResponse({
        total: breakdown.totalCost,
        breakdown: breakdown.breakdown,
        period: {
          start: monthStart.toISOString(),
          end: now.toISOString(),
        },
        groupBy,
      })
    );
  } catch (error: any) {
    res.status(500).json(createErrorResponse('FETCH_ERROR', error.message));
  }
});

export default router;
