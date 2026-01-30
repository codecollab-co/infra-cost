/**
 * Optimization API Routes
 * Endpoints for optimization recommendations
 */

import { Router, Request, Response } from 'express';
import { getProviderFromConfig } from '../utils';
import { createApiResponse, createErrorResponse } from '../server';



const router = Router();

/**
 * GET /api/v1/optimization
 * Get optimization recommendations
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    
    const provider = await getProviderFromConfig();

    const recommendations = await provider.getOptimizationRecommendations();

    const summary = {
      totalSavings: recommendations.reduce((sum: number, rec: any) => sum + (rec.estimatedMonthlySavings || 0), 0),
      recommendationCount: recommendations.length,
      byCategory: recommendations.reduce((acc: any, rec: any) => {
        const category = rec.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json(
      createApiResponse({
        summary,
        recommendations,
      })
    );
  } catch (error: any) {
    res.status(500).json(createErrorResponse('FETCH_ERROR', error.message));
  }
});

export default router;
