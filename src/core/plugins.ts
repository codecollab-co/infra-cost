/**
 * Plugin System
 * Custom plugin support for extensibility
 *
 * Allows third-party plugins to extend infra-cost functionality
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { Command } from 'commander';

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author?: string;

  // Plugin lifecycle hooks
  init?: () => void | Promise<void>;
  registerCommands?: (program: Command) => void;
  registerProviders?: () => ProviderPlugin[];
  registerFormatters?: () => FormatterPlugin[];
}

export interface ProviderPlugin {
  name: string;
  displayName: string;
  authenticate: (config: any) => Promise<any>;
  getCosts: (options: any) => Promise<any>;
  getInventory?: (options: any) => Promise<any>;
}

export interface FormatterPlugin {
  name: string;
  format: (data: any, options?: any) => string;
}

const PLUGIN_DIR = join(homedir(), '.infra-cost', 'plugins');
const loadedPlugins: Map<string, Plugin> = new Map();

/**
 * Load plugin from directory
 */
function loadPluginFromDir(pluginPath: string): Plugin | null {
  const packageJsonPath = join(pluginPath, 'package.json');
  const indexPath = join(pluginPath, 'index.js');

  if (!existsSync(packageJsonPath) || !existsSync(indexPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // Require the plugin module
    const pluginModule = require(indexPath);
    const plugin: Plugin = pluginModule.default || pluginModule;

    // Validate plugin
    if (!plugin.name || !plugin.version) {
      console.warn(`Invalid plugin at ${pluginPath}: missing name or version`);
      return null;
    }

    return plugin;
  } catch (error) {
    console.warn(`Failed to load plugin from ${pluginPath}:`, error);
    return null;
  }
}

/**
 * Discover and load all plugins
 */
export function loadPlugins(): Plugin[] {
  const plugins: Plugin[] = [];

  if (!existsSync(PLUGIN_DIR)) {
    return plugins;
  }

  try {
    const pluginDirs = readdirSync(PLUGIN_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const dir of pluginDirs) {
      const pluginPath = join(PLUGIN_DIR, dir);
      const plugin = loadPluginFromDir(pluginPath);

      if (plugin) {
        plugins.push(plugin);
        loadedPlugins.set(plugin.name, plugin);
      }
    }
  } catch (error) {
    console.warn('Error discovering plugins:', error);
  }

  return plugins;
}

/**
 * Initialize all loaded plugins
 */
export async function initializePlugins(): Promise<void> {
  for (const plugin of loadedPlugins.values()) {
    if (plugin.init) {
      try {
        await plugin.init();
      } catch (error) {
        console.warn(`Failed to initialize plugin ${plugin.name}:`, error);
      }
    }
  }
}

/**
 * Register plugin commands
 */
export function registerPluginCommands(program: Command): void {
  for (const plugin of loadedPlugins.values()) {
    if (plugin.registerCommands) {
      try {
        plugin.registerCommands(program);
      } catch (error) {
        console.warn(`Failed to register commands for plugin ${plugin.name}:`, error);
      }
    }
  }
}

/**
 * Get all loaded plugins
 */
export function getLoadedPlugins(): Plugin[] {
  return Array.from(loadedPlugins.values());
}

/**
 * Get plugin by name
 */
export function getPlugin(name: string): Plugin | undefined {
  return loadedPlugins.get(name);
}

/**
 * Get all provider plugins
 */
export function getProviderPlugins(): ProviderPlugin[] {
  const providers: ProviderPlugin[] = [];

  for (const plugin of loadedPlugins.values()) {
    if (plugin.registerProviders) {
      try {
        const pluginProviders = plugin.registerProviders();
        providers.push(...pluginProviders);
      } catch (error) {
        console.warn(`Failed to get providers from plugin ${plugin.name}:`, error);
      }
    }
  }

  return providers;
}

/**
 * Get all formatter plugins
 */
export function getFormatterPlugins(): FormatterPlugin[] {
  const formatters: FormatterPlugin[] = [];

  for (const plugin of loadedPlugins.values()) {
    if (plugin.registerFormatters) {
      try {
        const pluginFormatters = plugin.registerFormatters();
        formatters.push(...pluginFormatters);
      } catch (error) {
        console.warn(`Failed to get formatters from plugin ${plugin.name}:`, error);
      }
    }
  }

  return formatters;
}
