/**
 * Tests for Microsoft Teams integration
 * Issue #45: Microsoft Teams Integration
 */

import { describe, it, expect } from '@jest/globals';

describe('Microsoft Teams Integration', () => {
  describe('Teams module', () => {
    it('should export sendTeamsReport function', async () => {
      const { sendTeamsReport } = await import('../../../src/integrations/teams');
      expect(typeof sendTeamsReport).toBe('function');
    });

    it('should export sendTeamsMessage function', async () => {
      const { sendTeamsMessage } = await import('../../../src/integrations/teams');
      expect(typeof sendTeamsMessage).toBe('function');
    });
  });

  describe('chargeback teams command', () => {
    it('should be available', async () => {
      const { execSync } = await import('child_process');
      const output = execSync('./bin/index.js chargeback --help', {
        encoding: 'utf-8',
      });
      expect(output).toContain('teams');
    });

    it('should support --teams-webhook option', async () => {
      const { execSync } = await import('child_process');
      const output = execSync('./bin/index.js chargeback teams --help', {
        encoding: 'utf-8',
      });
      expect(output).toContain('--teams-webhook');
    });

    it('should support --card-style option', async () => {
      const { execSync } = await import('child_process');
      const output = execSync('./bin/index.js chargeback teams --help', {
        encoding: 'utf-8',
      });
      expect(output).toContain('--card-style');
      expect(output).toContain('compact');
      expect(output).toContain('detailed');
    });
  });
});
