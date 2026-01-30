/**
 * Tests for the annotate command
 * Issue #54: Cost Annotations for IaC Files
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Annotate Command', () => {
  const CLI_PATH = './bin/index.js';

  describe('command availability', () => {
    it('should have annotate command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('annotate');
    });

    it('should show help for annotate command', () => {
      const output = execSync(`${CLI_PATH} annotate --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('cost annotations');
      expect(output).toContain('Infrastructure as Code');
    });
  });

  describe('command options', () => {
    it('should support --path option', () => {
      const output = execSync(`${CLI_PATH} annotate --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--path');
      expect(output).toContain('./terraform');
    });

    it('should support --format option', () => {
      const output = execSync(`${CLI_PATH} annotate --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--format');
      expect(output).toContain('terraform');
      expect(output).toContain('cloudformation');
    });

    it('should support --dry-run option', () => {
      const output = execSync(`${CLI_PATH} annotate --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--dry-run');
      expect(output).toContain('without modifying');
    });

    it('should support --remove option', () => {
      const output = execSync(`${CLI_PATH} annotate --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--remove');
      expect(output).toContain('Remove existing');
    });

    it('should support --update option', () => {
      const output = execSync(`${CLI_PATH} annotate --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--update');
      expect(output).toContain('Update existing');
    });
  });

  describe('command defaults', () => {
    it('should have ./terraform as default path', () => {
      const output = execSync(`${CLI_PATH} annotate --help`, {
        encoding: 'utf-8',
      });
      expect(output).toMatch(/path.*\.\/terraform/i);
    });

    it('should have auto as default format', () => {
      const output = execSync(`${CLI_PATH} annotate --help`, {
        encoding: 'utf-8',
      });
      expect(output).toMatch(/format.*auto/i);
    });
  });
});
