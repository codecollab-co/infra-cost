/**
 * Tests for PagerDuty and OpsGenie integrations
 * Issue #48: PagerDuty and OpsGenie Alert Integration
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Alerting Integrations', () => {
  const CLI_PATH = './bin/index.js';

  describe('PagerDuty integration', () => {
    it('should export sendPagerDutyAlert function', async () => {
      const { sendPagerDutyAlert } = await import('../../../src/integrations/pagerduty');
      expect(typeof sendPagerDutyAlert).toBe('function');
    });

    it('should export resolvePagerDutyAlert function', async () => {
      const { resolvePagerDutyAlert } = await import('../../../src/integrations/pagerduty');
      expect(typeof resolvePagerDutyAlert).toBe('function');
    });

    it('should have monitor alert-pagerduty command', () => {
      const output = execSync(`${CLI_PATH} monitor --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('alert-pagerduty');
    });

    it('should support --pagerduty-key option', () => {
      const output = execSync(`${CLI_PATH} monitor alert-pagerduty --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--pagerduty-key');
    });

    it('should support --severity option', () => {
      const output = execSync(`${CLI_PATH} monitor alert-pagerduty --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--severity');
      expect(output).toContain('warning');
    });

    it('should support --threshold option', () => {
      const output = execSync(`${CLI_PATH} monitor alert-pagerduty --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--threshold');
    });
  });

  describe('OpsGenie integration', () => {
    it('should export sendOpsGenieAlert function', async () => {
      const { sendOpsGenieAlert } = await import('../../../src/integrations/opsgenie');
      expect(typeof sendOpsGenieAlert).toBe('function');
    });

    it('should export closeOpsGenieAlert function', async () => {
      const { closeOpsGenieAlert } = await import('../../../src/integrations/opsgenie');
      expect(typeof closeOpsGenieAlert).toBe('function');
    });

    it('should have monitor alert-opsgenie command', () => {
      const output = execSync(`${CLI_PATH} monitor --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('alert-opsgenie');
    });

    it('should support --opsgenie-key option', () => {
      const output = execSync(`${CLI_PATH} monitor alert-opsgenie --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--opsgenie-key');
    });

    it('should support --priority option', () => {
      const output = execSync(`${CLI_PATH} monitor alert-opsgenie --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--priority');
      expect(output).toContain('P3');
    });

    it('should support --team option', () => {
      const output = execSync(`${CLI_PATH} monitor alert-opsgenie --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--team');
    });
  });
});
