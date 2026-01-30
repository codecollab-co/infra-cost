/**
 * Tests for SSO commands
 * Issue #52: SSO/SAML Enterprise Authentication
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('SSO Commands', () => {
  const CLI_PATH = './bin/index.js';

  describe('sso command', () => {
    it('should have sso command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('sso');
    });

    it('should show help for sso command', () => {
      const output = execSync(`${CLI_PATH} sso --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('SSO');
      expect(output).toContain('authentication');
    });

    it('should have configure subcommand', () => {
      const output = execSync(`${CLI_PATH} sso --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('configure');
    });

    it('should have status subcommand', () => {
      const output = execSync(`${CLI_PATH} sso --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('status');
    });

    it('should have refresh subcommand', () => {
      const output = execSync(`${CLI_PATH} sso --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('refresh');
    });
  });

  describe('login command', () => {
    it('should have login command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('login');
    });

    it('should support --sso flag', () => {
      const output = execSync(`${CLI_PATH} login --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--sso');
    });
  });

  describe('logout command', () => {
    it('should have logout command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('logout');
    });
  });

  describe('sso configure command', () => {
    it('should support --provider option', () => {
      const output = execSync(`${CLI_PATH} sso configure --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--provider');
      expect(output).toContain('okta');
      expect(output).toContain('azure-ad');
      expect(output).toContain('google');
    });

    it('should support --client-id option', () => {
      const output = execSync(`${CLI_PATH} sso configure --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--client-id');
    });

    it('should support --client-secret option', () => {
      const output = execSync(`${CLI_PATH} sso configure --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--client-secret');
    });
  });

  describe('sso module', () => {
    it('should export loadSSOConfig function', async () => {
      const { loadSSOConfig } = await import('../../../src/core/sso');
      expect(typeof loadSSOConfig).toBe('function');
    });

    it('should export saveSSOSession function', async () => {
      const { saveSSOSession } = await import('../../../src/core/sso');
      expect(typeof saveSSOSession).toBe('function');
    });

    it('should export isLoggedIn function', async () => {
      const { isLoggedIn } = await import('../../../src/core/sso');
      expect(typeof isLoggedIn).toBe('function');
    });

    it('should export ProviderConfig', async () => {
      const { ProviderConfig } = await import('../../../src/core/sso');
      expect(ProviderConfig).toBeDefined();
      expect(ProviderConfig.okta).toBeDefined();
      expect(ProviderConfig.azureAd).toBeDefined();
      expect(ProviderConfig.google).toBeDefined();
    });
  });
});
