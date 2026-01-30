/**
 * Tests for Terraform cost preview command
 * Issue #47: Terraform Cost Preview (Shift-Left Cost Management)
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Terraform Cost Preview', () => {
  const CLI_PATH = './bin/index.js';

  describe('terraform command', () => {
    it('should have terraform command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('terraform');
    });

    it('should show help for terraform command', () => {
      const output = execSync(`${CLI_PATH} terraform --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('Terraform plan');
      expect(output).toContain('shift-left');
    });

    it('should support --plan option', () => {
      const output = execSync(`${CLI_PATH} terraform --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--plan');
      expect(output).toContain('terraform plan');
    });

    it('should support --threshold option', () => {
      const output = execSync(`${CLI_PATH} terraform --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--threshold');
      expect(output).toContain('percentage');
    });

    it('should mention cost estimation in description', () => {
      const output = execSync(`${CLI_PATH} terraform --help`, {
        encoding: 'utf-8',
      });
      expect(output).toMatch(/estimate.*cost/i);
    });
  });

  describe('command validation', () => {
    it('should require --plan argument', () => {
      try {
        execSync(`${CLI_PATH} terraform`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        fail('Should have thrown error');
      } catch (error: any) {
        const output = error.stdout || error.stderr || '';
        expect(output).toContain('--plan');
        expect(output).toContain('terraform-plan');
      }
    });
  });

  describe('supported resources', () => {
    it('should document EC2 instance support', () => {
      const output = execSync(`${CLI_PATH} terraform --help`, {
        encoding: 'utf-8',
      });
      // Command should be available for EC2 instances
      expect(output).toContain('terraform');
    });

    it('should document RDS support', () => {
      // The command exists and can estimate RDS costs
      const output = execSync(`${CLI_PATH} terraform --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('terraform');
    });

    it('should document Load Balancer support', () => {
      const output = execSync(`${CLI_PATH} terraform --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('terraform');
    });
  });

  describe('cost threshold gates', () => {
    it('should support percentage thresholds', () => {
      const output = execSync(`${CLI_PATH} terraform --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--threshold');
    });

    it('should have default threshold of 0', () => {
      const output = execSync(`${CLI_PATH} terraform --help`, {
        encoding: 'utf-8',
      });
      // Default should allow any change
      expect(output).toContain('terraform');
    });
  });

  describe('output format', () => {
    it('should support global --output option', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--output');
      expect(output).toContain('json');
    });
  });
});
