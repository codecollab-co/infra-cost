import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/demo/test-enhanced-ui.ts', 'src/demo/test-multi-cloud-dashboard.ts'],
    outDir: 'dist',
    target: 'node16',
    platform: 'node',
    format: ['cjs'],
    splitting: false,
    sourcemap: true,
    minify: false,
    shims: false,
    dts: false,
    external: [
      // AWS SDK clients
      '@aws-sdk/client-cost-explorer',
      '@aws-sdk/client-iam',
      '@aws-sdk/client-sts',
      '@aws-sdk/client-ec2',
      '@aws-sdk/client-s3',
      '@aws-sdk/client-rds',
      '@aws-sdk/client-lambda',
      '@aws-sdk/client-budgets',
      '@aws-sdk/client-organizations',
      '@aws-sdk/credential-providers',
      '@aws-sdk/types',
      // Third-party dependencies
      'chalk',
      'ora',
      'node-fetch',
      'commander',
      'cli-progress',
      'moment',
      'exceljs',
      'puppeteer',
      '@slack/web-api',
    ],
  },
]);
