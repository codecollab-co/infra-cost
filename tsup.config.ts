import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: [
      'src/cli/index.ts', // New CLI entry point after restructuring
      'src/index.ts', // Legacy entry point for backwards compatibility
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
      // Core AWS SDK clients
      '@aws-sdk/client-cost-explorer',
      '@aws-sdk/client-iam',
      '@aws-sdk/client-sts',
      '@aws-sdk/credential-providers',
      '@aws-sdk/client-ec2',
      '@aws-sdk/client-s3',
      '@aws-sdk/client-rds',
      '@aws-sdk/client-lambda',
      '@aws-sdk/client-budgets',
      '@aws-sdk/client-elastic-load-balancing-v2',
      '@aws-sdk/client-organizations',
      // Azure SDK
      '@azure/arm-compute',
      '@azure/arm-consumption',
      '@azure/arm-containerservice',
      '@azure/arm-costmanagement',
      '@azure/arm-network',
      '@azure/arm-sql',
      '@azure/arm-storage',
      '@azure/arm-subscriptions',
      '@azure/identity',
      // Google Cloud SDK
      '@google-cloud/bigquery',
      '@google-cloud/billing',
      '@google-cloud/compute',
      '@google-cloud/container',
      '@google-cloud/monitoring',
      '@google-cloud/resource-manager',
      '@google-cloud/sql',
      '@google-cloud/storage',
      'googleapis',
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
