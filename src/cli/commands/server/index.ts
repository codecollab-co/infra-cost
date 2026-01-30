/**
 * Server command - API Server Mode
 * Issue #49: API Server Mode (REST API for Integrations)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { ApiServer, ApiServerConfig } from '../../../api/server';

const CONFIG_DIR = join(homedir(), '.infra-cost');
const SERVER_CONFIG_PATH = join(CONFIG_DIR, 'server-config.json');
const PID_FILE = join(CONFIG_DIR, 'server.pid');

const DEFAULT_CONFIG: ApiServerConfig = {
  port: 3000,
  host: '127.0.0.1',
  cors: {
    enabled: true,
    origins: ['*'],
  },
  auth: {
    type: 'none',
  },
  rateLimit: {
    enabled: true,
    windowMs: 60000,
    max: 100,
  },
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
};

function loadServerConfig(): ApiServerConfig {
  if (existsSync(SERVER_CONFIG_PATH)) {
    const config = JSON.parse(readFileSync(SERVER_CONFIG_PATH, 'utf-8'));
    return { ...DEFAULT_CONFIG, ...config };
  }
  return DEFAULT_CONFIG;
}

function saveServerConfig(config: ApiServerConfig): void {
  writeFileSync(SERVER_CONFIG_PATH, JSON.stringify(config, null, 2));
}

async function handleStart(options: any): Promise<void> {
  try {
    // Check if server is already running
    if (existsSync(PID_FILE)) {
      const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);
      try {
        process.kill(pid, 0);
        console.log(chalk.yellow('⚠️  Server is already running'));
        console.log(chalk.gray(`   PID: ${pid}`));
        return;
      } catch {
        // Process not running, remove stale PID file
        require('fs').unlinkSync(PID_FILE);
      }
    }

    const config = loadServerConfig();

    // Override with CLI options
    if (options.port) config.port = parseInt(options.port, 10);
    if (options.host) config.host = options.host;
    if (options.apiKey) {
      config.auth = {
        type: 'api-key',
        apiKeys: [options.apiKey],
      };
    }
    if (options.apiKeyRequired && !options.apiKey) {
      console.log(chalk.red('❌ --api-key is required when --api-key-required is set'));
      process.exit(1);
    }

    const server = new ApiServer(config);

    // Handle daemon mode
    if (options.daemon) {
      console.log(chalk.blue('Starting server in daemon mode...'));

      const { spawn } = require('child_process');
      const child = spawn(
        process.argv[0],
        [process.argv[1], 'server', 'start', '--port', config.port.toString(), '--host', config.host],
        {
          detached: true,
          stdio: 'ignore',
        }
      );
      child.unref();

      writeFileSync(PID_FILE, child.pid!.toString());
      console.log(chalk.green('✅ Server started in background'));
      console.log(chalk.gray(`   PID: ${child.pid}`));
      console.log(chalk.gray(`   URL: http://${config.host}:${config.port}`));
      return;
    }

    // Start server
    await server.start();

    // Write PID file
    writeFileSync(PID_FILE, process.pid.toString());

    console.log();
    console.log(chalk.bold('Server Configuration:'));
    console.log(chalk.gray(`  Port:         ${config.port}`));
    console.log(chalk.gray(`  Host:         ${config.host}`));
    console.log(chalk.gray(`  Auth:         ${config.auth.type}`));
    console.log(chalk.gray(`  Rate Limit:   ${config.rateLimit.enabled ? 'enabled' : 'disabled'}`));
    console.log(chalk.gray(`  Cache:        ${config.cache.enabled ? `${config.cache.ttl}s` : 'disabled'}`));
    console.log();

    if (config.auth.type === 'api-key') {
      console.log(chalk.yellow('⚠️  API Key Authentication Enabled'));
      console.log(chalk.gray('   Use header: X-API-Key: your-api-key'));
      console.log();
    }

    console.log(chalk.green('Press Ctrl+C to stop the server'));

    // Graceful shutdown
    const shutdown = async () => {
      console.log(chalk.yellow('\n\nShutting down server...'));
      await server.stop();
      if (existsSync(PID_FILE)) {
        require('fs').unlinkSync(PID_FILE);
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to start server:'), error.message);
    process.exit(1);
  }
}

async function handleStop(): Promise<void> {
  try {
    if (!existsSync(PID_FILE)) {
      console.log(chalk.yellow('⚠️  Server is not running'));
      return;
    }

    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);

    try {
      process.kill(pid, 'SIGTERM');
      console.log(chalk.green('✅ Server stopped'));

      // Wait a bit and remove PID file
      setTimeout(() => {
        if (existsSync(PID_FILE)) {
          require('fs').unlinkSync(PID_FILE);
        }
      }, 1000);
    } catch {
      console.log(chalk.yellow('⚠️  Server process not found'));
      if (existsSync(PID_FILE)) {
        require('fs').unlinkSync(PID_FILE);
      }
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to stop server:'), error.message);
    process.exit(1);
  }
}

async function handleStatus(): Promise<void> {
  try {
    if (!existsSync(PID_FILE)) {
      console.log(chalk.yellow('⚠️  Server is not running'));
      return;
    }

    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);

    try {
      process.kill(pid, 0);
      const config = loadServerConfig();

      console.log(chalk.green('✅ Server is running'));
      console.log(chalk.gray(`   PID:  ${pid}`));
      console.log(chalk.gray(`   URL:  http://${config.host}:${config.port}`));
      console.log(chalk.gray(`   Docs: http://${config.host}:${config.port}/api/docs`));
    } catch {
      console.log(chalk.yellow('⚠️  Server is not running (stale PID file)'));
      require('fs').unlinkSync(PID_FILE);
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to check status:'), error.message);
    process.exit(1);
  }
}

async function handleConfigure(options: any): Promise<void> {
  try {
    const config = loadServerConfig();

    if (options.port) config.port = parseInt(options.port, 10);
    if (options.host) config.host = options.host;
    if (options.enableCors !== undefined) config.cors.enabled = options.enableCors === 'true';
    if (options.cacheEnabled !== undefined) config.cache.enabled = options.cacheEnabled === 'true';
    if (options.cacheTtl) config.cache.ttl = parseInt(options.cacheTtl, 10);

    saveServerConfig(config);

    console.log(chalk.green('✅ Server configuration updated'));
    console.log();
    console.log(JSON.stringify(config, null, 2));
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to configure server:'), error.message);
    process.exit(1);
  }
}

export function registerServerCommands(program: Command): void {
  const server = program
    .command('server')
    .description('API server mode for REST API access');

  // Start subcommand
  server
    .command('start')
    .description('Start the API server')
    .option('-p, --port <port>', 'Port to listen on', '3000')
    .option('-h, --host <host>', 'Host to bind to', '127.0.0.1')
    .option('--api-key <key>', 'API key for authentication')
    .option('--api-key-required', 'Require API key authentication')
    .option('-d, --daemon', 'Run in background/daemon mode')
    .action(handleStart);

  // Stop subcommand
  server
    .command('stop')
    .description('Stop the running API server')
    .action(handleStop);

  // Status subcommand
  server
    .command('status')
    .description('Check server status')
    .action(handleStatus);

  // Configure subcommand
  server
    .command('configure')
    .description('Configure server settings')
    .option('-p, --port <port>', 'Default port')
    .option('-h, --host <host>', 'Default host')
    .option('--enable-cors <boolean>', 'Enable/disable CORS')
    .option('--cache-enabled <boolean>', 'Enable/disable caching')
    .option('--cache-ttl <seconds>', 'Cache TTL in seconds')
    .action(handleConfigure);
}
