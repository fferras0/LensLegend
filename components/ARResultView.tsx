import React, { useEffect, useState, useRef } from 'react';
import { LandmarkData, ChatMessage } from '../types';
import { createLandmarkChat, enhanceImageVisuals } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";

interface ARResultViewProps {
  data: LandmarkData;
  onReset: () => void;
  onRegenerateAudio?: () => void;
}

export const ARResultView: React.FC<ARResultViewProps> = ({ data, onReset, onRegenerateAudio }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');
  
  // Audio Refs & State
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  // Chat State
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Enhancement State
  const [currentImage, setCurrentImage] = useState<string>(data.originalImage);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);

  // UI State
  const [hideUI, setHideUI] = useState(false);
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');
  const [copied, setCopied] = useState(false);

  const isAr = data.language === 'ar';
  // Check if we have a valid image to display (might be empty if PDF upload)
  const hasVisual = !!currentImage && !currentImage.includes('application/pdf');

  // Initialize Audio & Chat
  useEffect(() => {
    if (data.audioBuffer) {
        // Stop any previous audio if component updates
        stopAudio();
    }
    
    // Init Chat
    const chat = createLandmarkChat(data.name, data.description, data.language);
    setChatSession(chat);

    // Initial Welcome Message
    setMessages([{
        id: 'welcome',
        role: 'model',
        text: isAr ? `مرحباً بك في ${data.name}! أنا دليلك الذكي. هل لديك أي أسئلة؟` : `Welcome to ${data.name}! I'm your AI guide. Ask me anything about what you see.`,
        timestamp: new Date()
    }]);

    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Audio Logic
  const playAudio = async () => {
    if (!data.audioBuffer) return;
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) { /* ignore */ }
    }
    const source = audioContextRef.current.createBufferSource();
    source.buffer = data.audioBuffer;
    source.playbackRate.value = playbackRate; // Apply current rate
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) { /* ignore */ }
        sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlayback = () => isPlaying ? stopAudio() : playAudio();

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    
    // Apply immediately if playing
    if (sourceNodeRef.current) {
        sourceNodeRef.current.playbackRate.value = nextRate;
    }
  };

  // Chat Logic
  const handleSendMessage = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputMsg.trim() || !chatSession || isSending) return;

      const userText = inputMsg;
      setInputMsg('');
      setIsSending(true);

      // Add User Message
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'user',
          text: userText,
          timestamp: new Date()
      }]);

      try {
          const response: GenerateContentResponse = await chatSession.sendMessage({ message: userText });
          const modelText = response.text || (isAr ? "حدث خطأ في الاتصال." : "Connection error.");
          
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: modelText,
            timestamp: new Date()
        }]);
      } catch (err) {
          console.error(err);
      } finally {
          setIsSending(false);
      }
  };

  // Enhance Logic
  const handleEnhance = async () => {
      // Disable enhancement if no visual (e.g. PDF)
      if (!hasVisual) return;

      if (isEnhanced) {
          // Revert
          setCurrentImage(data.originalImage);
          setIsEnhanced(false);
          return;
      }

      if (data.enhancedImage) {
          setCurrentImage(`data:image/jpeg;base64,${data.enhancedImage}`);
          setIsEnhanced(true);
          return;
      }

      setIsEnhancing(true);
      try {
          const parts = data.originalImage.split(',');
          const base64Data = parts[1];
          const mimePart = parts[0].split(':')[1];
          const mimeType = mimePart ? mimePart.split(';')[0] : 'image/jpeg';

          const enhancedBase64 = await enhanceImageVisuals(base64Data, mimeType);
          
          data.enhancedImage = enhancedBase64;
          setCurrentImage(`data:image/jpeg;base64,${enhancedBase64}`);
          setIsEnhanced(true);
      } catch (err: any) {
          console.error("Enhance failed", err);
          alert(isAr ? `فشل تحسين الصورة: ${err.message}` : `Failed to enhance image: ${err.message}`);
      } finally {
          setIsEnhancing(false);
      }
  };

  const handleCopyText = () => {
      navigator.clipboard.writeText(data.description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // UI Text
  const t = {
    back: isAr ? 'عودة' : 'BACK',
    tabInfo: isAr ? 'معلومات' : 'INFO_LOG',
    tabChat: isAr ? 'اتصال' : 'COMMS_LINK',
    enhance: isAr ? 'تحسين' : 'ENHANCE',
    revert: isAr ? 'أصلي' : 'ORIGINAL',
    placeholder: isAr ? 'اسأل عن هذا المعلم...' : 'Ask about this landmark...',
    sending: isAr ? 'إرسال...' : 'SENDING...',
  };

  return (
    <div className={`relative h-screen w-full bg-slate-950 overflow-hidden flex flex-col ${isAr ? 'font-arabic' : 'font-sans'}`} dir={isAr ? 'rtl' : 'ltr'}>
        
        {/* Immersive Background with Pulse */}
        <div 
          className={`absolute inset-0 bg-center bg-no-repeat transition-all duration-700 ease-in-out ${isPlaying ? 'animate-immersive-pulse' : ''}`}
          style={{ 
              backgroundImage: hasVisual ? `url(${currentImage})` : 'none',
              backgroundSize: imageFit,
              backgroundColor: hasVisual ? 'transparent' : '#0f172a',
              // Clear view when UI hidden, or when in info tab. Only blur for chat.
              filter: hideUI 
                ? 'none' 
                : activeTab === 'chat' 
                    ? 'blur(4px) brightness(0.4)' 
                    : 'none'
          }}
          onClick={() => hideUI && setHideUI(false)}
        >
            {!hasVisual && (
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <svg className="w-32 h-32 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
            )}
        </div>

        {/* Hide UI Hint (Visible when UI is hidden) - Replaces button logic */}
        {hideUI && (
            <div className="absolute top-4 right-4 z-50 animate-pulse bg-black/30 rounded-full p-2 cursor-pointer hover:bg-black/50 transition-colors" onClick={() => setHideUI(false)}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {/* Contract / Exit Fullscreen Icon */}
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
        )}

        {/* Scanlines Effect (Hidden when full view) */}
        {!hideUI && (
            <div className="absolute inset-0 pointer-events-none z-0" style={{background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%'}}></div>
        )}

        {/* Top Header */}
        {!hideUI && (
            <div className="relative z-20 p-4 pt-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex gap-2">
                    <button 
                        onClick={onReset}
                        className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full hover:bg-cyan-500/20 transition-all text-cyan-400 hover:text-white"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        <span className="text-xs font-mono-tech tracking-widest">{t.back}</span>
                    </button>
                    
                    {/* Image Fit/Fill Toggle Button */}
                    <button 
                        onClick={() => setImageFit(prev => prev === 'cover' ? 'contain' : 'cover')}
                        className="flex items-center justify-center w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-cyan-500/20 transition-all text-cyan-400"
                        title={isAr ? (imageFit === 'cover' ? "إظهار الصورة كاملة" : "ملء الشاشة") : (imageFit === 'cover' ? "Show Full Image" : "Fill Screen")}
                    >
                        {imageFit === 'cover' ? (
                            // Icon for "Fit to Screen" (Arrows pointing in or aspect ratio rect)
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        ) : (
                            // Icon for "Fill Screen" (Arrows pointing out)
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>

                    {/* Hide UI / Immersive Button */}
                    <button 
                        onClick={() => setHideUI(true)}
                        className="flex items-center justify-center w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-cyan-500/20 transition-all text-cyan-400"
                        title={isAr ? "وضع الانغماس" : "Immersive Mode"}
                    >
                        {/* Eye Icon */}
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                </div>
                
                {hasVisual && (
                    <button 
                        onClick={handleEnhance}
                        disabled={isEnhancing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${isEnhanced 
                            ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]' 
                            : 'bg-black/50 text-cyan-300 border-cyan-500/30 hover:bg-cyan-900/30'}`}
                    >
                        {isEnhancing ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        )}
                        <span className="text-[10px] font-mono-tech font-bold uppercase">{isEnhancing ? '...' : (isEnhanced ? t.revert : t.enhance)}</span>
                    </button>
                )}
            </div>
        )}

        {/* Content Area */}
        {!hideUI && (
            <div className="flex-1 relative z-20 flex flex-col justify-end p-4 pb-6 overflow-hidden">
                
                {/* Credit */}
                <div className="absolute bottom-2 right-4 z-0 pointer-events-none opacity-50">
                    <span className="text-[9px] font-mono-tech text-cyan-500">
                      {isAr ? 'صنع بواسطة فراس' : 'Made by Feras'}
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-4 border-b border-white/10 px-2">
                    <button 
                        onClick={() => setActiveTab('info')}
                        className={`pb-2 text-xs font-mono-tech tracking-widest transition-all ${activeTab === 'info' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500'}`}
                    >
                        {t.tabInfo}
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`pb-2 text-xs font-mono-tech tracking-widest transition-all ${activeTab === 'chat' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500'}`}
                    >
                        {t.tabChat}
                    </button>
                </div>

                {/* INFO PANEL */}
                {activeTab === 'info' && (
                    <div className="glass-panel rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-t border-white/20 animate-slide-up relative">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(34,211,238,1)]"></div>
                         
                         <div className="flex justify-between items-start mb-2">
                             <h1 className="text-3xl font-bold text-white drop-shadow-md">{data.name}</h1>
                             {/* Copy Button */}
                             <button onClick={handleCopyText} className="text-cyan-400 hover:text-white transition-colors" title="Copy text">
                                {copied ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                )}
                             </button>
                         </div>
                         
                         <div className="max-h-[30vh] overflow-y-auto no-scrollbar pr-2 mb-4">
                            {/* select-text added to allow manual selection */}
                            <p className="text-gray-200 text-sm leading-relaxed font-light select-text">{data.description}</p>
                         </div>

                         {/* Audio Player OR Generate Button */}
                         {data.audioBuffer ? (
                            <div className="bg-black/40 rounded-xl p-3 flex items-center gap-4 border border-white/5">
                                <button 
                                    onClick={togglePlayback}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${isPlaying ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white'}`}
                                >
                                    {isPlaying ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                    ) : (
                                        <svg className={`w-4 h-4 ${isAr ? '-translate-x-0.5' : 'translate-x-0.5'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                    )}
                                </button>
                                
                                <div className="flex-1 h-8 flex items-center gap-0.5 opacity-80 overflow-hidden">
                                    {/* Fake waveform */}
                                    {[...Array(16)].map((_, i) => (
                                        <div key={i} className={`flex-1 rounded-full ${isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} style={{height: isPlaying ? Math.random() * 100 + '%' : '20%', animationDelay: i * 0.05 + 's'}}></div>
                                    ))}
                                </div>
                                
                                {/* Speed Control */}
                                <button 
                                    onClick={cyclePlaybackRate}
                                    className="text-[10px] font-mono-tech text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded hover:bg-cyan-900/40 w-12 text-center"
                                >
                                    {playbackRate}x
                                </button>
                            </div>
                         ) : (
                             // Generate Audio Button (for saved sessions where audio is missing)
                             <button 
                                onClick={onRegenerateAudio}
                                className="w-full py-3 bg-cyan-900/30 border border-cyan-500/30 rounded-xl text-cyan-400 text-sm font-mono-tech hover:bg-cyan-900/50 transition-all flex items-center justify-center gap-2"
                             >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                {isAr ? 'إنشاء دليل صوتي' : 'GENERATE AUDIO GUIDE'}
                             </button>
                         )}
                    </div>
                )}

                {/* CHAT PANEL */}
                {activeTab === 'chat' && (
                    <div className="glass-panel rounded-2xl flex flex-col h-[50vh] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-t border-white/20 animate-slide-up">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm select-text ${msg.role === 'user' ? 'bg-cyan-900/40 border border-cyan-500/30 text-cyan-100' : 'bg-black/40 border border-white/10 text-gray-200'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2 bg-black/20">
                            <input 
                                type="text" 
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                placeholder={t.placeholder}
                                disabled={isSending}
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 placeholder-gray-500"
                            />
                            <button 
                                type="submit" 
                                disabled={!inputMsg.trim() || isSending}
                                className="bg-cyan-600/80 text-white px-3 rounded-lg disabled:opacity-50"
                            >
                                <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </form>
                    </div>
                )}

            </div>
        )}

        <style>{`
            @keyframes slide-up {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .animate-slide-up {
                animation: slide-up 0.4s ease-out forwards;
            }
            @keyframes immersive-pulse {
                0% { transform: scale(1); filter: brightness(0.7); }
                50% { transform: scale(1.03); filter: brightness(0.9); }
                100% { transform: scale(1); filter: brightness(0.7); }
            }
            .animate-immersive-pulse {
                animation: immersive-pulse 6s ease-in-out infinite;
            }
        `}</style>
    </div>
  );
};