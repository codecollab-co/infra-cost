/**
 * Reports API Routes
 * Endpoints for generating custom reports
 */

import { Router, Request, Response } from 'express';
import { getProviderFromConfig, getConfig } from '../utils';
import { createApiResponse, createErrorResponse } from '../server';



const router = Router();

/**
 * POST /api/v1/reports/generate
 * Generate custom report
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      reportType = 'summary',
      startDate,
      endDate,
      format = 'json',
      groupBy = 'service',
    } = req.body;

    
    const config = getConfig();
    const provider = await getProviderFromConfig();

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    let groupByType: 'SERVICE' | 'TAG' | 'DAILY' | 'MONTHLY' = 'SERVICE';
    if (groupBy === 'tag') groupByType = 'TAG';
    else if (groupBy === 'daily') groupByType = 'DAILY';
    else if (groupBy === 'monthly') groupByType = 'MONTHLY';

    const breakdown = await provider.getCostBreakdown(start, end, groupByType);

    const report = {
      reportType,
      generatedAt: new Date().toISOString(),
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      data: {
        total: breakdown.totalCost,
        breakdown: breakdown.breakdown,
        groupBy,
      },
      format,
    };

    res.json(createApiResponse(report));
  } catch (error: any) {
    res.status(500).json(createErrorResponse('REPORT_ERROR', error.message));
  }
});

export default router;
