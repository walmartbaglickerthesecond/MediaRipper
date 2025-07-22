import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/MediaRipper/',  // 👈 Must match your repo name exactly!
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    assetsDir: 'assets',  // 👈 Ensures assets go in an 'assets' folder with correct paths
  },
});
