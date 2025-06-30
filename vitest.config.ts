import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/**/*.d.ts'],
      reporter: ['text', 'html'],
    },
  },
});
