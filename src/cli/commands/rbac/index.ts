/**
 * RBAC Command Group
 * Issue #50: Role-Based Access Control
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  assignRole,
  removeUserRole,
  createRole,
  deleteRole,
  getUserRole,
  getUserPermissions,
  listRoles,
  listUserRoles,
  hasPermission,
} from '../../../core/rbac';

/**
 * Handle assign-role command
 */
async function handleAssignRole(options: any): Promise<void> {
  const { user, role, assignedBy } = options;

  if (!user || !role) {
    console.error(chalk.red('Error: --user and --role are required'));
    console.log('\nExample:');
    console.log(chalk.gray('  infra-cost rbac assign-role --user john@company.com --role finance'));
    process.exit(1);
  }

  try {
    assignRole(user, role, assignedBy);
    console.log(chalk.green(`✅ Assigned role "${role}" to user "${user}"`));
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Handle remove-role command
 */
async function handleRemoveRole(options: any): Promise<void> {
  const { user } = options;

  if (!user) {
    console.error(chalk.red('Error: --user is required'));
    process.exit(1);
  }

  try {
    removeUserRole(user);
    console.log(chalk.green(`✅ Removed role from user "${user}"`));
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Handle create-role command
 */
async function handleCreateRole(options: any): Promise<void> {
  const { name, description, permissions } = options;

  if (!name || !description || !permissions) {
    console.error(chalk.red('Error: --name, --description, and --permissions are required'));
    console.log('\nExample:');
    console.log(chalk.gray('  infra-cost rbac create-role \\'));
    console.log(chalk.gray('    --name team-lead \\'));
    console.log(chalk.gray('    --description "Team lead access" \\'));
    console.log(chalk.gray('    --permissions "costs:read,optimization:read"'));
    process.exit(1);
  }

  try {
    const permList = permissions.split(',').map((p: string) => p.trim());
    createRole(name, description, permList);
    console.log(chalk.green(`✅ Created role "${name}"`));
    console.log(chalk.gray(`   Permissions: ${permList.join(', ')}`));
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Handle delete-role command
 */
async function handleDeleteRole(options: any): Promise<void> {
  const { name } = options;

  if (!name) {
    console.error(chalk.red('Error: --name is required'));
    process.exit(1);
  }

  try {
    deleteRole(name);
    console.log(chalk.green(`✅ Deleted role "${name}"`));
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Handle show-permissions command
 */
async function handleShowPermissions(options: any): Promise<void> {
  const { user } = options;

  if (!user) {
    console.error(chalk.red('Error: --user is required'));
    process.exit(1);
  }

  try {
    const role = getUserRole(user);
    const permissions = getUserPermissions(user);

    console.log(chalk.bold(`\n👤 User: ${user}\n`));

    if (!role) {
      console.log(chalk.yellow('No role assigned'));
      return;
    }

    console.log(chalk.bold(`Role: ${role}\n`));
    console.log(chalk.bold('Permissions:'));
    if (permissions.length === 0) {
      console.log(chalk.gray('  No permissions'));
    } else {
      permissions.forEach((perm) => {
        console.log(chalk.gray(`  • ${perm}`));
      });
    }
    console.log('');
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Handle list-roles command
 */
async function handleListRoles(options: any): Promise<void> {
  try {
    const roles = listRoles();

    console.log(chalk.bold('\n📋 Available Roles\n'));

    roles.forEach((role) => {
      console.log(chalk.bold(`${role.name}`));
      console.log(chalk.gray(`  ${role.description}`));
      console.log(chalk.gray(`  Permissions: ${role.permissions.slice(0, 3).join(', ')}${role.permissions.length > 3 ? '...' : ''}`));
      console.log('');
    });
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Handle list-users command
 */
async function handleListUsers(options: any): Promise<void> {
  try {
    const userRoles = listUserRoles();

    console.log(chalk.bold('\n👥 User Role Assignments\n'));

    if (userRoles.length === 0) {
      console.log(chalk.yellow('No user roles assigned'));
      return;
    }

    userRoles.forEach((ur) => {
      console.log(chalk.bold(ur.user));
      console.log(chalk.gray(`  Role: ${ur.role}`));
      console.log(chalk.gray(`  Assigned: ${new Date(ur.assignedAt).toLocaleString()}`));
      if (ur.assignedBy) {
        console.log(chalk.gray(`  Assigned by: ${ur.assignedBy}`));
      }
      console.log('');
    });
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Handle check-permission command
 */
async function handleCheckPermission(options: any): Promise<void> {
  const { user, permission } = options;

  if (!user || !permission) {
    console.error(chalk.red('Error: --user and --permission are required'));
    console.log('\nExample:');
    console.log(chalk.gray('  infra-cost rbac check-permission --user john@company.com --permission "costs:read"'));
    process.exit(1);
  }

  try {
    const has = hasPermission(user, permission);

    console.log(chalk.bold(`\n👤 User: ${user}`));
    console.log(chalk.bold(`🔐 Permission: ${permission}\n`));

    if (has) {
      console.log(chalk.green('✅ ALLOWED'));
    } else {
      console.log(chalk.red('❌ DENIED'));
    }
    console.log('');
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Register RBAC commands
 */
export function registerRBACCommands(program: Command): void {
  const rbac = program
    .command('rbac')
    .description('Role-Based Access Control management');

  rbac
    .command('assign-role')
    .description('Assign role to user')
    .option('--user <email>', 'User email')
    .option('--role <name>', 'Role name')
    .option('--assigned-by <email>', 'Who assigned the role')
    .action(handleAssignRole);

  rbac
    .command('remove-role')
    .description('Remove role from user')
    .option('--user <email>', 'User email')
    .action(handleRemoveRole);

  rbac
    .command('create-role')
    .description('Create custom role')
    .option('--name <name>', 'Role name')
    .option('--description <text>', 'Role description')
    .option('--permissions <list>', 'Comma-separated permissions')
    .action(handleCreateRole);

  rbac
    .command('delete-role')
    .description('Delete custom role')
    .option('--name <name>', 'Role name')
    .action(handleDeleteRole);

  rbac
    .command('show-permissions')
    .description('Show user permissions')
    .option('--user <email>', 'User email')
    .action(handleShowPermissions);

  rbac
    .command('list-roles')
    .description('List all available roles')
    .action(handleListRoles);

  rbac
    .command('list-users')
    .description('List all user role assignments')
    .action(handleListUsers);

  rbac
    .command('check-permission')
    .description('Check if user has permission')
    .option('--user <email>', 'User email')
    .option('--permission <perm>', 'Permission string (e.g., "costs:read")')
    .action(handleCheckPermission);
}
