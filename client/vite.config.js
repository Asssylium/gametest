import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// /api requests are proxied to the Express server so the browser sees a single origin.
// Port and API address come from client/.env (see .env.example).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.js',
    },
    server: {
      port: Number(env.CLIENT_PORT) || 5173,
      proxy: {
        '/api': env.API_URL || 'http://localhost:3001',
      },
    },
  };
});
