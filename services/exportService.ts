import { Language } from "../types";

export function downloadSingleFileApp() {
  const apiKey = process.env.API_KEY || "AIzaSyAKLs2p-VaZMyIztbHYezZSUfkmWBWcgys";
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>LensLegend AI - Single File Source</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Load React & ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <!-- Load Babel for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Google GenAI SDK via ESM shim for browser -->
  <script type="importmap">
    {
      "imports": {
        "@google/genai": "https://esm.sh/@google/genai@0.1.1"
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
      body { font-family: 'Outfit', sans-serif; background-color: #050505; color: #fff; overscroll-behavior: none; overflow: hidden; }
      .font-mono-tech { font-family: 'JetBrains Mono', monospace; }
      .font-arabic { font-family: 'Tajawal', sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .glass-panel { background: rgba(13, 13, 13, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- MAIN APP SCRIPT -->
  <script type="text/babel" data-type="module">
    import React, { useState, useEffect, useRef } from 'react';
    import ReactDOM from 'react-dom/client';
    import { GoogleGenAI } from "@google/genai";

    // --- TYPES ---
    const AppState = {
      IDLE: 'IDLE',
      ANALYZING_IMAGE: 'ANALYZING_IMAGE',
      FETCHING_INFO: 'FETCHING_INFO',
      GENERATING_AUDIO: 'GENERATING_AUDIO',
      SHOWING_RESULT: 'SHOWING_RESULT',
      ERROR: 'ERROR'
    };

    // --- API & SERVICES ---
    const API_KEY = "${apiKey}";
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Audio Utils
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

    // AI Service Logic
    async function identifyLandmark(base64Data, mimeType, language) {
       const langName = language === 'ar' ? 'Arabic' : 'English';
       try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: \`Identify the main subject (landmark, place, object, or scene) in this image. Return ONLY the name or short title in \${langName}. Do not use markdown.\` }] }
          });
          let cleanName = response.text?.trim() || "";
          cleanName = cleanName.replace(/[\\*\\"]/g, '').trim();
          if (!cleanName || cleanName.toLowerCase().includes("cannot") || cleanName.toLowerCase() === 'unknown') return language === 'ar' ? "مشهد عام" : "General Scene";
          return cleanName;
       } catch (error) {
          console.error(error);
          return language === 'ar' ? "مشهد عام" : "General Scene";
       }
    }

    async function getLandmarkDetails(landmarkName, base64Data, mimeType, language) {
      const langName = language === 'ar' ? 'Arabic' : 'English';
      const promptText = \`Use the Google Search tool to find accurate info about "\${landmarkName}". Provide a captivating, concise (max 80 words) summary in \${langName}. Focus on unique facts.\`;
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: promptText }] },
          config: { tools: [{ googleSearch: {} }] }
        });
        const description = response.text?.trim() || (language === 'ar' ? "لا يتوفر وصف." : "No description available.");
        const sources = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
           chunks.forEach(chunk => { if(chunk.web) sources.push({ title: chunk.web.title || "Source", uri: chunk.web.uri }); });
        }
        // Unique sources
        const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);
        return { description, sources: uniqueSources };
      } catch (e) {
        return { description: language === 'ar' ? "خطأ في الجلب" : "Error fetching", sources: [] };
      }
    }

    async function generateNarration(text) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("Audio gen failed");
      const ctx = getAudioContext();
      return await decodeAudioData(base64Audio, ctx);
    }

    async function enhanceImageVisuals(imageBase64, mimeType) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: "Generate a high-fidelity, 4k resolution photorealistic version. Improve sharpness and lighting." }] }
      });
      // Find image part
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) return part.inlineData.data;
        }
      }
      throw new Error("No image returned");
    }

    function createLandmarkChat(landmarkName, description, language) {
       const sysInstruction = language === 'ar' 
        ? \`أنت مرشد سياحي في \${landmarkName}. المعلومات: "\${description}". أجب باختصار.\`
        : \`You are a tour guide at \${landmarkName}. Context: "\${description}". Answer concisely.\`;
       return ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: sysInstruction } });
    }

    // --- COMPONENTS ---

    // LoadingScreen
    const LoadingScreen = ({ status, language, imageSrc }) => {
       const isAr = language === 'ar';
       const [dots, setDots] = React.useState('');
       React.useEffect(() => { const i = setInterval(() => setDots(p => p.length>=3?'':p+'.'), 400); return () => clearInterval(i); }, []);
       return (
         <div className={\`absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 overflow-hidden \${isAr ? 'font-arabic' : 'font-mono-tech'}\`} dir={isAr ? 'rtl' : 'ltr'}>
            {imageSrc && <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 blur-md scale-110" style={{ backgroundImage: \`url(\${imageSrc})\` }} />}
            <div className="absolute inset-0 bg-slate-950/90 z-0"></div>
            <div className="relative z-20 flex flex-col items-center">
              <h3 className="text-xl text-cyan-400 font-bold uppercase">{status}</h3>
              <p className="text-xs text-cyan-700 font-mono-tech">Processing{dots}</p>
            </div>
         </div>
       );
    };

    // ARResultView
    const ARResultView = ({ data, onReset, onRegenerateAudio }) => {
       const [isPlaying, setIsPlaying] = React.useState(false);
       const [activeTab, setActiveTab] = React.useState('info');
       const [chatSession, setChatSession] = React.useState(null);
       const [messages, setMessages] = React.useState([]);
       const [inputMsg, setInputMsg] = React.useState('');
       const [isEnhanced, setIsEnhanced] = React.useState(false);
       const [currentImage, setCurrentImage] = React.useState(data.originalImage);
       const [isEnhancing, setIsEnhancing] = React.useState(false);

       const audioCtxRef = React.useRef(null);
       const sourceRef = React.useRef(null);
       const chatEndRef = React.useRef(null);
       const isAr = data.language === 'ar';

       React.useEffect(() => {
          if(data.audioBuffer) stopAudio();
          const chat = createLandmarkChat(data.name, data.description, data.language);
          setChatSession(chat);
          setMessages([{ id: 'w', role: 'model', text: isAr ? 'مرحباً! اسألني أي شيء.' : 'Welcome! Ask me anything.', timestamp: new Date() }]);
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
         src.connect(audioCtxRef.current.destination);
         src.onended = () => setIsPlaying(false);
         src.start(0);
         sourceRef.current = src;
         setIsPlaying(true);
       };

       const stopAudio = () => { if(sourceRef.current) { try{sourceRef.current.stop()}catch(e){}; sourceRef.current=null; } setIsPlaying(false); };
       const togglePlayback = () => isPlaying ? stopAudio() : playAudio();

       const handleSend = async (e) => {
         e?.preventDefault();
         if(!inputMsg.trim() || !chatSession) return;
         const userText = inputMsg; setInputMsg('');
         setMessages(p => [...p, { id: Date.now(), role: 'user', text: userText }]);
         try {
           const res = await chatSession.sendMessage({ message: userText });
           setMessages(p => [...p, { id: Date.now()+1, role: 'model', text: res.text }]);
         } catch(err) { console.error(err); }
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
          } catch(e) { alert(e.message); } finally { setIsEnhancing(false); }
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
                <button onClick={onReset} className="bg-black/50 text-cyan-400 px-4 py-2 rounded-full border border-white/10 text-xs">BACK</button>
                <button onClick={() => window.downloadSingleFileApp()} className="bg-black/40 text-cyan-400 px-3 py-2 rounded-full border border-cyan-500/30 text-[10px] font-mono-tech font-bold group transition-all"><span className="group-hover:scale-110 block">SRC</span></button>
              </div>
              <div className="flex gap-2">
                {isEnhanced && (
                   <button onClick={handleDownload} className="bg-cyan-500 text-black px-4 py-2 rounded-lg border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)] text-xs flex items-center justify-center">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0L8 8m4-4v12" /></svg>
                   </button>
                )}
                <button onClick={handleEnhance} className="bg-black/50 text-cyan-400 px-4 py-2 rounded-lg border border-white/10 text-xs">{isEnhancing ? '...' : (isEnhanced ? 'ORIGINAL' : 'ENHANCE')}</button>
              </div>
           </div>

           <div className="flex-1 relative z-10 flex flex-col justify-end p-4 pb-8">
              <div className="flex gap-4 mb-4 border-b border-white/10 px-2">
                 <button onClick={()=>setActiveTab('info')} className={\`pb-2 text-xs \${activeTab==='info'?'text-cyan-400 border-b-2 border-cyan-400':'text-gray-500'}\`}>INFO</button>
                 <button onClick={()=>setActiveTab('chat')} className={\`pb-2 text-xs \${activeTab==='chat'?'text-cyan-400 border-b-2 border-cyan-400':'text-gray-500'}\`}>CHAT</button>
              </div>

              {activeTab === 'info' && (
                 <div className="glass-panel rounded-2xl p-6 animate-slide-up">
                    <h1 className="text-3xl font-bold mb-2">{data.name}</h1>
                    <div className="max-h-[30vh] overflow-y-auto mb-4 text-sm text-gray-200">{data.description}</div>
                    {data.sources?.length > 0 && <div className="border-t border-white/10 pt-2 mb-2"><span className="text-[10px] text-cyan-500">SOURCES:</span> {data.sources.map((s,i)=><a key={i} href={s.uri} target="_blank" className="text-xs text-gray-400 block truncate">{s.title}</a>)}</div>}
                    <button onClick={togglePlayback} className="w-full py-3 bg-cyan-900/40 border border-cyan-500/30 rounded-xl text-cyan-400 text-sm flex justify-center items-center gap-2">
                       {isPlaying ? 'STOP AUDIO' : 'PLAY AUDIO GUIDE'}
                    </button>
                 </div>
              )}

              {activeTab === 'chat' && (
                 <div className="glass-panel rounded-2xl flex flex-col h-[50vh] p-4">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-2 no-scrollbar">
                       {messages.map(m => (
                         <div key={m.id} className={\`flex \${m.role==='user'?'justify-end':'justify-start'}\`}>
                            <div className={\`p-2 rounded-lg text-sm max-w-[85%] \${m.role==='user'?'bg-cyan-900/50 text-cyan-100':'bg-black/50 text-gray-200'}\`}>{m.text}</div>
                         </div>
                       ))}
                       <div ref={chatEndRef}></div>
                    </div>
                    <form onSubmit={handleSend} className="flex gap-2">
                       <input value={inputMsg} onChange={e=>setInputMsg(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm" placeholder="Ask..." />
                       <button type="submit" className="bg-cyan-600 text-white px-3 rounded">→</button>
                    </form>
                 </div>
              )}
           </div>
         </div>
       );
    };

    // CameraView
    const CameraView = ({ onCapture, language, onToggleLang }) => {
       const isAr = language === 'ar';
       const inputRef = React.useRef(null);
       return (
          <div className={\`relative h-screen w-full bg-slate-950 flex flex-col justify-between \${isAr ? 'font-arabic' : 'font-sans'}\`} dir={isAr ? 'rtl' : 'ltr'}>
             <div className="relative z-10 p-4 flex justify-between text-cyan-400">
                <div className="text-xs font-mono-tech border-l-2 border-cyan-500 pl-2">SYSTEM READY</div>
                <div className="flex gap-2">
                   <button onClick={() => window.downloadSingleFileApp()} className="bg-black/40 text-cyan-400 px-3 py-1 rounded border border-cyan-500/30 text-[10px] font-mono-tech font-bold transition-all hover:bg-cyan-500 hover:text-black">SRC</button>
                   <button onClick={onToggleLang} className="text-xs border border-cyan-500/50 px-3 py-1 bg-cyan-950/30">{isAr ? 'EN' : 'عربي'}</button>
                </div>
             </div>
             <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm aspect-[3/4] border border-cyan-500/30 rounded-lg flex items-center justify-center">
                   <div className="text-cyan-500/50 font-mono-tech text-xs tracking-widest">{isAr ? 'التقط صورة' : 'ALIGN TARGET'}</div>
                </div>
             </div>
             <div className="relative z-10 p-8 flex justify-center gap-8 items-center bg-gradient-to-t from-slate-950 to-transparent">
                <input type="file" ref={inputRef} accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onCapture(e.target.files[0])} />
                <button onClick={()=>inputRef.current.click()} className="w-20 h-20 rounded-full border-2 border-cyan-500 flex items-center justify-center bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                   <div className="w-16 h-16 bg-cyan-400 rounded-full"></div>
                </button>
             </div>
          </div>
       );
    };

    // Main App
    const App = () => {
       const [state, setState] = React.useState(AppState.IDLE);
       const [data, setData] = React.useState(null);
       const [lang, setLang] = React.useState('ar');
       
       const handleCapture = async (file) => {
          setState(AppState.ANALYZING_IMAGE);
          try {
             const reader = new FileReader();
             reader.readAsDataURL(file);
             reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                const mime = file.type;
                const name = await identifyLandmark(base64, mime, lang);
                setState(AppState.FETCHING_INFO);
                const details = await getLandmarkDetails(name, base64, mime, lang);
                setState(AppState.GENERATING_AUDIO);
                const audio = await generateNarration(details.description);
                setData({ name, ...details, audioBuffer: audio, originalImage: reader.result, language: lang });
                setState(AppState.SHOWING_RESULT);
             };
          } catch(e) { console.error(e); setState(AppState.ERROR); }
       };

       return (
          <div className="w-full h-full min-h-screen bg-slate-950 text-white">
             {state === AppState.IDLE && <CameraView onCapture={handleCapture} language={lang} onToggleLang={()=>setLang(l=>l==='en'?'ar':'en')} />}
             {(state === AppState.ANALYZING_IMAGE || state === AppState.FETCHING_INFO || state === AppState.GENERATING_AUDIO) && <LoadingScreen status={state} language={lang} />}
             {state === AppState.SHOWING_RESULT && data && <ARResultView data={data} onReset={()=>{setData(null); setState(AppState.IDLE);}} />}
             {state === AppState.ERROR && <div className="h-screen flex items-center justify-center text-red-500 cursor-pointer" onClick={()=>setState(AppState.IDLE)}>ERROR - TAP TO RETRY</div>}
          </div>
       );
    };

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`;

  // Create Blob and Download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lens-legend-source.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}