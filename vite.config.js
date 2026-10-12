import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Reads client/.env (see .env.example). Only VITE_* variables reach the browser; never put secrets here.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_DEV_PORT || 5173),
      // Dev only: forward /api to the Express server. Keeping it same-origin means the auth cookie and the Google OAuth callback just work.
      proxy: { '/api': env.VITE_PROXY_TARGET || 'http://localhost:4000' },
    },
  };
});
