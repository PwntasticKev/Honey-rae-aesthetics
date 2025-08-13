import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules/',
      'tests/',
      '**/*.e2e.{test,spec}.{js,ts}',
      '**/*.config.*',
      'coverage/',
      'dist/',
      '.next/',
      'convex/_generated/',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/',
        'dist/',
        '.next/',
        'convex/_generated/',
      ],
    },
    // Mock Convex by default
    deps: {
      optimizer: {
        web: {
          include: ['convex']
        }
      }
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/convex': path.resolve(__dirname, './convex'),
      '@/convex/_generated/api': path.resolve(__dirname, './src/test/mocks/convex-api.ts'),
    },
  },
})