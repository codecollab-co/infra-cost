/**
 * Inventory API Routes
 * Endpoints for resource inventory
 */

import { Router, Request, Response } from 'express';
import { getProviderFromConfig } from '../utils';
import { createApiResponse, createErrorResponse } from '../server';



const router = Router();

/**
 * GET /api/v1/inventory
 * Get resource inventory
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    
    const provider = await getProviderFromConfig();

    const inventory = await provider.getResourceInventory();

    const summary = {
      totalResources: inventory.resources.length,
      byType: inventory.resources.reduce((acc: any, resource: any) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      }, {}),
      byRegion: inventory.resources.reduce((acc: any, resource: any) => {
        const region = resource.region || 'global';
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json(
      createApiResponse({
        summary,
        resources: inventory.resources,
      })
    );
  } catch (error: any) {
    res.status(500).json(createErrorResponse('FETCH_ERROR', error.message));
  }
});

export default router;
