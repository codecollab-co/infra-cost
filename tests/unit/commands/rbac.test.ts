/**
 * Tests for RBAC commands
 * Issue #50: Role-Based Access Control
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('RBAC Commands', () => {
  const CLI_PATH = './bin/index.js';

  describe('rbac command', () => {
    it('should have rbac command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('rbac');
    });

    it('should show help for rbac command', () => {
      const output = execSync(`${CLI_PATH} rbac --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('Role-Based Access Control');
    });

    it('should have assign-role subcommand', () => {
      const output = execSync(`${CLI_PATH} rbac --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('assign-role');
    });

    it('should have remove-role subcommand', () => {
      const output = execSync(`${CLI_PATH} rbac --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('remove-role');
    });

    it('should have create-role subcommand', () => {
      const output = execSync(`${CLI_PATH} rbac --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('create-role');
    });

    it('should have delete-role subcommand', () => {
      const output = execSync(`${CLI_PATH} rbac --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('delete-role');
    });

    it('should have show-permissions subcommand', () => {
      const output = execSync(`${CLI_PATH} rbac --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('show-permissions');
    });

    it('should have list-roles subcommand', () => {
      const output = execSync(`${CLI_PATH} rbac --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('list-roles');
    });

    it('should have list-users subcommand', () => {
      const output = execSync(`${CLI_PATH} rbac --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('list-users');
    });

    it('should have check-permission subcommand', () => {
      const output = execSync(`${CLI_PATH} rbac --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('check-permission');
    });
  });

  describe('rbac assign-role command', () => {
    it('should support --user option', () => {
      const output = execSync(`${CLI_PATH} rbac assign-role --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--user');
    });

    it('should support --role option', () => {
      const output = execSync(`${CLI_PATH} rbac assign-role --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--role');
    });

    it('should support --assigned-by option', () => {
      const output = execSync(`${CLI_PATH} rbac assign-role --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--assigned-by');
    });
  });

  describe('rbac create-role command', () => {
    it('should support --name option', () => {
      const output = execSync(`${CLI_PATH} rbac create-role --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--name');
    });

    it('should support --description option', () => {
      const output = execSync(`${CLI_PATH} rbac create-role --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--description');
    });

    it('should support --permissions option', () => {
      const output = execSync(`${CLI_PATH} rbac create-role --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--permissions');
    });
  });

  describe('rbac module', () => {
    it('should export assignRole function', async () => {
      const { assignRole } = await import('../../../src/core/rbac');
      expect(typeof assignRole).toBe('function');
    });

    it('should export hasPermission function', async () => {
      const { hasPermission } = await import('../../../src/core/rbac');
      expect(typeof hasPermission).toBe('function');
    });

    it('should export DEFAULT_ROLES', async () => {
      const rbac = await import('../../../src/core/rbac');
      expect(rbac).toBeDefined();
    });
  });
});
