import { Language } from "../types";

export function showExportOptions() {
  const isAr = localStorage.getItem('lensLegend_language') === 'ar';
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn';
  modal.innerHTML = `
    <div class="glass-panel rounded-2xl p-6 max-w-md w-full mx-4 ${isAr ? 'font-arabic' : 'font-sans'} animate-slideUp" dir="${isAr ? 'rtl' : 'ltr'}" style="animation: slideUp 0.3s ease-out;">
      <div class="flex items-center justify-center mb-4">
        <div class="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
        </div>
      </div>
      <h3 class="text-xl font-bold text-cyan-400 mb-2 text-center">
        ${isAr ? 'تحميل الكود المصدري' : 'DOWNLOAD SOURCE CODE'}
      </h3>
      <p class="text-sm text-gray-300 mb-6 text-center leading-relaxed">
        ${isAr ? 'احصل على ملف HTML واحد يعمل بشكل مستقل مع جميع المميزات' : 'Get a single self-contained HTML file with all features included'}
      </p>
      <div class="flex gap-3">
        <button id="download-btn" class="flex-1 bg-cyan-500 text-black py-3 rounded-lg font-bold hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105">
          <span class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            ${isAr ? 'تحميل الآن' : 'DOWNLOAD'}
          </span>
        </button>
        <button id="cancel-btn" class="flex-1 bg-slate-700 text-white py-3 rounded-lg font-bold hover:bg-slate-600 transition-all transform hover:scale-105">
          ${isAr ? 'إلغاء' : 'CANCEL'}
        </button>
      </div>
    </div>
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-fadeIn {
        animation: fadeIn 0.2s ease-out;
      }
      .animate-slideUp {
        animation: slideUp 0.3s ease-out;
      }
    </style>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('download-btn')?.addEventListener('click', () => {
    downloadSingleFileApp();
    document.body.removeChild(modal);
  });
  
  document.getElementById('cancel-btn')?.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) document.body.removeChild(modal);
  });
}

export function downloadSingleFileApp() {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAKLs2p-VaZMyIztbHYezZSUfkmWBWcgys';
  const groqKey = import.meta.env.VITE_GROQ_API_KEY || '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';
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>LensLegend AI - Standalone</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; background-color: #050505; color: #fff; margin: 0; padding: 0; }
    .font-mono-tech { font-family: 'JetBrains Mono', monospace; }
    .font-arabic { font-family: 'Tajawal', sans-serif; }
    .glass-panel { background: rgba(13, 13, 13, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    // Gemini Key: ${geminiKey}
    // Groq Key: ${groqKey}
    
    alert('LensLegend AI - Standalone Version\\n\\nThis is a simplified version. Full functionality requires the complete app setup.');
    
    document.getElementById('root').innerHTML = \`
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
        <div>
          <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 1rem; color: #22d3ee;">LensLegend AI</h1>
          <p style="color: #94a3b8; margin-bottom: 2rem;">Standalone HTML Version</p>
          <p style="color: #64748b; max-width: 500px;">To use the full application, please visit the live site or clone the repository from GitHub.</p>
          <a href="https://fferras0.github.io/LensLegend/" style="display: inline-block; margin-top: 2rem; padding: 1rem 2rem; background: #22d3ee; color: #000; border-radius: 0.5rem; text-decoration: none; font-weight: bold;">Visit Live Site</a>
        </div>
      </div>
    \`;
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'lenslegend_standalone.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
