import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Tests share the development database. Run files one at a time so
    // pagination/count assertions are not affected by another file's writes.
    fileParallelism: false,
  },
});
