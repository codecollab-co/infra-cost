import { EventEmitter } from 'events';
import { CloudProvider } from '../types/providers';
import { AuditLogger } from '../audit/audit-logger';
import * as crypto from 'crypto';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: TenantStatus;
  subscription: Subscription;
  settings: TenantSettings;
  quotas: ResourceQuotas;
  contacts: TenantContact[];
  metadata: TenantMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  TRIAL = 'TRIAL'
}

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  features: FeatureAccess[];
  pricing: PricingDetails;
  usage: UsageMetrics;
}

export enum SubscriptionPlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PENDING_PAYMENT = 'PENDING_PAYMENT'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
  CUSTOM = 'CUSTOM'
}

export interface FeatureAccess {
  feature: EnterpriseFeature;
  enabled: boolean;
  limits?: FeatureLimits;
  customConfig?: { [key: string]: any };
}

export enum EnterpriseFeature {
  ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
  CUSTOM_DASHBOARDS = 'CUSTOM_DASHBOARDS',
  API_ACCESS = 'API_ACCESS',
  WEBHOOKS = 'WEBHOOKS',
  SSO_INTEGRATION = 'SSO_INTEGRATION',
  MULTI_CLOUD_SUPPORT = 'MULTI_CLOUD_SUPPORT',
  ADVANCED_SECURITY = 'ADVANCED_SECURITY',
  COMPLIANCE_REPORTING = 'COMPLIANCE_REPORTING',
  CUSTOM_INTEGRATIONS = 'CUSTOM_INTEGRATIONS',
  DEDICATED_SUPPORT = 'DEDICATED_SUPPORT',
  SLA_GUARANTEE = 'SLA_GUARANTEE',
  WHITE_LABELING = 'WHITE_LABELING',
  CUSTOM_ALERTS = 'CUSTOM_ALERTS',
  BULK_OPERATIONS = 'BULK_OPERATIONS',
  ADVANCED_FORECASTING = 'ADVANCED_FORECASTING'
}

export interface FeatureLimits {
  maxUsers?: number;
  maxCloudAccounts?: number;
  maxDashboards?: number;
  maxApiCalls?: number;
  maxWebhooks?: number;
  dataRetentionDays?: number;
  maxResourcesMonitored?: number;
}

export interface PricingDetails {
  baseFee: number;
  perUserFee: number;
  perResourceFee: number;
  overageFees: OverageFee[];
  discounts: Discount[];
  currency: string;
}

export interface OverageFee {
  type: 'USERS' | 'RESOURCES' | 'API_CALLS' | 'STORAGE';
  threshold: number;
  rate: number;
  unit: string;
}

export interface Discount {
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'TIER_BASED';
  value: number;
  description: string;
  validUntil?: Date;
  conditions?: string[];
}

export interface UsageMetrics {
  currentPeriod: UsagePeriod;
  previousPeriod: UsagePeriod;
  trends: UsageTrend[];
  alerts: UsageAlert[];
}

export interface UsagePeriod {
  startDate: Date;
  endDate: Date;
  users: number;
  cloudAccounts: number;
  resourcesMonitored: number;
  apiCalls: number;
  storageUsed: number; // GB
  dashboards: number;
  webhooks: number;
}

export interface UsageTrend {
  metric: string;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  changePercent: number;
  projection: number;
}

export interface UsageAlert {
  type: 'APPROACHING_LIMIT' | 'LIMIT_EXCEEDED' | 'UNUSUAL_USAGE';
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  numberFormat: string;
  branding: BrandingSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
}

export interface BrandingSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customDomain?: string;
  companyName?: string;
  supportEmail?: string;
  customCSS?: string;
}

export interface SecuritySettings {
  ssoEnabled: boolean;
  ssoProvider?: string;
  ssoConfig?: { [key: string]: any };
  mfaRequired: boolean;
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number; // minutes
  ipWhitelist?: string[];
  apiKeyRotationDays: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  preventReuse: number; // number of previous passwords
}

export interface NotificationSettings {
  emailEnabled: boolean;
  slackEnabled: boolean;
  webhookEnabled: boolean;
  defaultChannels: string[];
  alertThresholds: AlertThreshold[];
  schedules: NotificationSchedule[];
}

