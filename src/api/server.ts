/**
 * REST API Server for infra-cost
 * Issue #49: API Server Mode
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Server } from 'http';

export interface ApiServerConfig {
  port: number;
  host: string;
  cors: {
    enabled: boolean;
    origins?: string[];
  };
  auth: {
    type: 'none' | 'api-key' | 'jwt';
    apiKeys?: string[];
    jwtSecret?: string;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    max: number;
  };
  cache: {
    enabled: boolean;
    ttl: number; // seconds
  };
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; expiry: number }>();

export class ApiServer {
  private app: Express;
  private server?: Server;
  private config: ApiServerConfig;

  constructor(config: ApiServerConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet());

    // JSON body parser
    this.app.use(express.json());

    // CORS
    if (this.config.cors.enabled) {
      this.app.use(
        cors({
          origin: this.config.cors.origins || '*',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          credentials: true,
        })
      );
    }

    // Rate limiting
    if (this.config.rateLimit.enabled) {
      const limiter = rateLimit({
        windowMs: this.config.rateLimit.windowMs,
        max: this.config.rateLimit.max,
        message: {
          status: 'error',
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later.',
          },
          timestamp: new Date().toISOString(),
        },
      });
      this.app.use('/api/', limiter);
    }

    // Authentication
    this.app.use('/api/', this.authMiddleware.bind(this));

    // Cache middleware
    if (this.config.cache.enabled) {
      this.app.use('/api/', this.cacheMiddleware.bind(this));
    }
  }

  private authMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Skip auth for health check
    if (req.path === '/api/v1/health') {
      return next();
    }

    if (this.config.auth.type === 'none') {
      return next();
    }

    if (this.config.auth.type === 'api-key') {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      if (!apiKey || !this.config.auth.apiKeys?.includes(apiKey as string)) {
        return res.status(401).json({
          status: 'error',
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing API key',
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }
    }

    next();
  }

  private cacheMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    const cached = cache.get(key);

    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    // Override res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 200) {
        cache.set(key, {
          data: body,
          expiry: Date.now() + this.config.cache.ttl * 1000,
        });
      }
      return originalJson(body);
    };

    next();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/v1/health', (_req, res) => {
      res.json({
        status: 'success',
        data: {
          healthy: true,
          version: require('../../package.json').version,
          uptime: process.uptime(),
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    });

    // Mount route handlers
    this.app.use('/api/v1/costs', require('./routes/costs').default);
    this.app.use('/api/v1/inventory', require('./routes/inventory').default);
    this.app.use('/api/v1/optimization', require('./routes/optimization').default);
    this.app.use('/api/v1/chargeback', require('./routes/chargeback').default);
    this.app.use('/api/v1/forecast', require('./routes/forecast').default);
    this.app.use('/api/v1/accounts', require('./routes/accounts').default);
    this.app.use('/api/v1/reports', require('./routes/reports').default);

    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: 'API endpoint not found',
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    });

    // Error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('API Error:', err);
      res.status(500).json({
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Internal server error',
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, this.config.host, () => {
          console.log(
            `✅ API Server running at http://${this.config.host}:${this.config.port}`
          );
          console.log(`📖 API Documentation: http://${this.config.host}:${this.config.port}/api/docs`);
          resolve();
        });

        this.server.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('API Server stopped');
          resolve();
        }
      });
    });
  }

  getApp(): Express {
    return this.app;
  }
}

export function createApiResponse<T>(data: T): ApiResponse<T> {
  return {
    status: 'success',
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(code: string, message: string): ApiResponse {
  return {
    status: 'error',
    error: { code, message },
    timestamp: new Date().toISOString(),
  };
}
