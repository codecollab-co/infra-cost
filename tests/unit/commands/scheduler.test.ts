/**
 * Tests for scheduler commands
 * Issue #42: Built-in Scheduled Reports with Daemon Mode
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Scheduler Commands', () => {
  const CLI_PATH = './bin/index.js';

  describe('scheduler command', () => {
    it('should have scheduler command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('scheduler');
    });

    it('should show help for scheduler command', () => {
      const output = execSync(`${CLI_PATH} scheduler --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('scheduled cost reports');
      expect(output).toContain('daemon');
    });

    it('should have start subcommand', () => {
      const output = execSync(`${CLI_PATH} scheduler --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('start');
      expect(output).toContain('Start scheduler daemon');
    });

    it('should have stop subcommand', () => {
      const output = execSync(`${CLI_PATH} scheduler --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('stop');
      expect(output).toContain('Stop scheduler daemon');
    });

    it('should have status subcommand', () => {
      const output = execSync(`${CLI_PATH} scheduler --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('status');
    });

    it('should have add subcommand', () => {
      const output = execSync(`${CLI_PATH} scheduler --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('add');
      expect(output).toContain('Add new schedule');
    });

    it('should have remove subcommand', () => {
      const output = execSync(`${CLI_PATH} scheduler --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('remove');
    });

    it('should have list subcommand', () => {
      const output = execSync(`${CLI_PATH} scheduler --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('list');
    });

    it('should have logs subcommand', () => {
      const output = execSync(`${CLI_PATH} scheduler --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('logs');
    });

    it('should have generate-systemd subcommand', () => {
      const output = execSync(`${CLI_PATH} scheduler --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('generate-systemd');
      expect(output).toContain('systemd service file');
    });
  });

  describe('scheduler add command', () => {
    it('should support --name option', () => {
      const output = execSync(`${CLI_PATH} scheduler add --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--name');
    });

    it('should support --cron option', () => {
      const output = execSync(`${CLI_PATH} scheduler add --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--cron');
      expect(output).toContain('Cron expression');
    });

    it('should support --command option', () => {
      const output = execSync(`${CLI_PATH} scheduler add --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--command');
    });

    it('should support --timezone option', () => {
      const output = execSync(`${CLI_PATH} scheduler add --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--timezone');
      expect(output).toContain('UTC');
    });
  });
});
