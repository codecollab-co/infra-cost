import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: [
      'src/cli/index.ts', // New CLI entry point after restructuring
      'src/index.ts', // Legacy entry point for backwards compatibility
      'src/demo/test-enhanced-ui.ts',
      'src/demo/test-multi-cloud-dashboard.ts'
    ],
    outDir: 'dist',
    target: 'node20',
    platform: 'node',
    format: ['cjs'],
    splitting: false,
    sourcemap: true,
    minify: false,
    shims: false,
    dts: false,
    keepNames: true, // Preserve function names to avoid bundling issues
    external: [
      // Core AWS SDK clients (in package.json dependencies)
      '@aws-sdk/client-cost-explorer',
      '@aws-sdk/client-iam',
      '@aws-sdk/client-sts',
      '@aws-sdk/credential-providers',
      // Additional AWS SDK clients (peer dependencies)
      '@aws-sdk/client-ec2',
      '@aws-sdk/client-s3',
      '@aws-sdk/client-rds',
      '@aws-sdk/client-lambda',
      '@aws-sdk/client-budgets',
      '@aws-sdk/client-elastic-load-balancing-v2',
      '@aws-sdk/client-organizations',
      // Optional feature dependencies
      'puppeteer',
      'cli-progress',
      'moment',
      'ora',
      'ini',
      'dayjs',
      'express',
      'node-fetch',
      'exceljs',
      '@slack/web-api',
    ],
  },
]);
