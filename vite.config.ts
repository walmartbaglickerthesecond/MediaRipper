import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/MediaRipper/',  // 👈 This matches your repo name – very important!
  plugins: [react()],
});
