/**
 * Tests for the `now` command
 * Issue #41: Quick Cost Command
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Now Command', () => {
  const CLI_PATH = './bin/index.js';

  describe('command availability', () => {
    it('should have now command available', () => {
      const output = execSync(`${CLI_PATH} --help`, { encoding: 'utf-8' });
      expect(output).toContain('now');
    });

    it('should show help for now command', () => {
      const output = execSync(`${CLI_PATH} now --help`, { encoding: 'utf-8' });
      expect(output).toContain('Quick cost check');
      expect(output).toContain('today\'s spending instantly');
    });
  });

  describe('command options', () => {
    it('should support --provider option', () => {
      const output = execSync(`${CLI_PATH} now --help`, { encoding: 'utf-8' });
      expect(output).toContain('--provider');
      expect(output).toContain('Cloud provider');
    });

    it('should support --profile option', () => {
      const output = execSync(`${CLI_PATH} now --help`, { encoding: 'utf-8' });
      expect(output).toContain('--profile');
      expect(output).toContain('-p,');
    });

    it('should support --json option', () => {
      const output = execSync(`${CLI_PATH} now --help`, { encoding: 'utf-8' });
      expect(output).toContain('--json');
      expect(output).toContain('JSON format');
    });

    it('should support --all-profiles option', () => {
      const output = execSync(`${CLI_PATH} now --help`, { encoding: 'utf-8' });
      expect(output).toContain('--all-profiles');
    });
  });

  describe('command execution', () => {
    it('should have aws as default provider', () => {
      const output = execSync(`${CLI_PATH} now --help`, { encoding: 'utf-8' });
      expect(output).toMatch(/--provider.*default.*aws/i);
    });
  });
});
