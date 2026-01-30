/**
 * Tests for Email integration
 * Issue #58: Email Report Scheduling
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Email Integration', () => {
  const CLI_PATH = './bin/index.js';

  describe('Email module', () => {
    it('should export sendEmailReport function', async () => {
      const { sendEmailReport } = await import('../../../src/integrations/email');
      expect(typeof sendEmailReport).toBe('function');
    });
  });

  describe('export email command', () => {
    it('should be available', () => {
      const output = execSync(`${CLI_PATH} export --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('email');
    });

    it('should support --email-to option', () => {
      const output = execSync(`${CLI_PATH} export email --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--email-to');
      expect(output).toContain('Recipient');
    });

    it('should support --email-from option', () => {
      const output = execSync(`${CLI_PATH} export email --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--email-from');
      expect(output).toContain('Sender');
    });

    it('should support --email-provider option', () => {
      const output = execSync(`${CLI_PATH} export email --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--email-provider');
      expect(output).toContain('sendgrid');
      expect(output).toContain('mailgun');
    });

    it('should support --sendgrid-key option', () => {
      const output = execSync(`${CLI_PATH} export email --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--sendgrid-key');
    });

    it('should support --mailgun-key option', () => {
      const output = execSync(`${CLI_PATH} export email --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--mailgun-key');
    });

    it('should support --mailgun-domain option', () => {
      const output = execSync(`${CLI_PATH} export email --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--mailgun-domain');
    });

    it('should support --subject option', () => {
      const output = execSync(`${CLI_PATH} export email --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--subject');
    });
  });
});
