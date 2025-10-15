import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/demo/test-enhanced-ui.ts'],
    outDir: 'dist',
    target: 'node16',
    platform: 'node',
    format: ['esm'],
    splitting: false,
    sourcemap: true,
    minify: false,
    shims: true,
    dts: false,
  },
]);
