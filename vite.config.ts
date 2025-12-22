import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: '/LensLegend/', // اسم الريبو على GitHub
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  define: {
    // تضمين المفاتيح مباشرة في البناء
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify('AIzaSyAKLs2p-VaZMyIztbHYezZSUfkmWBWcgys'),
    'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify('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'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
  }
});
