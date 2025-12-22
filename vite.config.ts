import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, path.resolve('.'), '');
    
    // المفاتيح الافتراضية
    const geminiApiKey = env.VITE_GEMINI_API_KEY || "AIzaSyAKLs2p-VaZMyIztbHYezZSUfkmWBWcgys";
    const groqApiKey = env.VITE_GROQ_API_KEY || "";

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.VITE_GROQ_API_KEY': JSON.stringify(groqApiKey),
        'process.env.API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
