/**
 * Tests for git cost history commands
 * Issue #56: Git Cost History (Cost-Commit Correlation)
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Git Cost History Commands', () => {
  const CLI_PATH = './bin/index.js';

  describe('history command', () => {
    it('should have history command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('history');
    });

    it('should show help for history command', () => {
      const output = execSync(`${CLI_PATH} history --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('cost history');
      expect(output).toContain('git correlation');
    });

    it('should support --git option', () => {
      const output = execSync(`${CLI_PATH} history --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--git');
      expect(output).toContain('git commit correlation');
    });

    it('should support --commit option', () => {
      const output = execSync(`${CLI_PATH} history --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--commit');
      expect(output).toContain('specific commit');
    });

    it('should support --period option', () => {
      const output = execSync(`${CLI_PATH} history --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--period');
      expect(output).toContain('week');
    });

    it('should support --author option', () => {
      const output = execSync(`${CLI_PATH} history --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--author');
    });

    it('should support --format option', () => {
      const output = execSync(`${CLI_PATH} history --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--format');
      expect(output).toContain('json');
      expect(output).toContain('markdown');
    });
  });

  describe('blame command', () => {
    it('should have blame command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('blame');
    });

    it('should show help for blame command', () => {
      const output = execSync(`${CLI_PATH} blame --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('cost impact');
      expect(output).toContain('author');
    });

    it('should support --period option', () => {
      const output = execSync(`${CLI_PATH} blame --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--period');
      expect(output).toContain('month');
    });

    it('should support --format option', () => {
      const output = execSync(`${CLI_PATH} blame --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--format');
    });
  });

  describe('command defaults', () => {
    it('should have week as default period for history', () => {
      const output = execSync(`${CLI_PATH} history --help`, {
        encoding: 'utf-8',
      });
      expect(output).toMatch(/period.*week/i);
    });

    it('should have month as default period for blame', () => {
      const output = execSync(`${CLI_PATH} blame --help`, {
        encoding: 'utf-8',
      });
      expect(output).toMatch(/period.*month/i);
    });

    it('should have text as default format', () => {
      const output = execSync(`${CLI_PATH} history --help`, {
        encoding: 'utf-8',
      });
      expect(output).toMatch(/format.*text/i);
    });
  });
});