export interface AlertThreshold {
  metric: string;
  operator: 'GT' | 'LT' | 'EQ' | 'CHANGE_GT' | 'CHANGE_LT';
  value: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
}

export interface NotificationSchedule {
  name: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  frequency: number;
  recipients: string[];
  reports: string[];
  enabled: boolean;
}

export interface IntegrationSettings {
  allowedIntegrations: string[];
  customIntegrations: CustomIntegration[];
  webhookSettings: WebhookSettings;
  apiSettings: ApiSettings;
}

export interface CustomIntegration {
  id: string;
  name: string;
  type: 'WEBHOOK' | 'API' | 'PLUGIN';
  config: { [key: string]: any };
  enabled: boolean;
}

export interface WebhookSettings {
  maxWebhooks: number;
  allowedDomains?: string[];
  retryPolicy: RetryPolicy;
  timeoutSeconds: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'LINEAR' | 'EXPONENTIAL';
  initialDelay: number;
  maxDelay: number;
}

export interface ApiSettings {
  rateLimits: RateLimit[];
  allowedOrigins?: string[];
  keyRotationRequired: boolean;
  auditEnabled: boolean;
}

export interface RateLimit {
  endpoint: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

export interface ResourceQuotas {
  maxUsers: number;
  maxCloudAccounts: number;
  maxDashboards: number;
  maxApiCallsPerMonth: number;
  maxWebhooks: number;
  maxResourcesMonitored: number;
  dataRetentionDays: number;
  storageQuotaGB: number;
  computeUnitsPerMonth: number;
}

export interface TenantContact {
  id: string;
  type: ContactType;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isPrimary: boolean;
  notifications: string[];
}

export enum ContactType {
  BILLING = 'BILLING',
  TECHNICAL = 'TECHNICAL',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT'
}

export interface TenantMetadata {
  industry?: string;
  companySize?: string;
  useCase?: string[];
  deploymentType?: 'CLOUD' | 'ON_PREMISE' | 'HYBRID';
  region?: string;
  customFields?: { [key: string]: any };
  tags?: string[];
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  lastLogin?: Date;
  preferences: UserPreferences;
  mfaEnabled: boolean;
  apiKeys: ApiKey[];
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  FINOPS_MANAGER = 'FINOPS_MANAGER',
  COST_ANALYST = 'COST_ANALYST',
  VIEWER = 'VIEWER',
  CUSTOM = 'CUSTOM'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_INVITATION = 'PENDING_INVITATION'
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'EQUALS' | 'IN' | 'CONTAINS' | 'STARTS_WITH';
  value: string | string[];
}

export interface UserPreferences {
  timezone: string;
  language: string;
  theme: 'LIGHT' | 'DARK' | 'AUTO';
  dateFormat: string;
  currency: string;
  dashboardDefaults: DashboardDefaults;
  notifications: UserNotificationPreferences;
}

export interface DashboardDefaults {
  defaultTimeframe: string;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultProvider?: CloudProvider;
  defaultRegion?: string;
}

export interface UserNotificationPreferences {
  email: boolean;
  inApp: boolean;
  slack: boolean;
  frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY';
  categories: string[];
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  hashedKey: string;
  permissions: Permission[];
  expiresAt?: Date;
  lastUsed?: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface TenantIsolation {
  dataIsolation: DataIsolationStrategy;
  networkIsolation: NetworkIsolationConfig;
  storageIsolation: StorageIsolationConfig;
  computeIsolation: ComputeIsolationConfig;
}

export enum DataIsolationStrategy {
  SHARED_DATABASE = 'SHARED_DATABASE',
  SEPARATE_SCHEMAS = 'SEPARATE_SCHEMAS',
  SEPARATE_DATABASES = 'SEPARATE_DATABASES',
  TENANT_SPECIFIC_INSTANCES = 'TENANT_SPECIFIC_INSTANCES'
}

export interface NetworkIsolationConfig {
  virtualNetworks: boolean;
  dedicatedEndpoints: boolean;
  ipWhitelisting: boolean;
  customDomains: boolean;
}

export interface StorageIsolationConfig {
  separateBuckets: boolean;
  encryption: 'SHARED_KEY' | 'TENANT_SPECIFIC' | 'CUSTOMER_MANAGED';
  backupIsolation: boolean;
  archiveIsolation: boolean;
}

export interface ComputeIsolationConfig {
  dedicatedInstances: boolean;
  resourcePools: boolean;
  containerIsolation: boolean;
  processIsolation: boolean;
}

export interface MultiTenantMetrics {
  tenantCount: number;
  activeTenantsCount: number;
  totalUsers: number;
  averageUsersPerTenant: number;
  subscriptionDistribution: { [key in SubscriptionPlan]: number };
  revenueMetrics: RevenueMetrics;
  usageMetrics: PlatformUsageMetrics;
  healthMetrics: TenantHealthMetrics;
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerTenant: number;
  churnRate: number;
  growthRate: number;
}

export interface PlatformUsageMetrics {
  totalApiCalls: number;
  totalResourcesMonitored: number;
  totalStorageUsed: number;
  averageResponseTime: number;
  uptime: number;
  errorRate: number;
}

export interface TenantHealthMetrics {
  healthyTenants: number;
  warningTenants: number;
  criticalTenants: number;
  averageHealthScore: number;
  trendsOverTime: HealthTrend[];
}

export interface HealthTrend {
  date: Date;
  healthScore: number;
  issueCount: number;
  topIssues: string[];
}

export class MultiTenantManager extends EventEmitter {
  private tenants: Map<string, Tenant> = new Map();
  private users: Map<string, User> = new Map();
  private auditLogger: AuditLogger;

