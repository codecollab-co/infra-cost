/**
 * Tests for the organizations daily command
 * Issue #61: Daily Slack Scheduling for AWS Organizations
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Organizations Daily Command', () => {
  const CLI_PATH = './bin/index.js';

  describe('command availability', () => {
    it('should have organizations daily command available', () => {
      const output = execSync(`${CLI_PATH} organizations --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('daily');
    });

    it('should show help for organizations daily command', () => {
      const output = execSync(`${CLI_PATH} organizations daily --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('Daily cost breakdown by account');
    });
  });

  describe('command options', () => {
    it('should support --days option', () => {
      const output = execSync(`${CLI_PATH} organizations daily --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--days');
      expect(output).toContain('Number of days');
    });

    it('should support --slack-webhook option', () => {
      const output = execSync(`${CLI_PATH} organizations daily --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--slack-webhook');
      expect(output).toContain('Send report to Slack');
    });

    it('should support --schedule-daily option', () => {
      const output = execSync(`${CLI_PATH} organizations daily --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--schedule-daily');
      expect(output).toContain('automated reports');
    });

    it('should support --schedule-time option', () => {
      const output = execSync(`${CLI_PATH} organizations daily --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--schedule-time');
      expect(output).toContain('09:00');
    });

    it('should support --json option', () => {
      const output = execSync(`${CLI_PATH} organizations daily --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--json');
      expect(output).toContain('JSON format');
    });
  });

  describe('command defaults', () => {
    it('should have 7 days as default', () => {
      const output = execSync(`${CLI_PATH} organizations daily --help`, {
        encoding: 'utf-8',
      });
      expect(output).toMatch(/days.*7/i);
    });

    it('should have 09:00 as default schedule time', () => {
      const output = execSync(`${CLI_PATH} organizations daily --help`, {
        encoding: 'utf-8',
      });
      expect(output).toMatch(/schedule-time.*09:00/i);
    });
  });
});
