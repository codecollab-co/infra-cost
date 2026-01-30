/**
 * Tests for the dashboard command
 * Issue #43: Interactive TUI Dashboard Mode
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Dashboard Command', () => {
  const CLI_PATH = './bin/index.js';

  describe('command availability', () => {
    it('should have dashboard command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('dashboard');
    });

    it('should show help for dashboard command', () => {
      const output = execSync(`${CLI_PATH} dashboard --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('Interactive dashboards');
    });
  });

  describe('subcommands', () => {
    it('should have interactive subcommand', () => {
      const output = execSync(`${CLI_PATH} dashboard --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('interactive');
      expect(output).toContain('terminal dashboard');
    });

    it('should have multicloud subcommand', () => {
      const output = execSync(`${CLI_PATH} dashboard --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('multicloud');
      expect(output).toContain('comparison');
    });
  });

  describe('interactive dashboard options', () => {
    it('should support --refresh option', () => {
      const output = execSync(`${CLI_PATH} dashboard interactive --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--refresh');
      expect(output).toContain('60');
    });

    it('should have 60 seconds as default refresh', () => {
      const output = execSync(`${CLI_PATH} dashboard interactive --help`, {
        encoding: 'utf-8',
      });
      expect(output).toMatch(/refresh.*60/i);
    });
  });
});
