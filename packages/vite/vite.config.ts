import nodeExternals from 'rollup-plugin-node-externals';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(
  ({ mode }): UserConfig => ({
    build: {
      emptyOutDir: mode !== 'development',
      lib: {
        entry: './src/index.ts',
        formats: ['es'],
        fileName: 'index',
      },
      outDir: './dist',
      minify: false,
    },
    optimizeDeps: {
      noDiscovery: true,
    },
    plugins: [nodeExternals({ devDeps: true }), dts()],
  }),
);
