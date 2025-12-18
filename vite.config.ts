import path from 'path';
// Fix: Import fileURLToPath to reconstruct __dirname in ESM environment
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Fix: Polyfill __filename and __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    // تحميل المتغيرات من ملفات .env المحلية
    // Fix: Use path.resolve('.') instead of process.cwd() to avoid TypeScript type errors with Process interface
    const env = loadEnv(mode, path.resolve('.'), '');
    
    // المفتاح المقدم
    const apiKey = "AIzaSyAKLs2p-VaZMyIztbHYezZSUfkmWBWcgys";

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // تمرير المفتاح الصحيح للكود
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});