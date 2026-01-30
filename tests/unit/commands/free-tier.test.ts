/**
 * Tests for the `free-tier` command
 * Issue #53: AWS Free Tier Usage Tracker
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Free Tier Command', () => {
  const CLI_PATH = './bin/index.js';

  describe('command availability', () => {
    it('should have free-tier command available', () => {
      const output = execSync(`${CLI_PATH} --help`, { encoding: 'utf-8' });
      expect(output).toContain('free-tier');
    });

    it('should show help for free-tier command', () => {
      const output = execSync(`${CLI_PATH} free-tier --help`, { encoding: 'utf-8' });
      expect(output).toContain('Track AWS Free Tier usage');
      expect(output).toContain('prevent surprise bills');
    });
  });

  describe('command options', () => {
    it('should support --profile option', () => {
      const output = execSync(`${CLI_PATH} free-tier --help`, { encoding: 'utf-8' });
      expect(output).toContain('--profile');
      expect(output).toContain('-p,');
    });

    it('should support --alert-threshold option', () => {
      const output = execSync(`${CLI_PATH} free-tier --help`, { encoding: 'utf-8' });
      expect(output).toContain('--alert-threshold');
      expect(output).toContain('default: 80');
    });

    it('should support --show-projection option', () => {
      const output = execSync(`${CLI_PATH} free-tier --help`, { encoding: 'utf-8' });
      expect(output).toContain('--show-projection');
      expect(output).toContain('month-end overages');
    });

    it('should support --json option', () => {
      const output = execSync(`${CLI_PATH} free-tier --help`, { encoding: 'utf-8' });
      expect(output).toContain('--json');
      expect(output).toContain('JSON format');
    });
  });

  describe('command defaults', () => {
    it('should have 80% as default alert threshold', () => {
      const output = execSync(`${CLI_PATH} free-tier --help`, { encoding: 'utf-8' });
      expect(output).toMatch(/alert-threshold.*80/i);
    });
  });
});
