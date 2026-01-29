#!/usr/bin/env node
/**
 * Legacy Entry Point
 *
 * This file maintains backwards compatibility by forwarding to the new CLI structure.
 * The main CLI implementation is now in src/cli/index.ts
 */

import { main } from './cli/index';

// Run the new CLI
main().catch((error) => {
  console.error('An error occurred:', error);
  process.exit(1);
});
