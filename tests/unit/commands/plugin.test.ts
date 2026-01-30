/**
 * Tests for plugin commands
 * Custom Plugin System
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Plugin Commands', () => {
  const CLI_PATH = './bin/index.js';

  describe('plugin command', () => {
    it('should have plugin command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('plugin');
    });

    it('should show help for plugin command', () => {
      const output = execSync(`${CLI_PATH} plugin --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('plugin');
      expect(output).toContain('custom');
    });

    it('should have list subcommand', () => {
      const output = execSync(`${CLI_PATH} plugin --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('list');
    });

    it('should have info subcommand', () => {
      const output = execSync(`${CLI_PATH} plugin --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('info');
    });
  });

  describe('plugin module', () => {
    it('should export loadPlugins function', async () => {
      const { loadPlugins } = await import('../../../src/core/plugins');
      expect(typeof loadPlugins).toBe('function');
    });

    it('should export getLoadedPlugins function', async () => {
      const { getLoadedPlugins } = await import('../../../src/core/plugins');
      expect(typeof getLoadedPlugins).toBe('function');
    });

    it('should export registerPluginCommands function', async () => {
      const { registerPluginCommands } = await import('../../../src/core/plugins');
      expect(typeof registerPluginCommands).toBe('function');
    });

    it('should export getProviderPlugins function', async () => {
      const { getProviderPlugins } = await import('../../../src/core/plugins');
      expect(typeof getProviderPlugins).toBe('function');
    });
  });
});