  constructor() {
    super();
    this.auditLogger = new AuditLogger();
    this.initializeDefaultTenants();
  }

  async createTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      name: tenantData.name || 'New Tenant',
      domain: tenantData.domain || `${tenantData.name?.toLowerCase().replace(/\s+/g, '-')}.example.com`,
      status: TenantStatus.PENDING,
      subscription: this.createDefaultSubscription(tenantData.subscription?.plan || SubscriptionPlan.STARTER),
      settings: this.createDefaultSettings(),
      quotas: this.createDefaultQuotas(tenantData.subscription?.plan || SubscriptionPlan.STARTER),
      contacts: tenantData.contacts || [],
      metadata: tenantData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...tenantData
    };

    // Set up tenant isolation
    await this.setupTenantIsolation(tenant);

    this.tenants.set(tenant.id, tenant);

    await this.auditLogger.log('tenant_created', {
      tenantId: tenant.id,
      tenantName: tenant.name,
      plan: tenant.subscription.plan
    });

    this.emit('tenant_created', tenant);
    return tenant;
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const updatedTenant: Tenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date()
    };

    this.tenants.set(tenantId, updatedTenant);

    await this.auditLogger.log('tenant_updated', {
      tenantId,
      changes: Object.keys(updates)
    });

    this.emit('tenant_updated', updatedTenant);
    return updatedTenant;
  }

  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    tenant.status = TenantStatus.SUSPENDED;
    tenant.updatedAt = new Date();

    // Disable all user access
    const tenantUsers = Array.from(this.users.values()).filter(u => u.tenantId === tenantId);
    tenantUsers.forEach(user => {
      user.status = UserStatus.SUSPENDED;
    });

    await this.auditLogger.log('tenant_suspended', {
      tenantId,
      tenantName: tenant.name,
      reason,
      affectedUsers: tenantUsers.length
    });

    this.emit('tenant_suspended', { tenant, reason });
  }

  async activateTenant(tenantId: string): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    tenant.status = TenantStatus.ACTIVE;
    tenant.updatedAt = new Date();

    // Reactivate users
    const tenantUsers = Array.from(this.users.values()).filter(u => u.tenantId === tenantId);
    tenantUsers.forEach(user => {
      if (user.status === UserStatus.SUSPENDED) {
        user.status = UserStatus.ACTIVE;
      }
    });

    await this.auditLogger.log('tenant_activated', {
      tenantId,
      tenantName: tenant.name,
      reactivatedUsers: tenantUsers.length
    });

    this.emit('tenant_activated', tenant);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    if (!userData.tenantId) {
      throw new Error('Tenant ID is required');
    }

    const tenant = this.tenants.get(userData.tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${userData.tenantId} not found`);
    }

    // Check user quota
    const currentUsers = Array.from(this.users.values()).filter(u => u.tenantId === userData.tenantId).length;
    if (currentUsers >= tenant.quotas.maxUsers) {
      throw new Error(`User quota exceeded. Maximum ${tenant.quotas.maxUsers} users allowed.`);
    }

    const user: User = {
      id: crypto.randomUUID(),
      tenantId: userData.tenantId,
      email: userData.email || '',
      name: userData.name || '',
      role: userData.role || UserRole.VIEWER,
      status: UserStatus.PENDING_INVITATION,
      permissions: this.getDefaultPermissions(userData.role || UserRole.VIEWER),
      preferences: this.createDefaultUserPreferences(),
      mfaEnabled: tenant.settings.security.mfaRequired,
      apiKeys: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData
    };

    this.users.set(user.id, user);

    await this.auditLogger.log('user_created', {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role
    });

    this.emit('user_created', user);
    return user;
  }

  async updateUserRole(userId: string, newRole: UserRole): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const oldRole = user.role;
    user.role = newRole;
    user.permissions = this.getDefaultPermissions(newRole);
    user.updatedAt = new Date();

    await this.auditLogger.log('user_role_updated', {
      userId,
      tenantId: user.tenantId,
      oldRole,
      newRole
    });

    this.emit('user_role_updated', { user, oldRole, newRole });
    return user;
  }

  async generateApiKey(userId: string, keyName: string, permissions?: Permission[], expiresAt?: Date): Promise<ApiKey> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const keyValue = this.generateSecureKey();
    const hashedKey = crypto.createHash('sha256').update(keyValue).digest('hex');

    const apiKey: ApiKey = {
      id: crypto.randomUUID(),
      name: keyName,
      key: keyValue, // Only returned once
      hashedKey,
      permissions: permissions || user.permissions,
      expiresAt,
      createdAt: new Date(),
      isActive: true
    };

    user.apiKeys.push({ ...apiKey, key: '[HIDDEN]' }); // Store without the actual key

    await this.auditLogger.log('api_key_generated', {
      userId,
      tenantId: user.tenantId,
      keyName,
      expiresAt
    });

    this.emit('api_key_generated', { user, apiKey: { ...apiKey, key: '[HIDDEN]' } });
    return apiKey;
  }

  async validateApiKey(keyValue: string): Promise<{ user: User; apiKey: ApiKey } | null> {
    const hashedKey = crypto.createHash('sha256').update(keyValue).digest('hex');

    for (const user of this.users.values()) {
      const apiKey = user.apiKeys.find(k => k.hashedKey === hashedKey && k.isActive);
      if (apiKey) {
        // Check expiration
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
          apiKey.isActive = false;
          return null;
        }

        // Update last used
        apiKey.lastUsed = new Date();

        return { user, apiKey };
      }
    }

    return null;
  }

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    const tenant = this.tenants.get(user.tenantId);
    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      return false;
    }

    return user.permissions.some(permission =>
      permission.resource === resource &&
      permission.actions.includes(action)
    );
  }

  async getMultiTenantMetrics(): Promise<MultiTenantMetrics> {
    const tenants = Array.from(this.tenants.values());
    const users = Array.from(this.users.values());

    const subscriptionDistribution = tenants.reduce((acc, tenant) => {
      acc[tenant.subscription.plan] = (acc[tenant.subscription.plan] || 0) + 1;
      return acc;
    }, {} as { [key in SubscriptionPlan]: number });

    const revenueMetrics = this.calculateRevenueMetrics(tenants);
    const usageMetrics = this.calculatePlatformUsageMetrics(tenants);
    const healthMetrics = this.calculateTenantHealthMetrics(tenants);

    return {
      tenantCount: tenants.length,
      activeTenantsCount: tenants.filter(t => t.status === TenantStatus.ACTIVE).length,
      totalUsers: users.length,
      averageUsersPerTenant: users.length / tenants.length,
      subscriptionDistribution: {
        STARTER: subscriptionDistribution.STARTER || 0,
        PROFESSIONAL: subscriptionDistribution.PROFESSIONAL || 0,
        ENTERPRISE: subscriptionDistribution.ENTERPRISE || 0,
        CUSTOM: subscriptionDistribution.CUSTOM || 0
      },
      revenueMetrics,
      usageMetrics,
      healthMetrics
    };
  }

  private async setupTenantIsolation(tenant: Tenant): Promise<void> {
    // Mock tenant isolation setup
    console.log(`Setting up isolation for tenant: ${tenant.name}`);

    // Data isolation
    await this.setupDataIsolation(tenant);

    // Network isolation
    await this.setupNetworkIsolation(tenant);

    // Storage isolation
    await this.setupStorageIsolation(tenant);

    // Compute isolation
    await this.setupComputeIsolation(tenant);
  }

  private async setupDataIsolation(tenant: Tenant): Promise<void> {
    // Implement data isolation based on strategy
    const strategy = DataIsolationStrategy.SEPARATE_SCHEMAS;
    console.log(`  Data isolation: ${strategy}`);
  }

  private async setupNetworkIsolation(tenant: Tenant): Promise<void> {
    console.log(`  Network isolation: Virtual networks and dedicated endpoints`);
  }

  private async setupStorageIsolation(tenant: Tenant): Promise<void> {
    console.log(`  Storage isolation: Separate buckets with tenant-specific encryption`);
  }

  private async setupComputeIsolation(tenant: Tenant): Promise<void> {
    console.log(`  Compute isolation: Resource pools and container isolation`);
  }

  private createDefaultSubscription(plan: SubscriptionPlan): Subscription {
    const planFeatures = this.getFeaturesByPlan(plan);
    const planPricing = this.getPricingByPlan(plan);

    return {
      plan,
      status: SubscriptionStatus.TRIAL,
      billingCycle: BillingCycle.MONTHLY,
      startDate: new Date(),
      autoRenew: true,
      features: planFeatures,
      pricing: planPricing,
      usage: {
        currentPeriod: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          users: 0,
          cloudAccounts: 0,
          resourcesMonitored: 0,
          apiCalls: 0,
          storageUsed: 0,
          dashboards: 0,
          webhooks: 0
        },
        previousPeriod: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          users: 0,
          cloudAccounts: 0,
          resourcesMonitored: 0,
          apiCalls: 0,
          storageUsed: 0,
          dashboards: 0,
          webhooks: 0
        },
        trends: [],
        alerts: []
      }
    };
  }

  private createDefaultSettings(): TenantSettings {
    return {
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      dateFormat: 'YYYY-MM-DD',
      numberFormat: 'en-US',
      branding: {
        companyName: 'Your Company',
        supportEmail: 'support@yourcompany.com'
      },
      security: {
        ssoEnabled: false,
        mfaRequired: false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          maxAge: 90,
          preventReuse: 5
        },
        sessionTimeout: 480,
        apiKeyRotationDays: 90
      },
      notifications: {
        emailEnabled: true,
        slackEnabled: false,
        webhookEnabled: false,
        defaultChannels: [],
        alertThresholds: [],
        schedules: []
      },
      integrations: {
        allowedIntegrations: [],
        customIntegrations: [],
        webhookSettings: {
          maxWebhooks: 10,
          retryPolicy: {
            maxRetries: 3,
            backoffStrategy: 'EXPONENTIAL',
            initialDelay: 1000,
            maxDelay: 10000
          },
          timeoutSeconds: 30
        },
        apiSettings: {
          rateLimits: [],
          keyRotationRequired: false,
          auditEnabled: true
        }
      }
    };
  }

  private createDefaultQuotas(plan: SubscriptionPlan): ResourceQuotas {
    const quotasByPlan = {
      [SubscriptionPlan.STARTER]: {
        maxUsers: 5,
        maxCloudAccounts: 3,
        maxDashboards: 10,
        maxApiCallsPerMonth: 10000,
        maxWebhooks: 5,
        maxResourcesMonitored: 1000,
        dataRetentionDays: 90,
        storageQuotaGB: 10,
        computeUnitsPerMonth: 100
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        maxUsers: 25,
        maxCloudAccounts: 10,
        maxDashboards: 50,
        maxApiCallsPerMonth: 100000,
        maxWebhooks: 25,
        maxResourcesMonitored: 10000,
        dataRetentionDays: 365,
        storageQuotaGB: 100,
        computeUnitsPerMonth: 1000
      },
      [SubscriptionPlan.ENTERPRISE]: {
        maxUsers: 500,
        maxCloudAccounts: 100,
        maxDashboards: 500,
        maxApiCallsPerMonth: 1000000,
        maxWebhooks: 100,
        maxResourcesMonitored: 100000,
        dataRetentionDays: 2555, // 7 years
        storageQuotaGB: 1000,
        computeUnitsPerMonth: 10000
      },
      [SubscriptionPlan.CUSTOM]: {
        maxUsers: -1, // Unlimited
        maxCloudAccounts: -1,
        maxDashboards: -1,
        maxApiCallsPerMonth: -1,
        maxWebhooks: -1,
        maxResourcesMonitored: -1,
        dataRetentionDays: -1,
        storageQuotaGB: -1,
        computeUnitsPerMonth: -1
      }
    };

    return quotasByPlan[plan];
  }

  private getFeaturesByPlan(plan: SubscriptionPlan): FeatureAccess[] {
    const featuresByPlan = {
      [SubscriptionPlan.STARTER]: [
        { feature: EnterpriseFeature.MULTI_CLOUD_SUPPORT, enabled: true },
        { feature: EnterpriseFeature.CUSTOM_DASHBOARDS, enabled: true, limits: { maxDashboards: 10 } },
        { feature: EnterpriseFeature.API_ACCESS, enabled: true, limits: { maxApiCalls: 10000 } }
      ],
      [SubscriptionPlan.PROFESSIONAL]: [
        { feature: EnterpriseFeature.ADVANCED_ANALYTICS, enabled: true },
        { feature: EnterpriseFeature.CUSTOM_DASHBOARDS, enabled: true, limits: { maxDashboards: 50 } },
        { feature: EnterpriseFeature.API_ACCESS, enabled: true, limits: { maxApiCalls: 100000 } },
        { feature: EnterpriseFeature.WEBHOOKS, enabled: true, limits: { maxWebhooks: 25 } },
        { feature: EnterpriseFeature.CUSTOM_ALERTS, enabled: true },
        { feature: EnterpriseFeature.COMPLIANCE_REPORTING, enabled: true }
      ],
      [SubscriptionPlan.ENTERPRISE]: [
        { feature: EnterpriseFeature.ADVANCED_ANALYTICS, enabled: true },
        { feature: EnterpriseFeature.CUSTOM_DASHBOARDS, enabled: true },
        { feature: EnterpriseFeature.API_ACCESS, enabled: true },
        { feature: EnterpriseFeature.WEBHOOKS, enabled: true },
        { feature: EnterpriseFeature.SSO_INTEGRATION, enabled: true },
        { feature: EnterpriseFeature.ADVANCED_SECURITY, enabled: true },
        { feature: EnterpriseFeature.COMPLIANCE_REPORTING, enabled: true },
        { feature: EnterpriseFeature.CUSTOM_INTEGRATIONS, enabled: true },
        { feature: EnterpriseFeature.DEDICATED_SUPPORT, enabled: true },
        { feature: EnterpriseFeature.SLA_GUARANTEE, enabled: true },
        { feature: EnterpriseFeature.WHITE_LABELING, enabled: true },
        { feature: EnterpriseFeature.BULK_OPERATIONS, enabled: true },
        { feature: EnterpriseFeature.ADVANCED_FORECASTING, enabled: true }
      ],
      [SubscriptionPlan.CUSTOM]: []
    };

    return featuresByPlan[plan];
  }

  private getPricingByPlan(plan: SubscriptionPlan): PricingDetails {
    const pricingByPlan = {
      [SubscriptionPlan.STARTER]: {
        baseFee: 99,
        perUserFee: 10,
        perResourceFee: 0.01,
        overageFees: [
          { type: 'API_CALLS' as const, threshold: 10000, rate: 0.001, unit: 'per call' }
        ],
        discounts: [],
        currency: 'USD'
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        baseFee: 299,
        perUserFee: 15,
        perResourceFee: 0.005,
        overageFees: [
          { type: 'API_CALLS' as const, threshold: 100000, rate: 0.0005, unit: 'per call' },
          { type: 'RESOURCES' as const, threshold: 10000, rate: 0.01, unit: 'per resource' }
        ],
        discounts: [
          { type: 'PERCENTAGE' as const, value: 10, description: 'Annual billing discount' }
        ],
        currency: 'USD'
      },
      [SubscriptionPlan.ENTERPRISE]: {
        baseFee: 999,
        perUserFee: 25,
        perResourceFee: 0.002,
        overageFees: [],
        discounts: [
          { type: 'PERCENTAGE' as const, value: 15, description: 'Annual billing discount' },
          { type: 'TIER_BASED' as const, value: 20, description: 'Volume discount for 100+ users' }
        ],
        currency: 'USD'
      },
      [SubscriptionPlan.CUSTOM]: {
        baseFee: 0,
        perUserFee: 0,
        perResourceFee: 0,
        overageFees: [],
        discounts: [],
        currency: 'USD'
      }
    };

    return pricingByPlan[plan];
  }

  private createDefaultUserPreferences(): UserPreferences {
    return {
      timezone: 'UTC',
      language: 'en',
      theme: 'LIGHT',
      dateFormat: 'YYYY-MM-DD',
      currency: 'USD',
      dashboardDefaults: {
        defaultTimeframe: '30d',
        autoRefresh: true,
        refreshInterval: 300000
      },
      notifications: {
        email: true,
        inApp: true,
        slack: false,
        frequency: 'DAILY',
        categories: ['COST_ALERTS', 'SYSTEM_UPDATES']
      }
    };
  }

  private getDefaultPermissions(role: UserRole): Permission[] {
    const permissionsByRole = {
      [UserRole.SUPER_ADMIN]: [
        { resource: '*', actions: ['*'] }
      ],
      [UserRole.TENANT_ADMIN]: [
        { resource: 'tenant', actions: ['read', 'write', 'delete'] },
        { resource: 'users', actions: ['read', 'write', 'delete'] },
        { resource: 'costs', actions: ['read', 'write'] },
        { resource: 'dashboards', actions: ['read', 'write', 'delete'] },
        { resource: 'integrations', actions: ['read', 'write', 'delete'] }
      ],
      [UserRole.FINOPS_MANAGER]: [
        { resource: 'costs', actions: ['read', 'write'] },
        { resource: 'budgets', actions: ['read', 'write'] },
        { resource: 'forecasts', actions: ['read', 'write'] },
        { resource: 'reports', actions: ['read', 'write'] },
        { resource: 'dashboards', actions: ['read', 'write'] }
      ],
      [UserRole.COST_ANALYST]: [
        { resource: 'costs', actions: ['read'] },
        { resource: 'budgets', actions: ['read'] },
        { resource: 'forecasts', actions: ['read'] },
        { resource: 'reports', actions: ['read', 'write'] },
        { resource: 'dashboards', actions: ['read', 'write'] }
      ],
      [UserRole.VIEWER]: [
        { resource: 'costs', actions: ['read'] },
        { resource: 'dashboards', actions: ['read'] },
        { resource: 'reports', actions: ['read'] }
      ],
      [UserRole.CUSTOM]: []
    };

    return permissionsByRole[role];
  }

  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private calculateRevenueMetrics(tenants: Tenant[]): RevenueMetrics {
    const activeSubscriptions = tenants.filter(t =>
      t.subscription.status === SubscriptionStatus.ACTIVE
    );

    const monthlyRevenue = activeSubscriptions.reduce((sum, tenant) => {
      const pricing = tenant.subscription.pricing;
      const users = tenant.subscription.usage.currentPeriod.users;
      const resources = tenant.subscription.usage.currentPeriod.resourcesMonitored;

      return sum + pricing.baseFee + (users * pricing.perUserFee) + (resources * pricing.perResourceFee);
    }, 0);

    return {
      totalRevenue: monthlyRevenue * 12, // Annualized
      monthlyRecurringRevenue: monthlyRevenue,
      annualRecurringRevenue: monthlyRevenue * 12,
      averageRevenuePerTenant: monthlyRevenue / activeSubscriptions.length,
      churnRate: 0.05, // Mock 5% churn rate
      growthRate: 0.15 // Mock 15% growth rate
    };
  }

  private calculatePlatformUsageMetrics(tenants: Tenant[]): PlatformUsageMetrics {
    return {
      totalApiCalls: tenants.reduce((sum, t) => sum + t.subscription.usage.currentPeriod.apiCalls, 0),
      totalResourcesMonitored: tenants.reduce((sum, t) => sum + t.subscription.usage.currentPeriod.resourcesMonitored, 0),
      totalStorageUsed: tenants.reduce((sum, t) => sum + t.subscription.usage.currentPeriod.storageUsed, 0),
      averageResponseTime: 150, // Mock 150ms
      uptime: 99.95, // Mock 99.95% uptime
      errorRate: 0.001 // Mock 0.1% error rate
    };
  }

  private calculateTenantHealthMetrics(tenants: Tenant[]): TenantHealthMetrics {
    const healthyCount = tenants.filter(t => t.status === TenantStatus.ACTIVE).length;
    const warningCount = tenants.filter(t => t.status === TenantStatus.TRIAL).length;
    const criticalCount = tenants.filter(t =>
      t.status === TenantStatus.SUSPENDED || t.status === TenantStatus.CANCELLED
    ).length;

    return {
      healthyTenants: healthyCount,
      warningTenants: warningCount,
      criticalTenants: criticalCount,
      averageHealthScore: 85, // Mock average health score
      trendsOverTime: [] // Mock trends data
    };
  }

  private initializeDefaultTenants(): void {
    // Create some sample tenants for demonstration
    const sampleTenants = [
      {
        name: 'Acme Corporation',
        domain: 'acme-corp.example.com',
        subscription: { plan: SubscriptionPlan.ENTERPRISE },
        metadata: { industry: 'Technology', companySize: '500-1000' }
      },
      {
        name: 'StartupXYZ',
        domain: 'startupxyz.example.com',
        subscription: { plan: SubscriptionPlan.PROFESSIONAL },
        metadata: { industry: 'SaaS', companySize: '50-100' }
      },
      {
        name: 'SmallBiz Inc',
        domain: 'smallbiz.example.com',
        subscription: { plan: SubscriptionPlan.STARTER },
        metadata: { industry: 'Retail', companySize: '10-50' }
      }
    ];

    sampleTenants.forEach(async (tenantData) => {
      const tenant = await this.createTenant(tenantData);
      tenant.status = TenantStatus.ACTIVE;

      // Create sample users for each tenant
      await this.createUser({
        tenantId: tenant.id,
        email: `admin@${tenant.domain}`,
        name: 'Tenant Admin',
        role: UserRole.TENANT_ADMIN,
        status: UserStatus.ACTIVE
      });

      await this.createUser({
        tenantId: tenant.id,
        email: `finops@${tenant.domain}`,
        name: 'FinOps Manager',
        role: UserRole.FINOPS_MANAGER,
        status: UserStatus.ACTIVE
      });
    });
  }

  getTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  getTenant(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  getUsers(tenantId?: string): User[] {
    const users = Array.from(this.users.values());
    return tenantId ? users.filter(u => u.tenantId === tenantId) : users;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  async isFeatureEnabled(tenantId: string, feature: EnterpriseFeature): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    const featureAccess = tenant.subscription.features.find(f => f.feature === feature);
    return featureAccess?.enabled || false;
  }

  async checkQuota(tenantId: string, quotaType: keyof ResourceQuotas, requestedAmount: number = 1): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    const currentUsage = tenant.subscription.usage.currentPeriod;
    const quota = tenant.quotas[quotaType];

    if (quota === -1) return true; // Unlimited

    const usageMap = {
      maxUsers: currentUsage.users,
      maxCloudAccounts: currentUsage.cloudAccounts,
      maxDashboards: currentUsage.dashboards,
      maxApiCallsPerMonth: currentUsage.apiCalls,
      maxWebhooks: currentUsage.webhooks,
      maxResourcesMonitored: currentUsage.resourcesMonitored,
      storageQuotaGB: currentUsage.storageUsed
    };

    const currentUsageValue = usageMap[quotaType as keyof typeof usageMap] || 0;
    return (currentUsageValue + requestedAmount) <= quota;
  }
}