import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: [
      'sb-18tp7r44yry9.vercel.run',
      // Opcional: permite qualquer subdomínio *.vercel.run durante testes
      '.vercel.run',
    ],
  },
});