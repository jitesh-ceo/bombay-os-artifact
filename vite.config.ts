import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { apiProxy } from './server/apiProxy';

export default defineConfig(({ mode }) => {
  // Empty prefix: keys are read here on the server only and are never exposed to the bundle.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), apiProxy(env)],
  };
});
