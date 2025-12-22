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
  const apiKey = process.env.API_KEY || "AIzaSyAKLs2p-VaZMyIztbHYezZSUfkmWBWcgys";
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>LensLegend AI - Enhanced Edition</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="importmap">
    {
      "imports": {
        "@google/genai": "https://esm.sh/@google/genai@1.33.0"
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
      body { font-family: 'Outfit', sans-serif; background-color: #050505; color: #fff; overscroll-behavior: none; overflow: hidden; margin: 0; padding: 0; }
      .font-mono-tech { font-family: 'JetBrains Mono', monospace; }
      .font-arabic { font-family: 'Tajawal', sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .glass-panel { background: rgba(13, 13, 13, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes ping { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: .5; } }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      .animate-spin { animation: spin 1s linear infinite; }
      .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
      .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel" data-type="module">
    import React, { useState, useEffect, useRef } from 'react';
    import ReactDOM from 'react-dom/client';
    import { GoogleGenAI } from "@google/genai";

    const AppState = {
      IDLE: 'IDLE',
      ANALYZING_IMAGE: 'ANALYZING_IMAGE',
      FETCHING_INFO: 'FETCHING_INFO',
      GENERATING_AUDIO: 'GENERATING_AUDIO',
      SHOWING_RESULT: 'SHOWING_RESULT',
      ERROR: 'ERROR'
    };

    const API_KEY = "${apiKey}";
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    function decodeBase64(base64) {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
      return bytes;
    }

    let audioContext = null;
    function getAudioContext() {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContext.state === 'suspended') audioContext.resume();
      return audioContext;
    }

    async function decodeAudioData(base64String, ctx) {
      const pcmData = decodeBase64(base64String);
      const int16Data = new Int16Array(pcmData.buffer);
      const buffer = ctx.createBuffer(1, int16Data.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < int16Data.length; i++) { channelData[i] = int16Data[i] / 32768.0; }
      return buffer;
    }

    async function identifyLandmark(base64Data, mimeType, language) {
       const langName = language === 'ar' ? 'Arabic' : 'English';
       const promptText = language === 'ar' 
         ? 'حدد الموضوع الرئيسي في هذه الصورة (معلم، مكان، كائن، أو مشهد). أعط اسماً مختصراً فقط بدون أي شرح إضافي.'
         : 'Identify the main subject in this image (landmark, place, object, or scene). Provide ONLY a short name without any additional explanation or markdown.';
       
       try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: promptText }] }
          });
          let cleanName = response.text?.trim() || "";
          cleanName = cleanName.replace(/[\\*\\"]/g, '').trim();
          if (!cleanName || cleanName.toLowerCase().includes("cannot") || cleanName.toLowerCase() === 'unknown') {
            return language === 'ar' ? "مشهد عام" : "General Scene";
          }
          return cleanName;
       } catch (error) {
          console.error(error);
          return language === 'ar' ? "مشهد عام" : "General Scene";
       }
    }

    async function getLandmarkDetails(landmarkName, base64Data, mimeType, language) {
      const langName = language === 'ar' ? 'Arabic' : 'English';
      const promptText = language === 'ar'
        ? \`قدم وصفاً سياحياً جذاباً ومختصراً (لا يتجاوز 80 كلمة) بالعربية عن: \${landmarkName}. ركز على الحقائق المثيرة والتاريخ والأهمية. اجعله مناسباً لدليل صوتي سياحي.\`
        : \`Provide a captivating, concise tourist description (max 80 words) in English about: \${landmarkName}. Focus on interesting facts, history, and significance. Make it suitable for an audio tour guide.\`;
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: promptText }] },
          config: { tools: [{ googleSearch: {} }] }
        });
        const description = response.text?.trim() || (language === 'ar' ? "لا يتوفر وصف." : "No description available.");
        const sources = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
           chunks.forEach(chunk => { if(chunk.web) sources.push({ title: chunk.web.title || "Source", uri: chunk.web.uri }); });
        }
        const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);
        return { description: description.replace(/[\\*]/g, ''), sources: uniqueSources };
      } catch (e) {
        console.error(e);
        return { description: language === 'ar' ? "خطأ في الجلب" : "Error fetching", sources: [] };
      }
    }

    async function generateNarration(text) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{ parts: [{ text }] }],
        config: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("Audio generation failed");
      const ctx = getAudioContext();
      return await decodeAudioData(base64Audio, ctx);
    }

    async function enhanceImageVisuals(imageBase64, mimeType) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: { parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: "Generate a high-fidelity, 4k resolution photorealistic version. Improve sharpness and lighting." }] }
      });
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) return part.inlineData.data;
        }
      }
      throw new Error("No image returned");
    }

    function createLandmarkChat(landmarkName, description, language) {
       const sysInstruction = language === 'ar' 
        ? \`أنت مرشد سياحي خبير ومرح ومفيد في \${landmarkName}. المعلومات المتاحة: "\${description}". أجب عن أسئلة الزوار باختصار ووضوح ومتعة. استخدم أسلوباً ودياً ومشوقاً.\`
        : \`You are an expert, witty, and helpful tour guide at \${landmarkName}. Available info: "\${description}". Answer visitor questions concisely, clearly, and engagingly. Use a friendly and interesting tone.\`;
       return ai.chats.create({ model: 'gemini-2.0-flash-exp', config: { systemInstruction: sysInstruction } });
    }

    const LoadingScreen = ({ status, language, imageSrc }) => {
       const isAr = language === 'ar';
       const [dots, setDots] = React.useState('');
       const [progress, setProgress] = React.useState(0);
       
       React.useEffect(() => { 
         const i = setInterval(() => setDots(p => p.length>=3?'':p+'.'), 400); 
         return () => clearInterval(i); 
       }, []);
       
       React.useEffect(() => {
         const pi = setInterval(() => setProgress(p => p>=90?p:p+Math.random()*15), 300);
         return () => clearInterval(pi);
       }, []);
       
       const t = {
         identifying: isAr ? 'تحليل الصورة' : 'ANALYZING_VISUAL_DATA',
         searching: isAr ? 'جاري استدعاء المعلومات' : 'FETCHING_DATABASE_HISTORY',
         generating: isAr ? 'تكوين الرد الصوتي' : 'SYNTHESIZING_AUDIO_STREAM'
       };

       let mainText = t.identifying;
       if (status.includes("Searching") || status.includes("FETCHING")) mainText = t.searching;
       if (status.includes("Generating") || status.includes("GENERATING")) mainText = t.generating;
       
       return (
         <div className={\`absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 overflow-hidden \${isAr ? 'font-arabic' : 'font-mono-tech'}\`} dir={isAr ? 'rtl' : 'ltr'}>
            {imageSrc && <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 blur-md scale-110" style={{ backgroundImage: \`url(\${imageSrc})\` }} />}
            <div className="absolute inset-0 bg-slate-950/90 z-0"></div>
            <div className="relative z-20 flex flex-col items-center w-full max-w-md px-6">
              <div className="relative w-28 h-28 mb-8">
                <svg className="w-full h-full text-cyan-500 animate-spin" style={{animationDuration: '2s'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-cyan-400/20 rounded-full animate-ping"></div>
                </div>
              </div>
              <h3 className="text-xl text-cyan-400 font-bold uppercase mb-2 text-center" style={{textShadow: '0 0 10px rgba(34, 211, 238, 0.6)'}}>{isAr ? mainText : \`>> \${mainText}\`}</h3>
              <p className="text-xs text-cyan-700 font-mono-tech">{isAr ? 'معالجة' : 'Processing'}{dots}</p>
              <div className="mt-8 w-full max-w-xs">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-300" style={{width: \`\${progress}%\`, boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)'}}></div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-cyan-600 font-mono-tech">
                  <span>{isAr ? 'جاري...' : 'Processing...'}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
         </div>
       );
    };

    const ARResultView = ({ data, onReset, onRegenerateAudio }) => {
       const [isPlaying, setIsPlaying] = React.useState(false);
       const [activeTab, setActiveTab] = React.useState('info');
       const [chatSession, setChatSession] = React.useState(null);
       const [messages, setMessages] = React.useState([]);
       const [inputMsg, setInputMsg] = React.useState('');
       const [isEnhanced, setIsEnhanced] = React.useState(false);
       const [currentImage, setCurrentImage] = React.useState(data.originalImage);
       const [isEnhancing, setIsEnhancing] = React.useState(false);
       const [playbackRate, setPlaybackRate] = React.useState(1.0);

       const audioCtxRef = React.useRef(null);
       const sourceRef = React.useRef(null);
       const chatEndRef = React.useRef(null);
       const isAr = data.language === 'ar';

       React.useEffect(() => {
          if(data.audioBuffer) stopAudio();
          const chat = createLandmarkChat(data.name, data.description, data.language);
          setChatSession(chat);
          setMessages([{ id: 'w', role: 'model', text: isAr ? 'مرحباً! اسألني أي شيء عن هذا المكان.' : 'Welcome! Ask me anything about this place.', timestamp: new Date() }]);
          return () => stopAudio();
       }, [data]);

       React.useEffect(() => chatEndRef.current?.scrollIntoView({behavior:'smooth'}), [messages, activeTab]);

       const playAudio = async () => {
         if(!data.audioBuffer) return;
         if(!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
         if(audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
         if(sourceRef.current) try{sourceRef.current.stop()}catch(e){}
         const src = audioCtxRef.current.createBufferSource();
         src.buffer = data.audioBuffer;
         src.playbackRate.value = playbackRate;
         src.connect(audioCtxRef.current.destination);
         src.onended = () => setIsPlaying(false);
         src.start(0);
         sourceRef.current = src;
         setIsPlaying(true);
       };

       const stopAudio = () => { 
         if(sourceRef.current) { 
           try{sourceRef.current.stop()}catch(e){}
           sourceRef.current=null;
         } 
         setIsPlaying(false);
       };
       
       const togglePlayback = () => isPlaying ? stopAudio() : playAudio();
       
       const cyclePlaybackRate = () => {
         const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
         const currentIndex = rates.indexOf(playbackRate);
         const nextRate = rates[(currentIndex + 1) % rates.length];
         setPlaybackRate(nextRate);
         if (sourceRef.current) {
           sourceRef.current.playbackRate.value = nextRate;
         }
       };

       const handleSend = async (e) => {
         e?.preventDefault();
         if(!inputMsg.trim() || !chatSession) return;
         const userText = inputMsg; 
         setInputMsg('');
         setMessages(p => [...p, { id: Date.now(), role: 'user', text: userText, timestamp: new Date() }]);
         try {
           const res = await chatSession.sendMessage({ message: userText });
           setMessages(p => [...p, { id: Date.now()+1, role: 'model', text: res.text, timestamp: new Date() }]);
         } catch(err) { 
           console.error(err);
           setMessages(p => [...p, { id: Date.now()+1, role: 'model', text: isAr ? 'عذراً، حدث خطأ.' : 'Sorry, an error occurred.', timestamp: new Date() }]);
         }
       };

       const handleEnhance = async () => {
          if(isEnhanced) { setCurrentImage(data.originalImage); setIsEnhanced(false); return; }
          if(data.enhancedImage) { setCurrentImage(\`data:image/jpeg;base64,\${data.enhancedImage}\`); setIsEnhanced(true); return; }
          setIsEnhancing(true);
          try {
             const parts = data.originalImage.split(',');
             const enhanced = await enhanceImageVisuals(parts[1], parts[0].split(':')[1].split(';')[0]);
             data.enhancedImage = enhanced;
             setCurrentImage(\`data:image/jpeg;base64,\${enhanced}\`);
             setIsEnhanced(true);
          } catch(e) { 
            alert(isAr ? 'فشل التحسين: ' + e.message : 'Enhancement failed: ' + e.message);
          } finally { 
            setIsEnhancing(false);
          }
       };

       const handleDownload = () => {
         const link = document.createElement('a');
         link.href = currentImage;
         link.download = \`lenslegend_\${data.name.replace(/\\s+/g, '_')}_enhanced.png\`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
       };

       return (
         <div className={\`relative h-screen w-full bg-slate-950 flex flex-col \${isAr ? 'font-arabic' : 'font-sans'}\`} dir={isAr ? 'rtl' : 'ltr'}>
           <div className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-all duration-700" style={{ backgroundImage: \`url(\${currentImage})\` }}></div>
           <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none"></div>
           
           <div className="relative z-10 p-4 flex justify-between">
              <div className="flex gap-2">
                <button onClick={onReset} className="bg-black/50 text-cyan-400 px-4 py-2 rounded-full border border-white/10 text-xs hover:bg-black/70 transition-all">{isAr ? 'عودة' : 'BACK'}</button>
              </div>
              <div className="flex gap-2">
                {isEnhanced && (
                   <button onClick={handleDownload} className="bg-cyan-500 text-black w-10 h-10 rounded-lg border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)] text-xs flex items-center justify-center hover:bg-cyan-400 transition-all">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0L8 8m4-4v12" /></svg>
                   </button>
                )}
                <button onClick={handleEnhance} disabled={isEnhancing} className={\`px-4 py-2 rounded-lg border text-xs transition-all \${isEnhanced ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'bg-black/50 text-cyan-300 border-cyan-500/30 hover:bg-cyan-900/30'}\`}>
                  {isEnhancing ? '...' : (isEnhanced ? (isAr ? 'أصلي' : 'ORIGINAL') : (isAr ? 'تحسين' : 'ENHANCE'))}
                </button>
              </div>
           </div>

           <div className="flex-1 relative z-10 flex flex-col justify-end p-4 pb-8">
              <div className="flex gap-4 mb-4 border-b border-white/10 px-2">
                 <button onClick={()=>setActiveTab('info')} className={\`pb-2 text-xs font-mono-tech tracking-widest transition-all \${activeTab==='info'?'text-cyan-400 border-b-2 border-cyan-400':'text-gray-500 hover:text-gray-300'}\`}>{isAr ? 'معلومات' : 'INFO_LOG'}</button>
                 <button onClick={()=>setActiveTab('chat')} className={\`pb-2 text-xs font-mono-tech tracking-widest transition-all \${activeTab==='chat'?'text-cyan-400 border-b-2 border-cyan-400':'text-gray-500 hover:text-gray-300'}\`}>{isAr ? 'اتصال' : 'COMMS_LINK'}</button>
              </div>

              {activeTab === 'info' && (
                 <div className="glass-panel rounded-2xl p-6">
                    <h1 className="text-3xl font-bold mb-3 drop-shadow-md">{data.name}</h1>
                    <div className="max-h-[35vh] overflow-y-auto mb-4 text-sm text-gray-200 leading-relaxed no-scrollbar">{data.description}</div>
                    {data.sources?.length > 0 && (
                      <div className="border-t border-white/10 pt-3 mb-4">
                        <span className="text-[10px] font-mono-tech text-cyan-500 uppercase tracking-widest mb-2 block">{isAr ? 'المصادر (Google)' : 'SOURCES (Google)'}</span>
                        <div className="flex flex-col gap-2">
                          {data.sources.slice(0, 3).map((s,i)=>(
                            <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-cyan-400 truncate flex items-center gap-2 transition-colors">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              {s.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.audioBuffer ? (
                      <div className="bg-black/40 rounded-xl p-4 flex items-center gap-4 border border-white/5">
                        <button onClick={togglePlayback} className={\`w-12 h-12 flex items-center justify-center rounded-full transition-all flex-shrink-0 shadow-lg \${isPlaying ? 'bg-cyan-500 text-black animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}\`}>
                          {isPlaying ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path
