/**
 * Multi-Tenant Types
 * Extracted from enterprise/multi-tenant.ts
 */

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
  lastActivityAt?: Date;
  users?: User[];
  userCount?: number;
  usage?: TenantUsage;
  apiKeyCount?: number;
}

export interface TenantUsage {
  users?: number;
  cloudAccounts?: number;
  resourcesMonitored?: number;
  apiCalls?: number;
  costAnalyses?: number;
  reports?: number;
  storage?: number;
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
  billing?: SubscriptionBilling;
  apiKey?: string;
}

export interface SubscriptionBilling {
  method?: string;
  nextBillingDate?: Date;
  monthlyAmount?: number;
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
  customConfig?: Record<string, string | number | boolean>;
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
}

export interface FeatureLimits {
  maxCloudAccounts?: number;
  maxUsers?: number;
  maxApiCallsPerDay?: number;
  maxResourcesMonitored?: number;
  maxReportsPerMonth?: number;
  maxStorageGB?: number;
}

export interface PricingDetails {
  basePrice: number;
  currency: string;
  additionalUserPrice?: number;
  additionalCloudAccountPrice?: number;
  additionalStoragePrice?: number;
}

export interface UsageMetrics {
  currentUsers: number;
  currentCloudAccounts: number;
  currentResourcesMonitored: number;
  apiCallsThisMonth: number;
  reportsThisMonth: number;
  storageUsedGB: number;
}

export interface TenantSettings {
  timeZone: string;
  currency: string;
  dateFormat: string;
  language: string;
  branding?: BrandingSettings;
  notifications?: NotificationSettings;
  security?: SecuritySettings;
}

export interface BrandingSettings {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customDomain?: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  slackEnabled: boolean;
  webhooksEnabled: boolean;
  alertThresholds?: Record<string, number>;
}

export interface SecuritySettings {
  mfaRequired: boolean;
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  ipWhitelist?: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays?: number;
}

export interface ResourceQuotas {
  maxUsers: number;
  maxCloudAccounts: number;
  maxResourcesMonitored: number;
  maxApiCallsPerDay: number;
  maxReportsPerMonth: number;
  maxStorageGB: number;
}

export interface TenantContact {
  type: 'billing' | 'technical' | 'admin';
  name: string;
  email: string;
  phone?: string;
}

export interface TenantMetadata {
  industry?: string;
  companySize?: string;
  country?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  lastLoginAt?: Date;
  createdAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  POWER_USER = 'POWER_USER',
  USER = 'USER',
  VIEWER = 'VIEWER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_INVITATION = 'PENDING_INVITATION',
  SUSPENDED = 'SUSPENDED'
}

export interface MultiTenantMetrics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalRevenue: number;
  averageRevenuePerTenant: number;
  churnRate: number;
  growthRate: number;
}
