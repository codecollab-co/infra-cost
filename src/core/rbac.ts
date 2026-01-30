/**
 * Role-Based Access Control (RBAC)
 * Issue #50: Role-Based Access Control
 *
 * Permission-based access control for enterprise environments
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface Permission {
  resource: string;
  action: string;
  scope?: string;
}

export interface Role {
  name: string;
  description: string;
  permissions: string[];
}

export interface UserRole {
  user: string;
  role: string;
  assignedAt: string;
  assignedBy?: string;
}

export interface RBACConfig {
  roles: Record<string, Role>;
  userRoles: UserRole[];
  groupMapping?: Record<string, string>;
}

const CONFIG_DIR = join(homedir(), '.infra-cost');
const RBAC_CONFIG_FILE = join(CONFIG_DIR, 'rbac.json');

/**
 * Default role definitions
 */
const DEFAULT_ROLES: Record<string, Role> = {
  admin: {
    name: 'admin',
    description: 'Full access to all features',
    permissions: ['*'],
  },
  finance: {
    name: 'finance',
    description: 'Cost data and reports only',
    permissions: [
      'costs:read',
      'costs:read:*',
      'chargeback:read',
      'chargeback:read:*',
      'reports:generate',
      'budgets:read',
      'budgets:read:*',
      'export:read',
    ],
  },
  developer: {
    name: 'developer',
    description: 'View costs for assigned resources',
    permissions: [
      'costs:read:own',
      'costs:read:team:*',
      'inventory:read:own',
      'inventory:read:team:*',
      'optimization:read:own',
      'optimization:read:team:*',
    ],
  },
  viewer: {
    name: 'viewer',
    description: 'Read-only access to summaries',
    permissions: [
      'costs:read:summary',
      'budgets:read',
    ],
  },
};

/**
 * Load RBAC configuration
 */
export function loadRBACConfig(): RBACConfig {
  if (!existsSync(RBAC_CONFIG_FILE)) {
    return {
      roles: DEFAULT_ROLES,
      userRoles: [],
    };
  }

  try {
    const data = readFileSync(RBAC_CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);

    // Merge default roles with custom roles
    return {
      ...config,
      roles: { ...DEFAULT_ROLES, ...config.roles },
    };
  } catch (error) {
    console.error('Error loading RBAC config:', error);
    return {
      roles: DEFAULT_ROLES,
      userRoles: [],
    };
  }
}

/**
 * Save RBAC configuration
 */
export function saveRBACConfig(config: RBACConfig): void {
  try {
    writeFileSync(RBAC_CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Failed to save RBAC config: ${error}`);
  }
}

/**
 * Get user's role
 */
export function getUserRole(user: string): string | null {
  const config = loadRBACConfig();
  const userRole = config.userRoles.find((ur) => ur.user === user);
  return userRole?.role || null;
}

/**
 * Assign role to user
 */
export function assignRole(user: string, role: string, assignedBy?: string): void {
  const config = loadRBACConfig();

  // Validate role exists
  if (!config.roles[role]) {
    throw new Error(`Role "${role}" does not exist`);
  }

  // Remove existing role assignment
  config.userRoles = config.userRoles.filter((ur) => ur.user !== user);

  // Add new role assignment
  config.userRoles.push({
    user,
    role,
    assignedAt: new Date().toISOString(),
    assignedBy,
  });

  saveRBACConfig(config);
}

/**
 * Remove role from user
 */
export function removeUserRole(user: string): void {
  const config = loadRBACConfig();
  config.userRoles = config.userRoles.filter((ur) => ur.user !== user);
  saveRBACConfig(config);
}

/**
 * Create custom role
 */
export function createRole(name: string, description: string, permissions: string[]): void {
  const config = loadRBACConfig();

  if (config.roles[name]) {
    throw new Error(`Role "${name}" already exists`);
  }

  config.roles[name] = {
    name,
    description,
    permissions,
  };

  saveRBACConfig(config);
}

/**
 * Delete custom role
 */
export function deleteRole(name: string): void {
  const config = loadRBACConfig();

  // Cannot delete default roles
  if (DEFAULT_ROLES[name]) {
    throw new Error(`Cannot delete default role "${name}"`);
  }

  if (!config.roles[name]) {
    throw new Error(`Role "${name}" does not exist`);
  }

  // Remove role
  delete config.roles[name];

  // Remove user assignments
  config.userRoles = config.userRoles.filter((ur) => ur.role !== name);

  saveRBACConfig(config);
}

/**
 * Parse permission string
 */
function parsePermission(permissionStr: string): Permission {
  const parts = permissionStr.split(':');

  return {
    resource: parts[0] || '*',
    action: parts[1] || '*',
    scope: parts[2],
  };
}

/**
 * Check if permission matches
 */
function permissionMatches(required: Permission, granted: Permission): boolean {
  // Wildcard grants all
  if (granted.resource === '*') {
    return true;
  }

  // Resource must match
  if (granted.resource !== required.resource) {
    return false;
  }

  // Action must match or be wildcard
  if (granted.action !== '*' && granted.action !== required.action) {
    return false;
  }

  // Check scope
  if (required.scope) {
    if (!granted.scope || granted.scope === '*') {
      return true;
    }

    // Exact scope match or wildcard
    if (granted.scope !== required.scope && !granted.scope.endsWith(':*')) {
      return false;
    }

    // Check prefix match for team: or account: scopes
    if (granted.scope.endsWith(':*')) {
      const prefix = granted.scope.slice(0, -2);
      return required.scope.startsWith(prefix);
    }
  }

  return true;
}

/**
 * Check if user has permission
 */
export function hasPermission(user: string, permissionStr: string, context?: any): boolean {
  const config = loadRBACConfig();

  // Get user's role
  const userRole = config.userRoles.find((ur) => ur.user === user);
  if (!userRole) {
    return false; // No role assigned = no permissions
  }

  // Get role permissions
  const role = config.roles[userRole.role];
  if (!role) {
    return false;
  }

  // Parse required permission
  const required = parsePermission(permissionStr);

  // Check each granted permission
  for (const grantedStr of role.permissions) {
    const granted = parsePermission(grantedStr);

    if (permissionMatches(required, granted)) {
      return true;
    }
  }

  return false;
}

/**
 * Get user's permissions
 */
export function getUserPermissions(user: string): string[] {
  const config = loadRBACConfig();

  const userRole = config.userRoles.find((ur) => ur.user === user);
  if (!userRole) {
    return [];
  }

  const role = config.roles[userRole.role];
  if (!role) {
    return [];
  }

  return role.permissions;
}

/**
 * List all roles
 */
export function listRoles(): Role[] {
  const config = loadRBACConfig();
  return Object.values(config.roles);
}

/**
 * List all user role assignments
 */
export function listUserRoles(): UserRole[] {
  const config = loadRBACConfig();
  return config.userRoles;
}
