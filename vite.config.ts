
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimisation pour les petits appareils
    target: 'esnext',
  },
  server: {
    port: 3000,
  },
  // Gestion des variables d'environnement pour éviter les crashs
  define: {
    'process.env': process.env
  }
});
