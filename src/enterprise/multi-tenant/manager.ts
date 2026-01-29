/**
 * Multi-Tenant Manager
 * Core tenant management operations
 */

import { EventEmitter } from 'events';
import { Tenant, User, MultiTenantMetrics, TenantStatus } from './types';
import { getAuditLogger } from '../../core/logging';

export class MultiTenantManager extends EventEmitter {
  private tenants: Map<string, Tenant>;
  private users: Map<string, User>;

  constructor() {
    super();
    this.tenants = new Map();
    this.users = new Map();
  }

  /**
   * Create new tenant
   */
  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const auditLogger = getAuditLogger();

    const newTenant: Tenant = {
      ...tenant,
      id: this.generateTenantId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tenants.set(newTenant.id, newTenant);

    // Emit and audit after state mutation - wrap to prevent partial success
    try {
      this.emit('tenant:created', newTenant);
      auditLogger.logDataAccess('write', newTenant.id, undefined, {
        action: 'Tenant created',
        tenantName: newTenant.name,
      });
    } catch (error) {
      // Log error but don't fail the operation since state is already committed
      console.error('Failed to emit event or log audit:', error);
    }

    return newTenant;
  }

  /**
   * Get tenant by ID
   */
  getTenant(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  /**
   * List all tenants
   */
  listTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, updates: Partial<Omit<Tenant, 'id' | 'createdAt'>>): Promise<Tenant> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const updated: Tenant = {
      ...tenant,
      ...updates,
      id: tenant.id, // Preserve immutable ID
      createdAt: tenant.createdAt, // Preserve immutable creation date
      updatedAt: new Date(),
    };

    this.tenants.set(tenantId, updated);
    this.emit('tenant:updated', updated);

    return updated;
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const auditLogger = getAuditLogger();
    const tenant = this.tenants.get(tenantId);

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    this.tenants.delete(tenantId);
    this.emit('tenant:deleted', { tenantId });

    auditLogger.logDataAccess('delete', tenantId, undefined, {
      action: 'Tenant deleted',
      tenantName: tenant.name,
    });
  }

  /**
   * Get metrics
   */
  getMetrics(): MultiTenantMetrics {
    const tenants = this.listTenants();
    const activeTenants = tenants.filter(t => t.status === TenantStatus.ACTIVE).length;
    const trialTenants = tenants.filter(t => t.status === TenantStatus.TRIAL).length;
    const suspendedTenants = tenants.filter(t => t.status === TenantStatus.SUSPENDED).length;

    return {
      totalTenants: tenants.length,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalUsers: this.users.size,
      totalRevenue: 0, // Calculate from subscriptions
      averageRevenuePerTenant: 0,
      churnRate: 0,
      growthRate: 0,
    };
  }

  private generateTenantId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `tenant_${timestamp}_${random}`;
  }
}
