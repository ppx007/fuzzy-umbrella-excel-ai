import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/simple.test.ts'],
    globals: true,
  },
});
