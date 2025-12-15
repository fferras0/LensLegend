import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // تحميل المتغيرات من ملفات .env المحلية
    const env = loadEnv(mode, process.cwd(), '');
    
    // المفتاح المقدم
    const apiKey = "AIzaSyBuIvS_y9BCfZLB2xJre70chmzratHF8-Q";

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